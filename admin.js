/* ==========================================================
   MOVE OVER KC  |  Owner tools (admin.html)
   Creates private review links, lists reviews and messages.
   The owner key is checked by the backend on every request.
   ========================================================== */
(function () {
  "use strict";

  var U = window.MOKC_UTIL;
  var STORE = "mokc_owner_key";

  var gate = document.getElementById("gate");
  var gateStatus = document.getElementById("gate-status");
  var tools = document.getElementById("tools");

  function getKey() { try { return sessionStorage.getItem(STORE) || ""; } catch (e) { return ""; } }
  function setKey(k) { try { if (k) sessionStorage.setItem(STORE, k); else sessionStorage.removeItem(STORE); } catch (e) {} }

  function call(path, method, body) {
    var headers = { "x-admin-key": getKey() };
    if (body) headers["Content-Type"] = "application/json";
    return U.api(path, { method: method || "GET", headers: headers, body: body ? JSON.stringify(body) : undefined });
  }

  function h(tag, cls, text) {
    var el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text != null) el.textContent = text;
    return el;
  }

  function fmt(iso) {
    var d = new Date(iso);
    return isNaN(d) ? "" : d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
  }

  function status(el, kind, text) { el.className = "form-status show " + kind; el.textContent = text; }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve) {
      var ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch (e) {}
      document.body.removeChild(ta); resolve();
    });
  }

  function shareText(name, url) {
    var first = (name || "").split(" ")[0] || "there";
    return "Hi " + first + ", thank you for choosing Move Over KC! If you have a minute, I would really appreciate your honest review here: " + url;
  }

  /* ---------- Unlock ---------- */
  function unlock() {
    return call("/admin/links").then(function () {
      gate.hidden = true;
      tools.hidden = false;
      loadAll();
    });
  }

  gate.addEventListener("submit", function (e) {
    e.preventDefault();
    setKey(document.getElementById("key").value.trim());
    status(gateStatus, "ok", "Checking...");
    unlock().catch(function (err) {
      setKey("");
      status(gateStatus, "bad", err && err.code === "no_api" ? "The backend is not connected yet (see README, Part 3)." : (err && err.message) || "That did not work.");
    });
  });

  document.getElementById("lock").addEventListener("click", function () {
    setKey("");
    location.reload();
  });

  if (getKey()) unlock().catch(function () { setKey(""); });

  /* ---------- Create link ---------- */
  var makeForm = document.getElementById("make-link");
  var makeStatus = document.getElementById("make-status");
  var made = document.getElementById("made");
  var madeUrl = document.getElementById("made-url");
  var madeText = document.getElementById("made-text");
  var current = { url: "", name: "" };

  makeForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = document.getElementById("cust-name").value.trim();
    var service = document.getElementById("cust-service").value;
    var phone = document.getElementById("cust-phone").value.replace(/\D/g, "");
    if (name.length < 2) { status(makeStatus, "bad", "Enter the customer's name."); return; }

    status(makeStatus, "ok", "Creating...");
    call("/admin/link", "POST", { name: name, service: service }).then(function (data) {
      current = { url: data.url, name: name };
      madeUrl.textContent = data.url;
      made.hidden = false;
      makeStatus.className = "form-status";
      if (phone.length >= 10) {
        madeText.hidden = false;
        madeText.href = "sms:+" + (phone.length === 10 ? "1" : "") + phone + "?body=" + encodeURIComponent(shareText(name, data.url));
      } else {
        madeText.hidden = true;
      }
      makeForm.reset();
      loadLinks();
    }).catch(function (err) {
      status(makeStatus, "bad", (err && err.message) || "Could not create the link.");
    });
  });

  document.getElementById("made-copy").addEventListener("click", function () {
    var btn = this;
    copyText(current.url).then(function () { btn.textContent = "Copied!"; setTimeout(function () { btn.textContent = "Copy link"; }, 1800); });
  });

  document.getElementById("made-share").addEventListener("click", function () {
    var msg = shareText(current.name, current.url);
    if (navigator.share) navigator.share({ text: msg }).catch(function () {});
    else copyText(msg);
  });

  /* ---------- Lists ---------- */
  function loadAll() { loadLinks(); loadReviews(); loadLeads(); }

  function loadLinks() {
    var box = document.getElementById("links");
    call("/admin/links").then(function (data) {
      box.innerHTML = "";
      if (!data.links.length) { box.appendChild(h("p", "muted", "No links yet.")); return; }
      data.links.forEach(function (l) {
        var item = h("div", "admin-item");
        var row = h("div", "row");
        row.appendChild(h("strong", "", l.name + (l.service ? " · " + l.service : "")));
        row.appendChild(h("span", "tag" + (l.usedAt ? " used" : ""), l.usedAt ? "Review received" : "Waiting"));
        item.appendChild(row);
        item.appendChild(h("span", "muted", "Created " + fmt(l.createdAt)));
        if (!l.usedAt) {
          var actions = h("div", "row");
          var copy = h("button", "btn btn-ghost btn-sm", "Copy link");
          copy.type = "button";
          copy.addEventListener("click", function () {
            copyText(l.url).then(function () { copy.textContent = "Copied!"; setTimeout(function () { copy.textContent = "Copy link"; }, 1800); });
          });
          var share = h("button", "btn btn-ghost btn-sm", "Share");
          share.type = "button";
          share.addEventListener("click", function () {
            var msg = shareText(l.name, l.url);
            if (navigator.share) navigator.share({ text: msg }).catch(function () {}); else copyText(msg);
          });
          actions.appendChild(copy);
          actions.appendChild(share);
          item.appendChild(actions);
        }
        box.appendChild(item);
      });
    }).catch(function () { box.textContent = "Could not load links."; });
  }

  function loadReviews() {
    var box = document.getElementById("reviews");
    call("/admin/reviews").then(function (data) {
      box.innerHTML = "";
      if (!data.reviews.length) { box.appendChild(h("p", "muted", "No reviews yet.")); return; }
      data.reviews.forEach(function (r) {
        var item = h("div", "admin-item");
        var row = h("div", "row");
        var left = h("div");
        left.innerHTML = U.starsHtml(r.rating);
        row.appendChild(left);
        row.appendChild(h("span", "muted", fmt(r.createdAt)));
        item.appendChild(row);
        item.appendChild(h("p", "", r.text));
        var foot = h("div", "row");
        foot.appendChild(h("strong", "", r.name + (r.service ? " · " + r.service : "")));
        var del = h("button", "btn btn-danger btn-sm", "Delete");
        del.type = "button";
        del.addEventListener("click", function () {
          if (!confirm("Delete this review from your website? This cannot be undone.")) return;
          call("/admin/review/delete", "POST", { id: r.id }).then(loadReviews).catch(function () { alert("Could not delete."); });
        });
        foot.appendChild(del);
        item.appendChild(foot);
        box.appendChild(item);
      });
    }).catch(function () { box.textContent = "Could not load reviews."; });
  }

  function loadLeads() {
    var box = document.getElementById("leads");
    call("/admin/leads").then(function (data) {
      box.innerHTML = "";
      if (!data.leads.length) { box.appendChild(h("p", "muted", "No messages yet.")); return; }
      data.leads.forEach(function (l) {
        var item = h("div", "admin-item");
        var row = h("div", "row");
        row.appendChild(h("strong", "", (l.type === "application" ? "Application: " : "Quote: ") + l.name));
        row.appendChild(h("span", "tag" + (l.smsSent ? " used" : ""), l.smsSent ? "Texted" : "NOT TEXTED"));
        item.appendChild(row);
        var phone = h("a", "", l.phone);
        phone.href = "tel:" + l.phone.replace(/\D/g, "");
        item.appendChild(phone);
        if (l.email) item.appendChild(h("span", "muted", l.email));
        if (l.role) item.appendChild(h("span", "muted", "Role: " + l.role));
        if (l.message) item.appendChild(h("p", "", l.message));
        item.appendChild(h("span", "muted", fmt(l.createdAt)));
        box.appendChild(item);
      });
    }).catch(function () { box.textContent = "Could not load messages."; });
  }
})();
