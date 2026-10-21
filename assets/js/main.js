"use strict";

/* THEME */
const themeBtn = document.getElementById("themeBtn");
const themeIcon = document.getElementById("themeIcon");
const themeLabel = document.getElementById("themeLabel");
const themeBtnMobile = document.getElementById("themeBtnMobile");
const themeIconMobile = document.getElementById("themeIconMobile");
const html = document.documentElement;

function applyTheme(isLight) {
  html.classList.toggle("light", isLight);
  const icon = isLight ? "☾" : "☀";
  if (themeIcon) themeIcon.textContent = icon;
  if (themeIconMobile) themeIconMobile.textContent = icon;
  if (themeLabel) themeLabel.textContent = isLight ? "dark" : "light";
}

if (localStorage.getItem("theme") === "light") {
  applyTheme(true);
}

function toggleTheme() {
  const isLight = !html.classList.contains("light");
  applyTheme(isLight);
  localStorage.setItem("theme", isLight ? "light" : "dark");
}

themeBtn?.addEventListener("click", toggleTheme);
themeBtnMobile?.addEventListener("click", toggleTheme);

/* MOBILE SIDEBAR */
const sidebar = document.getElementById("sidebar");
const mobToggle = document.getElementById("mobToggle");
mobToggle?.addEventListener("click", () => {
  const isOpen = sidebar.classList.toggle("mob-open");
  mobToggle.setAttribute("aria-expanded", String(isOpen));
  document.body.style.overflow = isOpen ? "hidden" : "";
});
document.querySelectorAll(".sb-link").forEach((link) => {
  link.addEventListener("click", () => {
    sidebar.classList.remove("mob-open");
    mobToggle?.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  });
});

/* ACTIVE NAV */
const sbLinks = document.querySelectorAll(".sb-link[data-section]");
const sections = document.querySelectorAll("section[id], div[id]");
const navObs = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const id = e.target.id;
      sbLinks.forEach((l) => {
        l.classList.toggle("active", l.dataset.section === id);
      });
    });
  },
  { rootMargin: "-30% 0px -60% 0px", threshold: 0 },
);
sections.forEach((s) => navObs.observe(s));

/* SCROLL REVEAL */
const revealObs = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      revealObs.unobserve(e.target);
    });
  },
  { threshold: 0.08 },
);
document.querySelectorAll(".rv").forEach((el) => revealObs.observe(el));

/* COUNTERS */
function animCount(el) {
  const target = parseInt(el.dataset.count, 10);
  const dur = 1500,
    start = performance.now();
  const run = (now) => {
    const p = Math.min((now - start) / dur, 1);
    el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target);
    if (p < 1) requestAnimationFrame(run);
    else el.textContent = target;
  };
  requestAnimationFrame(run);
}
const counterObs = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      animCount(e.target);
      counterObs.unobserve(e.target);
    });
  },
  { threshold: 0.5 },
);
document
  .querySelectorAll("[data-count]")
  .forEach((el) => counterObs.observe(el));

/* ─────────────────────────────────────────
   HERO PARALLAX — subtle glow drift
   Only runs while the hero is on screen, and
   only on pointer-capable / non-reduced-motion
   devices.
   ───────────────────────────────────────── */
(function () {
  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  if (prefersReduced) return;

  const heroSection = document.getElementById("hero");
  const glowA = document.querySelector(".hero-glow-a");
  const glowB = document.querySelector(".hero-glow-b");
  if (!heroSection) return;

  let heroInView = true;
  const heroObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        heroInView = e.isIntersecting;
      });
    },
    { threshold: 0 },
  );
  heroObs.observe(heroSection);

  let ticking = false;
  function onScroll() {
    if (!heroInView || ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const scrollY = window.scrollY || window.pageYOffset;
      // Glow orbs drift at different rates for parallax depth
      if (glowA) {
        glowA.style.transform = `translate3d(0, ${scrollY * 0.18}px, 0)`;
      }
      if (glowB) {
        glowB.style.transform = `translate3d(0, ${scrollY * -0.1}px, 0)`;
      }
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
})();

