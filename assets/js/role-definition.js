/* ==========================================================================
   Siraj Builders — page script: role-definition.html
   ROLE DEFINITION ACCORDION
   Runs after assets/include.js has injected the shared header and footer.
   ========================================================================== */
(function () {
  "use strict";

  function init() {
    var rdItems = Array.prototype.slice.call(
      document.querySelectorAll("[data-rd-item]")
    );
    
    function closeRdItem(item) {
      item.classList.remove("is-open");
      var header = item.querySelector(".rd-header");
      var body = item.querySelector(".rd-body");
      if (header) header.setAttribute("aria-expanded", "false");
      if (body) body.style.maxHeight = "0px";
    }
    
    function openRdItem(item) {
      item.classList.add("is-open");
      var header = item.querySelector(".rd-header");
      var body = item.querySelector(".rd-body");
      if (header) header.setAttribute("aria-expanded", "true");
      if (body) body.style.maxHeight = body.scrollHeight + 40 + "px";
    }
    
    rdItems.forEach(function (item) {
      var header = item.querySelector(".rd-header");
      if (!header) return;
    
      header.addEventListener("click", function () {
        var isOpen = item.classList.contains("is-open");
    
        /* close all */
        rdItems.forEach(closeRdItem);
    
        /* toggle */
        if (!isOpen) openRdItem(item);
      });
    });
    
    /* open the first item by default */
    if (rdItems.length) {
      /* wait for layout to settle before measuring height */
      window.requestAnimationFrame(function () {
        openRdItem(rdItems[0]);
      });
    }
    
    /* recalculate open item height on resize */
    window.addEventListener(
      "resize",
      function () {
        rdItems.forEach(function (item) {
          if (!item.classList.contains("is-open")) return;
          var body = item.querySelector(".rd-body");
          if (body) body.style.maxHeight = body.scrollHeight + 40 + "px";
        });
      },
      { passive: true }
    );
  }

  if (document.body.getAttribute("data-booted")) init();
  else document.addEventListener("siraj:layout-ready", init, { once: true });
})();
