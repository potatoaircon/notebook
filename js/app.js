"use strict";

const places = window.TRAVEL_PLACES;
const mapScreen = document.querySelector("#mapScreen");
const detail = document.querySelector("#detail");
const content = document.querySelector("#content");
const hoverNote = document.querySelector("#hoverNote");
const mobileChoice = document.querySelector("#mobileChoice");
const mobileMedia = matchMedia("(max-width: 700px), ((hover: none) and (pointer: coarse))");
const phoneMedia = matchMedia("(max-width: 767px)");

let current = null;
let opened = false;

const mobile = () => mobileMedia.matches;
const phone = () => phoneMedia.matches;

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  }[ch]));
}

function label(value) {
  return esc(value).replace(/(\d)(?=\p{Script=Han})/gu, '$1<span class="num-gap"></span>');
}

function setRoute(id) {
  document.querySelectorAll("[data-route]").forEach((el) => {
    el.classList.toggle("active", !!id && el.dataset.route === id);
  });
  document.querySelectorAll("[data-region]").forEach((el) => {
    el.classList.toggle("active", !!id && el.dataset.region === id);
  });
}

function highlight(id) {
  current = id;
  document.querySelectorAll("[data-place]").forEach((el) => {
    const on = el.dataset.place === id;
    el.classList.toggle("selected", on);
    el.setAttribute("aria-pressed", String(on));
  });
  setRoute(id);
}

function placeNote(anchorX, anchorY) {
  const wrap = document.querySelector(".map-wrap").getBoundingClientRect();
  const half = hoverNote.offsetWidth / 2;
  const left = Math.max(half + 8, Math.min(wrap.width - half - 8, anchorX - wrap.left));
  const aboveTop = anchorY - hoverNote.offsetHeight - 28;
  hoverNote.classList.toggle("below", aboveTop < 8);
  hoverNote.style.left = `${left}px`;
  hoverNote.style.top = hoverNote.classList.contains("below")
    ? `${anchorY - wrap.top + 22}px`
    : `${anchorY - wrap.top - 25}px`;
}

function preview(id) {
  const place = places[id];
  if (!place || mobile()) return;
  setRoute(id);
  document.querySelectorAll(".pin").forEach((el) => {
    el.classList.toggle("preview", el.dataset.place === id);
  });
  const circle = document.querySelector(`[data-place="${id}"] .outer`);
  const box = circle.getBoundingClientRect();
  hoverNote.innerHTML = `<b>${esc(place.jp)}</b><div class="time">${esc(place.time)}</div><small>${esc(place.line)}</small>`;
  placeNote(box.left + box.width / 2, box.top + box.height / 2);
  hoverNote.classList.add("show");
  hoverNote.setAttribute("aria-hidden", "false");
}

function hidePreview() {
  setRoute(current);
  hoverNote.classList.remove("show", "below");
  hoverNote.setAttribute("aria-hidden", "true");
  document.querySelectorAll(".pin").forEach((el) => el.classList.remove("preview"));
}

function showMobileChoice(id) {
  document.querySelector("#choiceName").textContent = places[id].jp;
  const time = document.querySelector("#choiceTime");
  time.replaceChildren(places[id].line, document.createElement("br"), places[id].time);
  document.querySelector("#choiceRide").textContent = places[id].time;
  document.querySelector("#choiceMode").textContent = places[id].line;
  const opening = !mobileChoice.classList.contains("show");
  clearTimeout(cardTimer);
  mobileChoice.classList.remove("is-closing");
  mobileChoice.classList.add("show");
  if (phone()) positionMobileCard(id);
  if (opening) mobileChoice.classList.add("is-in");
}

let cardTimer = 0;

function pinVisualBox(id) {
  const outer = document.querySelector(`[data-place="${id}"] .outer`).getBoundingClientRect();
  const label = document.querySelector(`[data-place="${id}"] .place-label`).getBoundingClientRect();
  const left = Math.min(outer.left, label.left);
  const top = Math.min(outer.top, label.top);
  const right = Math.max(outer.right, label.right);
  const bottom = Math.max(outer.bottom, label.bottom);
  return { left, top, right, bottom, width: right - left, height: bottom - top };
}

