/* ==========================================================
   MOVE OVER KC  |  Verified review form
   Only works with a valid private link (review.html?t=...).
   The backend checks the link again on submit and burns it,
   so each link can be used exactly once.
   ========================================================== */
(function () {
  "use strict";

  var U = window.MOKC_UTIL;
  var params = new URLSearchParams(location.search);
  var token = (params.get("t") || "").trim();

  var title = document.getElementById("rv-title");
  var sub = document.getElementById("rv-sub");
  var invalid = document.getElementById("rv-invalid");
  var form = document.getElementById("rv-form");
  var thanks = document.getElementById("rv-thanks");
  var status = document.getElementById("rv-status");
  var submit = document.getElementById("rv-submit");
  var starsBox = document.getElementById("rv-stars");

  // Build the five stars (markup order 5 to 1 so the CSS can fill them left to right)
  var html = "";
  for (var i = 5; i >= 1; i--) {
    html += '<input type="radio" name="rating" id="star' + i + '" value="' + i + '">' +
      '<label for="star' + i + '" title="' + i + ' star' + (i === 1 ? "" : "s") + '"><span class="sr-only" style="position:absolute;left:-9999px">' + i + ' stars</span>' +
      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="' + U.STAR_PATH + '"/></svg></label>';
  }
  starsBox.innerHTML = html;

  function showInvalid(message) {
    title.textContent = "This link is not active";
    sub.textContent = "We could not verify this review link.";
    if (message) invalid.querySelector("p").textContent = message;
    invalid.hidden = false;
    form.hidden = true;
  }

  function setStatus(kind, text) {
    status.className = "form-status show " + kind;
    status.textContent = text;
  }

  if (!token) { showInvalid(""); return; }

  U.api("/review-link?t=" + encodeURIComponent(token))
    .then(function (data) {
      if (!data || !data.valid) throw new Error("invalid");
      var first = (data.name || "").split(" ")[0] || "there";
      title.textContent = "Hi " + first + ", thank you for choosing us!";
      sub.textContent = "This private link was made just for you. It takes about a minute.";

      var parts = (data.name || "").trim().split(/\s+/);
      var suggested = parts.length > 1 ? parts[0] + " " + parts[parts.length - 1].charAt(0).toUpperCase() + "." : (parts[0] || "");
      document.getElementById("rv-name").value = suggested;
      if (data.service) document.getElementById("rv-service").value = data.service;

      form.hidden = false;
    })
    .catch(function (err) {
      if (err && err.code === "no_api") {
        showInvalid("The review system is not switched on yet. Please call or text 660-351-4699.");
      } else {
        showInvalid("");
      }
    });

  function fieldOf(el) { return el.closest(".field"); }
  function mark(el, bad) { var f = fieldOf(el); if (f) f.classList.toggle("invalid", bad); }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var ratingEl = form.querySelector('input[name="rating"]:checked');
    var text = document.getElementById("rv-text");
    var name = document.getElementById("rv-name");
    var consent = document.getElementById("rv-consent");
    var consentErr = document.getElementById("rv-consent-err");

    var bad = false;
    mark(starsBox, !ratingEl); if (!ratingEl) bad = true;
    var textBad = text.value.trim().length < 20; mark(text, textBad); if (textBad) bad = true;
    var nameBad = name.value.trim().length < 2; mark(name, nameBad); if (nameBad) bad = true;
    consentErr.parentNode.classList.toggle("invalid", !consent.checked); if (!consent.checked) bad = true;
    if (bad) return;

    submit.disabled = true;
    submit.textContent = "Submitting...";
    setStatus("ok", "Sending your review...");

    U.api("/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: token,
        rating: ratingEl.value,
        text: text.value.trim(),
        displayName: name.value.trim(),
        service: document.getElementById("rv-service").value
      })
    }).then(function () {
      form.hidden = true;
      thanks.hidden = false;
      title.textContent = "Thank you!";
      sub.textContent = "Your review was received.";
      window.scrollTo({ top: 0, behavior: "smooth" });
    }).catch(function (err) {
      setStatus("bad", (err && err.message) ? err.message : "That did not go through. Please try again.");
      submit.disabled = false;
      submit.textContent = "Submit my review";
    });
  });
})();
