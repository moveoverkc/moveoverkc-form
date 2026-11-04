/* ==========================================================
   MOVE OVER KC  |  Photo gallery
   Reads photos.json and draws the gallery, filters, and viewer.
   You do not need to edit this file. Edit photos.json instead.
   ========================================================== */
(function () {
  "use strict";

  var gallery = document.getElementById("gallery");
  var filters = document.getElementById("filters");
  var hint = document.getElementById("upload-hint");
  var lb = document.getElementById("lightbox");
  var lbImg = document.getElementById("lb-img");
  var lbCap = document.getElementById("lb-cap");
  var lastFocus = null;
  var forceHelp = /[?&]help=1/.test(location.search);

  function showPlaceholders() {
    gallery.innerHTML = "";
    var labels = ["Moving photo", "Junk removal photo", "Handyman photo", "Crew photo", "Before and after", "Your next photo"];
    labels.forEach(function (label, i) {
      var fig = document.createElement("figure");
      var box = document.createElement("div");
      box.className = "ph" + (i % 3 === 1 ? " tall" : "");
      box.textContent = label + " goes here";
      fig.appendChild(box);
      fig.style.cursor = "default";
      gallery.appendChild(fig);
    });
    if (hint) hint.hidden = false;
  }

  function openBox(p) {
    lastFocus = document.activeElement;
    lbImg.src = p.file;
    lbImg.alt = p.alt || p.caption || "Move Over KC photo";
    lbCap.textContent = p.caption || "";
    lb.classList.add("open");
    document.getElementById("lb-close").focus();
  }

  function closeBox() {
    lb.classList.remove("open");
    lbImg.src = "";
    if (lastFocus) lastFocus.focus();
  }

  function render(list, category) {
    gallery.innerHTML = "";
    list.forEach(function (p) {
      if (category && category !== "All" && p.category !== category) return;
      var fig = document.createElement("figure");
      fig.tabIndex = 0;
      fig.setAttribute("role", "button");
      fig.setAttribute("aria-label", "View larger: " + (p.caption || p.alt || "photo"));

      var img = document.createElement("img");
      img.src = p.file;
      img.alt = p.alt || p.caption || "Move Over KC photo";
      img.loading = "lazy";
      img.decoding = "async";
      fig.appendChild(img);

      if (p.caption) {
        var cap = document.createElement("figcaption");
        cap.textContent = p.caption;
        fig.appendChild(cap);
      }

      fig.addEventListener("click", function () { openBox(p); });
      fig.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openBox(p); }
      });
      gallery.appendChild(fig);
    });
  }

  function buildFilters(list) {
    var cats = ["All"];
    list.forEach(function (p) { if (p.category && cats.indexOf(p.category) === -1) cats.push(p.category); });
    if (cats.length <= 2) { filters.hidden = true; return; }
    filters.hidden = false;
    filters.innerHTML = "";
    cats.forEach(function (c, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "chip";
      b.textContent = c;
      b.setAttribute("aria-pressed", i === 0 ? "true" : "false");
      b.addEventListener("click", function () {
        filters.querySelectorAll(".chip").forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
        b.setAttribute("aria-pressed", "true");
        render(list, c);
      });
      filters.appendChild(b);
    });
  }

  fetch("photos.json", { cache: "no-cache" })
    .then(function (r) { if (!r.ok) throw new Error("missing"); return r.json(); })
    .then(function (data) {
      var list = (data && data.photos) || [];
      if (!list.length) { showPlaceholders(); return; }
      if (hint) hint.hidden = !forceHelp;
      buildFilters(list);
      render(list, "All");
    })
    .catch(function () { showPlaceholders(); });

  document.getElementById("lb-close").addEventListener("click", closeBox);
  lb.addEventListener("click", function (e) { if (e.target === lb) closeBox(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && lb.classList.contains("open")) closeBox(); });
})();
