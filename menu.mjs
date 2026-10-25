// EDIT YOUR MENU HERE. Prices are integer euro cents: 1250 means EUR 12.50.
// Null is an unset price, never a free item. Set available:false to mark sold out.
// Descriptions avoid unconfirmed ingredients and allergen claims.
export const CATEGORIES = ['Starters', 'Salads', 'Main Dishes', 'Sandwiches', 'Desserts', 'Drinks', 'Combos / Offers'];
export const PRICES = {
  'coca-cola-zero-can': 200,
  'coca-cola-zero-500': 300,
  'coca-cola-zero-caffeine-free-can': 200,
  'iced-tea-green-zero-can': 200,

  'sprite-can': 200,
  'coca-cola-can': 200,
  'coca-cola-500': 300,
  'fanta-orange-can': 200,
  'fanta-lemon-can': 200,
  'iced-tea-lemon-can': 200,
  'fuze-tea-can': 200,
  'couscous-lamb': 2000, 'couscous-beef': 1800, 'couscous-chicken': 1500,
  'pasta-lamb': 1500, 'pasta-beef': 1300, 'pasta-chicken': 1200,
  kamouniya: 1200, tajin: 300,
  'chorba-frik': 750, loubya: 1200, 'riz-djerbien': 1250,
  'ojja-normal': 1000, 'ojja-merguez': 1250, 'kafteji-plate': 1000, 'kafteji-sandwich': 1000,
  'libanaise-chicken': 900, 'libanaise-beef': 1100, 'libanaise-merguez': 1100,
  'supplement-eggs': null, 'supplement-merguez': 100, 'supplement-bread': 100, 'supplement-fries': 350, 'supplement-harissa': 0, 'supplement-tuna': 100,
  'tunisian-salad': 1000, mechouiya: 1000, brik: 500, libanaise: 900,
  // Option prices are complete dish prices; supplements are extra charges.
};
export const SUPPLEMENTS = ['Eggs','Merguez','Bread','Frites','Harissa','Tuna'].map((name,index)=>({id:['eggs','merguez','bread','fries','harissa','tuna'][index],name:name==='Merguez'?'Merguez · 1 Piece':name,price:PRICES['supplement-'+['eggs','merguez','bread','fries','harissa','tuna'][index]]})).filter(option=>Number.isSafeInteger(option.price));
const CONTAINER_SIZES = {couscous:1250,pasta:1250,'chorba-frik':500,'tunisian-salad':600,mechouiya:600};
// Explicit pairings: new products have no supplements until deliberately assigned.
const DISH_SUPPLEMENTS = {
  'riz-djerbien':['merguez'],
  'chorba-frik':['bread'], loubya:['bread'],
  kamouniya:['bread'], ojja:['bread'],
  'tunisian-salad':['eggs','bread'], mechouiya:['eggs','bread'],
  brik:[],
  kafteji:['eggs','merguez','bread','fries','harissa'], libanaise:['fries','harissa']
};
const dish = (id, name, category, description, image, variants = []) => ({ id, name, category, description, image: image ? `assets/${image}.webp` : null, imageAlt: `${category}: representative Tunisian food photograph, not our own dish`, price: PRICES[id] ?? null, servingLabel:CONTAINER_SIZES[id]?`Container · ${CONTAINER_SIZES[id]} ml`:undefined, available: true, placeholder: false, variantRequired: variants.length > 0, variants, addons: SUPPLEMENTS.filter(option=>(DISH_SUPPLEMENTS[id]||[]).includes(option.id)).map(option=>id==='kafteji'&&option.id==='bread'?{...option,variants:['plate']}:option) });
export const MENU = [
  { ...dish('couscous','Couscous','Main Dishes','Tunisian Couscous. Choose lamb, beef or chicken.','product-woven-couscous',['Lamb','Beef','Chicken'].map(name=>({id:name.toLowerCase(),name,price:PRICES['couscous-'+name.toLowerCase()]}))), variantLabel:'Choose Your Meat',variantPriceMode:'full',legacyIds:{'couscous-lamb':'lamb','couscous-beef':'beef','couscous-chicken':'chicken'} },
  { ...dish('pasta','Tunisian Pasta','Main Dishes','Tunisian pasta. Choose lamb, beef or chicken.','product-woven-pasta',['Lamb','Beef','Chicken'].map(name=>({id:name.toLowerCase(),name,price:PRICES['pasta-'+name.toLowerCase()]}))), variantLabel:'Choose Your Meat',variantPriceMode:'full',legacyIds:{'pasta-lamb':'lamb','pasta-beef':'beef','pasta-chicken':'chicken'} },
  dish('chorba-frik','Chorba Frik','Starters','Tunisian chorba frik.','product-woven-chorba-frik'),
  dish('loubya','Loubia','Main Dishes','Loubia in the Tunisian tradition.','product-woven-loubia'),
  dish('riz-djerbien','Riz Djerbien','Main Dishes','Riz Djerbien in the Tunisian tradition.','product-woven-riz-djerbien'),
  { ...dish('ojja','Ojja','Main Dishes','Choose normal Ojja or Ojja with merguez.','product-woven-ojja',[{id:'normal',name:'Normal',price:PRICES['ojja-normal']},{id:'merguez',name:'With Merguez',price:PRICES['ojja-merguez']}]),variantLabel:'Choose Your Ojja',variantPriceMode:'full' },
  dish('kamouniya','Kamouniya','Main Dishes','A Tunisian speciality.','product-woven-kamouniya'),
  { ...dish('kafteji','Kafteji','Main Dishes','Enjoy Kafteji as a plate or sandwich. Add merguez as a supplement.','product-woven-kafteji-sandwich',[{id:'sandwich',name:'Sandwich',price:PRICES['kafteji-sandwich']},{id:'plate',name:'Plate',price:PRICES['kafteji-plate']}]),variantLabel:'Plate Or Sandwich?',variantPriceMode:'full',legacyVariants:{'without-merguez':{variant:'plate',addons:[]},'with-merguez':{variant:'plate',addons:['merguez']}} },
  { ...dish('tajin','Tunisian Tajin','Starters','Tajin in the Tunisian tradition.','product-woven-tajin',[{id:'chicken',name:'Chicken',price:PRICES.tajin+200},{id:'tuna',name:'Tuna',price:PRICES.tajin}]),servingLabel:'Per portion',variantLabel:'Choose Your Filling',variantPriceMode:'full',legacyVariants:{'':{variant:'chicken',addons:[]}} },
  dish('tunisian-salad','Tunisian Salad','Salads','A Tunisian salad.','product-woven-salad'),
  dish('mechouiya','Mechouiya Salad','Salads','Mechouiya in the Tunisian tradition.','product-woven-mechouiya'),
  dish('brik','Brik','Starters','Tunisian brik.','product-woven-brik'),
  { ...dish('libanaise','Libanaise','Sandwiches','Libanaise sandwich. Filling and portion details will be confirmed with your order.','product-woven-libanaise',['Chicken','Beef','Merguez'].map(name=>({id:name.toLowerCase(),name,price:PRICES['libanaise-'+name.toLowerCase()]}))),variantLabel:'Choose Your Meat',variantPriceMode:'full',legacyVariants:{'':{variant:'chicken',addons:[]}} },
  { ...dish("coca-cola-zero-can","Coca-Cola Zero Sugar — Can · 330 ml","Drinks","Can · 330 ml. Zero sugar.","coca-cola-zero-can"), available:true, imageAlt:"Coca-Cola Zero Sugar \u2014 Can \u00b7 330 ml \u2014 manufacturer packaging photo", imageFit:'contain' },
  { ...dish("coca-cola-zero-500","Coca-Cola Zero Sugar — Bottle · 500 ml","Drinks","Bottle · 500 ml. Zero sugar.","coca-cola-zero-500"), available:true, imageAlt:"Coca-Cola Zero Sugar \u2014 Bottle \u00b7 500 ml \u2014 manufacturer packaging photo", imageFit:'contain' },
  { ...dish("coca-cola-zero-caffeine-free-can","Coca-Cola Zero Sugar, Caffeine Free — Can · 330 ml","Drinks","Can · 330 ml. Zero sugar and caffeine free.","coca-cola-zero-caffeine-free-can"), available:true, imageAlt:"Coca-Cola Zero Sugar, Caffeine Free \u2014 Can \u00b7 330 ml \u2014 manufacturer packaging photo", imageFit:'contain' },
  { ...dish("iced-tea-green-zero-can","Zero Green Tea — Can · 330 ml","Drinks","Can · 330 ml. Zero sugar. Passion fruit and mango flavour.","iced-tea-green-zero-can"), available:true, imageAlt:"Zero Green Tea \u2014 Can \u00b7 330 ml \u2014 manufacturer packaging photo", imageFit:'contain' },
  { ...dish('sprite-can','Sprite — Can · 330 ml','Drinks','Can · 330 ml. Serve chilled.','sprite-can'), available:true, imageAlt:'Sprite Can · 330 ml — manufacturer packaging photo', imageFit:'contain' },
  { ...dish('coca-cola-can','Coca-Cola — Can · 330 ml','Drinks','Can · 330 ml. Serve chilled.','coca-cola-can'), available:true, imageAlt:'Coca-Cola Can · 330 ml — manufacturer packaging photo', imageFit:'contain' },
  { ...dish('coca-cola-500','Coca-Cola — Bottle · 500 ml','Drinks','Bottle · 500 ml. Serve chilled.','coca-cola-500'), available:true, imageAlt:'Coca-Cola Bottle · 500 ml — manufacturer packaging photo', imageFit:'contain' },
  { ...dish('fanta-orange-can','Fanta Orange — Can · 330 ml','Drinks','Can · 330 ml. Serve chilled.','fanta-orange-can'), available:true, imageAlt:'Fanta Orange Can · 330 ml — manufacturer packaging photo', imageFit:'contain' },
  { ...dish('fanta-lemon-can','Fanta Lemon — Can · 330 ml','Drinks','Can · 330 ml. Serve chilled.','fanta-lemon-can'), available:true, imageAlt:'Fanta Lemon Can · 330 ml — manufacturer packaging photo', imageFit:'contain' },
  { ...dish('iced-tea-lemon-can','Lemon Iced Tea — Can · 330 ml','Drinks','Can · 330 ml. Serve chilled.','iced-tea-lemon-can'), available:true, imageAlt:'Lemon Iced Tea Can · 330 ml — manufacturer packaging photo', imageFit:'contain' },
  { ...dish('fuze-tea-can','Fuze Tea Lemon — Can · 330 ml','Drinks','Can · 330 ml. Serve chilled.','fuze-tea-can'), available:true, imageAlt:'Fuze Tea Lemon Can · 330 ml — manufacturer packaging photo', imageFit:'contain' }
].sort((a,b)=>CATEGORIES.indexOf(a.category)-CATEGORIES.indexOf(b.category)).map(item => item.image?.startsWith('assets/product-') ? {...item,standardisedPhoto:true,imageAlt:`${item.name} — background-standardised illustrative photo`,} : item);
