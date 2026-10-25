import { STRINGS, DISH_EXPLANATIONS } from './i18n.mjs';
export const LANGUAGES = {en:'English',fr:'Français',es:'Español',tn:'تونسي'};
export const language = typeof location === 'undefined' ? 'en' : location.pathname.split('/').find(part=>Object.hasOwn(LANGUAGES,part)) || 'en';
const dynamic = {
  fr:{items:'articles',item:'article',from:'À partir de',add:'Ajouter',decrease:'Diminuer la quantité de',increase:'Augmenter la quantité de',quantity:'Quantité de',bag:n=>`Mon panier ${n} — ouvrir le panier, ${n} articles`,added:n=>`${n} article(s) ajouté(s) au panier`},
  es:{items:'productos',item:'producto',from:'Desde',add:'Añadir',decrease:'Reducir la cantidad de',increase:'Aumentar la cantidad de',quantity:'Cantidad de',bag:n=>`Mi carrito ${n} — abrir carrito, ${n} productos`,added:n=>`${n} producto(s) añadido(s) al carrito`},
  tn:{items:'منتوجات',item:'منتوج',from:'من',add:'زيد',decrease:'نقص كمية',increase:'زيد كمية',quantity:'كمية',bag:n=>`سلتي ${n} — حل السلة، ${n} منتوجات`,added:n=>`تزاد ${n} منتوج للسلة`}
};
export function translate(value,lang=language) {
  if(lang==='en'||!value)return value;
  const leading=value.match(/^\s*/)[0],trailing=value.match(/\s*$/)[0],text=value.trim();
  const exact=STRINGS[text]?.[lang];if(exact)return leading+exact+trailing;
  const d=dynamic[lang];let match;
  if((match=text.match(/^My bag (\d+) — open bag, \d+ items$/)))return d.bag(match[1]);
  if((match=text.match(/^(\d+) items? added to your bag$/)))return d.added(match[1]);
  if((match=text.match(/^(\d+) (item|items)(.*)$/)))return `${match[1]} ${d[match[2]]}${translate(match[3],lang)}`;
  for(const [prefix,key] of [['Decrease quantity of ','decrease'],['Increase quantity of ','increase'],['Quantity of ','quantity'],['From ','from'],['Add ','add']])if(text.startsWith(prefix))return `${d[key]} ${translate(text.slice(prefix.length),lang)}`;
  // Composite product names, option labels, and amount labels use stable separators.
  for(const separator of [' — ',' · ',': ', ', ', ' (', '. '])if(text.includes(separator))return leading+text.split(separator).map(part=>translate(part,lang)).join(separator)+trailing;
  if(text.endsWith(')'))return translate(text.slice(0,-1),lang)+')';
  return value;
}
export function localizedMenu(menu,lang=language) {
  return menu.map(item=>({...item,name:translate(item.name,lang),servingLabel:translate(item.servingLabel,lang),description:(DISH_EXPLANATIONS[item.id]?.[lang]||translate(item.description,lang))+(item.servingLabel?` ${translate(item.servingLabel,lang)}.`:''),variantLabel:translate(item.variantLabel,lang),imageAlt:translate(item.name,lang),variants:item.variants.map(option=>({...option,name:translate(option.name,lang)})),addons:item.addons.map(option=>({...option,name:translate(option.name,lang)}))}));
}
export function initializeLocale() {
  document.documentElement.lang=language==='tn'?'aeb':language;
  document.documentElement.dir=language==='tn'?'rtl':'ltr';
  const transform=root=>{
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;
    while((node=walker.nextNode())){if(node.parentElement?.closest('script,style,textarea,input,output'))continue;const next=translate(node.nodeValue);if(next!==node.nodeValue)node.nodeValue=next;}
    for(const element of root.querySelectorAll?.('[placeholder],[aria-label]')||[])for(const attr of ['placeholder','aria-label'])if(element.hasAttribute(attr)){const before=element.getAttribute(attr),after=translate(before);if(after!==before)element.setAttribute(attr,after);}
  };
  const switcher=document.createElement('div');switcher.className='language-switcher';
  const select=document.createElement('select');select.setAttribute('aria-label',translate('Language'));
  for(const [code,label] of Object.entries(LANGUAGES)){const option=document.createElement('option');option.value=code;option.textContent=label;option.lang=code==='tn'?'aeb':code;option.selected=code===language;select.append(option);}
  select.addEventListener('change',()=>{location.href=`/${select.value}/${location.pathname.endsWith('credits.html')?'credits.html':''}${location.hash}`;});
  switcher.append(select);
  const header=document.querySelector('.site-header');
  if(header)header.insertBefore(switcher,header.querySelector('.bag-button'));else document.querySelector('main').append(switcher);
  transform(document.body);
  const observer=new MutationObserver(records=>{observer.disconnect();for(const record of records){if(record.type==='characterData'){const next=translate(record.target.nodeValue);if(next!==record.target.nodeValue)record.target.nodeValue=next;}else transform(record.target);}observer.observe(document.body,{childList:true,subtree:true,characterData:true});});
  observer.observe(document.body,{childList:true,subtree:true,characterData:true});
}
