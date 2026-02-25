class BackToTop extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    const threshold = 300;

    // Render the component
    this.shadowRoot.innerHTML = `
      <style>
        .back-to-top {
          position: fixed;
          bottom: calc(25px + env(safe-area-inset-bottom));
          right: calc(30px + env(safe-area-inset-right));
          padding: 12px 16px;
          font-size: 16px;
          cursor: pointer;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.3s, visibility 0.3s;
          border: none;
          border-radius: 6px;
          background-color: #333;
          color: white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          z-index: 1000;
        }

        .back-to-top.visible {
          opacity: 1;
          visibility: visible;
        }

        .back-to-top:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }

        @media (max-width: 640px) {
          .back-to-top {
            bottom: calc(16px + env(safe-area-inset-bottom));
            right: calc(16px + env(safe-area-inset-right));
            padding: 10px 12px;
            font-size: 14px;
          }
        }
      </style>
      <button class="back-to-top" aria-label="Back to top">↑</button>
    `;

    const btn = this.shadowRoot.querySelector(".back-to-top");
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    // Throttle scroll work with RAF.
    let ticking = false;
    const updateVisibility = () => {
      if (window.scrollY > threshold) {
        btn.classList.add("visible");
      } else {
        btn.classList.remove("visible");
      }
      ticking = false;
    };

    // Show/hide on scroll
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateVisibility);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    updateVisibility();

    // Scroll to top on click
    const onClick = () => {
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion.matches ? "auto" : "smooth",
      });
    };
    btn.addEventListener("click", onClick);

    // Cleanup
    this._cleanup = () => {
      window.removeEventListener("scroll", handleScroll);
      btn.removeEventListener("click", onClick);
    };
  }

  disconnectedCallback() {
    if (this._cleanup) this._cleanup();
  }

  // Allow dynamic label updates
  updateLabel(newLabel) {
    const btn = this.shadowRoot.querySelector(".back-to-top");
    if (btn) {
      btn.setAttribute("aria-label", newLabel);
    }
  }
}

// Register the custom element
customElements.define("back-to-top", BackToTop);
