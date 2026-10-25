import { language } from './locale.mjs';
import { ANALYTICS_TEXT } from './analytics-i18n.mjs';

const id='G-DWWVDJSC6E';
const key='spice-souk-analytics-consent-v1';
const lifetime=180*24*60*60*1000;
const text=ANALYTICS_TEXT[language];
let loaded=false;
window[`ga-disable-${id}`]=true;
window.dataLayer=window.dataLayer||[];
window.gtag=function(){window.dataLayer.push(arguments);};
window.gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});

function savedChoice(){
  try{const saved=JSON.parse(localStorage.getItem(key));return saved&&Number.isFinite(saved.time)&&saved.time<=Date.now()&&Date.now()-saved.time<lifetime&&['granted','denied'].includes(saved.choice)?saved.choice:null;}catch{return null;}
}
function enableAnalytics(){
  if(loaded)return;
  loaded=true;
  window[`ga-disable-${id}`]=false;
  window.gtag('consent','update',{analytics_storage:'granted'});
  window.gtag('js',new Date());
  window.gtag('config',id,{send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false,cookie_expires:15552000,cookie_update:false});
  window.gtag('event','page_view',{page_location:location.origin+location.pathname,page_referrer:document.referrer?new URL(document.referrer).origin:'',page_title:document.title});
  const script=document.createElement('script');script.async=true;script.src=`https://www.googletagmanager.com/gtag/js?id=${id}`;document.head.append(script);
}
function removeAnalyticsCookies(){
  for(const entry of document.cookie.split(';')){
    const name=entry.trim().split('=')[0];
    if(name!=='_ga'&&!name.startsWith('_ga_'))continue;
    for(const domain of ['',`; domain=${location.hostname}`,`; domain=.${location.hostname}`])document.cookie=`${name}=; Max-Age=0; path=/${domain}; SameSite=Lax; Secure`;
  }
}
const banner=document.createElement('section');banner.className='analytics-consent';banner.hidden=true;banner.setAttribute('aria-labelledby','analytics-consent-title');
const title=document.createElement('h2');title.id='analytics-consent-title';title.textContent=text.title;title.tabIndex=-1;
const body=document.createElement('p');body.textContent=text.body;
const policy=document.createElement('a');policy.href='https://policies.google.com/privacy';policy.target='_blank';policy.rel='noopener noreferrer';policy.textContent=text.policy;
const buttons=document.createElement('div');buttons.className='analytics-consent-actions';
const accept=document.createElement('button');accept.type='button';accept.textContent=text.accept;
const reject=document.createElement('button');reject.type='button';reject.textContent=text.reject;
buttons.append(accept,reject);banner.append(title,body,policy,buttons);document.body.append(banner);
const settings=document.createElement('button');settings.type='button';settings.className='text-button analytics-settings';settings.textContent=text.settings;
let footer=document.querySelector('footer');if(!footer){footer=document.createElement('footer');footer.className='wrap';document.body.append(footer);}footer.append(settings);
settings.addEventListener('click',()=>{banner.hidden=false;title.focus();});
function choose(choice){
  try{localStorage.setItem(key,JSON.stringify({choice,time:Date.now()}));}catch{/* Keep this visit usable when storage is blocked. */}
  banner.hidden=true;settings.focus();
  if(choice==='granted'){enableAnalytics();return;}
  window[`ga-disable-${id}`]=true;
  window.gtag('consent','update',{analytics_storage:'denied'});
  removeAnalyticsCookies();
  if(loaded)location.reload();
}
accept.addEventListener('click',()=>choose('granted'));reject.addEventListener('click',()=>choose('denied'));
const notice=document.querySelector('[data-analytics-notice]');if(notice)notice.textContent=text.notice;
const choice=savedChoice();if(choice==='granted')enableAnalytics();else{removeAnalyticsCookies();banner.hidden=choice==='denied';}
