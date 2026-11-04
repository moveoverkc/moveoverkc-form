/* ==========================================================
   MOVE OVER KC  |  Reviews page
   Loads verified reviews from the backend and displays them.
   ========================================================== */
(function () {
  "use strict";

  var list = document.getElementById("review-list");
  var summary = document.getElementById("summary");
  var U = window.MOKC_UTIL;
  var CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>';

  function showEmpty(heading, text) {
    list.className = "";
    list.innerHTML = "";
    var box = document.createElement("div");
    box.className = "empty-state";
    var h = document.createElement("h3");
    h.textContent = heading;
    var p = document.createElement("p");
    p.textContent = text;
    box.appendChild(h);
    box.appendChild(p);
    list.appendChild(box);
  }

  function monthYear(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return "";
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }

  U.api("/reviews")
    .then(function (data) {
      var reviews = (data && data.reviews) || [];
      if (!reviews.length) {
        showEmpty("Reviews are coming soon", "We only publish reviews from customers we have served. Check back soon, or call or text 660-351-4699 to talk with us.");
        return;
      }

      var total = 0;
      reviews.forEach(function (r) { total += r.rating; });
      var avg = total / reviews.length;
      summary.hidden = false;
      summary.innerHTML = '<span class="big">' + avg.toFixed(1) + "</span>" + U.starsHtml(Math.round(avg)) +
        '<span class="muted">' + reviews.length + " verified review" + (reviews.length === 1 ? "" : "s") + "</span>";

      list.innerHTML = "";
      reviews.forEach(function (r) {
        var card = document.createElement("article");
        card.className = "card review-card";

        var top = document.createElement("div");
        top.className = "review-meta";
        top.style.marginTop = "0";
        top.innerHTML = U.starsHtml(r.rating) + '<span class="verified">' + CHECK + "Verified customer</span>";
        card.appendChild(top);

        var q = document.createElement("blockquote");
        q.textContent = r.text;
        card.appendChild(q);

        var meta = document.createElement("div");
        meta.className = "review-meta";
        var who = document.createElement("span");
        who.className = "who";
        who.textContent = r.name;
        var when = document.createElement("span");
        when.className = "when";
        when.textContent = [r.service, monthYear(r.createdAt)].filter(Boolean).join(" · ");
        meta.appendChild(who);
        meta.appendChild(when);
        card.appendChild(meta);

        list.appendChild(card);
      });
    })
    .catch(function () {
      showEmpty("Reviews are coming soon", "We only publish reviews from customers we have served. Check back soon, or call or text 660-351-4699.");
    });
})();
