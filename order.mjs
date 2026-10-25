import { CONFIG } from './config.mjs';
export function money(cents) { return cents === null ? 'Price to be confirmed' : new Intl.NumberFormat(({es:'es-ES',fr:'fr-FR'})[(typeof location==='undefined'?'':location.pathname.split('/')[1])]||'en-IE', { style: 'currency', currency: 'EUR' }).format(cents / 100); }
function choices(menu, id, variant, addons) {
  const item = menu.find(item => item.id === id);
  if (!item || !item.available) throw new Error('This item is unavailable.');
  if (item.variantRequired && !variant) throw new Error('Choose an option for this plate.');
  const selectedVariant = variant ? item.variants.find(option => option.id === variant) : null;
  if (variant && !selectedVariant) throw new Error('This option is no longer available.');
  const ids = [...new Set(addons)].sort();
  const selectedAddons = ids.map(id => item.addons.find(option => option.id === id));
  if (selectedAddons.some(option => !option || (option.variants&&!option.variants.includes(variant)))) throw new Error('This add-on is no longer available.');
  return { item, selectedVariant, selectedAddons, ids };
}
export function addLine(cart, menu, id, variant = '', addons = [], quantity = 1) {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) throw new Error('Choose a quantity from 1 to 99.');
  const { ids } = choices(menu, id, variant, addons);
  const key = JSON.stringify([id, variant, ids]);
  const existing = cart.find(line => line.key === key);
  if (existing) return cart.map(line => line.key === key ? {...line, quantity: Math.min(99, line.quantity + quantity)} : line);
  return [...cart, { key, id, variant, addons: ids, quantity }];
}
export function changeQuantity(cart, key, quantity) {
  if (!Number.isInteger(quantity) || quantity < 0 || quantity > 99) return cart;
  return quantity === 0 ? cart.filter(line => line.key !== key) : cart.map(line => line.key === key ? {...line, quantity} : line);
}
export function hydrateCart(raw, menu) {
  try {
    const data = JSON.parse(raw); if (!Array.isArray(data)) return [];
    return data.slice(0,100).reduce((cart, line) => {
      try {
        const item=menu.find(item=>item.id===line.id)||menu.find(item=>Object.hasOwn(item.legacyIds||{},line.id));
        const variant=item?.legacyIds?.[line.id]||line.variant||'';
        const migration=item?.legacyVariants?.[variant];
        return addLine(cart, menu, item?.id||line.id, migration?.variant||variant, [...(Array.isArray(line.addons)?line.addons:[]),...(migration?.addons||[])], line.quantity);
      } catch { return cart; }
    }, []);
  } catch { return []; }
}
export function lineDetails(line, menu) {
  const { item, selectedVariant, selectedAddons } = choices(menu, line.id, line.variant, line.addons);
  const prices = [...(item.variantPriceMode==='full'&&selectedVariant?[selectedVariant.price]:[item.price,...(selectedVariant?[selectedVariant.price]:[])]), ...selectedAddons.map(option => option.price)];
  const unitPrice = prices.every(price => Number.isSafeInteger(price) && price >= 0) ? prices.reduce((a,b) => a+b,0) : null;
  return { item, unitPrice, labels: [selectedVariant?.name, ...selectedAddons.map(option => option.name)].filter(Boolean) };
}
export function subtotal(cart, menu) {
  const lines = cart.map(line => ({...line, ...lineDetails(line, menu)}));
  return lines.some(line => line.unitPrice === null) ? null : lines.reduce((sum,line) => sum + line.unitPrice * line.quantity, 0);
}
const clean = text => String(text || '').replace(/[\r\n]+/g, ' ').trim();
export function validNumber(number) { return /^[1-9]\d{6,14}$/.test(number); }
export const MINIMUM_NOTICE_HOURS = 24;
const madridFormatter = new Intl.DateTimeFormat('sv-SE', {timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
export function madridDateTime(timestamp) {
  const parts=Object.fromEntries(madridFormatter.formatToParts(new Date(timestamp)).map(part=>[part.type,part.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}
export function minimumOrderTime(now=Date.now()) { return madridDateTime(Math.ceil((Number(now)+MINIMUM_NOTICE_HOURS*3600000)/60000)*60000); }
export function madridTimestamp(value) {
  if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value||'')) return NaN;
  const guess=Date.parse(`${value}:00Z`);
  if(!Number.isFinite(guess)) return NaN;
  // Round-trip both seasonal offsets; reject missing and ambiguous local times.
  const candidates=[1,2].map(hours=>guess-hours*3600000).filter(time=>madridDateTime(time)===value);
  return candidates.length===1?candidates[0]:NaN;
}
export function minimumOrderShortfall(cart,menu,minimum=CONFIG.minimumOrderCents??0,tipCents=0){const total=subtotal(cart,menu);return total===null?null:Math.max(0,minimum-total-tipAmount(tipCents));}
export function tipAmount(value) {
  const amount=value===undefined?0:Number(value);
  if(!Number.isSafeInteger(amount)||amount<0||amount>100000)throw new Error('Choose a valid tip amount.');
  return amount;
}
export function tipFromEuros(value){
  const match=String(value).trim().match(/^(\d{1,4})(?:[.,](\d{1,2}))?$/);
  return match?Number(match[1])*100+Number((match[2]||'').padEnd(2,'0')):NaN;
}
export function validateOrder(cart, menu, customer, number, now=Date.now(),minimum=CONFIG.minimumOrderCents??0) {
  const errors = [];
  if (!cart.length) errors.push('Your bag is empty. Choose something from the menu.');
  if (!validNumber(number)) errors.push('WhatsApp ordering is not connected yet.');
  if (!clean(customer.name)) errors.push('Enter your first and last name.');
  if (!['delivery','takeaway'].includes(customer.fulfilment)) errors.push('Choose delivery or takeaway.');
  if (customer.fulfilment === 'delivery' && !clean(customer.address)) errors.push('Enter your delivery address.');
  if (customer.fulfilment === 'delivery' && customer.addressConfirmed !== 'on') errors.push('Confirm that your delivery address is correct.');
  const requested=madridTimestamp(customer.time);
  if (!Number.isFinite(requested)) errors.push('Choose a valid, unambiguous date and time in Madrid.');
  else if(requested < Number(now)+MINIMUM_NOTICE_HOURS*3600000) errors.push('Please order at least 24 hours in advance (Madrid time).');
  if (!/^[+\d\s().-]+$/.test(clean(customer.phone)) || !/^\d{7,15}$/.test(clean(customer.phone).replace(/\D/g,''))) errors.push('Enter a valid contact phone number.');
  try {
    tipAmount(customer.tipCents);
    if(cart.length&&minimumOrderShortfall(cart,menu,minimum,customer.tipCents)>0)errors.push('Your order is below the minimum amount.');
    if (cart.some(line => lineDetails(line,menu).item.placeholder) || subtotal(cart,menu) === null) errors.push('The menu and prices are not confirmed yet. Preview items cannot be ordered.');
  } catch(error) { errors.push(error.message==='Choose a valid tip amount.'?error.message:'An item or option is no longer available. Please update your bag.'); }
  return errors;
}
export function googleMapsUrl(address) {
  return `https://www.google.com/maps/search/?${new URLSearchParams({api:'1',query:clean(address)})}`;
}
export function orderMessage(cart, menu, customer, t=value=>value) {
  const tip=tipAmount(customer.tipCents);
  const items = cart.map(line => {
    const { item, unitPrice, labels } = lineDetails(line, menu);
    return `${line.quantity} × ${item.name}${item.servingLabel ? ` — ${t(item.servingLabel)}` : ''}${labels.length ? ` (${labels.join(', ')})` : ''} — ${money(unitPrice === null ? null : unitPrice * line.quantity)}`;
  });
  return [t('THE SPICE SOUK — ORDER REQUEST'),'',...items,'',`${t('Order subtotal')}: ${money(subtotal(cart,menu))}`,`${t('Tip')}: ${money(tip)}`,`${t('Total before delivery')}: ${money(subtotal(cart,menu)+tip)}`,...(customer.fulfilment==='delivery'?[t('Delivery fee depends on your address and is confirmed on WhatsApp before we confirm your order. It is not included in the food subtotal.')]:[]),'',`${t('Full name:')} ${clean(customer.name)}`,`${t('Method:')} ${t(customer.fulfilment === 'delivery' ? 'Delivery' : 'Takeaway')}`,...(customer.fulfilment === 'delivery' ? [`${t('Address:')} ${clean(customer.address)}`,'Google Maps:',googleMapsUrl(customer.address),''] : []),`${t('Preferred time (Madrid):')} ${clean(customer.time).replace('T',' ')}`,...(clean(customer.phone) ? [`WhatsApp: ${clean(customer.phone)}`] : []),`${t('Notes:')} ${clean(customer.notes) || t('None')}`,'',t('Please confirm my order and preferred time.')].join('\n');
}
export function whatsappUrl(number, message) {
  if (!validNumber(number)) throw new Error('Configure a valid international WhatsApp number first.');
  if (message.length > 6000) throw new Error('This order is too long for WhatsApp. Reduce the notes or number of items.');
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