function positionMobileCard(id) {
  const boxes = ["madarao", "hakuba", "echigo"].map((place) => ({ place, ...pinVisualBox(place) }));
  const pin = boxes.find((box) => box.place === id);
  const others = boxes.filter((box) => box.place !== id);
  const host = mapScreen.getBoundingClientRect();
  const gap = 14;
  const margin = 16;
  const width = mobileChoice.offsetWidth;
  const height = mobileChoice.offsetHeight;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const hits = (box, left, top, w, h) =>
    left < box.right - 1 && left + w > box.left + 1 && top < box.bottom - 1 && top + h > box.top + 1;
  const spots = [
    [pin.left + pin.width / 2 - width / 2, pin.top - gap - height],
    [pin.right - width, pin.top - gap - height],
    [pin.left, pin.top - gap - height],
    [pin.right + gap, pin.top - height * 0.4],
    [pin.left - width - gap, pin.top - height * 0.4],
    [pin.left + pin.width / 2 - width / 2, pin.bottom + gap],
    [pin.left, pin.bottom + gap],
    [pin.right - width, pin.bottom + gap],
  ];
  const lowest = Math.max(...boxes.map((box) => box.bottom));
  spots.push([pin.left + pin.width / 2 - width / 2, lowest + gap], [margin, lowest + gap]);
  const ranked = spots.map(([x, y]) => {
    const left = Math.max(margin, Math.min(x, vw - margin - width));
    const top = Math.max(margin, Math.min(y, vh - margin - height));
    const arrow = { left: left + width - 52, top: top + 8 };
    const coversSelected = hits(pin, left, top, width, height);
    const coversOther = others.filter((box) => hits(box, left, top, width, height)).length;
    const arrowOnPin = boxes.some((box) => hits(box, arrow.left, arrow.top, 44, 44));
    const gapAbove = pin.top - (top + height);
    const cramped = gapAbove >= 0 && gapAbove < 12;
    const above = gapAbove >= 12;
    const dist = Math.hypot(left + width / 2 - (pin.left + pin.width / 2), top + height / 2 - (pin.top + pin.height / 2));
    let preference = above ? -120 : 0;
    if (id === "hakuba" && left + width / 2 >= pin.left) preference -= 30;
    if (id === "echigo" && left + width / 2 <= pin.right) preference -= 30;
    if (id === "madarao" && above && left >= pin.left - 8) preference -= 50;
    return { left, top, score: (coversSelected ? 8000 : 0) + (arrowOnPin ? 4000 : 0) + coversOther * 700 + (cramped ? 250 : 0) + dist + preference };
  }).sort((a, b) => a.score - b.score);
  mobileChoice.style.left = `${ranked[0].left - host.left}px`;
  mobileChoice.style.top = `${ranked[0].top - host.top}px`;
}

function dismissMobileCard() {
  if (!mobileChoice.classList.contains("show")) return;
  mobileChoice.classList.remove("show", "is-in");
  mobileChoice.classList.add("is-closing");
  highlight(null);
  clearTimeout(cardTimer);
  cardTimer = setTimeout(() => mobileChoice.classList.remove("is-closing"), 150);
}

function choose(id) {
  if (!places[id]) return;
  highlight(id);
  hidePreview();
  if (phone() || mobile()) showMobileChoice(id);
  else openDetail(id);
}

function roomCard(room) {
  const photo = room.image
    ? `<img class="room-photo" src="${esc(room.image)}" alt="${esc(room.type)}">`
    : "";
  if (room.rates) {
    const rates = room.rates.map((rate) => {
      const meal = rate.meal && rate.meal !== "食事なし" && rate.meal !== "無早餐" ? esc(rate.meal) : "";
      const note = rate.note ? esc(rate.note) : "";
      const third = meal && note
        ? `<span class="rate-plan"><span class="rate-meal">${meal}</span><span class="rate-note">${note}</span></span>`
        : note
          ? `<span class="rate-note">${note}</span>`
          : `<span class="rate-meal">${meal}</span>`;
      return `<li class="room-price-row"><span class="rate-price">${esc(rate.price)}</span><span class="rate-people">${label(rate.people)}</span>${third}</li>`;
    }).join("");
    const stock = room.stock ? `<span class="stock">${label(room.stock)}</span>` : "";
    const equip = room.equip ? `<div class="meta">${label(room.equip)}</div>` : "";
    const roomEn = room.en ? `<div class="room-en">${esc(room.en)}</div>` : "";
    const extra = room.breakfast ? `<div class="rate-extra">${esc(room.breakfast)}</div>` : "";
    const cancel = room.cancel ? `<div class="rate-extra">${esc(room.cancel)}</div>` : "";
    return `<div class="room has-rates${photo ? " has-photo" : ""}" tabindex="0"><div class="room-copy"><div class="type">${label(room.type)}</div>${roomEn}${equip}${stock}<ul class="rates">${rates}</ul>${extra}${cancel}</div>${photo}</div>`;
  }
  return `<div class="room" tabindex="0"><div class="type">${esc(room.type)}</div><div class="price">${esc(room.price)}</div><div class="meta">${esc(room.meta) || "&nbsp;"}</div><span class="stock">${esc(room.stock)}</span></div>`;
}

