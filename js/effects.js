/* Baby Roulette : effets de fête (confettis) et de raté (petit nuage) dessinés sur un canvas éphémère */

import { reducedMotion } from "./ui.js";

const PALETTE = ["#4E9BFF", "#FF6F9F", "#FFC94A", "#2FBF8F", "#9B7BFF"];

function makeCanvas() {
  const canvas = document.createElement("canvas");
  canvas.className = "fx-canvas";
  canvas.setAttribute("aria-hidden", "true");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  document.body.append(canvas);
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  return { canvas, ctx, w: innerWidth, h: innerHeight };
}

function run(step, duration) {
  const { canvas, ctx, w, h } = makeCanvas();
  const start = performance.now();
  return new Promise(resolve => {
    function frame(now) {
      const elapsed = now - start;
      ctx.clearRect(0, 0, w, h);
      const alive = step(ctx, w, h, elapsed);
      if (alive && elapsed < duration) requestAnimationFrame(frame);
      else { canvas.remove(); resolve(); }
    }
    requestAnimationFrame(frame);
  });
}

// Pluie de confettis partant de deux canons en bas de l’écran
export function confetti({ colors = PALETTE, count = 180 } = {}) {
  if (reducedMotion()) return Promise.resolve();
  const w = innerWidth, h = innerHeight;
  const parts = Array.from({ length: count }, (_, i) => {
    const left = i % 2 === 0;
    const angle = (left ? -60 : -120) + (Math.random() - 0.5) * 50;
    const speed = 9 + Math.random() * 9;
    return {
      x: left ? w * 0.08 : w * 0.92,
      y: h + 10,
      vx: Math.cos(angle * Math.PI / 180) * speed * (w < 600 ? 0.7 : 1),
      vy: Math.sin(angle * Math.PI / 180) * speed * (h < 700 ? 1.05 : 1.3),
      size: 6 + Math.random() * 7,
      rot: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.3,
      tilt: Math.random() * Math.PI,
      color: colors[i % colors.length],
      round: Math.random() < 0.3
    };
  });
  return run((ctx, cw, ch, t) => {
    let alive = false;
    for (const p of parts) {
      p.vy += 0.28;
      p.vx *= 0.99;
      p.vy *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.spin;
      p.tilt += 0.12;
      if (p.y < ch + 20) alive = true;
      ctx.save();
      ctx.globalAlpha = t > 3200 ? Math.max(0, 1 - (t - 3200) / 800) : 1;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.round) {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2.4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.size / 2, -p.size / 4 * Math.abs(Math.cos(p.tilt)), p.size, p.size / 2 * Math.abs(Math.cos(p.tilt)) + 1);
      }
      ctx.restore();
    }
    return alive;
  }, 4000);
}

// Petit nuage gris qui s’échappe d’un élément (partie perdue)
export function puff(from) {
  if (reducedMotion()) return Promise.resolve();
  const rect = from ? from.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
  const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
  const dark = matchMedia("(prefers-color-scheme: dark)").matches;
  const parts = Array.from({ length: 28 }, () => ({
    x: cx + (Math.random() - 0.5) * rect.width * 0.6,
    y: cy + (Math.random() - 0.5) * rect.height * 0.4,
    vx: (Math.random() - 0.5) * 3,
    vy: -0.6 - Math.random() * 1.8,
    r: 10 + Math.random() * 18,
    a: 0.55
  }));
  return run(ctx => {
    let alive = false;
    for (const p of parts) {
      p.x += p.vx; p.y += p.vy; p.r += 0.5; p.a -= 0.009;
      if (p.a <= 0) continue;
      alive = true;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = dark ? `rgba(200,195,230,${p.a})` : `rgba(110,104,140,${p.a})`;
      ctx.fill();
    }
    return alive;
  }, 2500);
}
