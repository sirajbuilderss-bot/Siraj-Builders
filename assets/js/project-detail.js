(function () {
  "use strict";

  var projects = {
    "contemporary-family-residence": {
      title: "Contemporary Family Residence",
      category: "Residential construction",
      location: "Location to confirm",
      year: "Case study preview",
      image: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=2400&q=88",
      description: "A family home planned around daily use and long-term value, with structured coordination from foundation through final finishes.",
      heading: "A home shaped around daily life.",
      story: "The project required a clear route from the first requirements through structure, finishes and handover. The focus was on keeping decisions visible, coordinating the work in sequence and protecting the quality of the completed home.",
      focus: "Scope clarity, site supervision and coordinated delivery.",
      scope: ["Full turnkey build", "Structural + finishes", "Site supervision"]
    },
    "modern-workplace-fit-out": {
      title: "Modern Workplace Fit-out",
      category: "Commercial construction",
      location: "Location to confirm",
      year: "Case study preview",
      image: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=2400&q=88",
      description: "A commercial interior planned around how the business operates, combining functional layout, durable materials and coordinated services.",
      heading: "A workplace planned for movement and use.",
      story: "The work centred on translating business needs into a practical finished environment. Layout, services and finishes were treated as one coordinated delivery route so the space could perform from day one.",
      focus: "Functional planning, services coordination and durable finishes.",
      scope: ["Interior fit-out", "Services coordination", "Finishes"]
    },
    "refined-interior-remodelling": {
      title: "Refined Interior Remodelling",
      category: "Renovation",
      location: "Location to confirm",
      year: "Case study preview",
      image: "https://images.unsplash.com/photo-1531835551805-16d864c8d311?auto=format&fit=crop&w=2400&q=88",
      description: "An existing property updated to serve the client better while respecting structure, services and the intended use of the space.",
      heading: "Improvement begins with understanding what is already there.",
      story: "Renovation work depends on careful assessment before changes begin. The approach keeps existing conditions visible, sequences the layout changes responsibly and resolves the new finishes as part of one coherent result.",
      focus: "Existing-condition review, layout changes and finishing quality.",
      scope: ["Interior remodelling", "Layout changes", "New finishes"]
    },
    "urban-commercial-build": {
      title: "Urban Commercial Build",
      category: "Commercial construction",
      location: "Location to confirm",
      year: "Case study preview",
      image: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=2400&q=88",
      description: "A commercial build in a tight urban context, sequenced around site access, deliveries and neighbourhood conditions.",
      heading: "Coordination matters most when the site is constrained.",
      story: "The project route was shaped by access, deliveries and the conditions around the site. Planning the sequence early helped keep the work coordinated while allowing construction decisions to respond to the realities on the ground.",
      focus: "Site logistics, sequencing and MEP coordination.",
      scope: ["Commercial build", "Site coordination", "MEP coordination"]
    },
    "terrace-family-home": {
      title: "Terrace Family Home",
      category: "Residential construction",
      location: "Location to confirm",
      year: "Case study preview",
      image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=2400&q=88",
      description: "A residential build where plot constraints and neighbour context shaped both design and construction sequence.",
      heading: "The site conditions are part of the design conversation.",
      story: "This type of build benefits from bringing plot constraints, structure and finishes into the same early conversation. A measured sequence helps the project move forward without losing sight of the finished home.",
      focus: "Plot-aware planning, grey structure and finishes.",
      scope: ["Residential build", "Grey structure", "Finishes"]
    },
    "structural-renovation": {
      title: "Structural Renovation",
      category: "Renovation",
      location: "Location to confirm",
      year: "Case study preview",
      image: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=2400&q=88",
      description: "A renovation where the existing structure had to be understood before changes could be made, then executed in careful sequence.",
      heading: "Good renovation work starts before the first change.",
      story: "The first responsibility was to understand the existing structure and its constraints. From there, the work could be planned in a controlled order, with structural tasks and finishing decisions kept connected through completion.",
      focus: "Structural assessment, controlled sequencing and finishes.",
      scope: ["Structural work", "Renovation", "Finishes"]
    }
  };

  function init() {
    var key = new URLSearchParams(window.location.search).get("project");
    var project = projects[key] || projects["contemporary-family-residence"];
    var root = document.querySelector("[data-project-detail]");
    if (!root) return;

    document.title = project.title + " | Siraj Builders";
    document.querySelector("[data-project-image]").style.backgroundImage = "url('" + project.image + "')";
    document.querySelector("[data-project-category]").textContent = project.category;
    document.querySelector("[data-project-title]").textContent = project.title;
    document.querySelector("[data-project-title-crumb]").textContent = project.title;
    document.querySelector("[data-project-description]").textContent = project.description;
    document.querySelector("[data-project-location]").textContent = project.location;
    document.querySelector("[data-project-year]").textContent = project.year;
    document.querySelector("[data-project-heading]").textContent = project.heading;
    document.querySelector("[data-project-story]").textContent = project.story;
    document.querySelector("[data-project-focus]").textContent = project.focus;
    document.querySelector("[data-project-scope]").innerHTML = project.scope.map(function (item) {
      return "<span>" + item + "</span>";
    }).join("");

    initScrollReveal();
    initProgress();
  }

  function initScrollReveal() {
    var elements = Array.prototype.slice.call(
      document.querySelectorAll(".detail-reveal-on-scroll")
    );
    if (!elements.length) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      elements.forEach(function (element) { element.classList.add("is-visible"); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.18, rootMargin: "0px 0px -50px 0px" });

    elements.forEach(function (element) { observer.observe(element); });
  }

  function initProgress() {
    var bar = document.querySelector("[data-detail-progress]");
    if (!bar) return;

    function update() {
      var scrollable = document.documentElement.scrollHeight - window.innerHeight;
      var progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
      bar.style.width = Math.min(100, Math.max(0, progress)) + "%";
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();