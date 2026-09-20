/* ==========================================================================
   Siraj Builders — page script: market-sectors.html
   PROJECT FILTERS
   Runs after assets/include.js has injected the shared header and footer.
   ========================================================================== */
(function () {
  "use strict";

  function init() {
    var filterBtns = Array.prototype.slice.call(
      document.querySelectorAll(".filter-btn")
    );
    var projectCards = Array.prototype.slice.call(
      document.querySelectorAll("[data-category]")
    );
    var emptyState = document.querySelector("[data-projects-empty]");
    
    function applyFilter(cat) {
      var visible = 0;
    
      projectCards.forEach(function (card) {
        var cardCat = card.getAttribute("data-category");
        var show = cat === "all" || cardCat === cat;
        card.classList.toggle("is-hidden", !show);
        if (show) visible++;
      });
    
      if (emptyState) {
        emptyState.classList.toggle("is-visible", visible === 0);
      }
    }
    
    filterBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var cat = btn.getAttribute("data-filter");
    
        /* active state */
        filterBtns.forEach(function (b) {
          var isActive = b === btn;
          b.classList.toggle("is-active", isActive);
          b.setAttribute("aria-selected", String(isActive));
        });
    
        applyFilter(cat);
      });
    });
    
    /* initial filter */
    applyFilter("all");
  }

  if (document.body.getAttribute("data-booted")) init();
  else document.addEventListener("siraj:layout-ready", init, { once: true });
})();
