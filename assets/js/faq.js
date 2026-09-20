/* ==========================================================================
   Siraj Builders — page script: faq.html
   FAQ — ACCORDION, SEARCH & CATEGORY FILTER
   Runs after assets/include.js has injected the shared header and footer.
   ========================================================================== */
(function () {
  "use strict";

  function init() {
    var faqItems = Array.prototype.slice.call(
      document.querySelectorAll(".faq-item")
    );
    
    function closeItem(item) {
      item.classList.remove("is-open");
      var q = item.querySelector(".faq-q");
      var a = item.querySelector(".faq-a");
      if (q) q.setAttribute("aria-expanded", "false");
      if (a) a.style.maxHeight = "0px";
    }
    
    function openItem(item) {
      item.classList.add("is-open");
      var q = item.querySelector(".faq-q");
      var a = item.querySelector(".faq-a");
      if (q) q.setAttribute("aria-expanded", "true");
      if (a) a.style.maxHeight = a.scrollHeight + 40 + "px";
    }
    
    faqItems.forEach(function (item) {
      var q = item.querySelector(".faq-q");
      if (!q) return;
    
      q.addEventListener("click", function () {
        var isOpen = item.classList.contains("is-open");
    
        /* close all */
        faqItems.forEach(closeItem);
    
        /* toggle */
        if (!isOpen) openItem(item);
      });
    });
    
    /* ==========================================================
       6. FAQ — SEARCH & FILTER
    ========================================================== */
    var searchInput = document.getElementById("faqSearch");
    var searchClear = document.querySelector("[data-search-clear]");
    var catButtons = Array.prototype.slice.call(
      document.querySelectorAll(".cat-btn")
    );
    var groups = Array.prototype.slice.call(
      document.querySelectorAll(".faq-group")
    );
    var emptyState = document.querySelector("[data-faq-empty]");
    var visibleCountEl = document.querySelector("[data-visible-count]");
    var statusEl = document.querySelector("[data-status]");
    
    var currentCat = "all";
    
    function normalize(text) {
      return (text || "").toLowerCase().trim();
    }
    
    function applyFilters() {
      var query = normalize(searchInput ? searchInput.value : "");
      var visible = 0;
    
      /* toggle clear button */
      if (searchClear) {
        searchClear.classList.toggle(
          "is-visible",
          query.length > 0
        );
      }
    
      groups.forEach(function (group) {
        var groupCat = group.getAttribute("data-group");
        var anyVisibleInGroup = false;
    
        /* category filter at group level */
        var groupMatchesCat =
          currentCat === "all" || currentCat === groupCat;
    
        var items = Array.prototype.slice.call(
          group.querySelectorAll(".faq-item")
        );
    
        items.forEach(function (item) {
          var itemCat = item.getAttribute("data-cat");
          var catMatch =
            currentCat === "all" || currentCat === itemCat;
    
          var haystack = normalize(item.textContent);
          var queryMatch = !query || haystack.indexOf(query) !== -1;
    
          var show = catMatch && queryMatch;
    
          item.classList.toggle("is-hidden", !show);
    
          if (show) {
            anyVisibleInGroup = true;
            visible++;
          } else {
            /* close hidden items */
            closeItem(item);
          }
        });
    
        group.style.display =
          anyVisibleInGroup && groupMatchesCat ? "" : "none";
      });
    
      /* empty state */
      if (emptyState) {
        emptyState.classList.toggle("is-visible", visible === 0);
      }
    
      /* update count */
      if (visibleCountEl) {
        visibleCountEl.textContent = visible;
      }
    
      /* update status text */
      if (statusEl) {
        if (visible === 0) {
          statusEl.innerHTML =
            "No questions match your filters";
        } else if (currentCat === "all" && !query) {
          statusEl.innerHTML =
            'Showing <b data-visible-count>' +
            visible +
            "</b> of 19 questions";
        } else {
          var label =
            currentCat === "all"
              ? "all topics"
              : (function () {
                  var btn = document.querySelector(
                    '.cat-btn[data-cat="' + currentCat + '"] .cat-name'
                  );
                  return btn
                    ? btn.textContent.replace(/[0-9]/g, "").trim()
                    : currentCat;
                })();
          statusEl.innerHTML =
            'Showing <b data-visible-count>' +
            visible +
            "</b> question" +
            (visible === 1 ? "" : "s") +
            " · " +
            label +
            (query ? ' · "' + query + '"' : "");
        }
      }
    }
    
    if (searchInput) {
      searchInput.addEventListener("input", applyFilters);
    }
    if (searchClear) {
      searchClear.addEventListener("click", function () {
        if (searchInput) searchInput.value = "";
        applyFilters();
        if (searchInput) searchInput.focus();
      });
    }
    
    /* reset from empty state */
    var resetSearch = document.querySelector("[data-reset-search]");
    if (resetSearch) {
      resetSearch.addEventListener("click", function () {
        if (searchInput) searchInput.value = "";
        currentCat = "all";
        catButtons.forEach(function (b) {
          b.classList.toggle(
            "is-active",
            b.getAttribute("data-cat") === "all"
          );
        });
        applyFilters();
      });
    }
    
    /* category buttons */
    catButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        currentCat = btn.getAttribute("data-cat");
        catButtons.forEach(function (b) {
          b.classList.toggle("is-active", b === btn);
        });
        applyFilters();
      });
    });
    
    /* ==========================================================
       7. EXPAND ALL / COLLAPSE
    ========================================================== */
    var expandAllBtn = document.querySelector("[data-expand-all]");
    var allExpanded = false;
    
    if (expandAllBtn) {
      expandAllBtn.addEventListener("click", function () {
        allExpanded = !allExpanded;
    
        faqItems.forEach(function (item) {
          if (item.classList.contains("is-hidden")) return;
    
          if (allExpanded) {
            openItem(item);
          } else {
            closeItem(item);
          }
        });
    
        /* update button label */
        var label = allExpanded ? "Collapse all" : "Expand all";
        expandAllBtn.childNodes.forEach(function (n) {
          if (n.nodeType === 3 && n.textContent.trim()) {
            n.textContent = " " + label;
          }
        });
    
        /* fallback if text node not found */
        if (
          expandAllBtn.textContent.indexOf(label) === -1
        ) {
          expandAllBtn.innerHTML =
            '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 15l5 5 5-5M7 9l5-5 5 5"/></svg> ' +
            label;
        }
      });
    }
    
    /* ==========================================================
       8. INITIAL RENDER
    ========================================================== */
    applyFilters();
  }

  if (document.body.getAttribute("data-booted")) init();
  else document.addEventListener("siraj:layout-ready", init, { once: true });
})();
