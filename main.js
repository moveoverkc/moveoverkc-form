/* ==========================================================
   MOVE OVER KC  |  Shared site script
   Builds the header and footer on every page, handles the
   quote and application forms, and small visual effects.
   To change the menu, edit the NAV list below once.
   ========================================================== */
(function () {
  "use strict";

  var C = window.MOKC || {};
  document.documentElement.classList.remove("no-js");

  var NAV = [
    ["index.html", "Home"],
    ["services.html", "Services"],
    ["photos.html", "Photos"],
    ["reviews.html", "Reviews"],
    ["about.html", "About"],
    ["careers.html", "Careers"]
  ];

  var cur = (location.pathname.split("/").pop() || "index").replace(/\.html$/, "") || "index";
  var onHome = cur === "index";
  var quoteHref = onHome ? "#quote" : "contact.html#quote";

  var STAR_PATH = "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";

  /* ---------- Helpers shared with other page scripts ---------- */
  function starsHtml(n) {
    var out = '<span class="stars" role="img" aria-label="' + n + ' out of 5 stars">';
    for (var i = 1; i <= 5; i++) {
      out += '<svg class="' + (i <= n ? "on" : "off") + '" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="' + STAR_PATH + '"/></svg>';
    }
    return out + "</span>";
  }

  function api(path, options) {
    if (!C.API_BASE) {
      return Promise.reject({ code: "no_api", message: "The online system is not connected yet." });
    }
    options = options || {};
    return fetch(C.API_BASE.replace(/\/$/, "") + path, options).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (body) {
        if (!res.ok) { throw { code: res.status, message: body.error || "Something went wrong." }; }
        return body;
      });
    });
  }

  window.MOKC_UTIL = { starsHtml: starsHtml, api: api, STAR_PATH: STAR_PATH };

  /* ---------- Header ---------- */
  var headerMount = document.getElementById("site-header");
  if (headerMount) {
    var links = NAV.map(function (n) {
      var active = n[0].replace(/\.html$/, "") === cur ? ' aria-current="page"' : "";
      return '<a href="' + n[0] + '"' + active + ">" + n[1] + "</a>";
    }).join("");

    headerMount.outerHTML =
      '<header class="site-header"><div class="container">' +
      '<a class="brand" href="index.html" aria-label="Move Over KC, home">' +
      '<img class="brand-logo" src="images/logo.png" width="98" height="68" alt="Move Over KC">' +
      '</a>' +
      '<button class="nav-toggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="primary-nav"><span></span></button>' +
      '<nav class="nav" id="primary-nav" aria-label="Main">' + links +
      '<a class="btn btn-primary" href="' + quoteHref + '">Free Quote</a></nav>' +
      "</div></header>";

    var toggle = document.querySelector(".nav-toggle");
    toggle.addEventListener("click", function () {
      var open = document.body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    document.getElementById("primary-nav").addEventListener("click", function (e) {
      if (e.target.tagName === "A") { document.body.classList.remove("nav-open"); toggle.setAttribute("aria-expanded", "false"); }
    });
  }

  /* ---------- Footer and mobile action bar ---------- */
  var footerMount = document.getElementById("site-footer");
  if (footerMount) {
    var year = new Date().getFullYear();
    var social = "";
    if (C.FACEBOOK_URL) social += '<li><a href="' + C.FACEBOOK_URL + '" rel="noopener" target="_blank">Facebook</a></li>';
    if (C.INSTAGRAM_URL) social += '<li><a href="' + C.INSTAGRAM_URL + '" rel="noopener" target="_blank">Instagram</a></li>';
    if (C.GOOGLE_BUSINESS_URL) social += '<li><a href="' + C.GOOGLE_BUSINESS_URL + '" rel="noopener" target="_blank">Google Business</a></li>';
    var email = C.EMAIL ? '<li><a href="mailto:' + C.EMAIL + '">' + C.EMAIL + "</a></li>" : "";

    footerMount.outerHTML =
      '<footer class="site-footer"><div class="container">' +
      '<div class="footer-grid">' +
      '<div><a class="brand" href="index.html" aria-label="Move Over KC, home"><img class="footer-logo" src="images/logo.png" width="174" height="120" alt="Move Over KC"></a>' +
      '<p style="margin-top:18px">Residential and commercial moving, junk removal, and handyman help. Careful, reliable, affordable. Based in Lee\'s Summit, Missouri.</p></div>' +
      '<div><h4>Explore</h4><ul>' +
      '<li><a href="services.html">Services</a></li><li><a href="photos.html">Photos</a></li><li><a href="reviews.html">Reviews</a></li>' +
      '<li><a href="about.html">About</a></li><li><a href="careers.html">Careers</a></li><li><a href="faq.html">FAQ</a></li></ul></div>' +
      '<div><h4>Services</h4><ul>' +
      '<li><a href="services.html#moving">Moving</a></li><li><a href="services.html#junk">Junk Removal</a></li><li><a href="services.html#handyman">Handyman</a></li></ul></div>' +
      '<div><h4>Contact</h4><ul>' +
      '<li><a href="tel:' + C.PHONE_TEL + '">' + C.PHONE_DISPLAY + "</a></li>" + email +
      '<li><a href="contact.html">Send a message</a></li>' + social + "</ul></div>" +
      "</div>" +
      '<div class="footer-bottom"><span>&copy; ' + year + " Move Over KC. All rights reserved. " + (C.SERVICE_AREA || "") + '.</span>' +
      '<span><a href="privacy.html">Privacy</a></span></div>' +
      "</div></footer>" +
      '<div class="action-bar" role="navigation" aria-label="Quick actions">' +
      '<a href="tel:' + C.PHONE_TEL + '">Call</a>' +
      '<a href="sms:' + C.PHONE_TEL + '">Text</a>' +
      '<a class="primary" href="' + quoteHref + '">Free Quote</a></div>';
  }

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Forms ---------- */
  function fieldWrap(input) { return input.closest(".field"); }

  function setInvalid(input, message) {
    var wrap = fieldWrap(input);
    if (!wrap) return;
    wrap.classList.add("invalid");
    var err = wrap.querySelector(".err");
    if (!err) { err = document.createElement("div"); err.className = "err"; wrap.appendChild(err); }
    err.textContent = message;
  }

  function clearInvalid(input) {
    var wrap = fieldWrap(input);
    if (wrap) wrap.classList.remove("invalid");
  }

  function validate(form) {
    var ok = true;
    var firstBad = null;
    form.querySelectorAll("input, textarea, select").forEach(function (input) {
      if (input.type === "hidden" || input.classList.contains("hp-input")) return;
      var value = (input.value || "").trim();
      var bad = "";
      if (input.required && input.type === "checkbox" && !input.checked) bad = "Please check this box to continue.";
      else if (input.required && input.type !== "checkbox" && !value) bad = "This field is required.";
      else if (input.type === "tel" && value && value.replace(/\D/g, "").length < 10) bad = "Please enter a 10 digit phone number.";
      else if (input.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) bad = "Please enter a valid email address.";
      if (bad) { setInvalid(input, bad); ok = false; if (!firstBad) firstBad = input; }
      else clearInvalid(input);
    });
    if (firstBad) firstBad.focus();
    return ok;
  }

  function showStatus(el, kind, text) {
    if (!el) return;
    el.className = "form-status show " + kind;
    el.textContent = text;
  }

  document.querySelectorAll("form[data-endpoint]").forEach(function (form) {
    var status = form.querySelector(".form-status");
    var btn = form.querySelector('button[type="submit"]');
    var idle = btn ? btn.textContent : "";

    form.setAttribute("novalidate", "novalidate");
    form.addEventListener("input", function (e) { clearInvalid(e.target); });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validate(form)) return;

      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = String(v).trim(); });
      data.page = location.pathname;

      if (!C.API_BASE) {
        showStatus(status, "bad", "Our online form is not switched on yet. Please call or text " + C.PHONE_DISPLAY + " and we will take great care of you.");
        return;
      }

      btn.disabled = true;
      btn.textContent = "Sending...";
      showStatus(status, "ok", "Sending your message...");

      api(form.getAttribute("data-endpoint"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      }).then(function () {
        form.reset();
        showStatus(status, "ok", form.getAttribute("data-success") || "Thank you! Your message was sent. We will reach out very soon.");
      }).catch(function (err) {
        var msg = (err && err.message) ? err.message : "That did not go through.";
        showStatus(status, "bad", msg + " You can also call or text " + C.PHONE_DISPLAY + " right now.");
      }).then(function () {
        btn.disabled = false;
        btn.textContent = idle;
      });
    });
  });
})();