const agodaLogo = `<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="14" fill="currentColor"/><g fill="#fff" fill-rule="evenodd" transform="translate(4 18) scale(0.4)">
    <path fill="#fff" d="M40.8395924,50.3726635 C35.1321043,50.3726635 30.4888815,55.0152227 30.4888815,60.7227109 C30.4888815,66.4295355 35.1321043,71.0727583 40.8395924,71.0727583 C46.5470806,71.0727583 51.1896398,66.4295355 51.1896398,60.7227109 C51.1896398,55.0152227 46.5470806,50.3726635 40.8395924,50.3726635"/>
    <path fill="#fff" d="M11.9155261,50.3726635 C6.20803791,50.3726635 1.56547867,55.0152227 1.56547867,60.7227109 C1.56547867,66.4295355 6.20803791,71.0727583 11.9155261,71.0727583 C17.6223507,71.0727583 22.266237,66.4295355 22.266237,60.7227109 C22.266237,55.0152227 17.6223507,50.3726635 11.9155261,50.3726635"/>
    <path fill="#fff" d="M69.7637251,50.3726635 C64.0555735,50.3726635 59.4130142,55.0152227 59.4130142,60.7227109 C59.4130142,66.4295355 64.0555735,71.0727583 69.7637251,71.0727583 C75.4705498,71.0727583 80.1137725,66.4295355 80.1137725,60.7227109 C80.1137725,55.0152227 75.4705498,50.3726635 69.7637251,50.3726635"/>
    <path fill="#fff" d="M127.61,50.3726635 C121.902512,50.3726635 117.259953,55.0152227 117.259953,60.7227109 C117.259953,66.4295355 121.902512,71.0727583 127.61,71.0727583 C133.317488,71.0727583 137.960047,66.4295355 137.960047,60.7227109 C137.960047,55.0152227 133.317488,50.3726635 127.61,50.3726635"/>
    <path fill="#fff" d="M98.6871943,50.373327 C92.9797062,50.373327 88.3358199,55.0158863 88.3358199,60.7227109 C88.3358199,66.4301991 92.9790427,71.0720948 98.6865308,71.0720948 C104.394019,71.0720948 109.036578,66.4301991 109.036578,60.7227109 C109.036578,55.0158863 104.394682,50.373327 98.6871943,50.373327"/>
    <path fill="#fff" d="M.000265402844 21.0451848C.000265402844 14.3338104 5.38727962 9.26727014 12.0522085 9.26727014 18.7622559 9.26727014 24.1034882 14.2886919 24.1034882 20.9994028L24.1034882 31.3162749C24.1034882 32.3659431 23.3736303 33.0964645 22.2775166 33.0964645 21.1362844 33.0964645 20.451545 32.3659431 20.451545 31.3162749L20.451545 28.3032891 20.2690806 28.3032891C18.8538199 30.722436 16.0232986 32.822436 11.8232986 32.822436 5.34149763 32.822436.000265402844 27.8010142.000265402844 21.0451848M20.543109 21.0451848C20.543109 16.2062275 16.8905024 12.5542844 12.0522085 12.5542844 7.21258768 12.5542844 3.56064455 16.2062275 3.56064455 21.0451848 3.56064455 25.8834787 7.21258768 29.5360853 12.0522085 29.5360853 16.8905024 29.5360853 20.543109 25.8834787 20.543109 21.0451848M33.5092986 40.4465972C32.5505308 39.9901043 32.0933744 39.168019 32.4589668 38.2099147 32.8245592 37.2047014 33.737545 36.794654 34.6956493 37.2511469 36.3398199 38.0267867 38.3933744 38.5748436 40.5842749 38.5748436 46.0177346 38.5748436 49.3040853 35.3336114 49.3040853 29.8099147L49.3040853 28.30309 49.1209573 28.30309C47.7056967 30.7229005 44.8765024 32.822237 40.6758389 32.822237 34.1933744 32.822237 28.8521422 27.8008152 28.8521422 21.0449858 28.8521422 14.3342749 34.2391564 9.26707109 40.9047488 9.26707109 47.6154597 9.26707109 52.9566919 14.2891564 52.9566919 20.9992038L52.9566919 29.5816682C52.9566919 36.9771185 48.2079716 41.9527583 40.4475924 41.9527583 38.0742275 41.9527583 35.7001991 41.4962654 33.5092986 40.4465972M49.3949858 21.0449858C49.3949858 16.2060284 45.7430427 12.5534218 40.9047488 12.5534218 36.0657915 12.5534218 32.4138483 16.2060284 32.4138483 21.0449858 32.4138483 25.8839431 36.0657915 29.5358863 40.9047488 29.5358863 45.7430427 29.5358863 49.3949858 25.8839431 49.3949858 21.0449858M57.7046161 21.0451848C57.7046161 14.3338104 63.0465118 9.26727014 69.7572227 9.26727014 76.4672701 9.26727014 81.8085024 14.3338104 81.8085024 21.0451848 81.8085024 27.7552322 76.4672701 32.822436 69.7572227 32.822436 63.0465118 32.822436 57.7046161 27.7552322 57.7046161 21.0451848M78.2481232 21.0451848C78.2481232 16.2062275 74.5955166 12.5542844 69.7572227 12.5542844 64.9176019 12.5542844 61.2656588 16.2062275 61.2656588 21.0451848 61.2656588 25.8834787 64.9176019 29.5360853 69.7572227 29.5360853 74.5955166 29.5360853 78.2481232 25.8834787 78.2481232 21.0451848M86.5574882 21.0451848C86.5574882 14.3338104 91.8522749 9.26727014 98.3805213 9.26727014 102.580521 9.26727014 105.411043 11.3672701 106.826303 13.7864171L107.008768 13.7864171 107.008768 1.78025592C107.008768.730587678 107.739289.0000663507109 108.834739.0000663507109 109.976635.0000663507109 110.660711.730587678 110.660711 1.78025592L110.660711 21.0903033C110.660711 27.8010142 105.319479 32.822436 98.6094313 32.822436 91.9445024 32.822436 86.5574882 27.7552322 86.5574882 21.0451848M107.100332 21.0451848C107.100332 16.2062275 103.447725 12.5542844 98.6094313 12.5542844 93.7698104 12.5542844 90.1178673 16.2062275 90.1178673 21.0451848 90.1178673 25.8834787 93.7698104 29.5360853 98.6094313 29.5360853 103.447725 29.5360853 107.100332 25.8834787 107.100332 21.0451848M115.40963 21.0451848C115.40963 14.3338104 120.796645 9.26727014 127.461573 9.26727014 134.172284 9.26727014 139.513517 14.2886919 139.513517 20.9994028L139.513517 31.3162749C139.513517 32.3659431 138.782995 33.0964645 137.687545 33.0964645 136.545649 33.0964645 135.86091 32.3659431 135.86091 31.3162749L135.86091 28.3032891 135.678445 28.3032891C134.263185 30.722436 131.433327 32.822436 127.233327 32.822436 120.750863 32.822436 115.40963 27.8010142 115.40963 21.0451848M135.952474 21.0451848C135.952474 16.2062275 132.300531 12.5542844 127.461573 12.5542844 122.622616 12.5542844 118.970673 16.2062275 118.970673 21.0451848 118.970673 25.8834787 122.622616 29.5360853 127.461573 29.5360853 132.300531 29.5360853 135.952474 25.8834787 135.952474 21.0451848"/>
  </g></svg>`;

