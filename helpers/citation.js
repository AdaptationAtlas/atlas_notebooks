export function atlasContributionSection(i,r=null,s="en"){const n={authors:{en:"Authors",fr:"Auteurs"},affiliations:{en:"Affiliations",fr:"Affiliations"},developers:{en:"Technical Development",fr:"D\xE9veloppement technique"},citation:{en:"Citation",fr:"R\xE9f\xE9rence"}},o=t=>n[t]?.[s]??n[t]?.en??t,l=t=>t.map(({name:e,orgs:p})=>`${e}<sup>${p.sort((c,d)=>c-d).join(",")}</sup>`).join(", "),a=(t,e)=>e?.length?`<div style="margin-bottom: 1rem;">
           <h4 style="font-size: 0.90rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #6b7280; margin-bottom: 0.4rem;">${t}</h4>
           <div style="font-size: 0.95rem; line-height: 1.6;">${l(e)}</div>
         </div>`:"",f=Object.entries(i.organizations).sort(([t],[e])=>Number(t)-Number(e)).map(([t,e])=>`<div style="font-size: 0.85rem; line-height: 1.8; color: #4b5563;"><sup>${t}</sup> ${e}</div>`).join(""),m=r?`<div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e5e7eb;">
         <h4 style="font-size: 0.90rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #6b7280; margin-bottom: 0.4rem;">${o("citation")}</h4>
         <div style="font-size: 0.85rem; line-height: 1.6;">${r}</div>
       </div>`:"";return`
    <div style="display: flex; gap: 2rem; align-items: flex-start;">
      <div style="flex: 6;">
        ${a(o("authors"),i.authors)}
        ${a(o("developers"),i.developers)}
      </div>
      <div style="flex: 4; border-left: 1px solid #e5e7eb; padding-left: 2rem;">
        <h4 style="font-size: 0.90rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #6b7280; margin-bottom: 0.4rem;">${o("affiliations")}</h4>
        ${f}
      </div>
    </div>
    ${m}
  `}export function atlasCitation(i=""){return`CGIAR. (2025). ${[i&&`<em>${i}</em>.`,"Africa Agriculture Adaptation Atlas."].filter(Boolean).join(" ")} <a href="https://adaptationatlas.cgiar.org">https://adaptationatlas.cgiar.org</a>`}
