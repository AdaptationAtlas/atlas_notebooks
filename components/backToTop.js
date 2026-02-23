class BackToTop extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"})}connectedCallback(){const o=this.getAttribute("label")||"\u2191 Top",t=parseInt(this.getAttribute("threshold"))||300,s=this.getAttribute("bg-color")||"#333",a=this.getAttribute("text-color")||"white";this.shadowRoot.innerHTML=`
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
          background-color: ${s};
          color: ${a};
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
      <button class="back-to-top" aria-label="Back to top">${o}</button>
    `;const e=this.shadowRoot.querySelector(".back-to-top"),i=()=>{window.scrollY>t?e.classList.add("visible"):e.classList.remove("visible")};window.addEventListener("scroll",i),e.addEventListener("click",()=>{window.scrollTo({top:0,behavior:"smooth"})}),this._cleanup=()=>{window.removeEventListener("scroll",i)}}disconnectedCallback(){this._cleanup&&this._cleanup()}updateLabel(o){const t=this.shadowRoot.querySelector(".back-to-top");t&&(t.textContent=o)}}customElements.define("back-to-top",BackToTop);
