import {lineDetails, money, subtotal, tipAmount} from './order.mjs';

/* Carta del pedido (PNG que descarga o comparte el cliente). Misma identidad que la web:
   bordeaux satén, champán y dorado; fotos reales dentro de un arco, nunca texto de error. */
const WIDTH=1080, MARGIN=64, PHOTO_W=164, PHOTO_H=188, PAD=24;
const C={ink:'#2A0A12',muted:'#6A5A52',gold:'#B88A2E',goldLight:'#E8CC8A',line:'#D9C08A',cream:'#FBF4E4',wine:'#2B060D'};

function loadImage(src) {
  return new Promise(resolve=>{
    const image=new Image();
    const timer=setTimeout(()=>resolve(null),8000);
    image.onload=()=>{clearTimeout(timer);resolve(image);};
    image.onerror=()=>{clearTimeout(timer);resolve(null);};
    image.src=new URL(src,document.baseURI).href;
  });
}
/* La web muestra siempre la variante «-card.webp» de cada foto; la ficha del producto apunta a la grande. */
async function loadPhoto(src) {
  if(!src)return null;
  return (await loadImage(src.replace(/\.webp$/,'-card.webp')))||(await loadImage(src));
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
function archPath(ctx,x,y,w,h) {
  const r=w/2,c=10;
  ctx.beginPath();ctx.moveTo(x,y+h-c);ctx.lineTo(x,y+r);ctx.arc(x+r,y+r,r,Math.PI,0);ctx.lineTo(x+w,y+h-c);
  ctx.quadraticCurveTo(x+w,y+h,x+w-c,y+h);ctx.lineTo(x+c,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-c);ctx.closePath();
}
function roundRect(ctx,x,y,w,h,r) {
  ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();
}
function satin(ctx,w,h,dark=true) {
  const g=ctx.createLinearGradient(0,0,w,h*1.6);
  const stops=dark?[[0,'#1A0308'],[.2,'#3C0A18'],[.36,'#6E1430'],[.5,'#430A1B'],[.7,'#1E0409'],[.88,'#3C0A18'],[1,'#1A0308']]:[[0,'#EFE3CB'],[.3,'#FAF2E0'],[.55,'#EBDCBF'],[.8,'#F8EEDA'],[1,'#E9D9BA']];
  stops.forEach(([o,c])=>g.addColorStop(o,c));return g;
}
function diamond(ctx,cx,cy,r,color) {ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(cx,cy-r);ctx.lineTo(cx+r,cy);ctx.lineTo(cx,cy+r);ctx.lineTo(cx-r,cy);ctx.closePath();ctx.fill();}
function shortTime(value) {
  const m=String(value).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  return m?`${m[3]}/${m[2]}/${m[1]} · ${m[4]}:${m[5]}`:String(value).replace('T',' ');
}
const label=value=>String(value).replace(/:\s*$/,'');

/** PNG paginados: cada artículo se lee bien aunque el pedido sea grande. */
export async function createOrderCards(cart,menu,customer,t,rtl=false) {
  await document.fonts.ready;
  await Promise.all(['600 40px "Cormorant Garamond"','italic 500 40px "Cormorant Garamond"','400 22px "DM Sans"','600 22px "DM Sans"'].map(font=>document.fonts.load(font).catch(()=>{})));
  const photos=await Promise.all(cart.map(line=>loadPhoto(lineDetails(line,menu).item.image)));
  const pages=[],per=6,total=Math.ceil(cart.length/per);
  for(let start=0;start<cart.length;start+=per) {
    const canvas=document.createElement('canvas');canvas.width=WIDTH;canvas.height=9000;
    const ctx=canvas.getContext('2d');
    if(!ctx)throw new Error('Could not create the order card. Please try again.');
    ctx.direction=rtl?'rtl':'ltr';
    const align=rtl?'right':'left',other=rtl?'left':'right';
    const X=(x,w=0)=>rtl?WIDTH-x-w:x;                        // posición espejada para árabe
    const sans=(size,weight=400)=>`${weight} ${size}px "DM Sans", sans-serif`;
    const serif=(size,weight=600,style='')=>`${style} ${weight} ${size}px "Cormorant Garamond", serif`.trim();
    function put(value,x,y,{font,color=C.ink,al=align,spacing='0px'}) {
      ctx.font=font;ctx.fillStyle=color;ctx.textAlign=al;ctx.letterSpacing=spacing;ctx.fillText(value,x,y);ctx.letterSpacing='0px';
    }
    function block(value,y,{font,size,color=C.ink,x=MARGIN,width=WIDTH-2*MARGIN,gap=1.3,spacing='0px'}) {
      ctx.font=font;ctx.letterSpacing=spacing;
      const lines=wrap(ctx,value,width);
      for(const line of lines){put(line,rtl?x+width:x,y,{font,color,spacing});y+=size*gap;}
      ctx.letterSpacing='0px';return y;
    }
    function measure(value,font,size,width,gap=1.3) {ctx.font=font;return wrap(ctx,value,width).length*size*gap;}

    // Fondo champán satén
    ctx.fillStyle=satin(ctx,WIDTH,9000,false);ctx.fillRect(0,0,WIDTH,9000);

    // Cabecera bordeaux satén
    const HEAD=318;
    ctx.fillStyle=satin(ctx,WIDTH,HEAD,true);ctx.fillRect(0,0,WIDTH,HEAD);
    ctx.fillStyle=C.gold;ctx.fillRect(0,HEAD-4,WIDTH,4);
    put('THE SPICE SOUK',X(MARGIN),92,{font:serif(58),color:C.goldLight,spacing:'4px'});
    put('TUNISIAN FOOD · MADRID',X(MARGIN),132,{font:sans(17,500),color:'#C9A25A',spacing:'5px'});
    ctx.strokeStyle='rgba(232,204,138,.45)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(MARGIN,160);ctx.lineTo(WIDTH-MARGIN,160);ctx.stroke();
    diamond(ctx,WIDTH/2,160,5,C.goldLight);
    put(t('Order card'),X(MARGIN),232,{font:serif(54,500,'italic'),color:C.cream});
    put(`${t('Order request · Awaiting confirmation')} · ${Math.floor(start/per)+1}/${total}`,X(MARGIN),276,{font:sans(21),color:'#E3D3B8'});

    // Artículos
    let y=HEAD+46;
    for(let index=start;index<Math.min(start+per,cart.length);index++) {
      const line=cart[index],{item,unitPrice,labels}=lineDetails(line,menu);
      const image=photos[index];
      const priceText=unitPrice===null?'':money(unitPrice*line.quantity);
      ctx.font=sans(32,600);const priceW=Math.ceil(ctx.measureText(priceText).width)+10;
      const tx=MARGIN+PAD+PHOTO_W+30,tw=WIDTH-2*MARGIN-2*PAD-PHOTO_W-30-priceW-10;
      const name=item.name;
      const details=[item.servingLabel?t(item.servingLabel):'',labels.join(' · ')].filter(Boolean).join('\n');
      const textH=measure(name,serif(36),36,tw,1.15)+(details?10+measure(details,sans(22),22,tw,1.4):0);
      const rowH=Math.max(PHOTO_H,textH)+2*PAD;

      // tarjeta de la fila
      roundRect(ctx,MARGIN,y,WIDTH-2*MARGIN,rowH,16);ctx.fillStyle='rgba(255,253,247,.92)';ctx.fill();
      ctx.strokeStyle=C.line;ctx.lineWidth=1.5;ctx.stroke();

      // foto en arco (o marco dorado sin texto si no hay foto)
      const px=X(MARGIN+PAD,PHOTO_W),py=y+PAD;
      ctx.save();archPath(ctx,px,py,PHOTO_W,PHOTO_H);ctx.clip();
      if(image){
        ctx.fillStyle='#fff';ctx.fillRect(px,py,PHOTO_W,PHOTO_H);
        const scale=Math.max(PHOTO_W/image.width,PHOTO_H/image.height);
        ctx.drawImage(image,px+(PHOTO_W-image.width*scale)/2,py+(PHOTO_H-image.height*scale)/2,image.width*scale,image.height*scale);
      } else {
        ctx.fillStyle=satin(ctx,PHOTO_W+px,PHOTO_H+py,true);ctx.fillRect(px,py,PHOTO_W,PHOTO_H);
      }
      ctx.restore();
      archPath(ctx,px,py,PHOTO_W,PHOTO_H);ctx.strokeStyle=C.gold;ctx.lineWidth=2;ctx.stroke();
      if(!image)diamond(ctx,px+PHOTO_W/2,py+PHOTO_H/2+10,11,C.goldLight);

      // cantidad: pastilla bordeaux sobre la esquina inferior de la foto
      const qtxt=`×${line.quantity}`;ctx.font=sans(24,600);
      const qw=Math.max(54,Math.ceil(ctx.measureText(qtxt).width)+30),qh=40,qx=rtl?px-6:px+PHOTO_W-qw+6,qy=py+PHOTO_H-qh/2-2;
      roundRect(ctx,qx,qy,qw,qh,20);ctx.fillStyle=C.wine;ctx.fill();ctx.strokeStyle=C.goldLight;ctx.lineWidth=2;ctx.stroke();
      ctx.direction='ltr';put(qtxt,qx+qw/2,qy+qh/2+8.5,{font:sans(24,600),color:C.goldLight,al:'center'});ctx.direction=rtl?'rtl':'ltr';

      // texto y precio
      const bx=X(tx,tw);
      let by=block(name,y+PAD+36,{font:serif(36),size:36,x:bx,width:tw,gap:1.15,color:C.wine});
      if(details)block(details,by+4,{font:sans(22),size:22,x:bx,width:tw,gap:1.4,color:C.muted});
      if(priceText)put(priceText,(rtl?MARGIN+PAD:WIDTH-MARGIN-PAD),y+PAD+34,{font:sans(32,600),color:C.wine,al:other});
      y+=rowH+22;
    }

    // Totales y datos (solo en la última página)
    if(start+per>=cart.length) {
      const sub=subtotal(cart,menu),tip=tipAmount(customer.tipCents);
      const note=customer.fulfilment==='delivery'?t('Delivery fee confirmed on WhatsApp; not included in the subtotal.'):'';
      const noteH=note?measure(note,sans(20),20,WIDTH-2*MARGIN-80,1.4)+14:0;
      const panelH=44+36+16+36+26+58+noteH+34;
      const py=y+10;
      roundRect(ctx,MARGIN,py,WIDTH-2*MARGIN,panelH,18);ctx.fillStyle=satin(ctx,WIDTH,panelH+py,true);ctx.fill();
      ctx.strokeStyle=C.gold;ctx.lineWidth=2;ctx.stroke();
      const lx=X(MARGIN+40),rx=rtl?MARGIN+40:WIDTH-MARGIN-40;
      let ty=py+66;
      put(t('Order subtotal'),lx,ty,{font:sans(24),color:'#F1E6D0'});put(money(sub),rx,ty,{font:sans(26,600),color:'#F6EAD0',al:other});
      ty+=44;
      put(t('Tip'),lx,ty,{font:sans(24),color:'#F1E6D0'});put(money(tip),rx,ty,{font:sans(26,600),color:'#F6EAD0',al:other});
      ty+=28;ctx.strokeStyle='rgba(232,204,138,.5)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(MARGIN+40,ty);ctx.lineTo(WIDTH-MARGIN-40,ty);ctx.stroke();
      ty+=58;
      put(t('Total before delivery'),lx,ty,{font:serif(44),color:C.goldLight});put(money(sub+tip),rx,ty,{font:sans(40,600),color:C.goldLight,al:other});
      if(note)block(note,ty+40,{font:sans(20),size:20,x:rtl?MARGIN+40:MARGIN+40,width:WIDTH-2*MARGIN-80,color:'#D9CBB4'});
      y=py+panelH+40;

      const rows=[[t('Full name:'),customer.name],[t('Method:'),t(customer.fulfilment==='delivery'?'Delivery':'Takeaway')],
        ...(customer.fulfilment==='delivery'?[[t('Address:'),customer.address]]:[]),
        [t('Preferred time (Madrid):'),shortTime(customer.time)],['WhatsApp',customer.phone],
        ...(customer.notes.trim()?[[t('Notes:'),customer.notes]]:[])];
      for(const [k,v] of rows) {
        put(label(k).toUpperCase(),X(MARGIN),y,{font:sans(16,600),color:C.gold,spacing:'3px'});
        y=block(String(v),y+34,{font:sans(27),size:27,color:C.ink,gap:1.35});
        ctx.strokeStyle='rgba(184,138,46,.3)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(MARGIN,y+4);ctx.lineTo(WIDTH-MARGIN,y+4);ctx.stroke();
        y+=30;
      }
      y+=8;
      diamond(ctx,WIDTH/2,y,5,C.gold);
      y=block(t('Your order is confirmed only after our reply.'),y+48,{font:serif(30,500,'italic'),size:30,color:C.wine,x:MARGIN,width:WIDTH-2*MARGIN,gap:1.3});
    }
    y=block(t('Photos are illustrative. Presentation and portions may vary.'),y+14,{font:sans(19),size:19,color:C.muted});

    // Pie de marca
    const FOOT=84;y+=26;
    ctx.fillStyle=satin(ctx,WIDTH,FOOT,true);ctx.fillRect(0,y,WIDTH,FOOT);
    ctx.fillStyle=C.gold;ctx.fillRect(0,y,WIDTH,3);
    ctx.textAlign='center';put('spicesouk.es',WIDTH/2,y+FOOT/2+9,{font:sans(24,500),color:C.goldLight,al:'center',spacing:'4px'});
    y+=FOOT;

    const output=document.createElement('canvas');output.width=WIDTH;output.height=Math.ceil(y);
    output.getContext('2d').drawImage(canvas,0,0);
    const blob=await new Promise(resolve=>output.toBlob(resolve,'image/png'));
    if(!blob)throw new Error('Could not create the order card. Please try again.');
    pages.push(new File([blob],`The-Spice-Souk-order-${pages.length+1}.png`,{type:'image/png'}));
  }
  return pages;
}
