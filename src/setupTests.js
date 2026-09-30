/**
 * JEST SETUP
 * ============================================================================
 * jsdom implements most of the DOM but not layout or scrolling, so APIs the
 * site legitimately uses throw "Not implemented" during tests. Stubbing them
 * here keeps the test output meaningful — a console error should mean a real
 * problem, not a known jsdom gap.
 */

import "@testing-library/jest-dom";

// Layout.jsx scrolls to top on route change; useReveal observes elements.
window.scrollTo = jest.fn();
Element.prototype.scrollTo = jest.fn();
Element.prototype.scrollIntoView = jest.fn();

// IntersectionObserver drives the scroll-reveal animations.
if (!window.IntersectionObserver) {
  window.IntersectionObserver = class {
    constructor(callback) {
      this.callback = callback;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  };
}

if (!window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// matchMedia backs the prefers-reduced-motion checks.
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
