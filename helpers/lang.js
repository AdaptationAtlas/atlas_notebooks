const f="2.0.0";function g(r){return n=>c(n,{key:r})}function c(r,{key:n=null}={}){if(n===null)throw new Error("No 'key' field; please provide a language key.");return r?.[n]}function l(r,{start:n=":::",end:t=":::"}={}){return new RegExp(`${n}\\s*${r}\\s*${t}`,"g")}function p(r,n,{templateNameField:t="name",templateValueField:a="value",...e}={}){return n.reduce((i,s)=>i.replace(l(s[t],{...e}),s[a]),r)}function m(r,n){const t=[];function a(e,i){if(!(typeof e!="object"||e===null)){if(Array.isArray(e)){if(e.length===0){t.push({[i]:e});return}e.forEach((s,u)=>a(s,`${i}[${u}]`));return}if(Object.keys(e).length===0){t.push({[i]:e});return}for(let s in e)if(Object.hasOwnProperty.call(e,s)){if(typeof e[s]=="object"&&e[s]!==null)a(e[s],`${i}.${s}`);else if(n.filter(o=>!(o in e)).length>0){t.push({[i]:e});break}}}}return a(r,""),t}async function y({name:r,list:n,search:t=location.search}={}){if(!r||!n)throw new Error("'name' and 'list' parameters are required.");const e=new URLSearchParams(t).get(r);return e&&n.includes(e)?e:null}function h(r){if(typeof r!="string")throw new Error("Input must be a string");return r.replace(/\w\S*/g,n=>n.charAt(0).toUpperCase()+n.slice(1))}function w(r){if(typeof r!="string")throw new Error("Input must be a string");return r.charAt(0).toUpperCase()+r.slice(1)}export default{version:f,lg:g,getText:c,getRegexForNamedInsertion:l,reduceReplaceTemplateItems:p,listLeavesMissingObjectKeys:m,getParamFromList:y,toTitleCase:h,toSentenceCase:w};
