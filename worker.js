/* ==========================================================
   MOVE OVER KC  |  Backend (Cloudflare Worker)

   What this does:
   1. Receives quote requests and job applications from the website
      and texts them to the owner's phone (through Twilio).
   2. Creates private, single-use review links that only the owner
      can generate, and only accepts reviews that arrive with a valid link.
   3. Serves the verified reviews to the Reviews page.
   4. Powers the private owner page (admin.html).

   Setup steps are in README.md, Part 3.
   ========================================================== */

const LINK_TTL_SECONDS = 60 * 24 * 3600;      // an unused review link expires after 60 days
const USED_LINK_TTL_SECONDS = 365 * 24 * 3600; // keep used links visible in admin for a year
const LEAD_TTL_SECONDS = 90 * 24 * 3600;       // backup copy of messages kept 90 days
const SERVICES = ["Moving", "Junk Removal", "Handyman", "Other"];

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const cors = corsHeaders(origin, env);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    // Block browsers on other websites. (Requests with no Origin, like curl, still hit rate limits.)
    if (origin && !isAllowedOrigin(origin, env)) {
      return json({ error: "Not allowed." }, 403, cors);
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";
    const method = request.method;

    try {
      if (method === "GET" && path === "/") return json({ ok: true, service: "Move Over KC API" }, 200, cors);

      // Public
      if (method === "POST" && path === "/contact") return handleLead(request, env, cors, "quote");
      if (method === "POST" && path === "/apply") return handleLead(request, env, cors, "application");
      if (method === "GET" && path === "/reviews") return handlePublicReviews(env, cors);
      if (method === "GET" && path === "/review-link") return handleReviewLinkCheck(url, env, cors);
      if (method === "POST" && path === "/review") return handleReviewSubmit(request, env, cors);

      // Owner only
      if (path.startsWith("/admin")) {
        const authError = await requireAdmin(request, env, cors);
        if (authError) return authError;

        if (method === "POST" && path === "/admin/link") return handleAdminCreateLink(request, env, cors);
        if (method === "GET" && path === "/admin/links") return handleAdminLinks(env, cors);
        if (method === "GET" && path === "/admin/reviews") return handleAdminReviews(env, cors);
        if (method === "POST" && path === "/admin/review/delete") return handleAdminDeleteReview(request, env, cors);
        if (method === "GET" && path === "/admin/leads") return handleAdminLeads(env, cors);
      }

      return json({ error: "Not found." }, 404, cors);
    } catch (err) {
      console.log("Unhandled error", err && err.message);
      return json({ error: "Something went wrong on our end." }, 500, cors);
    }
  }
};

/* ---------------------------------------------------------- */
/* Quote requests and applications                              */
/* ---------------------------------------------------------- */

async function handleLead(request, env, cors, type) {
  const body = await readJson(request);
  if (!body) return json({ error: "That did not look right. Please try again." }, 400, cors);

  // Hidden honeypot field. Real people never fill it in. Pretend success to bots.
  if (body.company) return json({ ok: true }, 200, cors);

  if (!(await rateLimit(env, request, "lead", 6, 3600))) {
    return json({ error: "Too many messages from this device. Please call or text us instead." }, 429, cors);
  }

  const name = clean(body.name, 80);
  const phoneDigits = String(body.phone || "").replace(/\D/g, "");
  const phone = formatPhone(phoneDigits);
  const email = clean(body.email, 120);
  const message = cleanMultiline(body.message, 1200);
  const role = clean(body.role, 60);

  if (name.length < 2) return json({ error: "Please enter your name." }, 400, cors);
  if (phoneDigits.length < 10 || phoneDigits.length > 15) return json({ error: "Please enter a valid phone number." }, 400, cors);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Please enter a valid email address." }, 400, cors);
  if (type === "application" && !role) return json({ error: "Please choose a role." }, 400, cors);

  const id = newId();
  const record = { type, name, phone, email, role, message, createdAt: new Date().toISOString(), smsSent: false };
  await env.MOKC.put("lead:" + id, JSON.stringify(record), { expirationTtl: LEAD_TTL_SECONDS });

  const title = type === "application" ? "NEW JOB APPLICATION" : "NEW QUOTE REQUEST";
  let sms = title + " (Move Over KC)\n";
  sms += "Name: " + name + "\n";
  sms += "Phone: " + phone + "\n";
  if (email) sms += "Email: " + email + "\n";
  if (role) sms += "Role: " + role + "\n";
  if (message) sms += "Message: " + message;

  try {
    await sendSms(env, sms);
    record.smsSent = true;
    await env.MOKC.put("lead:" + id, JSON.stringify(record), { expirationTtl: LEAD_TTL_SECONDS });
  } catch (err) {
    console.log("SMS failed", err && err.message);
    return json({ error: "We saved your message, but could not text it to the owner right away." }, 502, cors);
  }

  return json({ ok: true }, 200, cors);
}