function hotelCard(hotel) {
  const dates = [...new Set(hotel.rooms.map((room) => room.date))];
  const groups = dates.map((date) => {
    const rooms = hotel.rooms.filter((room) => room.date === date).map(roomCard).join("");
    return `<section class="date-group"><h3>${esc(date)}</h3><div class="rooms">${rooms}</div></section>`;
  }).join("");
  const booking = hotel.booking
    ? `<a class="booking" href="${esc(hotel.booking)}" target="_blank" rel="noopener noreferrer" aria-label="Booking"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M24 0H0v24h24ZM8.575 6.563h2.658c2.108 0 3.473 1.15 3.473 2.898 0 1.15-.575 1.82-.91 2.108l-.287.263.335.192c.815.479 1.318 1.389 1.318 2.395 0 1.988-1.51 3.257-3.857 3.257H7.449V7.713c0-.623.503-1.126 1.126-1.15zm1.7 1.868c-.479.024-.694.264-.694.79v1.893h1.676c.958 0 1.294-.743 1.294-1.365 0-.815-.503-1.318-1.318-1.318zm-.096 4.36c-.407.071-.598.31-.598.79v2.251h1.868c.934 0 1.509-.55 1.509-1.533 0-.934-.599-1.509-1.51-1.509zm7.737 2.394c.743 0 1.341.599 1.341 1.342a1.34 1.34 0 0 1-1.341 1.341 1.355 1.355 0 0 1-1.341-1.341c0-.743.598-1.342 1.34-1.342z"/></svg></a>`
    : "";
  const agoda = hotel.agoda
    ? `<a class="agoda" href="${esc(hotel.agoda)}" target="_blank" rel="noopener noreferrer" aria-label="Agoda">${agodaLogo}</a>`
    : "";
  const links = booking || agoda ? `<div class="hotel-links">${booking}${agoda}</div>` : "";
  const en = hotel.en ? `<div class="hotel-en">${esc(hotel.en)}</div>` : "";
  return `<article class="hotel"><div class="hotel-title"><div class="hotel-name"><div class="hotel-name-row"><h2>${esc(hotel.name)}</h2>${links}</div>${en}</div></div>${groups}</article>`;
}

