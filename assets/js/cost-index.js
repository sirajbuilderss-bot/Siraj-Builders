/* ==========================================================================
   Siraj Builders — page script: cost-index.html
   COST ESTIMATOR
   Runs after assets/include.js has injected the shared header and footer.
   ========================================================================== */
(function () {
  "use strict";

  function init() {
    var areaInput = document.getElementById("areaInput");
    var scopeSelect = document.getElementById("scopeSelect");
    var qualitySelect = document.getElementById("qualitySelect");
    var areaTypeSelect = document.getElementById("areaTypeSelect");
    var countrySelect = document.getElementById("countrySelect");
    var extrasSelect = document.getElementById("extrasSelect");
    
    var resultValue = document.getElementById("resultValue");
    var resultSub = document.getElementById("resultSub");
    
    var rowArea = document.getElementById("rowArea");
    var rowRate = document.getElementById("rowRate");
    var rowScope = document.getElementById("rowScope");
    var rowQuality = document.getElementById("rowQuality");
    var rowAreaType = document.getElementById("rowAreaType");
    var rowCountry = document.getElementById("rowCountry");
    
    var unitButtons = Array.prototype.slice.call(
      document.querySelectorAll(".segment button")
    );
    var currentUnit = "marla";
    
    /* base rate bands per sq. ft. (in PKR) — indicative only.
       These are the BASE (Pakistan-standard) rates before country,
       area type and extras factors are applied. */
    var BASE_RATES = {
      grey: { min: 1400, max: 2200 },
      standard: { min: 3200, max: 5200 },
      premium: { min: 5500, max: 9500 },
      renovation: { min: 2500, max: 6000 },
      commercial: { min: 3800, max: 7000 },
    };
    
    var SCOPE_LABELS = {
      grey: "Grey structure only",
      standard: "Standard finish (turnkey)",
      premium: "Premium finish",
      renovation: "Renovation & remodelling",
      commercial: "Commercial construction",
    };
    
    var QUALITY_LABELS = {
      "0.9": "Economy",
      "1": "Standard",
      "1.18": "Premium",
    };
    
    var AREA_TYPE_LABELS = {
      "0.9": "Rural / smaller town",
      "1": "Mid-sized city",
      "1.12": "Major city",
      "1.25": "Prime urban / metro",
    };
    
    /* area conversions to sq. ft. */
    var UNIT_TO_SQFT = {
      marla: 272.25,
      sqft: 1,
      sqyd: 9,
    };
    
    function convertArea(value, fromUnit, toUnit) {
      var inSqft = value * UNIT_TO_SQFT[fromUnit];
      return inSqft / UNIT_TO_SQFT[toUnit];
    }
    
    function formatPKR(n) {
      if (!isFinite(n) || n <= 0) return "PKR —";
      if (n >= 10000000) {
        return "PKR " + (n / 10000000).toFixed(2) + " crore";
      }
      if (n >= 100000) {
        return "PKR " + (n / 100000).toFixed(2) + " lakh";
      }
      return (
        "PKR " + n.toLocaleString("en-PK", { maximumFractionDigits: 0 })
      );
    }
    
    function getSelectedCountryText() {
      if (!countrySelect) return "Pakistan";
      var opt = countrySelect.options[countrySelect.selectedIndex];
      return opt ? opt.textContent.trim() : "Pakistan";
    }
    
    function updateEstimate() {
      var area = parseFloat(areaInput.value) || 0;
      var scope = scopeSelect.value;
      var quality = parseFloat(qualitySelect.value) || 1;
      var areaType = parseFloat(areaTypeSelect.value) || 1;
      var country = parseFloat(countrySelect.value) || 1;
      var extras = parseFloat(extrasSelect.value) || 0;
    
      var areaSqft = area * UNIT_TO_SQFT[currentUnit];
      var band = BASE_RATES[scope] || BASE_RATES.standard;
    
      var factor = quality * areaType * country * (1 + extras);
    
      var low = areaSqft * band.min * factor;
      var high = areaSqft * band.max * factor;
    
      var midRateLow = band.min * factor;
      var midRateHigh = band.max * factor;
    
      /* main range value */
      resultValue.textContent =
        area > 0
          ? formatPKR(low) + " – " + formatPKR(high)
          : "PKR —";
    
      /* sub-line summary */
      var unitLabel =
        currentUnit === "marla"
          ? "marla"
          : currentUnit === "sqft"
          ? "sq. ft."
          : "sq. yd.";
      var countryName = getSelectedCountryText();
    
      resultSub.textContent =
        area > 0
          ? "Based on " +
            area +
            " " +
            unitLabel +
            " · " +
            QUALITY_LABELS[qualitySelect.value] +
            " · " +
            countryName
          : "Enter a property area to see an estimate.";
    
      /* detail rows */
      rowArea.textContent =
        area > 0
          ? Math.round(areaSqft).toLocaleString("en-PK") + " sq. ft."
          : "—";
      rowRate.textContent =
        area > 0
          ? "PKR " +
            Math.round(midRateLow).toLocaleString("en-PK") +
            " – " +
            Math.round(midRateHigh).toLocaleString("en-PK")
          : "—";
      rowScope.textContent = SCOPE_LABELS[scope] || "—";
      rowQuality.textContent =
        QUALITY_LABELS[qualitySelect.value] || "Standard";
      rowAreaType.textContent =
        AREA_TYPE_LABELS[areaTypeSelect.value] || "Mid-sized city";
      rowCountry.textContent =
        countryName + " ×" + (country * 1).toFixed(2).replace(/0$/, "");
    }
    
    /* unit toggle */
    unitButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var newUnit = btn.getAttribute("data-unit");
        if (newUnit === currentUnit) return;
    
        var currentVal = parseFloat(areaInput.value) || 0;
        var converted = convertArea(currentVal, currentUnit, newUnit);
    
        currentUnit = newUnit;
        areaInput.value = Math.round(converted * 100) / 100;
    
        unitButtons.forEach(function (b) {
          b.classList.toggle(
            "is-active",
            b.getAttribute("data-unit") === currentUnit
          );
        });
    
        var hint = document.getElementById("areaHint");
        if (hint) {
          hint.textContent =
            currentUnit === "marla"
              ? "Enter total covered or plot area in marla"
              : currentUnit === "sqft"
              ? "Enter total covered area in square feet"
              : "Enter total area in square yards";
        }
    
        updateEstimate();
      });
    });
    
    /* input listeners */
    [
      areaInput,
      scopeSelect,
      qualitySelect,
      areaTypeSelect,
      countrySelect,
      extrasSelect,
    ].forEach(function (el) {
      if (!el) return;
      el.addEventListener("input", updateEstimate);
      el.addEventListener("change", updateEstimate);
    });
    
    /* initial render */
    updateEstimate();
  }

  if (document.body.getAttribute("data-booted")) init();
  else document.addEventListener("siraj:layout-ready", init, { once: true });
})();
