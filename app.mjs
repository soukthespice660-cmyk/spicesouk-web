import { CONFIG } from './config.mjs';
import { channelUrl } from './whatsapp-links.mjs';
import { MENU as SOURCE_MENU, CATEGORIES } from './menu.mjs';
import { translate, localizedMenu, initializeLocale, language } from './locale.mjs';
import { createOrderCards } from './order-card.mjs';
import { tipAmount, tipFromEuros } from './order.mjs';
const MENU=localizedMenu(SOURCE_MENU);
import { addLine, changeQuantity, hydrateCart, lineDetails, money, subtotal, validateOrder, validNumber, orderMessage, whatsappUrl, googleMapsUrl, minimumOrderTime, minimumOrderShortfall } from './order.mjs';
const $ = selector => document.querySelector(selector);
const el = (tag, className, text) => { const node = document.createElement(tag); if(className) node.className = className; if(text !== undefined) node.textContent = translate(text); return node; };
const STORAGE = 'spice-souk-cart-v1';
$('#launch-notice').after(el('p','minimum-order-note',`${translate('Minimum order')}: ${money(CONFIG.minimumOrderCents)} · ${translate('Delivery and takeaway. Delivery fee excluded.')}`));
const VIEW_STORAGE = 'spice-souk-menu-view-v1';
document.querySelectorAll('[data-products-jump]').forEach(button=>button.addEventListener('click',()=>{
  $('#food-grid').scrollIntoView({block:button.dataset.productsJump,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
}));
function setMenuView(view) {
  const selected=view==='list'?'list':'grid';
  $('#food-grid').dataset.view=selected;
  document.querySelectorAll('[data-menu-view]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.menuView===selected)));
}
try { setMenuView(localStorage.getItem(VIEW_STORAGE)); } catch { setMenuView('grid'); }
document.querySelectorAll('[data-menu-view]').forEach(button=>button.addEventListener('click',()=>{
  setMenuView(button.dataset.menuView);
  try { localStorage.setItem(VIEW_STORAGE,button.dataset.menuView); } catch { /* The view still works without storage. */ }
}));
let cart = []; let category = 'All'; let toastTimer; const dialogFocus=new WeakMap();
try { cart = hydrateCart(localStorage.getItem(STORAGE), MENU); } catch { /* Storage may be disabled. The in-memory bag still works. */ }
function notify(text) { $('#toast').textContent = translate(text); $('#toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 2600); }
function save() { try { localStorage.setItem(STORAGE, JSON.stringify(cart)); } catch { notify('Your bag works here, but this browser cannot save it.'); } updateBag(); }
function openDialog(id,opener=document.activeElement) { const dialog=document.getElementById(id);dialogFocus.set(dialog,opener);dialog.showModal(); }
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.addEventListener('close', () => { const previous=dialogFocus.get(dialog);if(previous?.isConnected)previous.focus(); });
  dialog.addEventListener('click', event => { if(event.target !== dialog) return; const r=dialog.getBoundingClientRect(); if(event.clientX<r.left || event.clientX>r.right || event.clientY<r.top || event.clientY>r.bottom) dialog.close(); });
});
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => document.getElementById(button.dataset.close).close()));
function photo(item, className) {
  const holder = el('div',className); if(item.imageFit==='contain') holder.classList.add('packshot');if(item.standardisedPhoto)holder.classList.add('supplied-photo');
  const fallback = () => { holder.replaceChildren(); const p=el('div','photo-pending'); p.append(el('span','',item.category),el('small','','OUR PHOTO COMING SOON')); holder.append(p); };
  if(item.image) { const img=el('img'); img.src=item.image.replace(/\.webp$/, '-card.webp'); img.alt=item.name; img.width=700; img.height=480; img.loading='lazy'; img.fetchPriority=className==='card-photo'?'low':'auto'; img.addEventListener('error',fallback,{once:true}); holder.append(img); } else fallback();
  if(item.photoCredit&&className!=='cart-thumbnail')holder.append(el('small','photo-credit',item.photoCredit));
  return holder;
}
function renderCategories() {
  const container=$('#categories');
  for(const name of ['All',...CATEGORIES.filter(name=>MENU.some(item=>item.category===name))]) { const button=el('button','category',name); button.type='button'; button.setAttribute('aria-pressed',String(name===category)); button.addEventListener('click',()=>{category=name;container.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));renderMenu();}); container.append(button); }
}
const searchText=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase();
function chooseProduct(item) {
  if(item.category!=='Drinks'||item.variants.length||item.addons.length){openProduct(item);return;}
  try {cart=addLine(cart,MENU,item.id,'',[],1);save();notify('1 item added to your bag');}catch(error){notify(error.message);}
}
function renderMenu() {
  const query=searchText($('#search').value.trim());
  const items=MENU.filter(item=>(category==='All'||item.category===category)&&searchText(`${item.name} ${item.description} ${item.category}`).includes(query));
  $('#result-count').textContent=`${items.length} ${items.length===1?'item':'items'}${category==='All'?'':` · ${category}`}`;
  const grid=$('#food-grid'); grid.replaceChildren();
  if(!items.length) {const box=el('div','empty-results');box.append(el('h3','',query?'No dishes found':'Something good is on its way.'),el('p','',query?'Try another search or browse all dishes.':'Items for this category will appear when the menu is confirmed.'));const reset=el('button','secondary','Browse all dishes');reset.type='button';reset.addEventListener('click',()=>{category='All';$('#search').value='';$('#categories').replaceChildren();renderCategories();renderMenu();});box.append(reset);grid.append(box);return;}
  items.forEach(item=>{const card=el('article','food-card');const image=photo(item,'card-photo');if(!item.available) image.append(el('span','card-badge sold','UNAVAILABLE'));const content=el('div','card-content');content.append(el('p','card-category',item.category),el('h3','',item.name),el('p','',item.description));const bottom=el('div','card-bottom');bottom.append(el('span',`card-price${(item.variantPriceMode==='full'?!item.variants.some(option=>Number.isSafeInteger(option.price)):item.price===null)?' pending':''}`,item.variantPriceMode==='full'?(item.variants.some(option=>Number.isSafeInteger(option.price))?`From ${money(Math.min(...item.variants.filter(option=>Number.isSafeInteger(option.price)).map(option=>option.price)))}`:'Price to be confirmed'):money(item.price)));const button=el('button','add-button',item.available?(item.variants.length?'Choose options':'Add to bag'):'Unavailable');button.type='button';button.disabled=!item.available;button.setAttribute('aria-label',`${button.textContent} — ${item.name}`);button.addEventListener('click',()=>chooseProduct(item));bottom.append(button);content.append(bottom);card.append(image,content);grid.append(card);});
}
function quantityControl(value,onChange,label,min=0) {
  const box=el('div','quantity');const less=el('button','','−');less.type='button';less.dataset.quantityAction='decrease';less.setAttribute('aria-label',translate(`Decrease quantity of ${label}`));const output=el('output','',String(value));output.setAttribute('aria-label',translate(`Quantity of ${label}`));const more=el('button','','+');more.type='button';more.dataset.quantityAction='increase';more.setAttribute('aria-label',translate(`Increase quantity of ${label}`));
  const update=()=>{less.disabled=value<=min;more.disabled=value>=99;output.value=String(value);};less.addEventListener('click',()=>{if(value>min){value--;update();onChange(value);}});more.addEventListener('click',()=>{if(value<99){value++;update();onChange(value);}});update();box.append(less,output,more);return box;
}
function openProduct(item) {
  $('#product-dialog .dialog-top .eyebrow').textContent=item.name;
  const container=$('#product-content');container.replaceChildren();const productPhoto=photo(item,'product-image');container.append(productPhoto);const title=el('h2','',item.name);title.id='product-title';container.append(title,el('p','product-description',item.description));
  if(item.category!=='Drinks')container.append(el('p','photo-disclaimer','Photos are illustrative. Portions, garnish and presentation may vary with your chosen options and availability.'));
  const form=el('form');let quantity=1;
  if(item.variants.length) {const field=el('fieldset');field.append(el('legend','',item.variantLabel||'Choose Your Option'));item.variants.forEach((option,index)=>{const label=el('label','option');const input=el('input');input.type='radio';input.name='variant';input.value=option.id;input.checked=index===0;label.append(input,el('span','',option.name),el('small','',option.price===null?'Price pending':item.variantPriceMode==='full'?money(option.price):option.price===0?'Included':`Add ${money(option.price)}`));field.append(label);});form.append(field);}
  if(item.addons.length) {const field=el('fieldset');field.append(el('legend','','Add something extra'));item.addons.forEach(option=>{const label=el('label','option');const input=el('input');input.type='checkbox';input.name='addon';input.value=option.id;if(option.variants)input.dataset.variants=option.variants.join(',');label.append(input,el('span','',option.name),el('small','',option.price===null?'Price pending':option.price===0?'Free':`Add ${money(option.price)}`));field.append(label);});form.append(field);}
  const purchase=el('div','product-purchase');const summary=el('div','product-price-summary');summary.append(el('span','product-price-label','Price per item'));const price=el('p','product-price',money(item.price));summary.append(price);const actions=el('div','product-actions');const quantities=quantityControl(quantity,q=>quantity=q,item.name,1);quantities.querySelector('[data-quantity-action="increase"]').textContent='+';actions.append(quantities);const add=el('button','primary',`Add to bag`);add.type='submit';actions.append(add);purchase.append(summary,actions);form.append(purchase);
  const updatePrice=()=>{const selectedVariant=form.querySelector('[name=variant]:checked')?.value||'';form.querySelectorAll('[name=addon][data-variants]').forEach(input=>{const allowed=input.dataset.variants.split(',').includes(selectedVariant);input.disabled=!allowed;input.closest('label').hidden=!allowed;if(!allowed)input.checked=false;});const data=new FormData(form);try {const variant=String(data.get('variant')||'');const line=addLine([],MENU,item.id,variant,data.getAll('addon'),1)[0];price.textContent=money(lineDetails(line,MENU).unitPrice);}catch(error){price.textContent=translate(error.message);}};form.addEventListener('change',updatePrice);updatePrice();
  form.addEventListener('submit',event=>{event.preventDefault();const data=new FormData(form);try{cart=addLine(cart,MENU,item.id,String(data.get('variant')||''),data.getAll('addon'),quantity);save();$('#product-dialog').close();notify(`${quantity} ${quantity===1?'item':'items'} added to your bag`);}catch(error){notify(error.message);}});container.append(form);openDialog('product-dialog');
}
function updateBag() {
  const count=cart.reduce((sum,line)=>sum+line.quantity,0);document.querySelectorAll('[data-count]').forEach(node=>node.textContent=String(count));$('.bag-button').setAttribute('aria-label',translate(`My bag ${count} — open bag, ${count} items`));$('.floating-cart').setAttribute('aria-label',`${translate('View my bag')} · ${count}`);const total=subtotal(cart,MENU);$('#mobile-total').textContent=total===null?'Prices pending':money(total);if($('#cart-dialog').open) renderCart();
}
function renderCartExtras() {
  const container=$('#cart-extras');container.replaceChildren();
  const gap=minimumOrderShortfall(cart,MENU,CONFIG.minimumOrderCents,selectedTip());const minimum=el('p',`minimum-cart-notice${gap===0?' reached':''}`);minimum.setAttribute('role','status');minimum.textContent=`${translate('Minimum order')}: ${money(CONFIG.minimumOrderCents)} · ${gap===null?translate('Prices pending'):gap>0?`${translate('Still to add')}: ${money(gap)}`:translate('Minimum reached')}`;container.append(minimum);
  const more=el('button','secondary continue-shopping','Continue choosing dishes');more.type='button';
  more.addEventListener('click',()=>{$('#cart-dialog').close();$('#food-grid').scrollIntoView({block:'start'});});container.append(more);
  const groups=[{id:'drinks',title:'Add a drink',ids:['coca-cola-can','coca-cola-zero-can','sprite-can','iced-tea-lemon-can']},{id:'dishes',title:'Something extra to enjoy',ids:['brik','tajin','libanaise','mechouiya','tunisian-salad']}];
  const section=el('section','cart-suggestions');section.setAttribute('aria-label',translate('Complete your meal'));section.append(el('h3','','Complete your meal'),el('p','fine','Optional ideas to enjoy alongside your order.'));
  for(const group of groups){
    const suggestions=group.ids.map(id=>MENU.find(item=>item.id===id)).filter(item=>item?.available&&!cart.some(line=>line.id===item.id)&&(Number.isSafeInteger(item.price)||item.variants.some(option=>Number.isSafeInteger(option.price)))).slice(0,2);
    if(!suggestions.length)continue;
    const category=el('section','suggestion-group');category.dataset.suggestionGroup=group.id;category.setAttribute('aria-label',translate(group.title));category.append(el('h4','suggestion-group-title',group.title));const cards=el('div','suggestion-cards');
    for(const item of suggestions){
    const row=el('article',`suggestion${group.id==='drinks'?' suggestion-drink':''}`);row.dataset.productId=item.id;row.append(photo(item,'suggestion-photo'));const details=el('div');details.append(el('h5','',item.name));
    const price=item.variantPriceMode==='full'?`From ${money(Math.min(...item.variants.filter(option=>Number.isSafeInteger(option.price)).map(option=>option.price)))}`:money(item.price);details.append(el('p','suggestion-price',price));
    const button=el('button','secondary',item.variants.length||item.addons.length?'Choose options':'Add to bag');button.type='button';button.setAttribute('aria-label',`${button.textContent} — ${item.name}`);button.addEventListener('click',()=>chooseProduct(item));details.append(button);row.append(details);cards.append(row);
    }
    category.append(cards);section.append(category);
  }
  if(section.querySelector('.suggestion'))container.append(section);
}
function renderCart() {
  const activeRow=document.activeElement.closest('.cart-line'); const focusedKey=activeRow?.dataset.cartKey; const focusedAction=document.activeElement.dataset.quantityAction;
  const body=$('#cart-body');body.replaceChildren();const form=$('#checkout-form');form.hidden=!cart.length;
  if(!cart.length){const empty=el('div','cart-empty');empty.append(el('h3','','A good meal starts here.'),el('p','','Your bag is empty. Explore the menu and add your favourite dishes.'));const button=el('button','primary','Explore the menu');button.type='button';button.addEventListener('click',()=>{$('#cart-dialog').close();$('#menu').scrollIntoView();});empty.append(button);body.append(empty);return;}
  cart.forEach(line=>{const {item,unitPrice,labels}=lineDetails(line,MENU);const row=el('article','cart-line');row.dataset.cartKey=line.key;row.append(photo(item,'cart-thumbnail'));const details=el('div');const top=el('div','line-top');top.append(el('h3','',item.name));if(unitPrice!==null) top.append(el('strong','',money(unitPrice*line.quantity)));details.append(top);if(item.servingLabel)details.append(el('p','line-options',item.servingLabel));if(labels.length)details.append(el('p','line-options',labels.join(' · ')));if(unitPrice===null) details.append(el('p','line-price-pending','Price to be confirmed'));const controls=el('div','line-controls');controls.append(quantityControl(line.quantity,q=>{cart=changeQuantity(cart,line.key,q);save();},`${item.name}${labels.length?` (${labels.join(', ')})`:''}`));const remove=el('button','text-button','Remove');remove.type='button';remove.setAttribute('aria-label',`Remove ${item.name}${labels.length?` (${labels.join(', ')})`:''}`);remove.addEventListener('click',()=>{cart=changeQuantity(cart,line.key,0);save();notify('Item removed');});controls.append(remove);details.append(controls);row.append(details);body.append(row);});
  const total=subtotal(cart,MENU);$('#subtotal').textContent=total===null?'To be confirmed':money(total);updateCheckoutState();
  if(focusedKey){const row=[...body.querySelectorAll('.cart-line')].find(row=>row.dataset.cartKey===focusedKey);const replacement=focusedAction?[...row?.querySelectorAll('button')||[]].find(button=>button.dataset.quantityAction===focusedAction):null;(replacement||$('#cart-dialog [data-close]')).focus();}
}
function updateCheckoutState() {
  updateTipTotals();renderCartExtras();
  const blockers=[];if(!validNumber(CONFIG.whatsappNumber))blockers.push('WhatsApp ordering will open once our number is connected.');if(cart.some(line=>lineDetails(line,MENU).item.placeholder)||subtotal(cart,MENU)===null)blockers.push('Prices are being finalised. Your bag is a draft for now.');$('#checkout-status').textContent=blockers.map(message=>translate(message)).join(' ');$('#order-button').disabled=blockers.length>0||!cart.length||minimumOrderShortfall(cart,MENU,CONFIG.minimumOrderCents,selectedTip())>0;
}
document.querySelectorAll('[data-open-cart]').forEach(button=>button.addEventListener('click',()=>{checkout.elements.time.min=minimumOrderTime();renderCart();openDialog('cart-dialog');}));
$('#search').addEventListener('input',renderMenu);
const checkout=$('#checkout-form');checkout.addEventListener('change',()=>{const delivery=checkout.elements.fulfilment.value==='delivery';$('#address-field').hidden=!delivery;checkout.elements.address.disabled=!delivery;checkout.elements.address.required=delivery;});
function selectedTip(){try{return tipAmount($('#tip-amount').value==='custom'?tipFromEuros($('#custom-tip').value):$('#tip-amount').value);}catch{return 0;}}
function updateTipTotals(){
  const custom=$('#tip-amount').value==='custom';
  $('#custom-tip-field').hidden=!custom;
  $('#custom-tip').disabled=!custom;
  $('#custom-tip').required=custom;
  let tip;
  try{tip=tipAmount(custom?tipFromEuros($('#custom-tip').value):$('#tip-amount').value);}
  catch{$('#tip-total').textContent=translate('To be confirmed');$('#order-total').textContent=translate('To be confirmed');return;}
  const total=subtotal(cart,MENU);
  $('#tip-total').textContent=money(tip);
  $('#order-total').textContent=total===null?translate('To be confirmed'):money(total+tip);
}
$('#tip-amount').addEventListener('change',updateCheckoutState);
$('#custom-tip').addEventListener('input',updateCheckoutState);
function checkoutCustomer(){
  const customer=Object.fromEntries(new FormData(checkout));
  if(customer.tipCents==='custom')customer.tipCents=tipFromEuros($('#custom-tip').value);
  return customer;
}
checkout.addEventListener('submit',event=>{event.preventDefault();const customer=checkoutCustomer();const errors=validateOrder(cart,MENU,customer,CONFIG.whatsappNumber).map(error=>translate(error));if(errors.length){$('#checkout-status').textContent=errors.join(' ');return;}try{const message=orderMessage(cart,MENU,customer,translate);const url=whatsappUrl(CONFIG.whatsappNumber,message);window.open(url,'_blank','noopener,noreferrer');showOffersReminder();$('#checkout-status').textContent='Your prepared message opened in WhatsApp. Review it and tap send. Your bag stays here until you clear it.';}catch(error){$('#checkout-status').textContent=translate(error.message);}});
function updateAddressConfirmation(){
  const delivery=checkout.elements.fulfilment.value==='delivery';
  $('#address-confirmation').hidden=!delivery;
  checkout.elements.addressConfirmed.disabled=!delivery;
  checkout.elements.addressConfirmed.required=delivery;
  if(!delivery)checkout.elements.addressConfirmed.checked=false;
  $('#review-address').disabled=!delivery||!checkout.elements.address.value.trim();
}
checkout.addEventListener('change',updateAddressConfirmation);
checkout.elements.address.addEventListener('input',()=>{checkout.elements.addressConfirmed.checked=false;updateAddressConfirmation();});
$('#review-address').addEventListener('click',()=>{
  if(checkout.elements.address.value.trim())window.open(googleMapsUrl(checkout.elements.address.value),'_blank','noopener,noreferrer');
});
updateAddressConfirmation();
let orderCards=[],cardUrls=[];
function clearOrderCards(){cardUrls.forEach(url=>URL.revokeObjectURL(url));cardUrls=[];orderCards=[];$('#order-card-preview').replaceChildren();$('#order-card-downloads').replaceChildren();}
$('#order-card-dialog').addEventListener('close',clearOrderCards);
$('#preview-order-card').addEventListener('click',async()=>{
  if(!checkout.reportValidity())return;
  const customer=checkoutCustomer();
  const errors=validateOrder(cart,MENU,customer,CONFIG.whatsappNumber).map(error=>translate(error));
  if(errors.length){$('#checkout-status').textContent=errors.join(' ');return;}
  const button=$('#preview-order-card');button.disabled=true;button.textContent=translate('Preparing your card…');
  clearOrderCards();
  try{
    orderCards=await createOrderCards(cart,MENU,customer,translate,language==='tn');
    for(const file of orderCards){const url=URL.createObjectURL(file);cardUrls.push(url);const img=el('img');img.src=url;img.alt=translate('Order card');$('#order-card-preview').append(img);}
    $('#share-order-card').hidden=!(navigator.canShare&&navigator.canShare({files:orderCards}));
    $('#order-card-status').textContent='';openDialog('order-card-dialog',button);
  }catch(error){$('#checkout-status').textContent=translate(error.message);}
  finally{button.disabled=false;button.textContent=translate('Preview order card');}
});
$('#share-order-card').addEventListener('click',async()=>{
  try{await navigator.share({files:orderCards,title:CONFIG.brand});$('#order-card-status').textContent=translate('Your order is confirmed only after our reply.');}
  catch(error){if(error.name!=='AbortError')$('#order-card-status').textContent=translate('Sharing is unavailable. Download the card and attach it in WhatsApp.');}
});
$('#download-order-card').addEventListener('click',()=>{
  const links=$('#order-card-downloads');links.replaceChildren();
  orderCards.forEach((file,index)=>{const link=el('a','secondary',`${translate('Download order card')} ${index+1}/${orderCards.length}`);link.href=cardUrls[index];link.download=file.name;links.append(link);});
  if(orderCards.length===1)links.firstElementChild.click();
});
$('#privacy-button').addEventListener('click',()=>openDialog('privacy-dialog'));
$('#clear-bag').addEventListener('click',()=>{cart=[];save();$('#privacy-dialog').close();notify('Saved bag cleared');});
window.addEventListener('storage',event=>{if(event.key===STORAGE){cart=hydrateCart(event.newValue,MENU);updateBag();}});
const pending=MENU.some(item=>item.price===null||item.placeholder);$('#launch-notice').hidden=!pending;
const offersUrl=channelUrl(CONFIG.whatsappChannelUrl);
let offersReminderShown=false;
function showOffersReminder(){
  if(offersReminderShown)return;
  offersReminderShown=true;
  openDialog('offers-reminder',$('#order-button'));
}
if(offersUrl){
  for(const id of ['offers-channel-link','reminder-channel-link']){const link=$(`#${id}`);link.href=offersUrl;link.hidden=false;}
  $('#offers-channel-status').hidden=true;$('#reminder-channel-status').hidden=true;
}else if(validNumber(CONFIG.whatsappNumber)){
  const url=whatsappUrl(CONFIG.whatsappNumber,translate('Hello The Spice Souk! I would like to receive your special offers on WhatsApp. Please tell me how to subscribe. Thank you.'));
  for(const id of ['offers-channel-link','reminder-channel-link']){const link=$(`#${id}`);link.href=url;link.textContent=translate('Request offers via WhatsApp');link.hidden=false;}
  $('#offers>div>p:not(.eyebrow)').textContent=translate('Message us to request special offers. We will tell you how to receive them; our channel is coming soon.');
  $('#offers-reminder>p:not(.fine)').textContent=translate('Message us to request special offers. We will tell you how to receive them; our channel is coming soon.');
  for(const id of ['offers-channel-status','reminder-channel-status'])$(`#${id}`).textContent=translate('Opening the conversation does not automatically subscribe you.');
  for(const selector of ['#offers .offers-actions .fine','#offers-reminder .fine'])$(selector).textContent=translate('Requesting offers is optional. You can ask us to stop at any time.');
}
if(validNumber(CONFIG.whatsappNumber)){
  const contact=el('a','whatsapp-contact',`WhatsApp · +${CONFIG.whatsappNumber}`);
  contact.href=`https://wa.me/${CONFIG.whatsappNumber}`;contact.target='_blank';contact.rel='noopener noreferrer';
  document.querySelector('.footer-main>div').prepend(contact);
}
renderCategories();renderMenu();updateBag();initializeLocale();