function fareBlock(place) {
  if (!place.fares) return "";
  const fare = place.fares;
  const rows = fare.seats.map((seat) => `<li><span class="fare-type">${esc(seat.type)}</span><span class="fare-price">${esc(seat.price)}</span></li>`).join("");
  const passes = (place.passes || []).map((pass) => `<li><span class="${pass.ok ? "pass-yes" : "pass-part"}">${pass.ok ? "✓" : "△"}</span>${esc(pass.name)}</li>`).join("");
  return `<div class="fares"><div class="fare-head">新幹線 ${esc(fare.date)}　${esc(fare.label)}</div><div class="fare-route">${esc(fare.route)}</div><ul class="fare-list">${rows}</ul>${passes ? `<ul class="passes">${passes}</ul>` : ""}</div>`;
}

function resortBlock(place) {
  if (!place.resorts || !place.resorts.length) return "";
  const items = place.resorts.map((resort) => {
    const route = resort.stops.map((stop, index) => {
      const leg = index ? `<div class="resort-leg"><span class="arrow">↓</span><span>${esc(resort.legs[index - 1])}</span></div>` : "";
      return `${leg}<div class="resort-stop">${esc(stop)}</div>`;
    }).join("");
    return `<section class="resort"><h3>${esc(resort.name)}</h3><div class="resort-en">${esc(resort.en)}</div><div class="resort-route">${route}</div>${resort.total ? `<div class="resort-total">合計：${esc(resort.total)}</div>` : ""}<a class="maps" href="${esc(resort.url)}" target="_blank" rel="noopener noreferrer">Google Maps ↗</a></section>`;
  }).join("");
  return `<div class="resorts"><p class="resort-note">時間為概算</p>${items}</div>`;
}

const DETAIL_HASH = { madarao: "#madarao", hakuba: "#hakuba", echigo: "#echigo-nakazato" };
const PLACE_FROM_HASH = { madarao: "madarao", hakuba: "hakuba", "echigo-nakazato": "echigo" };

function placeFromLocation() {
  return PLACE_FROM_HASH[location.hash.slice(1)] || null;
}

function showDetail(id) {
  if (!id || !places[id]) return;
  highlight(id);
  opened = true;
  const place = places[id];
  const steps = place.steps.map((step, index) => `${index ? '<span class="arrow">→</span>' : ""}<span>${esc(step)}</span>`).join("");
  const hotels = place.hotels.length
    ? place.hotels.map(hotelCard).join("")
    : '<div class="empty">No accommodation added yet</div>';
  const fares = fareBlock(place);
  const resorts = resortBlock(place);
  content.innerHTML = `<div class="detail-top"><div><h1>${esc(place.name)}</h1><div class="jp">${esc(place.jp)}</div><div class="line"></div></div></div><div class="section-label">ACCESS</div><div class="transport"><div class="time">${esc(place.time)}</div><div class="line-name">${esc(place.line)}</div><div class="steps">${steps}</div><div class="description">${esc(place.desc)}</div>${resorts}${fares}<a class="maps" href="${esc(place.url)}" target="_blank" rel="noopener noreferrer">Google Maps ↗</a></div><div class="section-label">HOTEL</div>${hotels}`;
  mapScreen.classList.add("hidden");
  detail.classList.add("open");
  mobileChoice.classList.remove("show", "is-in", "is-closing");
  window.scrollTo(0, 0);
}

function openDetail(id) {
  if (!id || !places[id]) return;
  if (history.state?.view === "detail" && history.state.place === id) {
    showDetail(id);
    return;
  }
  history.pushState({ view: "detail", place: id }, "", DETAIL_HASH[id]);
  showDetail(id);
}

