class BackToTop extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"})}connectedCallback(){this.shadowRoot.innerHTML=`
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
      <button class="back-to-top" aria-label="Back to top">\u2191</button>
    `;const t=this.shadowRoot.querySelector(".back-to-top"),n=window.matchMedia("(prefers-reduced-motion: reduce)");let e=!1;const i=()=>{window.scrollY>300?t.classList.add("visible"):t.classList.remove("visible"),e=!1},s=()=>{e||(e=!0,window.requestAnimationFrame(i))};window.addEventListener("scroll",s,{passive:!0}),i();const a=()=>{window.scrollTo({top:0,behavior:n.matches?"auto":"smooth"})};t.addEventListener("click",a),this._cleanup=()=>{window.removeEventListener("scroll",s),t.removeEventListener("click",a)}}disconnectedCallback(){this._cleanup&&this._cleanup()}updateLabel(o){const t=this.shadowRoot.querySelector(".back-to-top");t&&t.setAttribute("aria-label",o)}}customElements.define("back-to-top",BackToTop);
