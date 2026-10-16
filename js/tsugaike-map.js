/* Independent January page. Existing December site remains untouched. */
(() => {
  'use strict';
  // Hotels sit below the gondola (y > 460). Left-right follows east-west.
  // Vertical spacing follows Google Maps walking distance from the station.
  const gondola = '栂池ゴンドラリフト「イヴ」山麓駅';
  const hotels = [
    {
      id:'hakuba-berghaus', label:'HOTEL 01', x:250, y:680,
      name:'ホテル白馬ベルグハウス', en:'Hotel Hakuba Berghaus',
      walk:'徒歩約8分（450m）',
      price:'参考価格：¥62,700',
      photo:'./assets/hotels/hakuba-berghaus.jpg',
      destination:'ホテル白馬ベルグハウス',
      booking:'https://www.booking.com/hotel/jp/hakuba-berghaus.ja.html?lang=ja&checkin=2027-01-23&checkout=2027-01-24&group_adults=2&no_rooms=1&group_children=0'
    },
    {
      id:'marion-shinano', label:'HOTEL 03', x:590, y:555,
      name:'リゾートインマリオンシナノ', en:'Resort Inn Marion Shinano',
      walk:'徒歩約4分（250m）',
      price:'参考価格：¥26,000～¥32,13',
      destination:'リゾートインマリオンシナノ',
      booking:'https://www.booking.com/hotel/jp/resort-inn-marion-shinano.ja.html?lang=ja&checkin=2027-01-23&checkout=2027-01-24&group_adults=2&no_rooms=1&group_children=0'
    },
    {
      id:'sunrise-tanne', label:'HOTEL 02', x:455, y:660,
      name:'サンライズタンネ', en:'Hakuba Tsugaike Sunrise Tanne',
      walk:'徒歩約5分（400m）',
      price:'参考価格：¥34,000',
      photo:'./assets/hotels/sunrise-tanne.png',
      destination:'サンライズタンネ',
      booking:'https://www.booking.com/hotel/jp/sunrise-tanne.ja.html?lang=ja&checkin=2027-01-23&checkout=2027-01-24&group_adults=2&no_rooms=1&group_children=0'
    },
    {
      id:'pension-kobekko', label:'HOTEL 04', x:800, y:788, labelY:756,
      name:'ペンション神戸っ子', en:'Pension Kobekko',
      walk:'徒歩約15分（1.1km）',
      price:'参考価格：¥26,600',
      destination:'ペンション神戸っ子',
      booking:'https://www.booking.com/hotel/jp/pension-koubekko.ja.html?lang=ja&checkin=2027-01-23&checkout=2027-01-24&group_adults=2&no_rooms=1&group_children=0'
    }
  ];
  const walkUrl = (destination) => `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(gondola)}&destination=${encodeURIComponent(destination)}&travelmode=walking`;
  const ns='http://www.w3.org/2000/svg';
  const root=document.getElementById('tm-january');
  const switcher=document.getElementById('tm-switch');
  if(!root||!switcher)return;
  const dec=document.getElementById('tm-december');
  const map=document.getElementById('tm-map');
  const card=document.getElementById('tm-card');
  const routes=document.getElementById('tm-routes');
  const markers=document.getElementById('tm-hotel-markers');
  let active=null;
  const create=(tag,attrs={})=>{const el=document.createElementNS(ns,tag);for(const [key,value] of Object.entries(attrs))el.setAttribute(key,value);return el;};
  hotels.forEach((hotel,i)=>{
    // Decorative dotted walking route: illustration only; not an actual street route.
    const path=create('path',{id:`tm-route-${hotel.id}`,class:'tm-route',d:`M 505 460 Q ${hotel.x+40} ${hotel.y-70} ${hotel.x} ${hotel.y}`});routes.append(path);
    const group=create('g',{class:'tm-marker',role:'button',tabindex:'0','aria-label':`${hotel.name}，查看住宿資訊`,'aria-pressed':'false','data-hotel':hotel.id});
    group.append(create('circle',{class:'touch',cx:hotel.x,cy:hotel.y,r:34}));
    group.append(create('circle',{class:'pin',cx:hotel.x,cy:hotel.y,r:14}));
    group.append(create('circle',{class:'dot',cx:hotel.x,cy:hotel.y,r:5}));
    const label=create('text',{x:hotel.labelX??hotel.x,y:hotel.labelY??hotel.y+34,'text-anchor':hotel.anchor||'middle',class:'tm-label'});label.textContent=hotel.label;group.append(label);
    group.addEventListener('click',e=>{e.stopPropagation();select(hotel.id);});
    group.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(hotel.id);}});
    markers.append(group);
  });
  function select(id){
    active=id;
    markers.querySelectorAll('.tm-marker').forEach(m=>m.setAttribute('aria-pressed',String(m.dataset.hotel===id)));
    routes.querySelectorAll('.tm-route').forEach(p=>p.classList.toggle('active',p.id===`tm-route-${id}`));
    const h=hotels.find(h=>h.id===id);
    if(!h){card.hidden=true;return;}
    document.getElementById('tm-card-name').textContent=h.name;
    document.getElementById('tm-card-en').textContent=h.en;
    document.getElementById('tm-card-walk').textContent=h.walk;
    document.getElementById('tm-card-price').textContent=h.price;
    const photo=document.getElementById('tm-card-photo');
    photo.hidden=!h.photo;
    if(h.photo){photo.src=h.photo;photo.alt=h.name;}
    else photo.removeAttribute('src');
    card.classList.toggle('has-photo',Boolean(h.photo));
    document.getElementById('tm-card-map').href=walkUrl(h.destination);
    document.getElementById('tm-card-book').href=h.booking;
    card.hidden=false;
    placeCard(id);
  }
  function placeCard(id){
    const group=markers.querySelector(`[data-hotel="${id}"]`);
    const pin=group.querySelector('.pin').getBoundingClientRect();
    const label=group.querySelector('.tm-label').getBoundingClientRect();
    const host=card.offsetParent.getBoundingClientRect();
    const width=card.offsetWidth;
    const height=card.offsetHeight;
    const gap=14;
    const margin=12;
    const box={left:Math.min(pin.left,label.left),top:pin.top,right:Math.max(pin.right,label.right),bottom:label.bottom};
    const cx=pin.left+pin.width/2;
    const cy=pin.top+pin.height/2;
    const spots=[
      [cx-width/2,box.top-gap-height],
      [box.right+gap,cy-height/2],
      [box.left-width-gap,cy-height/2],
      [cx-width/2,box.bottom+gap]
    ];
    const obstacles=[...markers.querySelectorAll('.tm-marker')].filter(marker=>marker.dataset.hotel!==id).map(marker=>{
      const point=marker.querySelector('.pin').getBoundingClientRect();
      const text=marker.querySelector('.tm-label').getBoundingClientRect();
      return {left:Math.min(point.left,text.left),top:point.top,right:Math.max(point.right,text.right),bottom:text.bottom};
    });
    obstacles.push(switcher.getBoundingClientRect());
    const hits=(target,left,top)=>left<target.right&&left+width>target.left&&top<target.bottom&&top+height>target.top;
    const chosen=spots.map(([x,y])=>{
      const left=Math.max(margin,Math.min(x,innerWidth-margin-width));
      const top=Math.max(margin,Math.min(y,innerHeight-margin-height));
      const dist=Math.hypot(left+width/2-cx,top+height/2-cy);
      const score=(hits(box,left,top)?8000:0)+(hits(switcher.getBoundingClientRect(),left,top)?6000:0)+obstacles.filter(item=>hits(item,left,top)).length*900+dist;
      return {left,top,score};
    }).sort((a,b)=>a.score-b.score)[0];
    card.style.left=`${chosen.left-host.left}px`;
    card.style.top=`${chosen.top-host.top}px`;
  }
  function closeCard(){
    active=null;
    card.hidden=true;
    card.style.left='';
    card.style.top='';
    markers.querySelectorAll('.tm-marker').forEach(m=>m.setAttribute('aria-pressed','false'));
    routes.querySelectorAll('.tm-route').forEach(p=>p.classList.remove('active'));
  }
  document.getElementById('tm-card-close').addEventListener('click',closeCard);
  card.querySelectorAll('a').forEach(link=>link.addEventListener('click',event=>event.stopPropagation()));
  root.addEventListener('click',e=>{if(!e.target.closest('.tm-card,.tm-marker'))closeCard();});
  function showMonth(month,updateHash=true){
    const jan=month==='jan';
    if(jan && window.NotebookMap && typeof window.NotebookMap.showMap==='function') window.NotebookMap.showMap();
    root.hidden=!jan;if(dec)dec.hidden=jan;
    switcher.querySelectorAll('button').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.month===month)));
    if(!jan)closeCard();
    if(updateHash){
      if(jan) history.replaceState({view:'map'},'','#jan');
      else if(location.hash==='#jan'||location.hash==='#dec') history.replaceState({view:'map'},'',location.pathname+location.search);
    }
    window.scrollTo({top:0,behavior:'instant'});
  }
  function syncMonth(){if(location.hash==='#jan')showMonth('jan',false);else showMonth('dec',false);}
  switcher.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>showMonth(b.dataset.month)));
  // Month switching uses replaceState so it does not add a history entry or disturb December detail pushState.
  // #jan opens January. Every other hash, including December place hashes, shows the existing December site.
  syncMonth();
  window.addEventListener('hashchange',syncMonth);
  window.addEventListener('popstate',syncMonth);
  window.addEventListener('resize',()=>{if(active)placeCard(active);});
  // For future updates: window.TsugaikeMap.updateHotels([...])
  // For now edit the `hotels` array and reload after verified coordinates / walking times.
})();