/* ---------------------------------------------------------- */
/* Reviews (public)                                             */
/* ---------------------------------------------------------- */

async function handlePublicReviews(env, cors) {
  const all = await loadAll(env, "review:");
  all.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const reviews = all.map((r) => ({
    id: r.id, name: r.name, rating: r.rating, text: r.text, service: r.service || "", createdAt: r.createdAt
  }));
  return json({ reviews }, 200, { ...cors, "Cache-Control": "public, max-age=60" });
}

async function handleReviewLinkCheck(url, env, cors) {
  const token = (url.searchParams.get("t") || "").trim();
  const link = await getLink(env, token);
  if (!link || link.usedAt) return json({ valid: false, error: "This review link is not valid anymore." }, 404, cors);
  return json({ valid: true, name: link.name, service: link.service || "" }, 200, cors);
}

async function handleReviewSubmit(request, env, cors) {
  const body = await readJson(request);
  if (!body) return json({ error: "That did not look right. Please try again." }, 400, cors);

  if (!(await rateLimit(env, request, "review", 10, 3600))) {
    return json({ error: "Too many tries. Please call or text us." }, 429, cors);
  }

  const token = String(body.token || "").trim();
  const link = await getLink(env, token);
  if (!link || link.usedAt) {
    return json({ error: "This review link is not valid anymore. It may have already been used." }, 410, cors);
  }

  const rating = parseInt(body.rating, 10);
  const text = cleanMultiline(body.text, 1500);
  const displayName = clean(body.displayName, 40) || firstNameInitial(link.name);
  let service = clean(body.service, 30);
  if (service && !SERVICES.includes(service)) service = "";
  if (!service) service = link.service || "";

  if (!(rating >= 1 && rating <= 5)) return json({ error: "Please choose a star rating." }, 400, cors);
  if (text.length < 20) return json({ error: "Please write a little more (at least 20 characters)." }, 400, cors);
  if (displayName.length < 2) return json({ error: "Please enter the name you want shown." }, 400, cors);

  const id = newId();
  const review = { id, name: displayName, rating, text, service, createdAt: new Date().toISOString(), verified: true };
  await env.MOKC.put("review:" + id, JSON.stringify(review));

  // Burn the link so it can never be used a second time.
  link.usedAt = review.createdAt;
  link.reviewId = id;
  await env.MOKC.put("link:" + token, JSON.stringify(link), { expirationTtl: USED_LINK_TTL_SECONDS });

  try {
    await sendSms(env, "NEW VERIFIED REVIEW (" + rating + " of 5 stars) from " + displayName + ":\n" + text.slice(0, 300));
  } catch (err) {
    console.log("Review SMS failed", err && err.message);
  }

  return json({ ok: true }, 200, cors);
}

/* ---------------------------------------------------------- */
/* Owner tools                                                  */
/* ---------------------------------------------------------- */

async function handleAdminCreateLink(request, env, cors) {
  const body = await readJson(request);
  if (!body) return json({ error: "Bad request." }, 400, cors);

  const name = clean(body.name, 60);
  let service = clean(body.service, 30);
  if (service && !SERVICES.includes(service)) service = "";
  if (name.length < 2) return json({ error: "Enter the customer's name." }, 400, cors);

  const token = newToken();
  const link = { name, service, createdAt: new Date().toISOString(), usedAt: null };
  await env.MOKC.put("link:" + token, JSON.stringify(link), { expirationTtl: LINK_TTL_SECONDS });

  return json({ ok: true, token, url: reviewUrl(env, token), expiresInDays: Math.round(LINK_TTL_SECONDS / 86400) }, 200, cors);
}

async function handleAdminLinks(env, cors) {
  const list = await env.MOKC.list({ prefix: "link:" });
  const links = (await Promise.all(list.keys.map(async (k) => {
    const raw = await env.MOKC.get(k.name);
    if (!raw) return null;
    const rec = JSON.parse(raw);
    const token = k.name.slice(5);
    return { token, name: rec.name, service: rec.service || "", createdAt: rec.createdAt, usedAt: rec.usedAt || null, url: reviewUrl(env, token) };
  }))).filter(Boolean);
  links.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return json({ links: links.slice(0, 60) }, 200, cors);
}

async function handleAdminReviews(env, cors) {
  const all = await loadAll(env, "review:");
  all.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return json({ reviews: all }, 200, cors);
}