function showMap() {
  opened = false;
  detail.classList.remove("open");
  mapScreen.classList.remove("hidden");
  highlight(null);
  mobileChoice.classList.remove("show", "is-in", "is-closing");
  mobileChoice.style.left = "";
  mobileChoice.style.top = "";
  hidePreview();
  window.scrollTo(0, 0);
}

function back() {
  if (history.state?.view === "detail") {
    history.back();
    return;
  }
  showMap();
  if (location.hash) history.replaceState({ view: "map" }, "", location.pathname + location.search);
}

function syncFromHistory() {
  if (history.state?.view === "map") {
    showMap();
    return;
  }
  const id = history.state?.view === "detail" ? history.state.place : placeFromLocation();
  if (id && places[id]) showDetail(id);
  else showMap();
}

const DOUBLE_TAP_MS = 320;
let lastPinTap = { id: null, time: 0 };

function activatePin(id) {
  const now = Date.now();
  const repeat = mobile() && !phone() && lastPinTap.id === id && now - lastPinTap.time <= DOUBLE_TAP_MS;
  lastPinTap = repeat ? { id: null, time: 0 } : { id, time: now };
  if (!repeat) {
    choose(id);
    return;
  }
  highlight(id);
  hidePreview();
  openDetail(id);
}

document.querySelectorAll("[data-place]").forEach((el) => {
  const id = el.dataset.place;
  el.addEventListener("mouseenter", () => preview(id));
  el.addEventListener("mouseleave", hidePreview);
  el.addEventListener("focus", () => preview(id));
  el.addEventListener("blur", hidePreview);
  el.addEventListener("click", (event) => {
    event.preventDefault();
    activatePin(id);
  });
  el.addEventListener("dblclick", (event) => {
    event.preventDefault();
    if (mobile() || phone()) return;
    highlight(id);
    hidePreview();
    openDetail(id);
  });
  el.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      choose(id);
    }
  });
});

document.querySelector("#next").addEventListener("click", () => openDetail(current));
mobileChoice.addEventListener("click", (event) => {
  if (phone() && !event.target.closest(".next")) {
    const pin = document.elementsFromPoint(event.clientX, event.clientY).map((el) => el.closest(".pin")).find(Boolean);
    if (pin) {
      activatePin(pin.dataset.place);
      return;
    }
  }
  event.stopPropagation();
});
document.querySelector("#back").addEventListener("click", back);

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (opened) back();
  else if (mobileChoice.classList.contains("show")) {
    if (phone()) dismissMobileCard();
    else {
      mobileChoice.classList.remove("show");
      highlight(null);
    }
  }
});

const MOBILE_SHAPES = [
  { fill: "coral", points: "17,86 58,74 81,90 93,115 72,133 31,127 7,106" },
  { fill: "coral", region: "madarao", points: "109,115 148,72 195,60 240,83 264,125 244,186 192,203 135,180 99,146" },
  { fill: "sage", points: "276,79 316,55 356,78 369,119 340,151 289,139 264,110" },
  { fill: "coral", points: "365,176 384,187 390,217 371,236 351,215 351,191" },
  { fill: "sage", points: "6,158 41,140 73,160 85,192 62,217 23,212 3,184" },
  { fill: "sage", region: "hakuba", points: "62,234 106,213 145,228 163,265 149,306 111,331 70,310 48,273" },
  { fill: "coral", points: "184,236 204,223 221,244 215,267 190,270 177,251" },
  { fill: "sage", points: "247,208 291,188 330,204 337,242 310,268 266,257 239,231" },
  { fill: "sage", region: "echigo", points: "268,281 316,268 361,290 376,329 357,373 306,392 262,368 248,328" },
  { fill: "sage", points: "396,268 400,284 400,322 396,338 390,320 390,286" },
  { fill: "coral", points: "14,333 50,318 80,343 91,379 61,399 23,391 4,363" },
  { fill: "sage", points: "85,391 133,370 175,390 192,425 165,459 111,465 72,438" },
  { fill: "coral", points: "202,400 232,385 257,409 251,439 218,451 195,427" },
  { fill: "coral", points: "353,411 380,400 396,423 388,447 361,451 345,433" },
  { fill: "coral", points: "36,475 83,456 130,476 155,521 133,566 77,578 27,550 16,508" },
  { fill: "sage", points: "169,515 202,497 232,515 238,550 211,575 174,560 157,536" },
  { fill: "sage", points: "340,480 377,466 398,495 400,539 374,566 338,551 324,517" },
];
const MOBILE_ROUTES = {
  hakuba: "M275 540 C200 500 214 285 176 274 C153 267 140 266 115 268",
  madarao: "M275 540 C232 450 262 169 226 166 C204 164 188 157 166 158",
  echigo: "M275 540 C320 470 380 346 362 338 C346 331 324 322 304 322",
};
const MOBILE_PINS = {
  hakuba: { x: 115, y: 268, label: 300, hit: 24, outer: 7.2, inner: 2.5, rectX: 62, rectY: 250, rectW: 106, rectH: 64 },
  madarao: { x: 166, y: 158, label: 190, hit: 24, outer: 7.2, inner: 2.5, rectX: 112, rectY: 140, rectW: 108, rectH: 64 },
  echigo: { x: 304, y: 322, label: 352, hit: 24, outer: 7.2, inner: 2.5, rectX: 246, rectY: 304, rectW: 118, rectH: 84 },
};
const MOBILE_ORIGIN = { x: 275, y: 540, title: 574, radii: [11, 5.8, 1.7] };

