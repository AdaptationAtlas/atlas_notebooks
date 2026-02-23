function getNotebookList(o){return(Array.isArray(o)?o:Array.isArray(o?.notebooks)?o.notebooks:[]).filter(n=>!n.hide)}function renderNotebookCards(o,e){if(!e.length){o.innerHTML="<p>No notebooks found.</p>";return}const n=e.map(t=>{const s=t.image||"images/default_crop.webp",r=t.title&&t.title.en||t.id||"Notebook";return`
        <a class="notebook-card" href="${typeof t.path=="string"?t.path.replace(".qmd",".html"):t.path}">
          <div class="notebook-card__image-wrap">
            <img class="notebook-card__image" src="${s}" alt="${r}">
          </div>
          <p class="notebook-card__title">${r}</p>
        </a>
      `}).join("");o.innerHTML=n}async function initNotebookGrid(){const o=document.getElementById("notebook-grid");if(o)try{const e=await fetch("notebooks.json");if(!e.ok)throw new Error("Unable to load notebook list.");const n=await e.json(),t=getNotebookList(n);renderNotebookCards(o,t)}catch(e){o.innerHTML="<p>Error loading notebooks. Please try again later.</p>",console.error(e)}}document.addEventListener("DOMContentLoaded",initNotebookGrid);
