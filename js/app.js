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

const PORTRAIT_REGIONS = [
  "M55 210 L125 168 L198 198 L214 262 L148 318 L68 292 L36 240 Z",
  "M0 338 L96 292 L188 338 L214 418 L136 478 L28 456 L0 388 Z",
  "M528 286 L642 252 L724 302 L702 372 L588 396 L516 342 Z",
  "M328 468 L402 446 L456 502 L424 566 L348 560 L312 508 Z",
  "M492 388 L612 352 L708 412 L686 508 L552 538 L470 468 Z",
  "M0 868 L128 792 L286 836 L368 948 L332 1088 L168 1148 L24 1072 L0 948 Z",
  "M286 1036 L428 978 L512 1052 L478 1156 L338 1180 L258 1092 Z",
  "M18 468 L146 404 L286 448 L338 548 L292 676 L162 734 L48 688 L0 566 Z",
  "M148 214 L286 128 L438 118 L552 198 L574 318 L486 428 L318 468 L184 404 L128 300 Z",
  "M508 552 L668 488 L792 552 L820 688 L724 812 L572 836 L488 728 L478 612 Z",
];
const PORTRAIT_ROUTES = {
  hakuba: "M584 1005 Q210 900 251 513",
  madarao: "M584 1005 Q490 680 348 325",
  echigo: "M584 1005 Q710 850 628 625",
};
const PORTRAIT_PINS = {
  hakuba: { x: 251, y: 513, label: 555, rectX: 191, rectY: 482 },
  madarao: { x: 348, y: 325, label: 368, rectX: 288, rectY: 300 },
  echigo: { x: 628, y: 625, label: 666, rectX: 568, rectY: 616 },
};
const PORTRAIT_ORIGIN = { x: 584, y: 1005, title: 1050, small: 1068 };

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
      circles: [...pin.querySelectorAll("circle")].map((el) => [el.getAttribute("cx"), el.getAttribute("cy")]),
      rect: [pin.querySelector("rect").getAttribute("x"), pin.querySelector("rect").getAttribute("y")],
      text: [pin.querySelector("text").getAttribute("x"), pin.querySelector("text").getAttribute("y")],
      tspans: [...pin.querySelectorAll("tspan")].map((el) => el.getAttribute("x")),
    })),
    origin: [...svg.querySelectorAll(".origin circle, .origin text")].map((el) => ({
      tag: el.localName,
      x: el.getAttribute(el.localName === "circle" ? "cx" : "x"),
      y: el.getAttribute(el.localName === "circle" ? "cy" : "y"),
    })),
  };
}

function applyPortraitMap(on) {
  if (on === portraitOn) return;
  const svg = document.querySelector(".map");
  snapshotMap();
  if (!on) {
    svg.setAttribute("viewBox", mapSnapshot.viewBox);
    svg.querySelectorAll(".region").forEach((el, index) => el.setAttribute("d", mapSnapshot.regions[index]));
    mapSnapshot.routes.forEach(([id, d]) => svg.querySelector(`[data-route="${id}"]`).setAttribute("d", d));
    mapSnapshot.pins.forEach((pin) => {
      const group = svg.querySelector(`[data-place="${pin.id}"]`);
      group.querySelectorAll("circle").forEach((el, index) => {
        el.setAttribute("cx", pin.circles[index][0]);
        el.setAttribute("cy", pin.circles[index][1]);
      });
      const rect = group.querySelector("rect");
      rect.setAttribute("x", pin.rect[0]);
      rect.setAttribute("y", pin.rect[1]);
      const text = group.querySelector("text");
      text.setAttribute("x", pin.text[0]);
      text.setAttribute("y", pin.text[1]);
      group.querySelectorAll("tspan").forEach((el, index) => el.setAttribute("x", pin.tspans[index]));
    });
    svg.querySelectorAll(".origin circle, .origin text").forEach((el, index) => {
      const saved = mapSnapshot.origin[index];
      el.setAttribute(saved.tag === "circle" ? "cx" : "x", saved.x);
      el.setAttribute(saved.tag === "circle" ? "cy" : "y", saved.y);
    });
    svg.classList.remove("is-portrait");
    portraitOn = false;
    return;
  }
  svg.setAttribute("viewBox", "0 0 820 1230");
  svg.querySelectorAll(".region").forEach((el, index) => el.setAttribute("d", PORTRAIT_REGIONS[index]));
  Object.entries(PORTRAIT_ROUTES).forEach(([id, d]) => svg.querySelector(`[data-route="${id}"]`).setAttribute("d", d));
  Object.entries(PORTRAIT_PINS).forEach(([id, pin]) => {
    const group = svg.querySelector(`[data-place="${id}"]`);
    group.querySelectorAll("circle").forEach((el) => {
      el.setAttribute("cx", pin.x);
      el.setAttribute("cy", pin.y);
    });
    const rect = group.querySelector("rect");
    rect.setAttribute("x", pin.rectX);
    rect.setAttribute("y", pin.rectY);
    const text = group.querySelector("text");
    text.setAttribute("x", pin.x);
    text.setAttribute("y", pin.label);
    group.querySelectorAll("tspan").forEach((el) => el.setAttribute("x", pin.x));
  });
  const origin = svg.querySelector(".origin");
  origin.querySelectorAll("circle").forEach((el) => {
    el.setAttribute("cx", PORTRAIT_ORIGIN.x);
    el.setAttribute("cy", PORTRAIT_ORIGIN.y);
  });
  const [title, small] = origin.querySelectorAll("text");
  title.setAttribute("x", PORTRAIT_ORIGIN.x);
  title.setAttribute("y", PORTRAIT_ORIGIN.title);
  small.setAttribute("x", PORTRAIT_ORIGIN.x);
  small.setAttribute("y", PORTRAIT_ORIGIN.small);
  svg.classList.add("is-portrait");
  portraitOn = true;
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
