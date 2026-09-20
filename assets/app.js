/* ==========================================================================
   Siraj Builders — site behaviour
   --------------------------------------------------------------------------
   Runs after assets/include.js has injected layout/header.html and
   layout/footer.html, so every handler binds to the real, shared markup.

   Sections
     1. Header scroll state + back to top
     2. Desktop dropdowns
     3. Mobile drawer
     4. Active navigation state
     5. Hero slider
     6. Scroll reveal
     7. Counters
     8. FAQ accordion
     9. Filters
    10. Forms (front-end validation + honest demo submit)
    11. Toast + modals
    12. Smooth in-page anchors
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  function $(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }
  function $$(sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  }

  /* ======================================================================
     1. HEADER SCROLL STATE + BACK TO TOP
     ====================================================================== */
  function initHeaderScroll() {
    var header = $("[data-site-nav]");
    var backtop = $(".backtop");

    function onScroll() {
      var y = window.scrollY || window.pageYOffset;
      if (header) header.classList.toggle("is-scrolled", y > 40);
      if (backtop) backtop.classList.toggle("is-visible", y > 600);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    if (backtop) {
      backtop.addEventListener("click", function () {
        window.scrollTo({
          top: 0,
          behavior: reduceMotion ? "auto" : "smooth",
        });
      });
    }
  }

  /* ======================================================================
     2. DESKTOP DROPDOWNS
     ====================================================================== */
  function initDropdowns() {
    var dropdowns = $$(".dropdown");
    if (!dropdowns.length) return;

    var canHover = window.matchMedia(
      "(hover: hover) and (min-width: 1081px)"
    ).matches;

    function closeAll(except) {
      dropdowns.forEach(function (dd) {
        if (dd === except) return;
        dd.classList.remove("is-open");
        var t = $(".drop-toggle", dd);
        if (t) t.setAttribute("aria-expanded", "false");
      });
    }

    dropdowns.forEach(function (dd) {
      var toggle = $(".drop-toggle", dd);
      if (!toggle) return;

      toggle.addEventListener("click", function (e) {
        e.preventDefault();
        /* On hover-capable desktops the panel is already open from
           mouseenter, so a click there must not immediately close it. */
        var willOpen = canHover ? true : !dd.classList.contains("is-open");
        closeAll(dd);
        dd.classList.toggle("is-open", willOpen);
        toggle.setAttribute("aria-expanded", String(willOpen));
      });

      if (canHover) {
        dd.addEventListener("mouseenter", function () {
          closeAll(dd);
          dd.classList.add("is-open");
          toggle.setAttribute("aria-expanded", "true");
        });
        dd.addEventListener("mouseleave", function () {
          dd.classList.remove("is-open");
          toggle.setAttribute("aria-expanded", "false");
        });
      }
    });

    document.addEventListener("click", function (e) {
      if (!e.target.closest || !e.target.closest(".dropdown")) closeAll(null);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeAll(null);
    });
  }

  /* ======================================================================
     3. MOBILE DRAWER
     ====================================================================== */
  function initMobileMenu() {
    var header = $("[data-site-nav]");
    var hamb = $(".hamb");
    var menu = document.getElementById("mobileMenu");
    var backdrop = $("[data-menu-backdrop]");
    if (!hamb || !menu) return;

    function setMenu(open) {
      menu.classList.toggle("is-open", open);
      hamb.classList.toggle("is-open", open);
      if (backdrop) backdrop.classList.toggle("is-open", open);
      if (header) header.classList.toggle("menu-open", open);
      hamb.setAttribute("aria-expanded", String(open));
      hamb.setAttribute(
        "aria-label",
        open ? "Close navigation menu" : "Open navigation menu"
      );
      document.body.classList.toggle("no-scroll", open);
    }

    hamb.addEventListener("click", function () {
      setMenu(!menu.classList.contains("is-open"));
    });

    if (backdrop) {
      backdrop.addEventListener("click", function () {
        setMenu(false);
      });
    }

    $$("a", menu).forEach(function (a) {
      a.addEventListener("click", function () {
        setMenu(false);
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("is-open")) {
        setMenu(false);
      }
    });

    /* collapsible sub-sections inside the drawer */
    $$("[data-mobile-toggle]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var target = document.getElementById(
          btn.getAttribute("data-mobile-toggle")
        );
        if (!target) return;
        var open = !target.classList.contains("is-open");
        target.classList.toggle("is-open", open);
        btn.setAttribute("aria-expanded", String(open));
        var sign = btn.querySelector("span");
        if (sign) sign.textContent = open ? "−" : "+";
      });
    });

    /* if the viewport grows past the mobile breakpoint, reset the drawer */
    window.matchMedia("(min-width: 1081px)").addEventListener
      ? window
          .matchMedia("(min-width: 1081px)")
          .addEventListener("change", function (e) {
            if (e.matches) setMenu(false);
          })
      : null;
  }

  /* ======================================================================
     4. ACTIVE NAVIGATION STATE
     One shared header is used everywhere, so the current page is resolved
     at runtime rather than hard-coded per page.
     ====================================================================== */
  function initActiveNav() {
    var file = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    if (!file) file = "index.html";

    /* Pages can declare which nav item should light up, e.g.
       <body data-page="market-sectors.html"> — useful for detail pages. */
    var declared = document.body.getAttribute("data-page");
    var current = (declared || file).toLowerCase();

    $$("[data-nav]").forEach(function (a) {
      var target = (a.getAttribute("data-nav") || "").toLowerCase();
      var on = target === current;
      a.classList.toggle("is-active", on);
      a.classList.toggle("active", on);
      if (on) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });

    /* Highlight the Services dropdown when the open page lives inside it and
       no top-level desktop nav item claimed the active state. */
    var topMatched = $$(".menu > a[data-nav]").some(function (a) {
      return (a.getAttribute("data-nav") || "").toLowerCase() === current;
    });

    $$(".dropdown").forEach(function (dd) {
      var hit =
        !topMatched &&
        $$(".drop-panel a", dd).some(function (a) {
          var href = (a.getAttribute("href") || "").toLowerCase();
          return href.split("/").pop().split("#")[0] === current;
        });
      dd.classList.toggle("is-current", hit);
    });
  }

  /* ======================================================================
     5. HERO SLIDER
     ====================================================================== */
  function initHeroSlider() {
    var hero = $("[data-hero-slider]");
    if (!hero) return;

    var slides = $$("[data-slide]", hero);
    var dots = $$("[data-hero-dot]", hero);
    var prevBtn = $("[data-hero-prev]", hero);
    var nextBtn = $("[data-hero-next]", hero);
    var progressWrap = $(".hero-progress", hero);
    var bar = progressWrap ? $("span", progressWrap) : null;
    var controls = $(".hero-controls", hero);

    if (slides.length < 2) {
      if (slides[0]) slides[0].classList.add("is-active");
      if (progressWrap) progressWrap.style.display = "none";
      return;
    }

    var DURATION = 7000;
    var index = 0;
    var timer = null;
    var startTime = 0;
    var remaining = DURATION;
    var isPaused = false;
    var autoplay = !reduceMotion;

    if (!autoplay && progressWrap) progressWrap.style.display = "none";

    function restartProgress() {
      if (!bar) return;
      bar.style.animation = "none";
      void bar.offsetWidth;
      bar.style.animation = "";
      bar.style.animationPlayState = isPaused ? "paused" : "running";
    }

    function render(i) {
      index = (i + slides.length) % slides.length;

      slides.forEach(function (s, n) {
        var active = n === index;
        s.classList.toggle("is-active", active);
        s.setAttribute("aria-hidden", String(!active));
      });

      dots.forEach(function (d, n) {
        var active = n === index;
        d.classList.toggle("is-active", active);
        d.setAttribute("aria-selected", String(active));
      });

      restartProgress();
    }

    function schedule(ms) {
      if (!autoplay) return;
      clearTimeout(timer);
      remaining = ms;
      startTime = Date.now();
      timer = setTimeout(function () {
        render(index + 1);
        schedule(DURATION);
      }, ms);
    }

    function pauseAuto() {
      if (!autoplay || isPaused) return;
      isPaused = true;
      if (timer) {
        clearTimeout(timer);
        timer = null;
        remaining -= Date.now() - startTime;
        if (remaining < 300) remaining = 300;
      }
      if (bar) bar.style.animationPlayState = "paused";
    }

    function resumeAuto() {
      if (!autoplay || !isPaused) return;
      isPaused = false;
      startTime = Date.now();
      timer = setTimeout(function () {
        render(index + 1);
        schedule(DURATION);
      }, remaining);
      if (bar) bar.style.animationPlayState = "running";
    }

    function goNext() {
      render(index + 1);
      schedule(DURATION);
    }
    function goPrev() {
      render(index - 1);
      schedule(DURATION);
    }

    if (nextBtn) nextBtn.addEventListener("click", goNext);
    if (prevBtn) prevBtn.addEventListener("click", goPrev);

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        var n = parseInt(dot.getAttribute("data-hero-dot"), 10);
        if (isNaN(n) || n === index) return;
        render(n);
        schedule(DURATION);
      });
    });

    if (controls) {
      controls.addEventListener("mouseenter", pauseAuto);
      controls.addEventListener("mouseleave", resumeAuto);
      controls.addEventListener("focusin", pauseAuto);
      controls.addEventListener("focusout", resumeAuto);
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) pauseAuto();
      else resumeAuto();
    });

    document.addEventListener("keydown", function (e) {
      var rect = hero.getBoundingClientRect();
      var visible = rect.top < window.innerHeight * 0.6 && rect.bottom > 0;
      if (!visible) return;
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    });

    var startX = 0;
    var startY = 0;
    var swiping = false;

    hero.addEventListener(
      "touchstart",
      function (e) {
        var t = e.changedTouches[0];
        startX = t.clientX;
        startY = t.clientY;
        swiping = true;
        pauseAuto();
      },
      { passive: true }
    );

    hero.addEventListener(
      "touchend",
      function (e) {
        if (!swiping) return;
        swiping = false;
        var t = e.changedTouches[0];
        var dx = t.clientX - startX;
        var dy = t.clientY - startY;
        if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) {
          if (dx < 0) goNext();
          else goPrev();
        } else {
          resumeAuto();
        }
      },
      { passive: true }
    );

    render(0);
    if (autoplay) schedule(DURATION);
  }

  /* ======================================================================
     6. SCROLL REVEAL
     ====================================================================== */
  function initReveal() {
    var revealEls = $$(".reveal");

    $$("[data-stagger]").forEach(function (group) {
      Array.prototype.slice.call(group.children).forEach(function (child, i) {
        if (child.classList.contains("reveal")) {
          child.style.setProperty("--d", (i * 0.1).toFixed(2) + "s");
        }
      });
    });

    if ("IntersectionObserver" in window && !reduceMotion) {
      var obs = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("in-view");
              entry.target.classList.add("visible");
              obs.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -70px 0px" }
      );
      revealEls.forEach(function (el) {
        obs.observe(el);
      });
    } else {
      revealEls.forEach(function (el) {
        el.classList.add("in-view");
        el.classList.add("visible");
      });
    }
  }

  /* ======================================================================
     7. COUNTERS
     ====================================================================== */
  function initCounters() {
    function animate(el) {
      var target = parseFloat(el.getAttribute("data-counter")) || 0;
      var suffix = el.getAttribute("data-suffix") || "";
      var duration = 1600;

      if (reduceMotion) {
        el.textContent = target + suffix;
        return;
      }

      var start = null;
      function tick(now) {
        if (start === null) start = now;
        var p = Math.min((now - start) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }

    var counters = $$("[data-counter]");
    if (!counters.length) return;

    if ("IntersectionObserver" in window) {
      var obs = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              animate(entry.target);
              obs.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.5 }
      );
      counters.forEach(function (c) {
        obs.observe(c);
      });
    } else {
      counters.forEach(animate);
    }
  }

  /* ======================================================================
     8. FAQ ACCORDION
     ====================================================================== */
  function initFaq() {
    /* Pages that ship their own accordion (faq.html has one wired to its
       search + category filter) opt out with <body data-custom-faq>. */
    if (document.body.hasAttribute("data-custom-faq")) return;

    var questions = $$(".faq-q");
    if (!questions.length) return;

    questions.forEach(function (q, i) {
      var item = q.closest(".faq-item");
      if (!item) return;

      var panel = $(".faq-a", item);
      var open = item.classList.contains("is-open") || item.classList.contains("open");

      if (!q.id) q.id = "faq-q-" + (i + 1);
      if (panel) {
        if (!panel.id) panel.id = "faq-a-" + (i + 1);
        panel.setAttribute("role", "region");
        panel.setAttribute("aria-labelledby", q.id);
        q.setAttribute("aria-controls", panel.id);
      }
      q.setAttribute("aria-expanded", String(open));
      if (q.tagName !== "BUTTON") {
        q.setAttribute("role", "button");
        q.setAttribute("tabindex", "0");
      }
      item.classList.toggle("is-open", open);
    });

    function toggle(item, force) {
      var group = item.closest(".faq-list") || item.parentElement;
      var willOpen =
        typeof force === "boolean" ? force : !item.classList.contains("is-open");

      if (willOpen && group) {
        $$(".faq-item.is-open", group).forEach(function (other) {
          if (other === item) return;
          other.classList.remove("is-open", "open");
          var oq = $(".faq-q", other);
          if (oq) oq.setAttribute("aria-expanded", "false");
        });
      }

      item.classList.toggle("is-open", willOpen);
      item.classList.toggle("open", willOpen);
      var q = $(".faq-q", item);
      if (q) q.setAttribute("aria-expanded", String(willOpen));
    }

    questions.forEach(function (q) {
      var item = q.closest(".faq-item");
      if (!item) return;

      q.addEventListener("click", function () {
        toggle(item);
      });

      q.addEventListener("keydown", function (e) {
        if (q.tagName !== "BUTTON" && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          toggle(item);
          return;
        }
        if (e.key === "Escape") toggle(item, false);

        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          var all = $$(".faq-q");
          var i = all.indexOf(q);
          var next = all[(i + (e.key === "ArrowDown" ? 1 : -1) + all.length) % all.length];
          if (next) next.focus();
        }
      });
    });
  }

  /* ======================================================================
     9. FILTERS
     ====================================================================== */
  function initFilters() {
    $$("[data-filter]").forEach(function (group) {
      var buttons = $$("button", group);
      if (!buttons.length) return;

      buttons.forEach(function (btn) {
        btn.addEventListener("click", function () {
          buttons.forEach(function (b) {
            b.classList.remove("active", "is-active");
            b.setAttribute("aria-pressed", "false");
          });
          btn.classList.add("active", "is-active");
          btn.setAttribute("aria-pressed", "true");

          var f = btn.getAttribute("data-filter-value") || btn.dataset.filter;
          $$("[data-category-item]").forEach(function (item) {
            var show = f === "all" || !f || item.getAttribute("data-category-item") === f;
            item.style.display = show ? "" : "none";
            item.classList.toggle("is-hidden", !show);
          });
        });
      });
    });
  }

  /* ======================================================================
     10. FORMS — front-end validation and an honest demo submit
     ====================================================================== */
  function initForms() {
    var forms = $$("form[data-demo-form]");
    if (!forms.length) return;

    function fieldOf(input) {
      return input.closest(".field") || input.parentElement;
    }

    function messageFor(input) {
      if (input.validity.valueMissing) {
        return input.getAttribute("data-msg-required") || "This field is required.";
      }
      if (input.validity.typeMismatch && input.type === "email") {
        return "Enter a valid email address, for example name@example.com.";
      }
      if (input.validity.typeMismatch && input.type === "tel") {
        return "Enter a valid phone number.";
      }
      if (input.validity.tooShort) {
        return "Please use at least " + input.minLength + " characters.";
      }
      if (input.validity.patternMismatch) {
        return input.getAttribute("data-msg-pattern") || "Please check this value.";
      }
      return "Please check this value.";
    }

    function validate(input, showValid) {
      var field = fieldOf(input);
      if (!field) return input.checkValidity();

      var slot = $(".error-msg", field);
      var ok = input.checkValidity();

      field.classList.toggle("is-invalid", !ok);
      field.classList.toggle("is-valid", ok && showValid && !!input.value.trim());
      input.setAttribute("aria-invalid", String(!ok));

      if (slot) slot.textContent = ok ? "" : messageFor(input);
      return ok;
    }

    forms.forEach(function (form) {
      var controls = $$("input, select, textarea", form).filter(function (el) {
        return el.type !== "hidden" && el.type !== "submit";
      });
      var submit = $('[type="submit"]', form);
      var notice = $(".form-notice", form) || $(".notice", form);

      controls.forEach(function (input) {
        input.addEventListener("blur", function () {
          validate(input, true);
        });
        input.addEventListener("input", function () {
          var field = fieldOf(input);
          if (field && field.classList.contains("is-invalid")) validate(input, true);
        });
      });

      form.setAttribute("novalidate", "novalidate");

      form.addEventListener("submit", function (e) {
        e.preventDefault();

        var firstBad = null;
        controls.forEach(function (input) {
          var ok = validate(input, true);
          if (!ok && !firstBad) firstBad = input;
        });

        if (firstBad) {
          if (notice) {
            notice.textContent =
              "Some details still need attention. Please review the highlighted fields.";
            notice.className = "form-notice is-error is-visible";
            notice.setAttribute("role", "alert");
          }
          firstBad.focus();
          firstBad.scrollIntoView({
            behavior: reduceMotion ? "auto" : "smooth",
            block: "center",
          });
          return;
        }

        if (notice) notice.className = "form-notice";
        if (submit) {
          submit.classList.add("is-loading");
          submit.disabled = true;
          submit.setAttribute("aria-busy", "true");
        }

        /* No backend is connected. The delay mimics a network round trip so
           the loading state is visible; nothing is actually transmitted. */
        setTimeout(function () {
          if (submit) {
            submit.classList.remove("is-loading");
            submit.disabled = false;
            submit.removeAttribute("aria-busy");
          }

          if (notice) {
            notice.textContent =
              "Thanks — your details passed validation and are held in this browser only. " +
              "No message has been sent yet: connect this form to an email service or API endpoint to enable real submissions.";
            notice.className = "form-notice is-success is-visible";
            notice.setAttribute("role", "status");
          }

          showToast("Form validated locally — no message was sent.");

          form.reset();
          controls.forEach(function (input) {
            var field = fieldOf(input);
            if (field) field.classList.remove("is-valid", "is-invalid");
            input.removeAttribute("aria-invalid");
            var slot = field ? $(".error-msg", field) : null;
            if (slot) slot.textContent = "";
          });
        }, 900);
      });
    });
  }

  /* ======================================================================
     11. TOAST + MODALS
     ====================================================================== */
  var toastTimer = null;

  function showToast(message) {
    var toast = document.getElementById("toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "toast";
      toast.className = "toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 5200);
  }

  function initModals() {
    $$("[data-modal-open]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var m = document.getElementById(btn.getAttribute("data-modal-open"));
        if (m) {
          m.classList.add("is-open", "open");
          document.body.classList.add("no-scroll");
        }
      });
    });

    function close(m) {
      if (!m) return;
      m.classList.remove("is-open", "open");
      document.body.classList.remove("no-scroll");
    }

    $$("[data-modal-close]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        close(btn.closest(".modal"));
      });
    });

    $$(".modal").forEach(function (m) {
      m.addEventListener("click", function (e) {
        if (e.target === m) close(m);
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") $$(".modal.is-open, .modal.open").forEach(close);
    });
  }

  /* ======================================================================
     12. SMOOTH IN-PAGE ANCHORS
     ====================================================================== */
  function initAnchors() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
      if (!a) return;
      var id = a.getAttribute("href");
      if (!id || id === "#") return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
      history.replaceState(null, "", id);
    });
  }

  /* ======================================================================
     BOOTSTRAP
     ====================================================================== */
  var booted = false;

  function boot() {
    if (booted) return;
    booted = true;
    document.body.setAttribute("data-booted", "true");
    initHeaderScroll();
    initDropdowns();
    initMobileMenu();
    initActiveNav();
    initHeroSlider();
    initReveal();
    initCounters();
    initFaq();
    initFilters();
    initForms();
    initModals();
    initAnchors();
  }

  document.addEventListener("siraj:layout-ready", boot, { once: true });

  /* Safety net: if include.js is missing, blocked or never resolves, the page
     still gets its behaviour rather than sitting inert. Page scripts listen
     for the same event, so re-dispatch it here too. */
  setTimeout(function () {
    if (booted) return;
    boot();
    document.dispatchEvent(
      new CustomEvent("siraj:layout-ready", { detail: { base: "", fallback: true } })
    );
  }, 4000);

  window.SirajToast = showToast;
})();
