import {translations} from './translations.js';
const escapeRegex=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const exact=new Map(translations);
const reverse=new Map(translations.map(([ja,en])=>[en,ja]));
const patterns=translations.filter(([ja])=>ja.includes('{')).map(([ja,en])=>{
  const names=[...ja.matchAll(/\{(\w+)\}/g)].map(m=>m[1]);
  const parts=ja.split(/\{\w+\}/g);
  return {regex:new RegExp('^'+parts.map(escapeRegex).join('([\\s\\S]*?)')+'$'),names,en};
});
export function translate(text,language='en'){
  text=String(text);
  if(language==='ja'){
    if(reverse.has(text))return reverse.get(text);
    const trimmed=text.trim();
    return reverse.has(trimmed)?text.replace(trimmed,reverse.get(trimmed)):text;
  }
  if(exact.has(text))return exact.get(text);
  for(const {regex,names,en} of patterns){
    const match=text.match(regex);
    if(match){const values=Object.fromEntries(names.map((name,i)=>[name,translate(match[i+1],language)]));return en.replace(/\{(\w+)\}/g,(_,name)=>values[name]);}
  }
  const trimmed=text.trim();
  if(trimmed!==text&&exact.has(trimmed))return text.replace(trimmed,exact.get(trimmed));
  return text;
}
let language='en';
const dynamic=new Map();
export function resolveLanguage(requested,saved,browserLanguage){
  if(requested==='ja'||requested==='en')return requested;
  if(saved==='ja'||saved==='en')return saved;
  return /^ja(?:-|$)/i.test(browserLanguage||'')?'ja':'en';
}
export const tr=text=>translate(text,language);
export function setText(element,text){dynamic.set(element,String(text));element.textContent=tr(text);}
export function initLanguage(onChange){
  const choice=document.getElementById('language');
  const staticNodes=[],attributes=[];
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  while(walker.nextNode()){
    const node=walker.currentNode;
    if(!node.parentElement.closest('script,style,textarea,[data-language-control]'))staticNodes.push([node,node.textContent]);
  }
  document.querySelectorAll('[title],[aria-label],meta[content],title').forEach(element=>{
    if(element.tagName==='TITLE')staticNodes.push([element.firstChild,element.textContent]);
    for(const attribute of ['title','aria-label','content'])if(element.hasAttribute(attribute))attributes.push([element,attribute,element.getAttribute(attribute)]);
  });
  function apply(next){
    language=next==='ja'?'ja':'en';document.documentElement.lang=language;choice.value=language;
    for(const [node,text] of staticNodes)node.textContent=tr(text);
    for(const [element,name,value] of attributes)element.setAttribute(name,tr(value));
    document.querySelector('meta[property="og:locale"]').content=language==='ja'?'ja_JP':'en_US';
    for(const [element,text] of dynamic)setText(element,text);
  }
  const requested=new URL(location.href).searchParams.get('lang');
  let saved;try{saved=localStorage.getItem('formula-language');}catch{}
  apply(resolveLanguage(requested,saved,navigator.language||navigator.languages?.[0]));
  choice.addEventListener('change',()=>{
    apply(choice.value);
    try{localStorage.setItem('formula-language',language);}catch{}
    const url=new URL(location.href);url.searchParams.set('lang',language);
    try{history.replaceState(null,'',url);}catch{}
    onChange();
  });
}