async function handleAdminDeleteReview(request, env, cors) {
  const body = await readJson(request);
  const id = body && String(body.id || "");
  if (!id || !/^[0-9a-z-]+$/i.test(id)) return json({ error: "Bad review id." }, 400, cors);
  await env.MOKC.delete("review:" + id);
  return json({ ok: true }, 200, cors);
}

async function handleAdminLeads(env, cors) {
  const all = await loadAll(env, "lead:");
  all.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return json({ leads: all.slice(0, 50) }, 200, cors);
}

async function requireAdmin(request, env, cors) {
  if (!(await rateLimit(env, request, "admin", 120, 3600))) {
    return json({ error: "Too many attempts. Try again later." }, 429, cors);
  }
  const key = request.headers.get("x-admin-key") || "";
  if (!env.ADMIN_KEY || !safeEqual(key, env.ADMIN_KEY)) {
    return json({ error: "Wrong key." }, 401, cors);
  }
  return null;
}

/* ---------------------------------------------------------- */
/* Helpers                                                      */
/* ---------------------------------------------------------- */

function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...headers }
  });
}

function allowedOrigins(env) {
  return String(env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
}

function isAllowedOrigin(origin, env) {
  return allowedOrigins(env).includes(origin);
}

function corsHeaders(origin, env) {
  const h = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-admin-key",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
  if (origin && isAllowedOrigin(origin, env)) h["Access-Control-Allow-Origin"] = origin;
  return h;
}

async function readJson(request) {
  try {
    const text = await request.text();
    if (!text || text.length > 12000) return null;
    const data = JSON.parse(text);
    return data && typeof data === "object" ? data : null;
  } catch (e) {
    return null;
  }
}

function clean(value, max) {
  return String(value == null ? "" : value).replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function cleanMultiline(value, max) {
  return String(value == null ? "" : value).replace(/\r/g, "").replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, " ").trim().slice(0, max);
}

function formatPhone(digits) {
  const d = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  if (d.length === 10) return d.slice(0, 3) + "-" + d.slice(3, 6) + "-" + d.slice(6);
  return digits;
}

function firstNameInitial(full) {
  const parts = clean(full, 60).split(" ").filter(Boolean);
  if (!parts.length) return "Customer";
  return parts.length > 1 ? parts[0] + " " + parts[parts.length - 1][0].toUpperCase() + "." : parts[0];
}

function newId() {
  const rand = new Uint8Array(4);
  crypto.getRandomValues(rand);
  return Date.now() + "-" + Array.from(rand).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function newToken() {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function reviewUrl(env, token) {
  return String(env.SITE_URL || "").replace(/\/+$/, "") + "/review.html?t=" + token;
}

async function getLink(env, token) {
  if (!token || !/^[A-Za-z0-9_-]{16,64}$/.test(token)) return null;
  const raw = await env.MOKC.get("link:" + token);
  return raw ? JSON.parse(raw) : null;
}

async function loadAll(env, prefix) {
  const list = await env.MOKC.list({ prefix });
  const items = await Promise.all(list.keys.map(async (k) => {
    const raw = await env.MOKC.get(k.name);
    return raw ? JSON.parse(raw) : null;
  }));
  return items.filter(Boolean);
}

async function rateLimit(env, request, bucket, max, windowSeconds) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const slot = Math.floor(Date.now() / (windowSeconds * 1000));
  const key = "rl:" + bucket + ":" + ip + ":" + slot;
  const used = parseInt((await env.MOKC.get(key)) || "0", 10);
  if (used >= max) return false;
  await env.MOKC.put(key, String(used + 1), { expirationTtl: Math.max(windowSeconds, 60) });
  return true;
}

function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const enc = new TextEncoder();
  const x = enc.encode(a);
  const y = enc.encode(b);
  let diff = x.length ^ y.length;
  const len = Math.max(x.length, y.length);
  for (let i = 0; i < len; i++) diff |= (x[i] || 0) ^ (y[i] || 0);
  return diff === 0;
}

async function sendSms(env, body) {
  const sid = env.TWILIO_ACCOUNT_SID;
  const token = env.TWILIO_AUTH_TOKEN;
  const from = env.TWILIO_FROM;
  const to = env.OWNER_PHONE;
  if (!sid || !token || !from || !to) throw new Error("sms_not_configured");

  const form = new URLSearchParams({ To: to, From: from, Body: String(body).slice(0, 1500) });
  const res = await fetch("https://api.twilio.com/2010-04-01/Accounts/" + sid + "/Messages.json", {
    method: "POST",
    headers: {
      Authorization: "Basic " + btoa(sid + ":" + token),
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: form
  });
  if (!res.ok) throw new Error("sms_failed_" + res.status);
}
