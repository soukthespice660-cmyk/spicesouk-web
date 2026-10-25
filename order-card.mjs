import {lineDetails, money, subtotal, tipAmount} from './order.mjs';

const WIDTH=960, MARGIN=56;
function loadPhoto(src) {
  return new Promise(resolve=>{
    if(!src){resolve(null);return;}
    const image=new Image();
    const timer=setTimeout(()=>resolve(null),8000);
    image.onload=()=>{clearTimeout(timer);resolve(image);};
    image.onerror=()=>{clearTimeout(timer);resolve(null);};
    image.src=new URL(src,document.baseURI).href;
  });
}
function wrap(ctx,text,width) {
  const lines=[];
  for(const paragraph of String(text).split('\n')) {
    let line='';
    for(const word of paragraph.split(/\s+/)) {
      const candidate=line?`${line} ${word}`:word;
      if(ctx.measureText(candidate).width>width&&line){lines.push(line);line=word;}
      else line=candidate;
      while(ctx.measureText(line).width>width&&line.length>1) {
        let end=line.length-1;
        while(end>1&&ctx.measureText(line.slice(0,end)).width>width)end--;
        lines.push(line.slice(0,end));line=line.slice(end);
      }
    }
    lines.push(line);
  }
  return lines;
}
/** Paginated PNGs keep every item readable even for a large bag. */
export async function createOrderCards(cart,menu,customer,t,rtl=false) {
  await document.fonts.ready;
  const photos=await Promise.all(cart.map(line=>loadPhoto(lineDetails(line,menu).item.image)));
  const pages=[];
  for(let start=0;start<cart.length;start+=6) {
    const canvas=document.createElement('canvas');canvas.width=WIDTH;canvas.height=6000;
    const ctx=canvas.getContext('2d');
    if(!ctx)throw new Error('Could not create the order card. Please try again.');
    ctx.fillStyle='#faf3e6';ctx.fillRect(0,0,WIDTH,canvas.height);
    ctx.fillStyle='#082b39';ctx.fillRect(0,0,WIDTH,230);
    ctx.direction=rtl?'rtl':'ltr';
    function text(value,y,{size=26,color='#082b39',width=WIDTH-2*MARGIN,x=MARGIN,serif=false}={}) {
      ctx.font=`${serif?'600':'400'} ${size}px ${serif?'Cormorant Garamond':'DM Sans'}, ${serif?'serif':'sans-serif'}`;
      ctx.fillStyle=color;ctx.textAlign=rtl?'right':'left';
      const lines=wrap(ctx,value,width);
      for(const line of lines){ctx.fillText(line,rtl?x+width:x,y);y+=size*1.4;}
      return y;
    }
    text('THE SPICE SOUK',88,{size:48,color:'#e9c780',serif:true});
    text(t('Order card'),143,{size:32,color:'#fff6e8'});
    text(`${t('Order request · Awaiting confirmation')} · ${Math.floor(start/6)+1}/${Math.ceil(cart.length/6)}`,190,{size:21,color:'#fff6e8'});
    let y=280;
    for(let index=start;index<Math.min(start+6,cart.length);index++) {
      const line=cart[index],{item,unitPrice,labels}=lineDetails(line,menu);
      const image=photos[index],imageX=rtl?WIDTH-MARGIN-160:MARGIN;
      ctx.fillStyle='#eadfc9';ctx.fillRect(imageX,y,160,130);
      if(image){const scale=Math.max(160/image.width,130/image.height);ctx.save();ctx.beginPath();ctx.rect(imageX,y,160,130);ctx.clip();ctx.drawImage(image,imageX+(160-image.width*scale)/2,y+(130-image.height*scale)/2,image.width*scale,image.height*scale);ctx.restore();}
      else {ctx.fillStyle='#082b39';ctx.font='22px "DM Sans", sans-serif';ctx.textAlign='center';ctx.fillText(t('Photo unavailable'),imageX+80,y+70);}
      const x=rtl?MARGIN:MARGIN+186,width=WIDTH-2*MARGIN-186;
      let bottom=text(`${line.quantity} × ${item.name}`,y+29,{size:30,x,width,serif:true});
      if(item.servingLabel)bottom=text(t(item.servingLabel),bottom,{size:21,x,width});
      if(labels.length)bottom=text(labels.join(' · '),bottom,{size:21,x,width});
      bottom=text(money(unitPrice*line.quantity),bottom+5,{size:27,x,width});
      y=Math.max(y+150,bottom+18);
      ctx.strokeStyle='#d7c8ae';ctx.beginPath();ctx.moveTo(MARGIN,y);ctx.lineTo(WIDTH-MARGIN,y);ctx.stroke();y+=34;
    }
    if(start+6>=cart.length) {
      y=text(`${t('Order subtotal')}: ${money(subtotal(cart,menu))}`,y,{size:34,serif:true});
      y=text(`${t('Tip')}: ${money(tipAmount(customer.tipCents))}`,y,{size:25});
      y=text(`${t('Total before delivery')}: ${money(subtotal(cart,menu)+tipAmount(customer.tipCents))}`,y,{size:34,serif:true});
      if(customer.fulfilment==='delivery')y=text(t('Delivery fee confirmed on WhatsApp; not included in the subtotal.'),y+8,{size:23});
      y+=22;
      const details=[`${t('Full name:')} ${customer.name}`,`${t('Method:')} ${t(customer.fulfilment==='delivery'?'Delivery':'Takeaway')}`,
        ...(customer.fulfilment==='delivery'?[`${t('Address:')} ${customer.address}`]:[]),
        `${t('Preferred time (Madrid):')} ${customer.time.replace('T',' ')}`,`WhatsApp: ${customer.phone}`,
        ...(customer.notes.trim()?[`${t('Notes:')} ${customer.notes}`]:[])];
      for(const detail of details)y=text(detail,y,{size:25})+8;
    }
    y=text(t('Photos are illustrative. Presentation and portions may vary.'),y+22,{size:20,color:'#55504a'})+28;
    const output=document.createElement('canvas');output.width=WIDTH;output.height=Math.ceil(y);
    output.getContext('2d').drawImage(canvas,0,0);
    const blob=await new Promise(resolve=>output.toBlob(resolve,'image/png'));
    if(!blob)throw new Error('Could not create the order card. Please try again.');
    pages.push(new File([blob],`The-Spice-Souk-order-${pages.length+1}.png`,{type:'image/png'}));
  }
  return pages;
}
