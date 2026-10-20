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
  const areaLabels = { omotesando:'表参道', marunouchi:'東京', shibuya:'渋谷', shinjuku:'新宿', ginza:'銀座', ueno:'上野', kinshicho:'錦糸町', ebisu:'恵比寿', other:'東京' };
  const areaCenters = { omotesando:[325,390], marunouchi:[589,416], shibuya:[170,387], shinjuku:[185,167], ginza:[475,482], ueno:[721,153], kinshicho:[806,338], ebisu:[285,459], other:[450,435] };
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
  // Once a category holds many places, collapse them into region counts until an area is selected.
  const clusterMode = () => visibleCategoryPlaces().length > 15 && !currentArea;

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
    g.append(el('circle', { class:'fd-ring', cx:0, cy:0, r:8.5 }));
    g.append(el('circle', { class:'fd-dot', cx:0, cy:0, r:3.5 }));
    markerLayer.append(g);
    const box = g.getBBox();
    g.insertBefore(el('rect', { class:'fd-hit', x:box.x - 4, y:box.y - 4, width:box.width + 8, height:box.height + 8 }), g.firstChild);
    nodes.set(shop.id, g);
    g.addEventListener('pointerenter', () => {
      if (!finePointer.matches || pinned) return;
      openCard(shop.id, false);
    });
    g.addEventListener('pointerleave', () => { if (finePointer.matches) scheduleClose(); });
    g.addEventListener('click', event => {
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
    card.append(name);
    const category = document.createElement('p');
    category.className = 'fd-card-category';
    category.textContent = `${categoryLabels[shop.category] || ''} · ${areaLabels[shop.area] || '東京'}`;
    card.append(category);
    const photo = document.createElement('div');
    photo.className = 'fd-card-photo';
    if (shop.image) {
      const img = document.createElement('img');
      img.src = shop.image;
      img.alt = `${shop.name} 的餐點照片`;
      img.loading = 'lazy';
      photo.append(img);
    }
    card.append(photo);
    const station = document.createElement('p');
    station.className = 'fd-card-line';
    station.textContent = shop.station || areaLabels[shop.area] || '東京';
    card.append(station);
    for (const hours of shop.hours || []) {
      const line = document.createElement('p');
      line.className = 'fd-card-line';
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
    const pin = marker.querySelector('.fd-dot').getBoundingClientRect();
    const host = wrap.getBoundingClientRect();
    const w = card.offsetWidth;
    const h = card.offsetHeight;
    let x = pin.right - host.left + 12;
    let y = pin.top - host.top - 12;
    if (x + w > host.width - 8) x = pin.left - host.left - w - 12;
    if (x < 8) x = 8;
    if (y + h > host.height - 8) y = Math.max(8, host.height - h - 8);
    card.style.left = `${x}px`;
    card.style.top = `${y}px`;
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
      row.append(button,area,link);
      list.append(row);
    }
  }
  function updateView() {
    closeCard();
    const visible = new Set(visiblePlaces().map(p => p.id));
    for (const [id,node] of nodes) {
      node.toggleAttribute('hidden', clusterMode() || !visible.has(id));
      node.classList.toggle('is-quiet', visiblePlaces().length > 7);
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