let mapSnapshot = null;
let portraitOn = false;

function snapshotMap() {
  if (mapSnapshot) return;
  const svg = document.querySelector(".map");
  mapSnapshot = {
    viewBox: svg.getAttribute("viewBox"),
    regions: [...svg.querySelectorAll(".region")].map((el) => el.getAttribute("d")),
    routes: [...svg.querySelectorAll(".route")].map((el) => [el.dataset.route, el.getAttribute("d")]),
    pins: [...svg.querySelectorAll(".pin")].map((pin) => ({
      id: pin.dataset.place,
      circles: [...pin.querySelectorAll("circle")].map((el) => ({
        cx: el.getAttribute("cx"),
        cy: el.getAttribute("cy"),
        r: el.getAttribute("r"),
      })),
      rect: [
        pin.querySelector("rect").getAttribute("x"),
        pin.querySelector("rect").getAttribute("y"),
        pin.querySelector("rect").getAttribute("width"),
        pin.querySelector("rect").getAttribute("height"),
      ],
      text: [pin.querySelector("text").getAttribute("x"), pin.querySelector("text").getAttribute("y")],
      tspans: [...pin.querySelectorAll("tspan")].map((el) => ({
        x: el.getAttribute("x"),
        dy: el.getAttribute("dy"),
      })),
    })),
    origin: [...svg.querySelectorAll(".origin circle, .origin text")].map((el) => ({
      tag: el.localName,
      x: el.getAttribute(el.localName === "circle" ? "cx" : "x"),
      y: el.getAttribute(el.localName === "circle" ? "cy" : "y"),
      r: el.localName === "circle" ? el.getAttribute("r") : null,
      dy: el.localName === "text" ? el.getAttribute("dy") : null,
    })),
  };
}

