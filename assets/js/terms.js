/* ==========================================================================
   Siraj Builders — page script: terms.html
   READING PROGRESS + SECTION TRACKING
   Runs after assets/include.js has injected the shared header and footer.
   ========================================================================== */
(function () {
  "use strict";

  function init() {
    var progressBar = document.querySelector("[data-reading-progress]");
    
    function updateProgress() {
      if (!progressBar) return;
      var docHeight =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
      var scrolled = window.scrollY || window.pageYOffset;
      var pct = docHeight > 0 ? (scrolled / docHeight) * 100 : 0;
      progressBar.style.width = pct + "%";
    }
    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress, { passive: true });
    
    /* ==========================================================
       6. TOC — SCROLL SPY
    ========================================================== */
    var tocLinks = Array.prototype.slice.call(
      document.querySelectorAll(".toc-list a")
    );
    var sections = tocLinks
      .map(function (link) {
        var id = link.getAttribute("href").slice(1);
        return document.getElementById(id);
      })
      .filter(Boolean);
    
    if ("IntersectionObserver" in window && sections.length) {
      var sectionObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            var id = entry.target.id;
            tocLinks.forEach(function (link) {
              var isActive = link.getAttribute("href") === "#" + id;
              link.classList.toggle("is-active", isActive);
            });
          });
        },
        {
          rootMargin: "-25% 0px -60% 0px",
          threshold: 0,
        }
      );
    
      sections.forEach(function (sec) {
        sectionObserver.observe(sec);
      });
    }
  }

  if (document.body.getAttribute("data-booted")) init();
  else document.addEventListener("siraj:layout-ready", init, { once: true });
})();
