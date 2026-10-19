(() => {
  // Change this id to switch the correct animal: rabbit, bear, dog, cat
  const correctAnimalId = "dog";
  const lock = document.getElementById("nb-lock");
  const stage = document.getElementById("nb-stage");
  const hammer = document.getElementById("nb-hammer");
  const hint = document.getElementById("nb-hint");
  const dots = [...document.querySelectorAll("#nb-dots i")];
  if (!lock || !stage || !hammer || document.documentElement.classList.contains("nb-open")) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const animals = [...stage.querySelectorAll(".nb-animal")].map((el, index) => ({
    el,
    id: el.dataset.id,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    rot: (index - 1.5) * 4,
    spin: (index % 2 ? 1 : -1) * (reduced ? 2 : 7),
    speed: [14, 22, 18, 12][index] * (reduced ? 0.35 : 1),
    phase: index * 1.7,
    w: 128,
    h: 146
  }));
  const starts = [
    [0.16, 0.18],
    [0.62, 0.14],
    [0.3, 0.56],
    [0.66, 0.5]
  ];

  let held = false;
  let pointerId = null;
  let moved = false;
  let ignoreUp = false;
  let downAnimal = null;
  let startX = 0;
  let startY = 0;
  let hx = 0;
  let hy = 0;
  let tx = 0;
  let ty = 0;
  let progress = 0;
  let busy = false;
  let done = false;
  let running = true;
  let last = 0;

  function sizeOf(animal) {
    const mobile = window.innerWidth <= 767;
    animal.w = mobile ? 104 : 128;
    animal.h = mobile ? 118 : 146;
  }

  function layout() {
    const bounds = stage.getBoundingClientRect();
    animals.forEach((animal, index) => {
      sizeOf(animal);
      const [sx, sy] = starts[index];
      if (!animal.placed) {
        animal.x = sx * Math.max(0, bounds.width - animal.w);
        animal.y = sy * Math.max(0, bounds.height - animal.h);
        const angle = animal.phase;
        animal.vx = Math.cos(angle) * animal.speed;
        animal.vy = Math.sin(angle * 0.8) * animal.speed * 0.65;
        animal.placed = true;
      }
    });
    if (!held) {
      const rest = restPoint();
      hx = tx = rest.x;
      hy = ty = rest.y;
      paintHammer();
    }
  }

  function restPoint() {
    const anchor = document.getElementById("nb-anchor").getBoundingClientRect();
    return { x: anchor.left + anchor.width / 2, y: anchor.top + anchor.height / 2 };
  }

  function paintAnimal(animal) {
    animal.el.style.transform = `translate3d(${animal.x}px,${animal.y}px,0) rotate(${animal.rot}deg)`;
  }

  function paintHammer() {
    const box = hammer.getBoundingClientRect();
    const w = box.width || 68;
    hammer.style.transform = `translate3d(${hx - w / 2}px,${hy - w * 0.22}px,0) rotate(-8deg)`;
  }

  function updateDots() {
    dots.forEach((dot, index) => dot.classList.toggle("on", index < progress));
  }

  function strike(el) {
    if (busy || done || !held) return;
    busy = true;
    const rect = el.getBoundingClientRect();
    tx = rect.left + rect.width / 2;
    ty = rect.top + rect.height * 0.42;
    hx = tx;
    hy = ty;
    paintHammer();
    hammer.classList.add("is-swing");
    const body = el.querySelector(".nb-animal-body");
    body.classList.remove("is-hit");
    void body.offsetWidth;
    body.classList.add("is-hit");
    if (el.dataset.id === correctAnimalId) {
      progress = Math.min(3, progress + 1);
      updateDots();
    }
    window.setTimeout(() => {
      hammer.classList.remove("is-swing");
      body.classList.remove("is-hit");
      busy = false;
      if (progress >= 3) finish();
    }, 420);
  }

  function finish() {
    if (done) return;
    done = true;
    running = false;
    try { sessionStorage.setItem("notebookUnlocked", "true"); } catch (e) {}
    animals.forEach((animal, index) => {
      const angle = (-0.8 + index * 0.7) * Math.PI;
      const dist = reduced ? 40 : 180;
      animal.el.style.transition = "transform 1s ease";
      animal.el.style.transform = `translate3d(${animal.x + Math.cos(angle) * dist}px,${animal.y + Math.sin(angle) * dist * 0.65}px,0) rotate(${animal.rot}deg)`;
    });
    lock.classList.add("is-done");
    window.setTimeout(() => document.documentElement.classList.add("nb-open"), reduced ? 420 : 1100);
  }

  function step(now) {
    if (!running) return;
    const dt = Math.min(0.032, last ? (now - last) / 1000 : 0.016);
    last = now;
    const bounds = stage.getBoundingClientRect();
    animals.forEach((animal) => {
      sizeOf(animal);
      const maxX = Math.max(0, bounds.width - animal.w);
      const maxY = Math.max(0, bounds.height - animal.h);
      animal.phase += dt * 0.35;
      animal.vx += Math.cos(animal.phase) * animal.speed * 0.35 * dt;
      animal.vy += Math.sin(animal.phase * 1.3) * animal.speed * 0.28 * dt;
      animals.forEach((other) => {
        if (other === animal) return;
        const dx = animal.x + animal.w / 2 - (other.x + other.w / 2);
        const dy = animal.y + animal.h / 2 - (other.y + other.h / 2);
        const dist = Math.hypot(dx, dy) || 1;
        const min = (animal.w + other.w) * 0.68;
        if (dist < min) {
          const push = ((min - dist) / min) * 46;
          animal.vx += (dx / dist) * push * dt * 8;
          animal.vy += (dy / dist) * push * dt * 8;
        }
      });
      const margin = 6;
      if (animal.x < margin) animal.vx += (margin - animal.x) * 8 * dt;
      if (animal.x > maxX - margin) animal.vx -= (animal.x - (maxX - margin)) * 8 * dt;
      if (animal.y < margin) animal.vy += (margin - animal.y) * 8 * dt;
      if (animal.y > maxY - margin) animal.vy -= (animal.y - (maxY - margin)) * 8 * dt;
      const cap = animal.speed * 1.35;
      const mag = Math.hypot(animal.vx, animal.vy) || 1;
      if (mag > cap) {
        animal.vx = (animal.vx / mag) * cap;
        animal.vy = (animal.vy / mag) * cap;
      }
      animal.x += animal.vx * dt;
      animal.y += animal.vy * dt;
      animal.x = Math.max(0, Math.min(maxX, animal.x));
      animal.y = Math.max(0, Math.min(maxY, animal.y));
      animal.rot = Math.sin(animal.phase) * (reduced ? 1.5 : animal.spin);
      paintAnimal(animal);
    });
    if (held) {
      hx += (tx - hx) * 0.34;
      hy += (ty - hy) * 0.34;
    } else {
      const rest = restPoint();
      hx = rest.x;
      hy = rest.y;
    }
    paintHammer();
    window.requestAnimationFrame(step);
  }

  lock.addEventListener("touchmove", (event) => { if (!done) event.preventDefault(); }, { passive: false });
  lock.addEventListener("pointerdown", (event) => {
    if (done || (event.button != null && event.button !== 0)) return;
    const onHammer = event.target.closest("#nb-hammer");
    const animal = event.target.closest(".nb-animal");
    if (!held) {
      if (!onHammer) return;
      held = true;
      ignoreUp = true;
      hint.hidden = true;
      hammer.classList.add("is-held");
      tx = event.clientX;
      ty = event.clientY;
      hx = tx;
      hy = ty;
      return;
    }
    pointerId = event.pointerId;
    moved = false;
    downAnimal = animal;
    startX = event.clientX;
    startY = event.clientY;
    tx = event.clientX;
    ty = event.clientY;
  });

  lock.addEventListener("pointermove", (event) => {
    if (!held || done) return;
    if (pointerId != null && event.pointerId === pointerId) {
      if (Math.hypot(event.clientX - startX, event.clientY - startY) > 10) moved = true;
    }
    tx = event.clientX;
    ty = event.clientY;
  });

  function endPointer(event) {
    if (!held || done) return;
    if (ignoreUp) {
      ignoreUp = false;
      pointerId = null;
      return;
    }
    if (pointerId != null && event.pointerId != null && event.pointerId !== pointerId) return;
    const animal = downAnimal;
    const tapped = !moved;
    pointerId = null;
    downAnimal = null;
    moved = false;
    if (tapped && animal) strike(animal);
  }

  lock.addEventListener("pointerup", endPointer);
  lock.addEventListener("pointercancel", () => {
    pointerId = null;
    downAnimal = null;
    moved = false;
    ignoreUp = false;
  });

  window.addEventListener("resize", () => {
    animals.forEach((animal) => { animal.placed = false; });
    layout();
  });
  layout();
  window.requestAnimationFrame(step);
})();
