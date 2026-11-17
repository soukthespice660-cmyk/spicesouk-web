// Pedido de dulces (desde 2026-11-17). Se añaden cajas desde las tarjetas; mínimo 2 cajas y 70 € (las dos condiciones), solo para dulces; entrega aparte.
// El pedido se envía por WhatsApp como «pendiente de confirmación». Va aparte del carrito de comida (su mínimo de 25 € no aplica).
// Las tarjetas las genera Web/herramientas/dulces_lib.py: solo las disponibles llevan botón .sw-add con data-ref y data-price.
import { CONFIG } from './config.mjs';
import { language } from './locale.mjs';

const tnBoxes = b => b === 1 ? 'علبة' : b === 2 ? 'زوز علب' : `${b} علب`;
const T = {
  es: { title: 'Tu pedido de dulces', empty: 'Añade cajas para hacer tu pedido.', min: (b, v) => `Pedido mínimo de dulces: ${b} cajas y ${v}`, delivery: 'Entrega aparte',
    total: 'Total dulces', missing: (b, v) => `Te ${b ? (b === 1 ? 'falta 1 caja' : `faltan ${b} cajas`) : 'faltan'}${b && v ? ' y ' : v ? ' ' : ''}${v} para el mínimo`, reached: 'Mínimo alcanzado', send: 'Enviar pedido por WhatsApp',
    inOrder: n => `${n} en tu pedido`, less: 'Quitar una', more: 'Añadir otra', items: n => `${n} producto${n > 1 ? 's' : ''}`, view: 'Ver pedido',
    fine: 'Pendiente de confirmación: te escribimos para confirmar disponibilidad y entrega. Listo en 7 días desde la confirmación.',
    head: 'Hola, quiero hacer un pedido de dulces (pendiente de confirmación):', end: 'Entrega aparte. ¿Me confirmáis disponibilidad y entrega?' },
  en: { title: 'Your sweets order', empty: 'Add boxes to place your order.', min: (b, v) => `Minimum sweets order: ${b} boxes and ${v}`, delivery: 'Delivery charged separately',
    total: 'Sweets total', missing: (b, v) => `${[b && `${b} more box${b > 1 ? 'es' : ''}`, v && (b ? v : `${v} more`)].filter(Boolean).join(' and ')} to reach the minimum`, reached: 'Minimum reached', send: 'Send order on WhatsApp',
    inOrder: n => `${n} in your order`, less: 'Remove one', more: 'Add one more', items: n => `${n} item${n > 1 ? 's' : ''}`, view: 'View order',
    fine: 'Pending confirmation: we will message you to confirm availability and delivery. Ready within 7 days of confirmation.',
    head: 'Hello, I would like to order sweets (pending confirmation):', end: 'Delivery charged separately. Could you confirm availability and delivery?' },
  fr: { title: 'Votre commande de douceurs', empty: 'Ajoutez des coffrets pour passer commande.', min: (b, v) => `Commande minimum de douceurs : ${b} coffrets et ${v}`, delivery: 'Livraison en supplément',
    total: 'Total douceurs', missing: (b, v) => `Il manque ${[b && `${b} coffret${b > 1 ? 's' : ''}`, v].filter(Boolean).join(' et ')} pour atteindre le minimum`, reached: 'Minimum atteint', send: 'Envoyer la commande sur WhatsApp',
    inOrder: n => `${n} dans votre commande`, less: 'Retirer un', more: 'Ajouter un', items: n => `${n} article${n > 1 ? 's' : ''}`, view: 'Voir la commande',
    fine: 'En attente de confirmation : nous vous écrivons pour confirmer la disponibilité et la livraison. Prêt sous 7 jours après confirmation.',
    head: 'Bonjour, je voudrais commander des douceurs (en attente de confirmation) :', end: 'Livraison en supplément. Pouvez-vous me confirmer la disponibilité et la livraison ?' },
  // Árabe tunecino: PENDIENTE DE REVISIÓN NATIVA.
  tn: { title: 'طلبية الحلو متاعك', empty: 'زيد علب باش تعمل طلبيتك.', min: (b, v) => `أقل طلبية متاع الحلو: ${tnBoxes(b)} و${v}`, delivery: 'التوصيل وحدو',
    total: 'مجموع الحلو', missing: (b, v) => `ناقصك ${[b && tnBoxes(b), v].filter(Boolean).join(' و')} باش توصل للحد الأدنى`, reached: 'وصلت للحد الأدنى', send: 'ابعث الطلبية على واتساب',
    inOrder: n => `${n} في طلبيتك`, less: 'نقص وحدة', more: 'زيد وحدة', items: n => `${n} منتوجات`, view: 'شوف الطلبية',
    fine: 'الطلبية تستنى التأكيد: نكتبولك باش نأكدو المتوفر والتوصيل. يكون حاضر في 7 أيام من بعد التأكيد.',
    head: 'عسلامة، نحب نعمل طلبية حلو (تستنى التأكيد):', end: 'التوصيل وحدو. تنجمو تأكدولي المتوفر والتوصيل؟' }
};
const t = T[language] || T.en;
const KEY = 'ss-sweets-v1', MAX = 20;
const money = v => language === 'en' ? `€${v}` : `${v} €`;
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const box = document.getElementById('sw-order');
if (box) init(box);