/* ─────────────────────────────────────────
   HERO NETWORK PARTICLES
   Small points travel the existing network paths.
   Animation pauses offscreen and respects reduced motion.
   ───────────────────────────────────────── */
(function () {
  const hero = document.getElementById("hero");
  const particles = [...document.querySelectorAll(".network-particle")];
  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  if (!hero || !particles.length || prefersReduced) return;

  const routes = [
    [
      [60, 140],
      [120, 80],
      [250, 60],
      [340, 120],
    ],
    [
      [120, 80],
      [180, 160],
      [290, 180],
    ],
  ];

  function pointAlong(route, progress) {
    const lengths = [];
    let total = 0;
    for (let i = 0; i < route.length - 1; i++) {
      const dx = route[i + 1][0] - route[i][0];
      const dy = route[i + 1][1] - route[i][1];
      const length = Math.hypot(dx, dy);
      lengths.push(length);
      total += length;
    }

    let remaining = progress * total;
    for (let i = 0; i < lengths.length; i++) {
      if (remaining <= lengths[i] || i === lengths.length - 1) {
        const t = lengths[i] ? remaining / lengths[i] : 0;
        return [
          route[i][0] + (route[i + 1][0] - route[i][0]) * t,
          route[i][1] + (route[i + 1][1] - route[i][1]) * t,
        ];
      }
      remaining -= lengths[i];
    }
    return route[0];
  }

  const movers = particles.map((node) => ({
    node,
    route: routes[Number(node.dataset.route) || 0],
    duration: Number(node.dataset.duration) || 8000,
    offset: Number(node.dataset.offset) || 0,
  }));

  let visible = false;
  let frameId = 0;
  let startAt = 0;
  function tick(now) {
    if (!visible || document.hidden) {
      frameId = 0;
      return;
    }
    if (!startAt) startAt = now;
    const elapsed = now - startAt;
    movers.forEach(({ node, route, duration, offset }) => {
      const phase = ((elapsed / duration + offset) % 2 + 2) % 2;
      const progress = phase <= 1 ? phase : 2 - phase;
      const [x, y] = pointAlong(route, progress);
      node.setAttribute("transform", `translate(${x.toFixed(2)} ${y.toFixed(2)})`);
    });
    frameId = requestAnimationFrame(tick);
  }

  function updatePlayback() {
    if (visible && !document.hidden && !frameId) {
      frameId = requestAnimationFrame(tick);
    } else if ((!visible || document.hidden) && frameId) {
      cancelAnimationFrame(frameId);
      frameId = 0;
    }
  }

  const observer = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      updatePlayback();
    },
    { threshold: 0 },
  );
  observer.observe(hero);
  document.addEventListener("visibilitychange", updatePlayback);
})();

/* ─────────────────────────────────────────
   PROJECT CARD TILT — subtle 3D mouse tilt
   Disabled on touch devices and reduced motion.
   ───────────────────────────────────────── */
