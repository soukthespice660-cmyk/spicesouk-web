// Medición agregada sin cookies: envía solo evento, página, idioma y host del referrer. Sin IDs ni IP guardada.
import { language } from './locale.mjs';

const endpoint='https://spicesouk-stats.soukthespice660.workers.dev/';
function send(event){
  try{
    const ref=document.referrer?new URL(document.referrer).hostname:'';
    const body=JSON.stringify({e:event,p:location.pathname,l:language,r:ref&&ref!==location.hostname?ref:''});
    if(!(navigator.sendBeacon&&navigator.sendBeacon(endpoint,new Blob([body],{type:'text/plain'}))))fetch(endpoint,{method:'POST',body,keepalive:true,headers:{'content-type':'text/plain'}}).catch(()=>{});
  }catch{/* La medición nunca debe romper la web. */}
}
function eventFor(link){
  const href=link.getAttribute('href')||'';
  if(link.id==='offers-channel-link')return 'ofertas_whatsapp';
  if(link.id==='reminder-channel-link')return 'ofertas_whatsapp_aviso';
  if(href.includes('instagram.com'))return 'instagram';
  if(href.includes('facebook.com'))return 'facebook';
  if(!href.includes('wa.me'))return null;
  if(link.classList.contains('sw-send'))return 'dulces_pedido';
  const ref=decodeURIComponent(href).match(/Ref\.\s*(\d+)/);
  if(link.classList.contains('sw-btn')&&ref)return `dulce_ref_${ref[1]}`;
  if(link.classList.contains('wa-float'))return 'whatsapp_flotante';
  if(link.classList.contains('ft-cta'))return 'whatsapp_footer';
  if(link.classList.contains('local-wa'))return 'whatsapp_contacto';
  if(link.closest('.hero-actions'))return 'whatsapp_hero';
  return 'whatsapp_enlace';
}
document.addEventListener('click',event=>{
  const link=event.target.closest&&event.target.closest('a[href]');
  const name=link&&eventFor(link);
  if(name)send(name);
  const sweet=event.target.closest&&event.target.closest('button.sw-add');   // caja de dulces añadida al pedido
  const num=sweet&&(sweet.dataset.ref||'').match(/\d+/);
  if(num)send(`dulce_ref_${num[0]}`);
},true);
const nativeOpen=window.open;
window.open=function(url,...rest){
  if(typeof url==='string'&&url.includes('wa.me'))send('pedido_carrito');
  return nativeOpen.call(this,url,...rest);
};
send('pageview');