function init(box) {
  const min = Number(box.dataset.min) || 70, minBoxes = Number(box.dataset.minBoxes) || 2;
  const cards = new Map();
  document.querySelectorAll('#dulces .sw-add').forEach(btn => {
    const card = btn.closest('.sw-card');
    cards.set(btn.dataset.ref, { btn, card, price: Number(btn.dataset.price), kind: card.querySelector('.sw-kind')?.textContent.trim() || '' });
  });
  let qty = {};
  try { for (const [ref, n] of Object.entries(JSON.parse(localStorage.getItem(KEY) || '{}'))) if (cards.has(ref) && n > 0) qty[ref] = Math.min(MAX, Math.floor(n)); } catch { qty = {}; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(qty)); } catch { /* sin almacenamiento: el pedido vive solo en esta visita */ } };

  const list = el('ul', 'sw-lines'), empty = el('p', 'sw-empty', t.empty), total = el('p', 'sw-total');
  const send = el('a', 'sw-send', t.send); send.target = '_blank'; send.rel = 'noopener noreferrer';
  const foot = el('div', 'sw-foot'); foot.append(total, send);
  total.setAttribute('role', 'status');
  box.replaceChildren(el('h3', 'sw-order-title', t.title), list, empty, foot, el('p', 'sw-fine', t.fine));
  const bar = el('a', 'sw-bar'); bar.href = '#sw-order'; bar.hidden = true; box.before(bar);

  for (const [ref, c] of cards) {
    c.badge = el('p', 'sw-in'); c.badge.hidden = true; c.btn.after(c.badge);
    c.btn.addEventListener('click', () => { qty[ref] = Math.min(MAX, (qty[ref] || 0) + 1); update(); });
  }
  let panelInView = false;
  if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { panelInView = e.isIntersecting; bar.hidden = panelInView || !count(); }).observe(box);

  function count() { return Object.values(qty).reduce((a, b) => a + b, 0); }
  function line(ref, c) {
    const li = el('li', 'sw-line'), step = el('span', 'sw-step');
    const minus = el('button', '', '−'), out = el('output', '', String(qty[ref])), plus = el('button', '', '+');
    for (const [b, act, label] of [[minus, -1, t.less], [plus, 1, t.more]]) {
      b.type = 'button'; b.dataset.ref = ref; b.dataset.act = act; b.setAttribute('aria-label', `${label} — ${ref}`);
      b.addEventListener('click', () => { qty[ref] = Math.max(0, Math.min(MAX, qty[ref] + act)); update(); });
    }
    plus.disabled = qty[ref] >= MAX;
    step.append(minus, out, plus);
    li.append(el('span', 'sw-l-name', c.kind ? `${ref} · ${c.kind}` : ref), step, el('span', 'sw-l-sum', money(c.price * qty[ref])));
    return li;
  }
  function message(entries, sum) {
    return [t.head, ...entries.map(([ref, c]) => `• ${qty[ref]} × ${ref}${c.kind ? ` (${c.kind})` : ''} — ${money(c.price * qty[ref])}`), `${t.total}: ${money(sum)}`, t.end].join('\n');
  }
  function update() {
    const focused = document.activeElement?.closest?.('.sw-step button');
    const keep = focused && { ref: focused.dataset.ref, act: focused.dataset.act };
    for (const k of Object.keys(qty)) if (!qty[k]) delete qty[k];
    save();
    const entries = [...cards].filter(([ref]) => qty[ref]);
    const sum = entries.reduce((s, [ref, c]) => s + c.price * qty[ref], 0), n = count(), gap = Math.max(0, min - sum), boxGap = Math.max(0, minBoxes - n);
    list.replaceChildren(...entries.map(([ref, c]) => line(ref, c)));
    list.hidden = !n; empty.hidden = !!n;
    total.replaceChildren(el('strong', '', `${t.total}: ${money(sum)}`),
      el('span', '', [t.min(minBoxes, money(min)), t.delivery, n ? (gap || boxGap ? t.missing(boxGap, gap ? money(gap) : '') : t.reached) : ''].filter(Boolean).join(' · ')));
    if (n && !gap && !boxGap) { send.href = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(message(entries, sum))}`; send.removeAttribute('aria-disabled'); }
    else { send.removeAttribute('href'); send.setAttribute('aria-disabled', 'true'); }
    for (const [ref, c] of cards) { c.badge.hidden = !qty[ref]; c.badge.textContent = qty[ref] ? `✓ ${t.inOrder(qty[ref])}` : ''; c.card.classList.toggle('in-order', !!qty[ref]); }
    bar.replaceChildren(el('span', '', `${t.title}: ${t.items(n)} · ${money(sum)}`), el('strong', '', t.view));
    bar.hidden = panelInView || !n;
    if (keep) (list.querySelector(`button[data-ref="${CSS.escape(keep.ref)}"][data-act="${keep.act}"]`) || send).focus();
  }
  update();
}
