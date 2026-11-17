let active = false;
let ctx: CanvasRenderingContext2D | null = null;
let particles: Array<{x:number;y:number;vx:number;vy:number;rot:number;vr:number;life:number;max:number;color:string;size:number}> = [];

export function mountConfetti(root: HTMLElement): void {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;';
  root.appendChild(canvas);
  if (!(canvas instanceof HTMLCanvasElement)) return;
  (globalThis as any)._confettiCanvas = canvas;
}

function getCanvas(): HTMLCanvasElement | null {
  return (globalThis as any)._confettiCanvas as HTMLCanvasElement | null;
}

function ensureCtx(): CanvasRenderingContext2D | null {
  const c = getCanvas();
  if (!c) return null;
  if (!ctx) {
    ctx = c.getContext('2d') ?? null;
  }
  return ctx;
}

function resize(): void {
  const c = getCanvas();
  if (!c) return;
  c.width = window.innerWidth;
  c.height = window.innerHeight;
}

function spawn(n = 80): void {
  const canvas = getCanvas();
  if (!canvas || !ctx) return;
  const w = canvas.width, h = canvas.height;
  const colors = ['#ff5b2e','#ff8a5c','#ffd166','#06d6a0','#118ab2','#8338ec','#ffffff'];
  for (let i = 0; i < n; i++) {
    particles.push({
      x: w * 0.5 + (Math.random() - 0.5) * w * 0.3,
      y: h * 0.4 + Math.random() * h * 0.2,
      vx: (Math.random() - 0.5) * 14,
      vy: -Math.random() * 18 - 4,
      rot: Math.random() * 360,
      vr: (Math.random() - 0.5) * 12,
      life: 0,
      max: 70 + Math.random() * 50,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 6 + Math.random() * 6,
    });
  }
  active = true;
}

function tick(): void {
  const c = ensureCtx();
  if (!c || !active) {
    if (c) c.clearRect(0, 0, getCanvas()?.width ?? 0, getCanvas()?.height ?? 0);
    return;
  }
  const canvas = getCanvas();
  if (!canvas) return;
  c.clearRect(0, 0, canvas.width, canvas.height);
  let alive = 0;
  for (const p of particles) {
    p.life++;
    p.vy += 0.18;
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vr;
    p.vx *= 0.99;
    if (p.life < p.max) alive++;
    if (p.life < p.max) {
      c.save();
      c.translate(p.x, p.y);
      c.rotate(p.rot * Math.PI / 180);
      c.fillStyle = p.color;
      c.globalAlpha = Math.max(0, 1 - p.life / p.max);
      c.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      c.restore();
    }
  }
  particles = particles.filter(p => p.life < p.max);
  if (alive === 0) { active = false; particles = []; }
  if (active) requestAnimationFrame(tick);
}

function emit(n = 80): void {
  resize();
  spawn(n);
  if (!active) requestAnimationFrame(tick);
}

(globalThis as any)._confettiEmit = function burst(this: unknown, ...args: unknown[]) {
  const n = typeof args[0] === 'number' ? args[0] : 80;
  emit(n);
};

declare global {
  interface Window {
    _confettiEmit?: (n?: number) => void;
  }
}

export function confettiBurst(n = 80): void {
  if ((globalThis as any)._confettiEmit) (globalThis as any)._confettiEmit(n);
  else emit(n);
}

if (typeof window !== 'undefined') {
  window.addEventListener('resize', resize);
  resize();
}
