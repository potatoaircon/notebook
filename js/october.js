/* October Tokyo notes. Shop facts live only in this list. */
(() => {
  'use strict';
  const root = document.getElementById('tm-october');
  if (!root) return;
  const maps = (query) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  // image stays null until a photo of that shop's own food can be used.
  const shops = [
    {
      id: 'human-made',
      name: 'HUMAN MADE TOKYO',
      nameJa: '',
      mapLines: ['HUMAN MADE', 'TOKYO'],
      type: '旗艦店',
      address: '東京都渋谷区神宮前6-25-10',
      showAddress: true,
      hours: ['平日 11:00 — 19:00', '土日祝 11:00 — 20:00'],
      nearestStation: '明治神宮前〈原宿〉駅',
      mapsUrl: maps('HUMAN MADE TOKYO 東京都渋谷区神宮前6-25-10'),
      image: null,
      x: 248, y: 286, lx: 234, ly: 274, anchor: 'end'
    },
    {
      id: 'butter',
      name: 'BUTTER',
      nameJa: '美瑛放牧酪農場',
      listName: 'BUTTER 美瑛放牧酪農場',
      mapLines: ['BUTTER'],
      type: '鬆餅',
      address: '東京都千代田区丸の内2-4-1 丸ビル B1F',
      showAddress: false,
      hours: ['カフェ 平日・土曜 11:00 — 19:00', '日祝 11:00 — 18:00'],
      nearestStation: '二重橋前駅',
      mapsUrl: maps('BUTTER 美瑛放牧酪農場 丸ビル'),
      image: null,
      x: 610, y: 236, lx: 610, ly: 262, anchor: 'middle'
    },
    {
      id: 'crisscross',
      name: 'crisscross',
      nameJa: 'クリスクロス',
      mapLines: ['crisscross'],
      type: '鬆餅',
      address: '東京都港区南青山5-7-28',
      showAddress: false,
      hours: ['8:00 — 21:00'],
      nearestStation: '表参道駅',
      mapsUrl: maps('crisscross 東京都港区南青山5-7-28'),
      image: null,
      x: 412, y: 338, lx: 426, ly: 334, anchor: 'start'
    }
  ];
  const svg = root.querySelector('.ot-map');
  const layer = document.getElementById('ot-shops');
  const card = document.getElementById('ot-card');
  const list = document.getElementById('ot-place-list');
  const wrap = root.querySelector('.ot-map-wrap');
  const base = root.querySelector('.ot-base');
  const ns = 'http://www.w3.org/2000/svg';
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  const phone = window.matchMedia('(max-width: 767px)');
  let pinned = null;
  let timer = 0;
  const node = (name, attrs) => {
    const el = document.createElementNS(ns, name);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    return el;
  };
  shops.forEach((shop) => {
    const group = node('g', { class: 'ot-shop', 'data-shop': shop.id, role: 'button', tabindex: '0', 'aria-label': shop.name });
    group.append(node('circle', { class: 'ot-hit', cx: shop.x, cy: shop.y, r: 24 }));
    group.append(node('circle', { class: 'ot-ring', cx: shop.x, cy: shop.y, r: 7 }));
    group.append(node('circle', { class: 'ot-dot', cx: shop.x, cy: shop.y, r: 3.2 }));
    shop.mapLines.forEach((line, index) => {
      const text = node('text', { class: 'ot-name', x: shop.lx, y: shop.ly + index * 15, 'text-anchor': shop.anchor });
      text.textContent = line;
      group.append(text);
    });
    if (shop.nameJa) {
      const text = node('text', { class: 'ot-sub', x: shop.lx, y: shop.ly + shop.mapLines.length * 15, 'text-anchor': shop.anchor });
      text.textContent = shop.nameJa;
      group.append(text);
    }
    layer.append(group);
    const row = document.createElement('div');
    row.className = 'ot-place';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'ot-place-hit';
    button.dataset.shop = shop.id;
    const name = document.createElement('span');
    name.className = 'ot-place-name';
    name.textContent = shop.listName || shop.name;
    const type = document.createElement('span');
    type.className = 'ot-place-type';
    type.textContent = shop.type;
    button.append(name, type);
    const link = document.createElement('a');
    link.className = 'maps';
    link.href = shop.mapsUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Google Maps ↗';
    row.append(button, link);
    list.append(row);
  });
  function renderCard(shop) {
    card.replaceChildren();
    const title = document.createElement('p');
    title.className = 'ot-card-name';
    title.textContent = shop.name;
    card.append(title);
    if (shop.nameJa) {
      const ja = document.createElement('p');
      ja.className = 'ot-card-ja';
      ja.textContent = shop.nameJa;
      card.append(ja);
    }
    if (shop.image) {
      const img = document.createElement('img');
      img.className = 'ot-card-photo';
      img.src = shop.image;
      img.alt = `${shop.name}の鬆餅`;
      card.append(img);
    }
    if (shop.showAddress) {
      const line = document.createElement('p');
      line.className = 'ot-card-line';
      line.textContent = shop.address;
      card.append(line);
    }
    shop.hours.forEach((hours, index) => {
      const line = document.createElement('p');
      line.className = 'ot-card-line';
      line.textContent = index === 0 ? `営業時間　${hours}` : hours;
      card.append(line);
    });
    const station = document.createElement('p');
    station.className = 'ot-card-line';
    station.textContent = `最寄駅　${shop.nearestStation}`;
    card.append(station);
    const link = document.createElement('a');
    link.className = 'maps';
    link.href = shop.mapsUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Google Maps ↗';
    card.append(link);
  }
  function placeCard(id) {
    const marker = layer.querySelector(`[data-shop="${id}"] circle.ot-dot`);
    if (phone.matches) {
      card.classList.add('is-docked');
      card.style.left = '';
      card.style.top = '';
      return;
    }
    card.classList.remove('is-docked');
    const host = wrap.getBoundingClientRect();
    const pin = marker.getBoundingClientRect();
    const width = card.offsetWidth;
    const height = card.offsetHeight;
    let left = pin.right - host.left + 10;
    let top = pin.top - host.top - 8;
    if (left + width > host.width - 8) left = pin.left - host.left - width - 10;
    if (left < 8) left = 8;
    if (top + height > host.height - 8) top = Math.max(8, host.height - height - 8);
    if (top < 8) top = 8;
    card.style.left = `${left}px`;
    card.style.top = `${top}px`;
  }
  function mark(id) {
    layer.querySelectorAll('.ot-shop').forEach((item) => item.classList.toggle('is-on', item.dataset.shop === id));
    list.querySelectorAll('.ot-place-hit').forEach((item) => item.classList.toggle('is-on', item.dataset.shop === id));
  }
  function openShop(id, pin) {
    const shop = shops.find((item) => item.id === id);
    if (!shop) return;
    clearTimeout(timer);
    if (pin) pinned = id;
    base.classList.remove('is-on');
    mark(id);
    renderCard(shop);
    card.hidden = false;
    placeCard(id);
  }
  function closeShop() {
    clearTimeout(timer);
    pinned = null;
    card.hidden = true;
    mark('');
  }
  function scheduleClose() {
    if (pinned) return;
    clearTimeout(timer);
    timer = setTimeout(() => { if (!pinned) closeShop(); }, 240);
  }
  layer.addEventListener('pointerover', (event) => {
    const shop = event.target.closest('.ot-shop');
    if (!shop || !fine.matches || pinned) return;
    openShop(shop.dataset.shop, false);
  });
  layer.addEventListener('pointerout', (event) => {
    const shop = event.target.closest('.ot-shop');
    if (!shop || !fine.matches || pinned) return;
    if (shop.contains(event.relatedTarget)) return;
    scheduleClose();
  });
  card.addEventListener('pointerenter', () => { if (fine.matches) clearTimeout(timer); });
  card.addEventListener('pointerleave', () => { if (fine.matches) scheduleClose(); });
  layer.addEventListener('click', (event) => {
    const shop = event.target.closest('.ot-shop');
    if (!shop) return;
    event.stopPropagation();
    if (pinned === shop.dataset.shop) closeShop();
    else openShop(shop.dataset.shop, true);
  });
  layer.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const shop = event.target.closest('.ot-shop');
    if (!shop) return;
    event.preventDefault();
    if (pinned === shop.dataset.shop) closeShop();
    else openShop(shop.dataset.shop, true);
  });
  card.addEventListener('click', (event) => event.stopPropagation());
  base.addEventListener('click', (event) => {
    event.stopPropagation();
    const on = base.classList.toggle('is-on');
    if (on) closeShop();
  });
  base.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    base.click();
  });
  root.addEventListener('click', (event) => {
    if (event.target.closest('.ot-shop,.ot-card,.ot-base,.ot-place-hit')) return;
    closeShop();
    base.classList.remove('is-on');
  });
  list.addEventListener('click', (event) => {
    const button = event.target.closest('.ot-place-hit');
    if (!button) return;
    openShop(button.dataset.shop, true);
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    svg.scrollIntoView({ block: 'center', behavior: motion ? 'auto' : 'smooth' });
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeShop();
  });
  window.addEventListener('resize', () => {
    if (card.hidden) return;
    const id = layer.querySelector('.ot-shop.is-on')?.dataset.shop;
    if (id) placeCard(id);
  });
  document.getElementById('tm-switch').addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (button && button.dataset.month !== 'oct') { closeShop(); base.classList.remove('is-on'); }
  });
})();
