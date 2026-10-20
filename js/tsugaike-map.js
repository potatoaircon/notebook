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
      id:'marion-shinano', label:'HOTEL 02', x:590, y:555,
      name:'リゾートインマリオンシナノ', en:'Resort Inn Marion Shinano',
      walk:'徒歩約4分（250m）',
      price:'¥29,225',
      booked:true,
      photo:'./assets/hotels/marion-shinano.jpg',
      destination:'リゾートインマリオンシナノ',
      booking:'https://www.booking.com/hotel/jp/resort-inn-marion-shinano.ja.html?lang=ja&checkin=2027-01-23&checkout=2027-01-24&group_adults=2&no_rooms=1&group_children=0'
    }
  ];
  const walkUrl = (destination) => `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(gondola)}&destination=${encodeURIComponent(destination)}&travelmode=walking`;
  const ns='http://www.w3.org/2000/svg';
  const root=document.getElementById('tm-january');
  const switcher=document.getElementById('tm-switch');
  if(!root||!switcher)return;
  const dec=document.getElementById('tm-december');
  const octRoot=document.getElementById('tm-october');
  const foodRoot=document.getElementById('tm-food');
  const foodLink=switcher.querySelector('.tm-food-link');
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
    const price=document.getElementById('tm-card-price');
    price.replaceChildren();
    if(h.booked){
      const status=document.createElement('span');
      status.className='tm-card-status';
      status.textContent='予約済み';
      price.append(status);
    }
    price.append(h.price);
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
    card.classList.remove('has-photo');
    card.style.left='';
    card.style.top='';
    markers.querySelectorAll('.tm-marker').forEach(m=>m.setAttribute('aria-pressed','false'));
    routes.querySelectorAll('.tm-route').forEach(p=>p.classList.remove('active'));
  }
  document.getElementById('tm-card-close').addEventListener('click',closeCard);
  card.querySelectorAll('a').forEach(link=>link.addEventListener('click',event=>event.stopPropagation()));
  const routeToggle=document.getElementById('tm-route-toggle');
  const routeDrop=document.getElementById('tm-route-drop');
  const setRoute=open=>{routeDrop.hidden=!open;routeToggle.setAttribute('aria-expanded',String(open));};
  routeToggle.addEventListener('click',event=>{event.stopPropagation();setRoute(routeDrop.hidden);});
  routeDrop.addEventListener('click',event=>event.stopPropagation());
  root.addEventListener('click',e=>{
    if(!e.target.closest('.tm-card,.tm-marker'))closeCard();
    if(!e.target.closest('.tm-place'))setRoute(false);
    if(!e.target.closest('.jn-spot'))closeNote();
  });
  function setFood(open){
    if(foodRoot)foodRoot.hidden=!open;
    if(foodLink){if(open)foodLink.setAttribute('aria-current','page');else foodLink.removeAttribute('aria-current');}
  }
  function showFood(updateHash=true){
    root.hidden=true;
    if(dec)dec.hidden=true;
    if(octRoot)octRoot.hidden=true;
    setFood(true);
    switcher.querySelectorAll('button').forEach(b=>b.setAttribute('aria-selected','false'));
    closeCard();
    if(updateHash && location.hash!=='#tokyo-food') history.replaceState({view:'map'},'','#tokyo-food');
    window.scrollTo({top:0,behavior:'instant'});
  }
  function showMonth(month,updateHash=true){
    const jan=month==='jan';
    if(jan && window.NotebookMap && typeof window.NotebookMap.showMap==='function') window.NotebookMap.showMap();
    root.hidden=month!=='jan';
    if(dec)dec.hidden=month!=='dec';
    if(octRoot)octRoot.hidden=month!=='oct';
    setFood(false);
    switcher.querySelectorAll('button').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.month===month)));
    if(!jan)closeCard();
    if(updateHash){
      if(jan){history.replaceState({view:'map'},'','#jan');showTrip('0110');}
      else if(month==='oct') history.replaceState({view:'map'},'','#oct');
      else if(location.hash==='#jan'||location.hash==='#jan-0109'||location.hash==='#jan-0110'||location.hash==='#jan-0123'||location.hash==='#dec'||location.hash==='#oct'||location.hash==='#tokyo-food') history.replaceState({view:'map'},'',location.pathname+location.search);
    }
    window.scrollTo({top:0,behavior:'instant'});
  }
  function showTrip(trip){
    document.querySelectorAll('.jn-trip').forEach(el=>{el.hidden=el.dataset.trip!==trip;});
    document.querySelectorAll('.jn-dates button').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.trip===trip)));
    closeNote();
    if(trip!=='0123'){closeCard();setRoute(false);}
  }
  function syncMonth(){
    const hash=location.hash;
    if(hash==='#jan'||hash==='#jan-0109'||hash==='#jan-0110'||hash==='#jan-0123'){showMonth('jan',false);showTrip(hash==='#jan-0123'?'0123':'0110');}
    else if(hash==='#oct') showMonth('oct',false);
    else if(hash==='#tokyo-food') showFood(false);
    else showMonth('dec',false);
  }
  switcher.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>showMonth(b.dataset.month)));
  document.querySelectorAll('.jn-dates button').forEach(btn=>btn.addEventListener('click',()=>{
    const trip=btn.dataset.trip;
    const hash=trip==='0123'?'#jan-0123':'#jan-0110';
    if(location.hash!==hash) history.replaceState({view:'map'},'',hash);
    showTrip(trip);
  }));
  const shiga=document.getElementById('tm-trip-0109');
  if(shiga){
    shiga.addEventListener('click',e=>{
      const day=e.target.closest('.jn-day');
      if(day){
        if(!day.hasAttribute('aria-expanded')) return;
        const panel=day.nextElementSibling;
        if(!panel || !panel.classList.contains('jn-detail')) return;
        const open=day.getAttribute('aria-expanded')==='true';
        shiga.querySelectorAll('.jn-day[aria-expanded]').forEach(b=>{b.setAttribute('aria-expanded','false'); const next=b.nextElementSibling; if(next && next.classList.contains('jn-detail')) next.hidden=true;});
        if(!open){day.setAttribute('aria-expanded','true');panel.hidden=false;}
        return;
      }
      const stay=e.target.closest('.jn-stay');
      if(stay && !stay.classList.contains('is-plain')){
        const panel=stay.parentElement.querySelector('.jn-detail');
        if(!panel) return;
        const open=stay.getAttribute('aria-expanded')==='true';
        stay.setAttribute('aria-expanded',String(!open));
        panel.hidden=open;
      }
    });
  }
  const legs={shiga:'narita-shiga',madarao:'shiga-madarao',tokyo:'madarao-tokyo'};
  const mapWrap=document.querySelector('.jn-map-wrap');
  const note=document.getElementById('jn-note');
  let openSpot=null;
  function clearRoutes(){if(mapWrap)mapWrap.querySelectorAll('.jn-route').forEach(path=>path.classList.remove('active'));}
  function closeNote(){openSpot=null;if(note)note.hidden=true;clearRoutes();if(mapWrap)mapWrap.querySelectorAll('.jn-spot').forEach(el=>el.classList.remove('is-on'));}
  function openNote(spot,el){
    if(!mapWrap)return;
    if(openSpot===spot){closeNote();return;}
    openSpot=spot;
    mapWrap.querySelectorAll('.jn-spot').forEach(node=>node.classList.toggle('is-on',node===el));
    clearRoutes();
    if(note)note.hidden=true;
    const leg=legs[spot];
    if(leg)mapWrap.querySelector(`.jn-route[data-leg="${leg}"]`)?.classList.add('active');
  }
  if(mapWrap){
    mapWrap.addEventListener('click',e=>{
      const spot=e.target.closest('.jn-spot');
      if(spot)openNote(spot.dataset.spot,spot);
      else closeNote();
    });
    mapWrap.addEventListener('keydown',e=>{
      if(e.key!=='Enter'&&e.key!==' ')return;
      const spot=e.target.closest('.jn-spot');
      if(!spot)return;
      e.preventDefault();
      openNote(spot.dataset.spot,spot);
    });
  }
  // Month switching uses replaceState so it does not add a history entry or disturb December detail pushState.
  // #jan, #jan-0109 and #jan-0110 open 01.01–01.10. #jan-0123 opens the Tsugaike map. #oct opens October. #tokyo-food opens the TOKYO collection. Every other hash shows December.
  function formatDateRange(start, end){
    const part=value=>{const [y,m,d]=value.split('-'); return {y,m,d};};
    const a=part(start), b=part(end);
    const ymd=v=>`${v.y}.${v.m}.${v.d}`;
    const md=v=>`${v.m}.${v.d}`;
    return a.y===b.y ? `${ymd(a)} — ${md(b)}` : `${ymd(a)} — ${ymd(b)}`;
  }
  document.querySelectorAll('[data-range]').forEach(el=>{
    const [start,end]=el.dataset.range.split(',');
    el.textContent=formatDateRange(start.trim(), end.trim());
  });
  syncMonth();
  window.addEventListener('hashchange',syncMonth);
  window.addEventListener('popstate',syncMonth);
  window.addEventListener('resize',()=>{if(active)placeCard(active);});
  // For future updates: window.TsugaikeMap.updateHotels([...])
  // For now edit the `hotels` array and reload after verified coordinates / walking times.
})();