function applyPortraitMap(on) {
  if (on === portraitOn) return;
  const svg = document.querySelector(".map");
  snapshotMap();
  if (!on) {
    svg.querySelectorAll(".phone-shape").forEach((el) => el.remove());
    svg.setAttribute("viewBox", mapSnapshot.viewBox);
    svg.querySelectorAll(".region").forEach((el, index) => el.setAttribute("d", mapSnapshot.regions[index]));
    mapSnapshot.routes.forEach(([id, d]) => svg.querySelector(`[data-route="${id}"]`).setAttribute("d", d));
    mapSnapshot.pins.forEach((pin) => {
      const group = svg.querySelector(`[data-place="${pin.id}"]`);
      group.querySelectorAll("circle").forEach((el, index) => {
        el.setAttribute("cx", pin.circles[index].cx);
        el.setAttribute("cy", pin.circles[index].cy);
        el.setAttribute("r", pin.circles[index].r);
      });
      const rect = group.querySelector("rect");
      rect.setAttribute("x", pin.rect[0]);
      rect.setAttribute("y", pin.rect[1]);
      rect.setAttribute("width", pin.rect[2]);
      rect.setAttribute("height", pin.rect[3]);
      const text = group.querySelector("text");
      text.setAttribute("x", pin.text[0]);
      text.setAttribute("y", pin.text[1]);
      group.querySelectorAll("tspan").forEach((el, index) => {
        el.setAttribute("x", pin.tspans[index].x);
        if (pin.tspans[index].dy) el.setAttribute("dy", pin.tspans[index].dy);
        else el.removeAttribute("dy");
      });
    });
    svg.querySelectorAll(".origin circle, .origin text").forEach((el, index) => {
      const saved = mapSnapshot.origin[index];
      if (saved.tag === "circle") {
        el.setAttribute("cx", saved.x);
        el.setAttribute("cy", saved.y);
        el.setAttribute("r", saved.r);
      } else {
        el.setAttribute("x", saved.x);
        el.setAttribute("y", saved.y);
        if (saved.dy) el.setAttribute("dy", saved.dy);
        else el.removeAttribute("dy");
      }
    });
    svg.classList.remove("is-portrait");
    portraitOn = false;
    setRoute(current);
    return;
  }
  svg.setAttribute("viewBox", "0 0 400 600");
  const anchor = svg.querySelector(".route");
  MOBILE_SHAPES.forEach((shape) => {
    const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    polygon.setAttribute("class", shape.region ? "region phone-shape" : "region phone-shape decorative");
    if (shape.region) polygon.dataset.region = shape.region;
    polygon.setAttribute("fill", shape.fill === "coral" ? "url(#redhatch-phone)" : "url(#greenhatch-phone)");
    polygon.setAttribute("points", shape.points);
    svg.insertBefore(polygon, anchor);
  });
  Object.entries(MOBILE_ROUTES).forEach(([id, d]) => svg.querySelector(`[data-route="${id}"]`).setAttribute("d", d));
  Object.entries(MOBILE_PINS).forEach(([id, pin]) => {
    const group = svg.querySelector(`[data-place="${id}"]`);
    group.querySelector(".hit").setAttribute("r", pin.hit);
    group.querySelector(".outer").setAttribute("r", pin.outer);
    group.querySelector(".inner").setAttribute("r", pin.inner);
    group.querySelectorAll("circle").forEach((el) => {
      el.setAttribute("cx", pin.x);
      el.setAttribute("cy", pin.y);
    });
    const rect = group.querySelector("rect");
    rect.setAttribute("x", pin.rectX);
    rect.setAttribute("y", pin.rectY);
    rect.setAttribute("width", pin.rectW);
    rect.setAttribute("height", pin.rectH);
    const text = group.querySelector("text");
    text.setAttribute("x", pin.x);
    text.setAttribute("y", pin.label);
    const lines = group.querySelectorAll("tspan");
    lines.forEach((el) => el.setAttribute("x", pin.x));
    if (lines[1]) lines[1].setAttribute("dy", "1.3em");
  });
  const origin = svg.querySelector(".origin");
  origin.querySelectorAll("circle").forEach((el, index) => {
    el.setAttribute("cx", MOBILE_ORIGIN.x);
    el.setAttribute("cy", MOBILE_ORIGIN.y);
    el.setAttribute("r", MOBILE_ORIGIN.radii[index]);
  });
  const [title, small] = origin.querySelectorAll("text");
  title.setAttribute("x", MOBILE_ORIGIN.x);
  title.setAttribute("y", MOBILE_ORIGIN.title);
  small.setAttribute("x", MOBILE_ORIGIN.x);
  small.setAttribute("y", MOBILE_ORIGIN.title);
  small.setAttribute("dy", "1.45em");
  svg.classList.add("is-portrait");
  portraitOn = true;
  setRoute(current);
}

applyPortraitMap(phone());

function leaveMobileMode() {
  hidePreview();
  applyPortraitMap(phone());
  if (!phone()) {
    mobileChoice.style.left = "";
    mobileChoice.style.top = "";
  }
  if (!mobile() && !phone()) mobileChoice.classList.remove("show", "is-in", "is-closing");
  else if (phone() && mobileChoice.classList.contains("show") && current) positionMobileCard(current);
}

window.addEventListener("resize", leaveMobileMode);
mobileMedia.addEventListener("change", leaveMobileMode);
window.addEventListener("popstate", syncFromHistory);
document.addEventListener("click", (event) => {
  if (!phone() || !mobileChoice.classList.contains("show")) return;
  if (event.target.closest(".mobile-choice, .pin")) return;
  const compass = document.querySelector(".compass").getBoundingClientRect();
  const { clientX: x, clientY: y } = event;
  if (x >= compass.left && x <= compass.right && y >= compass.top && y <= compass.bottom) return;
  dismissMobileCard();
});

const openedPlace = placeFromLocation();
if (openedPlace) {
  if (history.state?.view === "detail" && history.state.place === openedPlace) showDetail(openedPlace);
  else {
    history.replaceState({ view: "map" }, "", location.pathname + location.search);
    history.pushState({ view: "detail", place: openedPlace }, "", DETAIL_HASH[openedPlace]);
    showDetail(openedPlace);
  }
} else if (history.state?.view !== "map") {
  history.replaceState({ view: "map" }, "", location.pathname + location.search + location.hash);
}
