/* Effets : compteur, confettis, onde au clic, parallaxe. */
export const REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function countUp(el, to, suffix) {
  if (!el || REDUCED) return;
  const t0 = performance.now();
  (function frame(t) {
    const k = Math.min(1, (t - t0) / 700);
    el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))) + suffix;
    if (k < 1) requestAnimationFrame(frame);
  })(t0);
}
export function confetti() {
  if (REDUCED) return;
  const c = document.createElement("canvas"); c.className = "confetti"; document.body.appendChild(c);
  const ctx = c.getContext("2d"), W = c.width = window.innerWidth, H = c.height = window.innerHeight;
  const cols = ["#4285f4", "#ea4335", "#fbbc04", "#34a853"];
  const P = Array.from({ length: 60 }, (_, i) => ({
    x: W / 2 + (Math.random() - .5) * W * .3, y: H * .4,
    vx: (Math.random() - .5) * 10, vy: -Math.random() * 10 - 3,
    s: 6 + Math.random() * 7, r: Math.random() * 6, vr: (Math.random() - .5) * .4,
    c: cols[i % 4], round: Math.random() < .4
  }));
  const t0 = performance.now(), LIFE = 2200;
  (function frame(t) {
    const el = t - t0;
    ctx.clearRect(0, 0, W, H);
    P.forEach(p => {
      p.vy += .32; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
      ctx.globalAlpha = Math.max(0, Math.min(1, (LIFE - el) / 800)); ctx.fillStyle = p.c;
      if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.s / 2, 0, 7); ctx.fill(); } else ctx.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * .66);
      ctx.restore();
    });
    if (el < LIFE) requestAnimationFrame(frame); else c.remove();
  })(t0);
}

// Écouteurs globaux : onde Material au point de contact, formes de l'accueil qui suivent le pointeur.
export function initEffects() {
  document.addEventListener("pointerdown", e => {
    if (REDUCED) return;
    const el = e.target.closest(".btn, .opt:not(.locked), .nav-grid button, .chip > span");
    if (!el || el.disabled) return;
    const r = el.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2.2;
    const s = document.createElement("span"); s.className = "ripple";
    s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
    el.appendChild(s); s.addEventListener("animationend", () => s.remove());
  });
  document.addEventListener("pointermove", e => {
    const hero = document.getElementById("hero"); if (!hero || REDUCED) return;
    const r = hero.getBoundingClientRect();
    hero.style.setProperty("--px", ((e.clientX - r.left) / r.width - .5).toFixed(3));
    hero.style.setProperty("--py", ((e.clientY - r.top) / r.height - .5).toFixed(3));
  });
}
