export function atlas_toc({selector:h="h1",sectionLevels:m=["level1"],heading:b="<b>In this notebook</b>",delim:f="&nbsp;|&nbsp;",skip:r=["notebook-title"],activeClass:p="active"}={}){return Generators.observe(v=>{let s=[],l=[],i;function a(){clearTimeout(i),i=setTimeout(()=>{const n=Array.from(document.querySelectorAll("section")).filter(t=>m.some(o=>t.classList.contains(o))&&!r.includes(t.id));console.log(n);const e=Array.from(document.querySelectorAll(h)).filter(t=>!r.includes(t.textContent));e.length===s.length&&e.every((t,o)=>t===s[o])||(s=e,l=s.map(g),v(html`${b}<br>${s.length?l.map((t,o)=>html`<span>${t}${o<l.length-1?f:""}</span>`):html`<span>No headings found.</span>`}`))},5)}function g(n){const e=html`<a class='toc-link' href=#${n.id}>${DOM.text(n.textContent)}</a>`;return e.onclick=t=>{t.preventDefault(),n.scrollIntoView({behavior:"smooth"}),u(e)},e}function u(n){l.forEach(e=>e.classList.toggle(p,e===n))}function c(){const n=l[s.map(e=>Math.abs(e.getBoundingClientRect().top)).reduce((e,t,o,w)=>t<w[e]?o:e,0)];u(n)}const d=new MutationObserver(a);return d.observe(document.body,{childList:!0,subtree:!0}),window.addEventListener("scroll",c),a(),c(),()=>{d.disconnect(),window.removeEventListener("scroll",c)}})}