(function () {
  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const isTouch = window.matchMedia("(hover: none)").matches;
  if (prefersReduced || isTouch) return;

  const MAX_TILT = 5; // degrees, kept subtle
  const cards = document.querySelectorAll(".proj-card, .about-card");

  cards.forEach((card) => {
    card.style.transition = "transform .15s ease-out";

    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const px = x / rect.width - 0.5;
      const py = y / rect.height - 0.5;
      const rotX = (py * -MAX_TILT).toFixed(2);
      const rotY = (px * MAX_TILT).toFixed(2);
      card.style.transform = `perspective(700px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-4px)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });
  });
})();

/* HEXAGON PARTICLES — mouse reactive */
(function () {
  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  if (prefersReduced) return;
  const canvas = document.getElementById("pc");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const COUNT = 50,
    HEX_MIN = 3,
    HEX_MAX = 8;
  const MAX_DIST = 130,
    MOUSE_R = 150,
    REPEL = 2.5,
    FRICTION = 0.88,
    RETURN = 0.016;
  const COLORS = ["0,200,150", "14,165,201"];

  let W, H;
  const mouse = { x: -9999, y: -9999 };

  window.addEventListener(
    "mousemove",
    (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    },
    { passive: true },
  );
  window.addEventListener("mouseleave", () => {
    mouse.x = -9999;
    mouse.y = -9999;
  });

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize, { passive: true });

  const rnd = (a, b) => Math.random() * (b - a) + a;

  function hex(x, y, r, angle, color, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i;
      i === 0
        ? ctx.moveTo(r * Math.cos(a), r * Math.sin(a))
        : ctx.lineTo(r * Math.cos(a), r * Math.sin(a));
    }
    ctx.closePath();
    ctx.strokeStyle = `rgba(${color},${alpha})`;
    ctx.lineWidth = 0.75;
    ctx.stroke();
    ctx.restore();
  }

  const pts = Array.from({ length: COUNT }, () => {
    const ox = rnd(0, W),
      oy = rnd(0, H);
    return {
      ox,
      oy,
      x: ox,
      y: oy,
      vx: 0,
      vy: 0,
      r: rnd(HEX_MIN, HEX_MAX),
      angle: rnd(0, Math.PI),
      spin: rnd(-0.003, 0.003),
      color: COLORS[Math.random() > 0.5 ? 0 : 1],
      alpha: rnd(0.18, 0.52),
      dvx: rnd(-0.1, 0.1),
      dvy: rnd(-0.08, 0.08),
    };
  });

  function loop() {
    ctx.clearRect(0, 0, W, H);
    pts.forEach((p) => {
      p.ox += p.dvx;
      p.oy += p.dvy;
      if (p.ox < -20) {
        p.ox = W + 20;
        p.x = p.ox;
      }
      if (p.ox > W + 20) {
        p.ox = -20;
        p.x = p.ox;
      }
      if (p.oy < -20) {
        p.oy = H + 20;
        p.y = p.oy;
      }
      if (p.oy > H + 20) {
        p.oy = -20;
        p.y = p.oy;
      }
      const dx = p.x - mouse.x,
        dy = p.y - mouse.y,
        d = Math.sqrt(dx * dx + dy * dy);
      if (d < MOUSE_R && d > 0) {
        const f = (1 - d / MOUSE_R) * REPEL;
        p.vx += (dx / d) * f;
        p.vy += (dy / d) * f;
      }
      p.vx += (p.ox - p.x) * RETURN;
      p.vy += (p.oy - p.y) * RETURN;
      p.vx *= FRICTION;
      p.vy *= FRICTION;
      p.x += p.vx;
      p.y += p.vy;
      p.angle += p.spin;
    });
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x,
          dy = pts[i].y - pts[j].y,
          d = Math.sqrt(dx * dx + dy * dy);
        if (d < MAX_DIST) {
          ctx.beginPath();
          ctx.moveTo(pts[i].x, pts[i].y);
          ctx.lineTo(pts[j].x, pts[j].y);
          ctx.strokeStyle = `rgba(${pts[i].color},${(1 - d / MAX_DIST) * 0.12})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
    pts.forEach((p) => {
      const dx = p.x - mouse.x,
        dy = p.y - mouse.y,
        d = Math.sqrt(dx * dx + dy * dy);
      const near = d < MOUSE_R;
      hex(
        p.x,
        p.y,
        near ? p.r + (1 - d / MOUSE_R) * 3 : p.r,
        p.angle,
        p.color,
        near ? Math.min(p.alpha + (1 - d / MOUSE_R) * 0.35, 0.85) : p.alpha,
      );
    });
    requestAnimationFrame(loop);
  }
  loop();
})();
