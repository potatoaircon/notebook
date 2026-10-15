"use strict";

const places = window.TRAVEL_PLACES;
const mapScreen = document.querySelector("#mapScreen");
const detail = document.querySelector("#detail");
const content = document.querySelector("#content");
const hoverNote = document.querySelector("#hoverNote");
const mobileChoice = document.querySelector("#mobileChoice");
const mobileMedia = matchMedia("(max-width: 700px), ((hover: none) and (pointer: coarse))");

let current = null;
let opened = false;

const mobile = () => mobileMedia.matches;

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
  mobileChoice.classList.add("show");
}

function choose(id) {
  if (!places[id]) return;
  highlight(id);
  hidePreview();
  if (mobile()) showMobileChoice(id);
  else openDetail(id);
}

function roomCard(room) {
  const photo = room.image
    ? `<img class="room-photo" src="${esc(room.image)}" alt="${esc(room.type)}">`
    : "";
  if (room.rates) {
    const rates = room.rates.map((rate) => `<li class="room-price-row"><span class="rate-price">${esc(rate.price)}</span><span class="rate-people">${label(rate.people)}</span><span class="rate-meal">${rate.meal && rate.meal !== "食事なし" && rate.meal !== "無早餐" ? esc(rate.meal) : ""}</span></li>`).join("");
    const stock = room.stock ? `<span class="stock">${esc(room.stock)}</span>` : "";
    const equip = room.equip ? `<div class="meta">${esc(room.equip)}</div>` : "";
    return `<div class="room has-rates${photo ? " has-photo" : ""}" tabindex="0"><div class="room-copy"><div class="type">${label(room.type)}</div>${equip}${stock}<ul class="rates">${rates}</ul></div>${photo}</div>`;
  }
  return `<div class="room" tabindex="0"><div class="type">${esc(room.type)}</div><div class="price">${esc(room.price)}</div><div class="meta">${esc(room.meta) || "&nbsp;"}</div><span class="stock">${esc(room.stock)}</span></div>`;
}

function hotelCard(hotel) {
  const dates = [...new Set(hotel.rooms.map((room) => room.date))];
  const groups = dates.map((date) => {
    const rooms = hotel.rooms.filter((room) => room.date === date).map(roomCard).join("");
    return `<section class="date-group"><h3>${esc(date)}</h3><div class="rooms">${rooms}</div></section>`;
  }).join("");
  const booking = hotel.booking
    ? `<a class="booking" href="${esc(hotel.booking)}" target="_blank" rel="noopener noreferrer" aria-label="Booking"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M24 0H0v24h24ZM8.575 6.563h2.658c2.108 0 3.473 1.15 3.473 2.898 0 1.15-.575 1.82-.91 2.108l-.287.263.335.192c.815.479 1.318 1.389 1.318 2.395 0 1.988-1.51 3.257-3.857 3.257H7.449V7.713c0-.623.503-1.126 1.126-1.15zm1.7 1.868c-.479.024-.694.264-.694.79v1.893h1.676c.958 0 1.294-.743 1.294-1.365 0-.815-.503-1.318-1.318-1.318zm-.096 4.36c-.407.071-.598.31-.598.79v2.251h1.868c.934 0 1.509-.55 1.509-1.533 0-.934-.599-1.509-1.51-1.509zm7.737 2.394c.743 0 1.341.599 1.341 1.342a1.34 1.34 0 0 1-1.341 1.341 1.355 1.355 0 0 1-1.341-1.341c0-.743.598-1.342 1.34-1.342z"/></svg></a>`
    : "";
  return `<article class="hotel"><div class="hotel-title"><h2>${esc(hotel.name)}</h2>${booking}</div>${groups}</article>`;
}

function openDetail(id) {
  if (!id || !places[id]) return;
  highlight(id);
  opened = true;
  const place = places[id];
  const steps = place.steps.map((step, index) => `${index ? '<span class="arrow">→</span>' : ""}<span>${esc(step)}</span>`).join("");
  const hotels = place.hotels.length
    ? place.hotels.map(hotelCard).join("")
    : '<div class="empty">尚未新增住宿資料</div>';
  content.innerHTML = `<div class="detail-top"><div><h1>${esc(place.name)}</h1><div class="jp">${esc(place.jp)}</div><div class="line"></div></div></div><div class="section-label">交通方式</div><div class="transport"><div class="time">${esc(place.time)}</div><div class="line-name">${esc(place.line)}</div><div class="steps">${steps}</div><div class="description">${esc(place.desc)}</div><a class="maps" href="${esc(place.url)}" target="_blank" rel="noopener noreferrer">Google Maps ↗</a></div><div class="section-label">住宿資訊</div>${hotels}`;
  mapScreen.classList.add("hidden");
  detail.classList.add("open");
  mobileChoice.classList.remove("show");
  window.scrollTo(0, 0);
}

function back() {
  opened = false;
  detail.classList.remove("open");
  mapScreen.classList.remove("hidden");
  highlight(null);
  mobileChoice.classList.remove("show");
  hidePreview();
  window.scrollTo(0, 0);
}

document.querySelectorAll("[data-place]").forEach((el) => {
  const id = el.dataset.place;
  el.addEventListener("mouseenter", () => preview(id));
  el.addEventListener("mouseleave", hidePreview);
  el.addEventListener("focus", () => preview(id));
  el.addEventListener("blur", hidePreview);
  el.addEventListener("click", (event) => {
    event.preventDefault();
    choose(id);
  });
  el.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      choose(id);
    }
  });
});

document.querySelector("#next").addEventListener("click", () => openDetail(current));
document.querySelector("#back").addEventListener("click", back);

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (opened) back();
  else if (mobileChoice.classList.contains("show")) {
    mobileChoice.classList.remove("show");
    highlight(null);
  }
});

function leaveMobileMode() {
  hidePreview();
  if (!mobile()) mobileChoice.classList.remove("show");
}

window.addEventListener("resize", leaveMobileMode);
mobileMedia.addEventListener("change", leaveMobileMode);
