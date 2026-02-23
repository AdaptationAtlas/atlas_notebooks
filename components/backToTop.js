class BackToTop extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    // Get attributes with defaults
    const label = this.getAttribute("label") || "↑ Top";
    const threshold = parseInt(this.getAttribute("threshold")) || 300;
    const bgColor = this.getAttribute("bg-color") || "#333";
    const textColor = this.getAttribute("text-color") || "white";

    // Render the component
    this.shadowRoot.innerHTML = `
      <style>
        .back-to-top {
          position: fixed;
          bottom: 25px;
          right: 30px;
          padding: 12px 16px;
          font-size: 16px;
          cursor: pointer;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.3s, visibility 0.3s;
          border: none;
          border-radius: 6px;
          background-color: ${bgColor};
          color: ${textColor};
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
      </style>
      <button class="back-to-top" aria-label="Back to top">${label}</button>
    `;

    const btn = this.shadowRoot.querySelector(".back-to-top");

    // Show/hide on scroll
    const handleScroll = () => {
      if (window.scrollY > threshold) {
        btn.classList.add("visible");
      } else {
        btn.classList.remove("visible");
      }
    };

    window.addEventListener("scroll", handleScroll);

    // Scroll to top on click
    btn.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });

    // Cleanup
    this._cleanup = () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }

  disconnectedCallback() {
    if (this._cleanup) this._cleanup();
  }

  // Allow dynamic label updates
  updateLabel(newLabel) {
    const btn = this.shadowRoot.querySelector(".back-to-top");
    if (btn) btn.textContent = newLabel;
  }
}

// Register the custom element
customElements.define("back-to-top", BackToTop);
