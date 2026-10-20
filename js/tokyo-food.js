/* Independent TOKYO collection; does not alter trip itineraries. */
(() => {
  'use strict';
  const root = document.getElementById('tm-food');
  const places = window.TOKYO_FOOD_PLACES;
  if (!root || !Array.isArray(places)) return;

  const svg = document.getElementById('fd-map');
  const markerLayer = document.getElementById('fd-markers');
  const areaLayer = document.getElementById('fd-area-layer');
  const wrap = document.getElementById('fd-map-wrap');
  const card = document.getElementById('fd-card');
  const list = document.getElementById('fd-list');
  const filters = document.getElementById('fd-filters');
  const count = document.getElementById('fd-count');
  const areaReset = document.getElementById('fd-area-reset');
  const ns = 'http://www.w3.org/2000/svg';
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const compact = window.matchMedia('(max-width: 767px)');
  const mapSearch = (shop) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${shop.name} ${shop.address}`)}`;
  const categoryLabels = { pancakes: 'PANCAKES', yakiniku: 'YAKINIKU', gyutan: 'GYUTAN', izakaya: 'IZAKAYA', cakes: 'CAKES' };
  const areaLabels = { omotesando:'表参道', marunouchi:'東京', shibuya:'渋谷', shinjuku:'新宿', ginza:'銀座', ueno:'上野', kinshicho:'錦糸町', ebisu:'恵比寿', asakusa:'浅草', roppongi:'六本木', nogizaka:'乃木坂', ikejiri:'池尻大橋', yoyogi:'代々木公園', higashinihonbashi:'東日本橋', okachimachi:'御徒町', daikanyama:'代官山', nakano:'中野', machida:'町田', nakameguro:'中目黒', kitasando:'北参道', kokubunji:'国分寺', other:'東京' };
  const areaCenters = { omotesando:[325,390], marunouchi:[589,416], shibuya:[170,387], shinjuku:[185,167], ginza:[475,482], ueno:[721,153], kinshicho:[806,338], ebisu:[180,530], asakusa:[748,198], roppongi:[300,512], nogizaka:[262,322], ikejiri:[36,508], yoyogi:[100,248], higashinihonbashi:[690,250], okachimachi:[650,200], daikanyama:[236,460], nakano:[36,118], machida:[36,430], nakameguro:[15,470], kitasando:[348,246], kokubunji:[52,42], other:[450,435] };
  const nodes = new Map();
  let currentCategory = 'all';
  let currentArea = null;
  let openedId = null;
  let pinned = false;
  let timeout;

  const el = (name, attrs = {}) => {
    const result = document.createElementNS(ns, name);
    Object.entries(attrs).forEach(([key, value]) => result.setAttribute(key, String(value)));
    return result;
  };
  const addText = (parent, text, attrs = {}) => {
    const item = el('text', attrs);
    item.textContent = text;
    parent.append(item);
    return item;
  };
  const visibleCategoryPlaces = () => places.filter(p => currentCategory === 'all' || p.category === currentCategory);
  const visiblePlaces = () => visibleCategoryPlaces().filter(p => !currentArea || p.area === currentArea);
  const pointFor = (shop) => ({ x:Number(shop.x) || 450, y:Number(shop.y) || 280 });
  const safeNumber = (value) => Math.max(0, Math.min(999, value));
  const clusterMode = () => false;

  function createMarker(shop) {
    const { x, y } = pointFor(shop);
    const g = el('g', { class:'fd-marker', role:'button', tabindex:'0', 'data-id':shop.id,
      'aria-label': `${shop.name} · ${areaLabels[shop.area] || '東京'}`,
      transform: `translate(${x} ${y})` });
    const labelX = 20;
    const lines = Array.isArray(shop.lines) && shop.lines.length ? shop.lines : [shop.name];
    const shown = lines.slice(0, 2).map((line, index) => index === 0 && line.length > 21 ? line.slice(0, 20) + '…' : line);
    if (shown.length === 1) {
      addText(g, shown[0], { class:'fd-marker-name', x:labelX, y:0, 'text-anchor':'start', 'dominant-baseline':'central' });
    } else {
      addText(g, shown[0], { class:'fd-marker-name', x:labelX, y:-6.5, 'text-anchor':'start', 'dominant-baseline':'central' });
      addText(g, shown[1], { class:'fd-marker-sub', x:labelX, y:8, 'text-anchor':'start', 'dominant-baseline':'central' });
    }
    if (shop.badge) g.append(angryMark());
    else {
      g.append(el('circle', { class:'fd-ring fd-pin', cx:0, cy:0, r:8.5 }));
      g.append(el('circle', { class:'fd-dot fd-pin', cx:0, cy:0, r:3.5 }));
    }
    markerLayer.append(g);
    g.addEventListener('mousedown', event => { if (event.button === 0) event.preventDefault(); });
    const box = g.getBBox();
    g.insertBefore(el('rect', { class:'fd-hit', x:box.x - 4, y:box.y - 4, width:box.width + 8, height:box.height + 8 }), g.firstChild);
    nodes.set(shop.id, g);
    g.addEventListener('click', event => {
      const label = event.target.closest('.fd-marker-name, .fd-marker-sub');
      const pin = event.target.closest('.fd-pin');
      if (!label && !pin) {
        if (finePointer.matches) return;
        event.stopPropagation();
        markerLayer.querySelectorAll('.fd-marker').forEach(item => { if (item !== g) item.classList.remove('is-revealed'); });
        g.classList.toggle('is-revealed');
        return;
      }
      event.stopPropagation();
      if (openedId === shop.id && pinned) closeCard();
      else openCard(shop.id, true);
    });
    g.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      if (openedId === shop.id && pinned) closeCard();
      else openCard(shop.id, true);
    });
  }

  function angryMark() {
    const face = el('g', { class:'fd-pin fd-angry' });
    face.append(el('circle', { class:'fd-angry-face', cx:0, cy:0, r:8.5 }));
    face.append(el('path', { class:'fd-angry-line', d:'M-5.1 -3.2 L-1.5 -1.3' }));
    face.append(el('path', { class:'fd-angry-line', d:'M5.1 -3.2 L1.5 -1.3' }));
    face.append(el('circle', { class:'fd-angry-eye', cx:-3.15, cy:-0.15, r:0.7 }));
    face.append(el('circle', { class:'fd-angry-eye', cx:3.15, cy:-0.15, r:0.7 }));
    face.append(el('path', { class:'fd-angry-line', d:'M-3.7 3.5 Q0 1.15 3.7 3.5' }));
    return face;
  }

  function createClusters() {
    areaLayer.replaceChildren();
    if (!clusterMode()) return;
    const groups = new Map();
    visibleCategoryPlaces().forEach(shop => groups.set(shop.area, (groups.get(shop.area) || 0) + 1));
    groups.forEach((total, area) => {
      const [x,y] = areaCenters[area] || areaCenters.other;
      const g = el('g', { class:'fd-area', role:'button', tabindex:'0', 'data-area':area,
        'aria-label': `${areaLabels[area] || area} ${total} 間店` });
      g.append(el('circle',{ class:'fd-area-hit', cx:x, cy:y, r:28 }));
      g.append(el('circle',{ class:'fd-area-ring', cx:x, cy:y, r:15 }));
      addText(g, String(safeNumber(total)).padStart(2,'0'), { x, y:y+4, 'text-anchor':'middle', class:'fd-area-label' });
      g.addEventListener('click', () => { currentArea = area; updateView(); });
      g.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        currentArea = area;
        updateView();
      });
      areaLayer.append(g);
    });
  }

  function photoAddress(shop) {
    const value = shop && shop.image;
    return typeof value === 'string' && value.trim() ? value.trim() : '';
  }
  function photoIcon() {
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('class', 'fd-photo-icon');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML = '<rect x="3" y="4" width="18" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="8.5" cy="9" r="1.3" fill="currentColor"/><path d="M4 17.5l4.2-3.6 3.2 2.6 2.4-2 6.2 4.6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>';
    return icon;
  }
  function showPhotoPlaceholder(frame) {
    frame.classList.add('is-empty');
    frame.replaceChildren(photoIcon());
  }
  function fillPhoto(frame, shop) {
    frame.className = 'fd-card-photo';
    const src = photoAddress(shop);
    if (!src) {
      showPhotoPlaceholder(frame);
      return;
    }
    const img = document.createElement('img');
    img.alt = `${shop.name} 的餐點照片`;
    img.decoding = 'async';
    if (shop.imagePosition) img.style.objectPosition = shop.imagePosition;
    img.addEventListener('error', () => showPhotoPlaceholder(frame));
    img.src = src;
    frame.append(img);
  }
  function drawCard(shop) {
    if (!shop) return;
    card.replaceChildren();
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'fd-card-close';
    close.textContent = '×';
    close.setAttribute('aria-label','關閉店家資訊');
    close.addEventListener('click', closeCard);
    card.append(close);
    const name = document.createElement('h3');
    name.textContent = shop.name;
    if (shop.badge) {
      const mood = document.createElement('img');
      mood.className = 'fd-card-mood';
      mood.src = shop.badge;
      mood.alt = '很難吃';
      name.append(mood);
    }
    card.append(name);
    const category = document.createElement('p');
    category.className = 'fd-card-category';
    category.textContent = `${categoryLabels[shop.category] || ''} · ${areaLabels[shop.area] || '東京'}`;
    card.append(category);
    const photo = document.createElement('div');
    fillPhoto(photo, shop);
    card.append(photo);
    const station = document.createElement('p');
    station.className = 'fd-card-station';
    station.textContent = shop.station || areaLabels[shop.area] || '東京';
    card.append(station);
    for (const hours of shop.hours || []) {
      const line = document.createElement('p');
      line.className = 'fd-card-hours';
      line.textContent = hours;
      card.append(line);
    }
    const link = document.createElement('a');
    link.className = 'maps';
    link.href = shop.mapsUrl || mapSearch(shop);
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Google Maps ↗';
    card.append(link);
  }
  function positionCard(id) {
    const marker = nodes.get(id);
    if (!marker) return;
    if (compact.matches) {
      card.classList.add('is-docked');
      card.style.left = '';
      card.style.top = '';
      return;
    }
    card.classList.remove('is-docked');
    const pin = marker.querySelector('.fd-pin').getBoundingClientRect();
    const label = marker.getBoundingClientRect();
    const host = wrap.getBoundingClientRect();
    const margin = 8;
    const gap = 12;
    const w = card.offsetWidth;
    const h = card.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const coversPin = (x, y) => x < pin.right + 8 && x + w > pin.left - 8 && y < pin.bottom + 8 && y + h > pin.top - 8;
    const clamp = (x, y) => ({
      x: Math.max(margin, Math.min(x, vw - w - margin)),
      y: Math.max(margin, Math.min(y, vh - h - margin))
    });
    const midY = pin.top + pin.height / 2 - h / 2;
    const right = { x: label.right + gap, y: midY };
    const left = { x: label.left - gap - w, y: midY };
    const below = { x: pin.left - 8, y: label.bottom + gap };
    const above = { x: pin.left - 8, y: label.top - gap - h };
    const preferRight = pin.left + pin.width / 2 < vw / 2;
    const spots = (preferRight ? [right, left, below, above] : [left, right, below, above]).map(spot => clamp(spot.x, spot.y));
    const chosen = spots.find(spot => !coversPin(spot.x, spot.y)) || spots[0];
    card.style.left = `${chosen.x - host.left}px`;
    card.style.top = `${chosen.y - host.top}px`;
  }
  function openCard(id, sticky = false) {
    const shop = places.find(p => p.id === id);
    if (!shop || !visiblePlaces().some(p => p.id === id) || clusterMode()) return;
    clearTimeout(timeout);
    openedId = id;
    pinned = sticky;
    markerLayer.querySelectorAll('.fd-marker').forEach(item => item.classList.toggle('is-on', item.dataset.id === id));
    drawCard(shop);
    card.hidden = false;
    positionCard(id);
    renderList();
  }
  function closeCard() {
    clearTimeout(timeout);
    openedId = null;
    pinned = false;
    card.hidden = true;
    markerLayer.querySelectorAll('.fd-marker').forEach(item => item.classList.remove('is-on'));
    renderList();
  }
  function scheduleClose() {
    if (pinned) return;
    clearTimeout(timeout);
    timeout = setTimeout(() => { if (!pinned) closeCard(); }, 320);
  }
  function renderList() {
    list.replaceChildren();
    const shops = visiblePlaces();
    count.textContent = `${String(shops.length).padStart(2,'0')} ${shops.length === 1 ? 'PLACE' : 'PLACES'}`;
    areaReset.hidden = !currentArea;
    if (shops.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'fd-empty';
      empty.textContent = 'NO PLACES YET';
      list.append(empty);
      return;
    }
    for (const shop of shops) {
      const row = document.createElement('div');
      row.className = 'fd-row';
      const photo = document.createElement('img');
      photo.className = 'fd-row-photo';
      photo.src = shop.image;
      photo.alt = '';
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `fd-place-button${openedId === shop.id ? ' is-on' : ''}`;
      const title = document.createElement('strong');
      title.textContent = shop.name;
      const sub = document.createElement('span');
      sub.textContent = categoryLabels[shop.category] || '';
      button.append(title,sub);
      button.addEventListener('click',() => {
        if (clusterMode()) { currentArea = shop.area; updateView(); }
        openCard(shop.id,true);
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        wrap.scrollIntoView({ block:'center', behavior:reduce ? 'auto' : 'smooth' });
      });
      const area = document.createElement('span');
      area.className = 'fd-list-area';
      area.textContent = areaLabels[shop.area] || '東京';
      const link = document.createElement('a');
      link.className = 'maps';
      link.href = shop.mapsUrl || mapSearch(shop);
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'Google Maps ↗';
      row.append(photo,button,area,link);
      list.append(row);
    }
  }
  function updateView() {
    closeCard();
    const visible = new Set(visiblePlaces().map(p => p.id));
    for (const [id,node] of nodes) {
      node.toggleAttribute('hidden', clusterMode() || !visible.has(id));
      node.classList.add('is-quiet');
    }
    createClusters();
    filters.querySelectorAll('.fd-filter').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.category === currentCategory)));
    renderList();
  }

  places.forEach(createMarker);
  filters.addEventListener('click', event => {
    const button = event.target.closest('button[data-category]');
    if (!button) return;
    currentCategory = button.dataset.category;
    currentArea = null;
    updateView();
  });
  areaReset.addEventListener('click', () => { currentArea = null; updateView(); });
  card.addEventListener('pointerenter', () => clearTimeout(timeout));
  card.addEventListener('pointerleave', () => { if (finePointer.matches) scheduleClose(); });
  card.addEventListener('click',event => event.stopPropagation());
  root.addEventListener('click', event => {
    if (event.target.closest('.fd-marker,.fd-card,.fd-area,.fd-place-button,.fd-filter,.fd-area-reset')) return;
    if (openedId) closeCard();
  });
  window.addEventListener('resize', () => { if (openedId) positionCard(openedId); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !card.hidden) closeCard(); });
  updateView();
})();
