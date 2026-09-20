/* ==========================================================================
   Siraj Builders — project enquiry form
   Used by contact-us.html (#contactForm) and consultation.html (#consultForm)
   --------------------------------------------------------------------------
   Front-end only. Validates required fields, shows per-field messages, runs a
   loading state, then swaps in the page's existing success panel.

   No backend is connected: nothing is transmitted and the copy says so.
   To go live, replace sendToBackend() with a real fetch() to your endpoint.
   ========================================================================== */
(function () {
  "use strict";

  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var PHONE = /^[+()\-\s\d]{7,}$/;

  function init() {
    var form =
      document.getElementById("contactForm") ||
      document.getElementById("consultForm");
    if (!form) return;

    var success = document.getElementById("formSuccess");
    var resetBtn = document.getElementById("resetForm");
    var grid = form.querySelector(".form-grid");
    var head = form.querySelector(".form-head");
    var submit = form.querySelector('[type="submit"]');
    var submitLabel = submit ? submit.innerHTML : "";

    form.setAttribute("novalidate", "novalidate");

    var fields = Array.prototype.slice.call(
      form.querySelectorAll("input, select, textarea")
    ).filter(function (f) {
      return f.type !== "hidden" && f.type !== "submit" && f.type !== "button";
    });

    /* --- make sure every field has somewhere to show its message --- */
    fields.forEach(function (f) {
      var wrap = f.closest(".field");
      if (!wrap) return;
      if (!wrap.querySelector(".error-msg")) {
        var span = document.createElement("span");
        span.className = "error-msg";
        span.setAttribute("aria-live", "polite");
        wrap.appendChild(span);
      }
      if (!f.id) f.id = "f-" + Math.random().toString(36).slice(2, 8);
      wrap.querySelector(".error-msg").id = f.id + "-error";
      f.setAttribute("aria-describedby", f.id + "-error");
    });

    function problem(f) {
      var v = (f.value || "").trim();

      if (f.hasAttribute("required") && !v) {
        if (f.tagName === "SELECT") return "Please choose an option.";
        return "This field is required.";
      }
      if (!v) return null; /* optional and empty — fine */

      if (f.type === "email" && !EMAIL.test(v)) {
        return "Enter a valid email address, for example name@example.com.";
      }
      if (f.type === "tel" && !PHONE.test(v)) {
        return "Enter a valid phone number, digits and + ( ) - only.";
      }
      if (f.tagName === "TEXTAREA" && f.hasAttribute("required") && v.length < 10) {
        return "Please add a little more detail — at least 10 characters.";
      }
      return null;
    }

    function paint(f, showValid) {
      var wrap = f.closest(".field");
      var msg = problem(f);
      var slot = wrap ? wrap.querySelector(".error-msg") : null;

      if (wrap) {
        wrap.classList.toggle("is-invalid", !!msg);
        wrap.classList.toggle(
          "is-valid",
          !msg && showValid && !!(f.value || "").trim()
        );
      }
      f.setAttribute("aria-invalid", String(!!msg));
      if (slot) slot.textContent = msg || "";

      /* clear the old inline styling if this page was previously rendered */
      f.style.borderColor = "";
      f.style.boxShadow = "";

      return !msg;
    }

    fields.forEach(function (f) {
      f.addEventListener("blur", function () {
        paint(f, true);
      });
      f.addEventListener("change", function () {
        paint(f, true);
      });
      f.addEventListener("input", function () {
        var wrap = f.closest(".field");
        if (wrap && wrap.classList.contains("is-invalid")) paint(f, true);
      });
    });

    function clearAll() {
      fields.forEach(function (f) {
        var wrap = f.closest(".field");
        if (wrap) wrap.classList.remove("is-invalid", "is-valid");
        f.removeAttribute("aria-invalid");
        var slot = wrap ? wrap.querySelector(".error-msg") : null;
        if (slot) slot.textContent = "";
        f.style.borderColor = "";
        f.style.boxShadow = "";
      });
    }

    /* Placeholder for a real integration. Resolves after a short delay so the
       loading state is visible; it does NOT send anything anywhere. */
    function sendToBackend() {
      return new Promise(function (resolve) {
        setTimeout(resolve, 900);
      });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var firstInvalid = null;
      fields.forEach(function (f) {
        if (!paint(f, true) && !firstInvalid) firstInvalid = f;
      });

      if (firstInvalid) {
        firstInvalid.focus();
        firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
        if (window.SirajToast) {
          window.SirajToast("Please complete the highlighted fields.");
        }
        return;
      }

      if (submit) {
        submit.disabled = true;
        submit.setAttribute("aria-busy", "true");
        submit.classList.add("is-loading");
        submit.innerHTML = "Sending…";
      }

      sendToBackend().then(function () {
        if (submit) {
          submit.disabled = false;
          submit.removeAttribute("aria-busy");
          submit.classList.remove("is-loading");
          submit.innerHTML = submitLabel;
        }

        if (grid) grid.style.display = "none";
        if (head) head.style.display = "none";
        if (success) {
          success.classList.add("is-active");
          success.setAttribute("role", "status");
          success.setAttribute("tabindex", "-1");
          success.focus();
        }
      });
    });

    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        form.reset();
        clearAll();
        if (success) success.classList.remove("is-active");
        if (grid) grid.style.display = "";
        if (head) head.style.display = "";
        var first = fields[0];
        if (first) first.focus();
      });
    }
  }

  if (document.body.getAttribute("data-booted")) init();
  else document.addEventListener("siraj:layout-ready", init, { once: true });
})();
