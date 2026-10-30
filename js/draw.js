/** Side views. E30, E36, and E46 use the reference photos.
 *  The other chassis stay on the measured outline.
 *  Sprites are stored nose-left. The strip asks for face "right".
 */

import { sampleCurve } from "./sim.js?v=3";
import { TRACES } from "./traces.js?v=3";

const PHOTO_PACKS = {
  e30: {
    stock: { file: "e30-stock.png", aspect: 1180 / 382 },
    mod: { file: "e30-mod.png", aspect: 1097 / 342 },
  },
  e36: {
    stock: { file: "e36-stock.png", aspect: 1400 / 431 },
    mod: { file: "e36-mod.png", aspect: 462 / 137 },
  },
  e46: {
    stock: { file: "e46-stock.png", aspect: 800 / 259 },
    mod: { file: "e46-mod.png", aspect: 795 / 249 },
  },
};

const spriteListeners = new Set();
let spritesLeft = 0;

function settleSprite() {
  spritesLeft -= 1;
  if (spritesLeft > 0) return;
  for (const fn of spriteListeners) fn();
}

function loadSprite(entry) {
  const img = new Image();
  let settled = false;
  spritesLeft += 1;
  const done = () => {
    if (settled) return;
    settled = true;
    settleSprite();
  };
  img.onload = done;
  img.onerror = done;
  img.decoding = "async";
  img.src = new URL(`../assets/cars/${entry.file}?v=3`, import.meta.url).href;
  entry.img = img;
  if (img.complete) done();
}

for (const pack of Object.values(PHOTO_PACKS)) {
  loadSprite(pack.stock);
  loadSprite(pack.mod);
}

export function onCarSprites(fn) {
  spriteListeners.add(fn);
  if (spritesLeft === 0) fn();
}

function aeroLook(opts) {
  return (opts.suspension >= 1) || (opts.tires >= 2) || (opts.weight >= 1);
}

function photoFor(car, opts) {
  const pack = PHOTO_PACKS[car.shape];
  if (!pack) return null;
  return aeroLook(opts) ? pack.mod : pack.stock;
}

const SHAPES = {
  e30: {
    boxy: true,
    doors: 2,
    rocker: 0.2,
    arch: 0.2,
    archW: 0.1,
    flare: "box",
    spoiler: 0.07,
    grille: [0.0, 0.3, 0.055, 0.46],
    upper: [
      [0, 0.28], [0.02, 0.42], [0.07, 0.49], [0.34, 0.48],
      [0.4, 0.62], [0.46, 0.8], [0.64, 0.82], [0.69, 0.56],
      [0.86, 0.55], [0.97, 0.46], [1, 0.3],
    ],
    panes: [
      [[0.47, 0.52], [0.51, 0.74], [0.63, 0.76], [0.66, 0.54]],
    ],
  },
  e36: {
    doors: 2,
    rocker: 0.19,
    arch: 0.16,
    archW: 0.09,
    grille: [0.01, 0.26, 0.07, 0.4],
    upper: [
      [0, 0.22], [0.04, 0.36], [0.12, 0.42], [0.34, 0.4],
      [0.42, 0.56], [0.5, 0.74], [0.66, 0.76], [0.74, 0.5],
      [0.9, 0.42], [1, 0.24],
    ],
    panes: [
      [[0.46, 0.44], [0.52, 0.68], [0.64, 0.7], [0.7, 0.56], [0.64, 0.46]],
    ],
  },
  e46: {
    doors: 2,
    rocker: 0.18,
    arch: 0.17,
    archW: 0.092,
    dome: true,
    lip: true,
    grille: [0.012, 0.24, 0.07, 0.38],
    upper: [
      [0, 0.2], [0.05, 0.32], [0.14, 0.39], [0.36, 0.37],
      [0.44, 0.52], [0.5, 0.7], [0.66, 0.72], [0.74, 0.46],
      [0.9, 0.38], [1, 0.22],
    ],
    panes: [
      [[0.47, 0.4], [0.52, 0.64], [0.64, 0.66], [0.71, 0.52], [0.64, 0.42]],
    ],
  },
  e92: {
    doors: 2,
    rocker: 0.17,
    arch: 0.16,
    archW: 0.088,
    scoop: true,
    lip: true,
    grille: [0.02, 0.22, 0.08, 0.35],
    upper: [
      [0, 0.18], [0.06, 0.28], [0.16, 0.35], [0.4, 0.32],
      [0.48, 0.48], [0.54, 0.66], [0.7, 0.68], [0.78, 0.42],
      [0.92, 0.32], [1, 0.18],
    ],
    panes: [
      [[0.5, 0.36], [0.55, 0.6], [0.68, 0.62], [0.75, 0.48], [0.68, 0.38]],
    ],
  },
  e82: {
    doors: 2,
    rocker: 0.2,
    arch: 0.17,
    archW: 0.095,
    grille: [0.008, 0.28, 0.065, 0.43],
    upper: [
      [0, 0.24], [0.04, 0.38], [0.12, 0.45], [0.3, 0.43],
      [0.38, 0.6], [0.46, 0.78], [0.68, 0.8], [0.8, 0.5],
      [0.94, 0.4], [1, 0.24],
    ],
    panes: [
      [[0.42, 0.46], [0.48, 0.72], [0.66, 0.74], [0.76, 0.56], [0.66, 0.48]],
    ],
  },
  e90: {
    doors: 4,
    rocker: 0.19,
    arch: 0.15,
    archW: 0.086,
    grille: [0.008, 0.26, 0.065, 0.42],
    upper: [
      [0, 0.22], [0.05, 0.36], [0.14, 0.42], [0.28, 0.41],
      [0.34, 0.56], [0.4, 0.74], [0.62, 0.76], [0.68, 0.5],
      [0.76, 0.46], [0.94, 0.44], [1, 0.26],
    ],
    panes: [
      [[0.4, 0.44], [0.44, 0.68], [0.54, 0.7], [0.56, 0.46]],
      [[0.58, 0.46], [0.58, 0.7], [0.63, 0.72], [0.67, 0.54], [0.63, 0.48]],
    ],
  },
  e39: {
    doors: 4,
    rocker: 0.2,
    arch: 0.14,
    archW: 0.08,
    grille: [0.008, 0.26, 0.07, 0.42],
    upper: [
      [0, 0.24], [0.06, 0.36], [0.16, 0.42], [0.3, 0.41],
      [0.36, 0.56], [0.42, 0.76], [0.64, 0.78], [0.7, 0.52],
      [0.78, 0.48], [0.95, 0.46], [1, 0.28],
    ],
    panes: [
      [[0.42, 0.44], [0.46, 0.7], [0.56, 0.72], [0.58, 0.46]],
      [[0.6, 0.46], [0.6, 0.72], [0.65, 0.74], [0.69, 0.54], [0.65, 0.48]],
    ],
  },
  e60: {
    doors: 4,
    rocker: 0.18,
    arch: 0.15,
    archW: 0.082,
    grille: [0.015, 0.24, 0.075, 0.38],
    upper: [
      [0, 0.2], [0.06, 0.32], [0.16, 0.37], [0.32, 0.34],
      [0.38, 0.5], [0.44, 0.7], [0.66, 0.72], [0.72, 0.46],
      [0.82, 0.4], [0.96, 0.34], [1, 0.2],
    ],
    panes: [
      [[0.44, 0.4], [0.48, 0.64], [0.58, 0.66], [0.6, 0.42]],
      [[0.62, 0.42], [0.62, 0.66], [0.66, 0.68], [0.71, 0.5], [0.66, 0.44]],
    ],
  },
  f80: {
    doors: 4,
    rocker: 0.16,
    arch: 0.15,
    archW: 0.084,
    dome: true,
    grille: [0.02, 0.2, 0.09, 0.36],
    upper: [
      [0, 0.16], [0.07, 0.28], [0.18, 0.33], [0.38, 0.3],
      [0.46, 0.46], [0.52, 0.64], [0.68, 0.66], [0.74, 0.42],
      [0.84, 0.36], [0.97, 0.3], [1, 0.16],
    ],
    panes: [
      [[0.5, 0.36], [0.54, 0.58], [0.62, 0.6], [0.63, 0.38]],
      [[0.65, 0.38], [0.65, 0.6], [0.69, 0.62], [0.73, 0.46], [0.69, 0.4]],
    ],
  },
  f87: {
    doors: 2,
    rocker: 0.18,
    arch: 0.18,
    archW: 0.098,
    grille: [0.012, 0.24, 0.075, 0.4],
    upper: [
      [0, 0.2], [0.05, 0.34], [0.14, 0.39], [0.32, 0.36],
      [0.4, 0.52], [0.46, 0.7], [0.66, 0.73], [0.76, 0.44],
      [0.9, 0.36], [1, 0.2],
    ],
    panes: [
      [[0.44, 0.4], [0.49, 0.64], [0.64, 0.67], [0.72, 0.5], [0.64, 0.42]],
    ],
  },
  g20: {
    doors: 4,
    rocker: 0.17,
    arch: 0.15,
    archW: 0.084,
    grille: [0.015, 0.22, 0.07, 0.4],
    upper: [
      [0, 0.17], [0.06, 0.32], [0.16, 0.37], [0.32, 0.34],
      [0.38, 0.5], [0.44, 0.7], [0.64, 0.74], [0.7, 0.46],
      [0.78, 0.42], [0.96, 0.36], [1, 0.18],
    ],
    panes: [
      [[0.43, 0.4], [0.47, 0.64], [0.56, 0.67], [0.58, 0.42]],
      [[0.6, 0.42], [0.6, 0.67], [0.64, 0.69], [0.69, 0.5], [0.64, 0.44]],
    ],
  },
  f90: {
    doors: 4,
    rocker: 0.16,
    arch: 0.15,
    archW: 0.08,
    grille: [0.012, 0.2, 0.08, 0.42],
    upper: [
      [0, 0.16], [0.07, 0.32], [0.18, 0.37], [0.34, 0.33],
      [0.4, 0.5], [0.46, 0.68], [0.66, 0.72], [0.72, 0.44],
      [0.8, 0.4], [0.97, 0.34], [1, 0.16],
    ],
    panes: [
      [[0.45, 0.38], [0.49, 0.62], [0.58, 0.65], [0.6, 0.4]],
      [[0.62, 0.4], [0.62, 0.65], [0.66, 0.67], [0.71, 0.48], [0.66, 0.42]],
    ],
  },
  f92: {
    doors: 2,
    rocker: 0.14,
    arch: 0.13,
    archW: 0.08,
    grille: [0.02, 0.16, 0.09, 0.32],
    upper: [
      [0, 0.16], [0.07, 0.26], [0.18, 0.3], [0.42, 0.27],
      [0.5, 0.4], [0.56, 0.56], [0.74, 0.58], [0.82, 0.34],
      [0.94, 0.24], [1, 0.14],
    ],
    panes: [
      [[0.52, 0.3], [0.57, 0.5], [0.72, 0.52], [0.79, 0.38], [0.72, 0.32]],
    ],
  },
  g80: {
    doors: 4,
    rocker: 0.16,
    arch: 0.17,
    archW: 0.09,
    dome: true,
    grille: [0.0, 0.18, 0.055, 0.48],
    upper: [
      [0, 0.18], [0.015, 0.44], [0.08, 0.43], [0.34, 0.37],
      [0.42, 0.52], [0.48, 0.68], [0.66, 0.72], [0.74, 0.46],
      [0.84, 0.4], [0.98, 0.32], [1, 0.16],
    ],
    panes: [
      [[0.47, 0.42], [0.51, 0.62], [0.59, 0.64], [0.6, 0.44]],
      [[0.62, 0.44], [0.62, 0.64], [0.66, 0.67], [0.72, 0.5], [0.67, 0.45]],
    ],
  },
  g87: {
    doors: 2,
    rocker: 0.17,
    arch: 0.18,
    archW: 0.1,
    grille: [0.0, 0.22, 0.06, 0.4],
    upper: [
      [0, 0.18], [0.02, 0.36], [0.1, 0.4], [0.3, 0.36],
      [0.38, 0.52], [0.44, 0.7], [0.66, 0.74], [0.76, 0.46],
      [0.9, 0.36], [1, 0.18],
    ],
    panes: [
      [[0.42, 0.4], [0.47, 0.64], [0.64, 0.68], [0.72, 0.52], [0.64, 0.42]],
    ],
  },
};

function mapPoint(pt, L, H, ground) {
  return [pt[0] * L, ground - pt[1] * H];
}

function traceUpper(ctx, pts, L, H, ground, boxy) {
  const p = pts.map((pt) => mapPoint(pt, L, H, ground));
  ctx.moveTo(p[0][0], p[0][1]);
  if (boxy || p.length < 3) {
    for (let i = 1; i < p.length; i += 1) ctx.lineTo(p[i][0], p[i][1]);
    return;
  }
  for (let i = 0; i < p.length - 1; i += 1) {
    const p0 = p[Math.max(0, i - 1)];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[Math.min(p.length - 1, i + 2)];
    ctx.bezierCurveTo(
      p1[0] + (p2[0] - p0[0]) / 6,
      p1[1] + (p2[1] - p0[1]) / 6,
      p2[0] - (p3[0] - p1[0]) / 6,
      p2[1] - (p3[1] - p1[1]) / 6,
      p2[0],
      p2[1],
    );
  }
}

function archLift(offset, boxy) {
  const ad = Math.abs(offset);
  if (ad >= 1) return 0;
  if (boxy) return ad < 0.62 ? 1 : (1 - ad) / 0.38;
  return Math.cos((ad * Math.PI) / 2);
}

function addBody(ctx, spec, L, H, ground, frontAxle, rearAxle, arch, archW) {
  traceUpper(ctx, spec.upper, L, H, ground, spec.boxy);
  const steps = 42;
  for (let i = 0; i <= steps; i += 1) {
    const t = 1 - i / steps;
    let y = spec.rocker;
    for (const axle of [rearAxle, frontAxle]) {
      const lift = archLift((t - axle) / archW, spec.flare === "box");
      y = Math.max(y, spec.rocker + lift * arch);
    }
    const p = mapPoint([t, y], L, H, ground);
    ctx.lineTo(p[0], p[1]);
  }
  ctx.closePath();
}

export function spriteHeight(car, opts = {}) {
  const photo = photoFor(car, opts);
  if (photo) return car.length / photo.aspect;
  const trace = traceFor(car, opts);
  if (!trace) return car.height;
  return car.length / trace.aspect;
}

function traceFor(car, opts) {
  const pack = TRACES[car.shape];
  if (!pack) return null;
  const aero = (opts.suspension >= 1) || (opts.tires >= 2) || (opts.weight >= 1);
  const src = aero && pack.mod ? pack.mod : pack;
  const dressed = aero || (opts.tires >= 1);
  return {
    aspect: src.aspect,
    body: src.body,
    windows: src.windows,
    wheels: src.wheels,
    wheel: dressed && pack.mod ? pack.mod.wheel : pack.wheel,
    rim: dressed && pack.mod ? pack.mod.rim : pack.rim,
  };
}

export function drawCar(ctx, car, paint, x, ground, px, opts = {}) {
  const lengthPx = car.length * px;
  ctx.save();
  let localX = x;
  let localOpts = opts;
  if (opts.face === "right") {
    ctx.translate(x + lengthPx, 0);
    ctx.scale(-1, 1);
    localX = 0;
    localOpts = { ...opts, spin: -(opts.spin || 0) };
  }
  const photo = photoFor(car, localOpts);
  if (photo?.img?.complete && photo.img.naturalWidth) {
    drawPhoto(ctx, car, photo, localX, ground, px);
    ctx.restore();
    return;
  }
  const traced = traceFor(car, localOpts);
  if (traced) {
    drawTraced(ctx, car, traced, paint, localX, ground, px, localOpts);
    ctx.restore();
    return;
  }
  drawOutline(ctx, car, paint, localX, ground, px, localOpts);
  ctx.restore();
}

function drawPhoto(ctx, car, photo, x, ground, px) {
  const L = car.length * px;
  const H = L / photo.aspect;
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = "rgba(0,0,0,.2)";
  ctx.beginPath();
  ctx.ellipse(x + L * 0.5, ground + 1, L * 0.36, Math.max(3, px * 0.05), 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.drawImage(photo.img, x, ground - H, L, H);
  ctx.restore();
}

function drawOutline(ctx, car, paint, x, ground, px, opts = {}) {
  const shape = SHAPES[car.shape] ? car.shape : "e46";
  const spec = SHAPES[shape];
  const L = car.length * px;
  const H = car.height * px;
  const radiusM = opts.tireRadius || 0.33;
  const wheelR = radiusM * px;
  const frontAxle = ((car.length - car.wheelbase) * 0.44) / car.length;
  const rearAxle = frontAxle + car.wheelbase / car.length;
  const arch = spec.flare === "box" ? 0.16 : Math.min(spec.arch, 0.1);
  const archW = spec.flare === "box" ? 0.09 : Math.min(spec.archW, 0.072);
  ctx.save();
  ctx.translate(x, 0);

  ctx.fillStyle = "rgba(0,0,0,.22)";
  ctx.beginPath();
  ctx.ellipse(L * 0.52, ground + 2, L * 0.4, Math.max(3, px * 0.07), 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  addBody(ctx, spec, L, H, ground, frontAxle, rearAxle, arch, archW);
  ctx.fillStyle = paint;
  ctx.fill();
  ctx.strokeStyle = "rgba(20,22,26,.55)";
  ctx.lineWidth = Math.max(1, px * 0.012);
  ctx.stroke();

  ctx.save();
  ctx.clip();
  ctx.strokeStyle = "rgba(255,255,255,.28)";
  ctx.lineWidth = Math.max(1, px * 0.01);
  const belt = spec.upper.filter((pt) => pt[1] < 0.6 && pt[0] > 0.08 && pt[0] < 0.92);
  if (belt.length > 1) {
    ctx.beginPath();
    const a = mapPoint(belt[0], L, H, ground);
    ctx.moveTo(a[0], a[1] + H * 0.02);
    for (let i = 1; i < belt.length; i += 1) {
      const p = mapPoint(belt[i], L, H, ground);
      ctx.lineTo(p[0], p[1] + H * 0.02);
    }
    ctx.stroke();
  }
  ctx.restore();

  ctx.fillStyle = "rgba(8,10,14,.82)";
  for (const pane of spec.panes) {
    ctx.beginPath();
    pane.forEach((pt, i) => {
      const p = mapPoint(pt, L, H, ground);
      if (i === 0) ctx.moveTo(p[0], p[1]);
      else ctx.lineTo(p[0], p[1]);
    });
    ctx.closePath();
    ctx.fill();
  }

  if (spec.doors === 4 && spec.panes.length === 2) {
    ctx.strokeStyle = "rgba(20,22,26,.35)";
    ctx.lineWidth = 1;
    const seam = spec.panes[0][spec.panes[0].length - 1][0];
    ctx.beginPath();
    ctx.moveTo(seam * L, ground - spec.rocker * H);
    ctx.lineTo(seam * L, ground - 0.62 * H);
    ctx.stroke();
  }

  ctx.save();
  ctx.beginPath();
  addBody(ctx, spec, L, H, ground, frontAxle, rearAxle, arch, archW);
  ctx.clip();
  const g = spec.grille;
  const gx = Math.max(g[0], 0.012) * L;
  const gy = ground - g[3] * H;
  const gw = (g[2] - g[0]) * L;
  const gh = (g[3] - g[1]) * H;
  ctx.fillStyle = "#121418";
  if (shape === "g80" || shape === "g87") {
    roundRect(ctx, gx, gy, gw, gh, 1);
  } else {
    roundRect(ctx, gx, gy, gw * 0.42, gh, 1.5);
    roundRect(ctx, gx + gw * 0.55, gy, gw * 0.42, gh, 1.5);
  }
  ctx.fillStyle = "rgba(255,255,255,.75)";
  ctx.fillRect(gx + gw + L * 0.006, gy + gh * 0.25, Math.max(2, L * 0.028), gh * 0.35);
  ctx.restore();

  if (spec.dome) {
    ctx.fillStyle = "rgba(0,0,0,.12)";
    ctx.beginPath();
    ctx.ellipse(L * 0.28, ground - H * 0.4, L * 0.08, H * 0.025, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (spec.scoop) {
    ctx.fillStyle = "#1a1c20";
    ctx.fillRect(L * 0.24, ground - H * 0.4, L * 0.09, Math.max(3, H * 0.035));
  }
  if (spec.spoiler) {
    ctx.fillStyle = paint;
    ctx.strokeStyle = "rgba(20,22,26,.55)";
    ctx.beginPath();
    ctx.rect(L * 0.72, ground - H * (0.56 + spec.spoiler), L * 0.1, H * spec.spoiler);
    ctx.fill();
    ctx.stroke();
  }
  if (spec.lip) {
    ctx.fillStyle = paint;
    ctx.fillRect(L * 0.82, ground - H * 0.44, L * 0.08, Math.max(2, H * 0.02));
  }

  ctx.fillStyle = "#8e2a2a";
  ctx.fillRect(L * 0.955, ground - H * 0.34, Math.max(2, L * 0.03), H * 0.08);

  if (opts.induction >= 2) {
    ctx.fillStyle = "#1a1c20";
    ctx.fillRect(L * 0.2, ground - H * 0.46, L * 0.08, Math.max(2, H * 0.03));
  }
  if (opts.exhaust) {
    ctx.fillStyle = "#d5d8de";
    ctx.beginPath();
    ctx.arc(L * 0.97, ground - H * 0.16, Math.max(2, px * 0.04), 0, Math.PI * 2);
    ctx.fill();
  }

  const mirror = spec.panes[0][0];
  ctx.fillStyle = paint;
  ctx.strokeStyle = "rgba(20,22,26,.45)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(mirror[0] * L, ground - mirror[1] * H);
  ctx.lineTo(mirror[0] * L - px * 0.04, ground - mirror[1] * H - px * 0.02);
  ctx.lineTo(mirror[0] * L + px * 0.06, ground - mirror[1] * H - px * 0.015);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  drawWheel(ctx, frontAxle * L, ground - wheelR, wheelR, opts.spin || 0, "five", "#d5d8de");
  drawWheel(ctx, rearAxle * L, ground - wheelR, wheelR, opts.spin || 0, "five", "#d5d8de");
  ctx.restore();
}

function drawTraced(ctx, car, trace, paint, x, ground, px, opts) {
  const L = car.length * px;
  const H = L / trace.aspect;
  const at = (p) => [p[0] * L, ground - p[1] * H];
  ctx.save();
  ctx.translate(x, 0);
  ctx.fillStyle = "rgba(0,0,0,.22)";
  ctx.beginPath();
  ctx.ellipse(L * 0.5, ground + 2, L * 0.38, Math.max(3, px * 0.06), 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  trace.body.forEach((p, i) => {
    const q = at(p);
    if (i === 0) ctx.moveTo(q[0], q[1]);
    else ctx.lineTo(q[0], q[1]);
  });
  ctx.closePath();
  ctx.fillStyle = paint;
  ctx.fill();
  ctx.strokeStyle = "rgba(20,22,26,.45)";
  ctx.lineWidth = Math.max(1, px * 0.01);
  ctx.stroke();

  ctx.fillStyle = "rgba(8,10,14,.9)";
  for (const pane of trace.windows) {
    ctx.beginPath();
    pane.forEach((p, i) => {
      const q = at(p);
      if (i === 0) ctx.moveTo(q[0], q[1]);
      else ctx.lineTo(q[0], q[1]);
    });
    ctx.closePath();
    ctx.fill();
  }

  if (opts.exhaust) {
    const tail = trace.body.reduce((best, p) => (p[0] > best[0] ? p : best), trace.body[0]);
    ctx.fillStyle = "#d5d8de";
    ctx.beginPath();
    ctx.arc(Math.min(L * 0.985, tail[0] * L), ground - Math.max(0.1, tail[1] * 0.45) * H, Math.max(2, px * 0.035), 0, Math.PI * 2);
    ctx.fill();
  }

  for (const wheel of trace.wheels) {
    drawWheel(ctx, wheel.x * L, ground - wheel.y * H, wheel.r * H, opts.spin || 0, trace.wheel, trace.rim);
  }
  ctx.restore();
}

function drawWheel(ctx, cx, cy, r, spin, style, rim) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = "#14161a";
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  const lip = style === "dish" ? 0.2 : style === "mesh" ? 0.09 : 0.13;
  ctx.strokeStyle = rim || "#d5d8de";
  ctx.lineWidth = Math.max(1, r * lip);
  ctx.beginPath();
  ctx.arc(0, 0, r * (style === "dish" ? 0.7 : 0.8), 0, Math.PI * 2);
  ctx.stroke();
  ctx.save();
  ctx.rotate(spin || 0);
  ctx.lineCap = "round";
  if (style === "mesh") {
    ctx.strokeStyle = rim || "#d0d4da";
    ctx.lineWidth = Math.max(1, r * 0.03);
    for (let i = 0; i < 16; i += 1) {
      const a = (i / 16) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.18, Math.sin(a) * r * 0.18);
      ctx.lineTo(Math.cos(a) * r * 0.68, Math.sin(a) * r * 0.68);
      ctx.stroke();
    }
    for (const ring of [0.34, 0.52]) {
      ctx.beginPath();
      ctx.arc(0, 0, r * ring, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (style === "star") {
    ctx.strokeStyle = "#b7bcc4";
    ctx.lineWidth = Math.max(1, r * 0.055);
    for (let i = 0; i < 10; i += 1) {
      const a = (i / 10) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.16, Math.sin(a) * r * 0.16);
      ctx.lineTo(Math.cos(a) * r * 0.64, Math.sin(a) * r * 0.64);
      ctx.stroke();
    }
  } else {
    ctx.strokeStyle = style === "dish" ? "#eceff3" : (rim || "#c5c9d0");
    ctx.lineWidth = Math.max(1.2, r * (style === "dish" ? 0.15 : 0.11));
    for (let i = 0; i < 5; i += 1) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.14, Math.sin(a) * r * 0.14);
      ctx.lineTo(Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.6);
      ctx.stroke();
    }
  }
  ctx.restore();
  ctx.fillStyle = "#9aa3ad";
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
  ctx.fill();
}

const FONT = "12px Helvetica, Arial, sans-serif";

function scaleCurve(rows, filedHp) {
  const peak = Math.max(...rows.map((row) => row.hp), 1);
  const scale = filedHp / peak;
  return rows.map((row) => ({ ...row, hp: row.hp * scale, tq: row.tq * scale }));
}

export function drawDyno(canvas, spec, stock, sweep = 1) {
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = canvas.clientWidth || 640;
  const h = canvas.clientHeight || 260;
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const pad = { l: 46, r: 16, t: 22, b: 28 };
  const maxRpm = Math.max(spec.redline, stock.redline);
  const tuned = scaleCurve(sampleCurve(spec, 56), spec.hp);
  const base = scaleCurve(sampleCurve(stock, 56), stock.hp);
  const maxHp = Math.max(spec.hp, stock.hp, 200) * 1.08;
  const shown = Math.max(0, Math.min(1, sweep));
  const limit = 800 + (maxRpm - 800) * shown;
  const xOf = (rpm) => pad.l + ((rpm - 800) / (maxRpm - 800)) * (w - pad.l - pad.r);
  const yOf = (hp) => pad.t + (1 - hp / maxHp) * (h - pad.t - pad.b);

  ctx.strokeStyle = "#e2e5ea";
  ctx.lineWidth = 1;
  ctx.font = FONT;
  ctx.fillStyle = "#5c6570";
  ctx.fillText("Crank hp", pad.l, 14);
  const step = Math.max(50, Math.round(maxHp / 4 / 50) * 50);
  for (let hp = 0; hp <= maxHp; hp += step) {
    const y = yOf(hp);
    ctx.strokeStyle = "#eef0f3";
    ctx.beginPath();
    ctx.moveTo(pad.l, y);
    ctx.lineTo(w - pad.r, y);
    ctx.stroke();
    ctx.fillStyle = "#5c6570";
    ctx.fillText(String(Math.round(hp)), 4, y + 4);
  }
  ctx.strokeStyle = "#c5cad1";
  ctx.beginPath();
  ctx.moveTo(pad.l, pad.t);
  ctx.lineTo(pad.l, h - pad.b);
  ctx.lineTo(w - pad.r, h - pad.b);
  ctx.stroke();

  const strokeCurve = (rows, color, width, clip) => {
    const drawn = clip ? rows.filter((row) => row.rpm <= limit + 30) : rows;
    if (!drawn.length) return;
    ctx.beginPath();
    drawn.forEach((row, i) => {
      const x = xOf(row.rpm);
      const y = yOf(row.hp);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  };

  strokeCurve(base, "#9aa3ad", 1.5, false);
  strokeCurve(tuned, "#0c5ebd", 2.4, true);
  if (shown < 1) {
    const row = tuned.reduce((best, item) => (Math.abs(item.rpm - limit) < Math.abs(best.rpm - limit) ? item : best), tuned[0]);
    ctx.fillStyle = "#0c5ebd";
    ctx.beginPath();
    ctx.arc(xOf(row.rpm), yOf(row.hp), 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#5c6570";
  ctx.fillText("Stock", w - 118, 14);
  ctx.fillStyle = "#0c5ebd";
  ctx.fillText(`${Math.round(spec.hp)} hp`, w - 72, 14);
  ctx.fillStyle = "#5c6570";
  ctx.fillText("rpm", w - 32, h - 8);
}

const MARKS = [
  [18.288, "60"],
  [100.584, "330"],
  [201.168, "1/8"],
  [304.8, "1000"],
  [402.336, "1320"],
];

export function drawStrip(ctx, w, h, scene) {
  ctx.clearRect(0, 0, w, h);
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#1a1d22");
  sky.addColorStop(0.45, "#121418");
  sky.addColorStop(1, "#0e1013");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  const ground = h * 0.72;
  ctx.fillStyle = "#2a241c";
  ctx.fillRect(0, ground - h * 0.08, w, h);
  ctx.fillStyle = "#3a3d42";
  ctx.fillRect(0, ground - 8, w, h);

  const laneH = h * 0.18;
  const lanes = [ground - laneH * 1.05, ground + laneH * 0.35];
  lanes.forEach((y) => {
    ctx.fillStyle = "#2c3036";
    ctx.fillRect(0, y - laneH * 0.5, w, laneH);
    ctx.strokeStyle = "rgba(255,255,255,.45)";
    ctx.lineWidth = 2;
    ctx.strokeRect(8, y - laneH * 0.5, w - 16, laneH);
  });

  const { px, cam, player, rival } = scene;
  const sx = (meters) => (meters - cam) * px;

  ctx.font = FONT;
  for (const [dist, label] of MARKS) {
    const x = sx(dist);
    if (x < -20 || x > w + 20) continue;
    ctx.strokeStyle = label === "1320" ? "#f4f6f8" : "rgba(255,255,255,.28)";
    ctx.lineWidth = label === "1320" ? 3 : 1;
    ctx.beginPath();
    ctx.moveTo(x, lanes[0] - laneH * 0.55);
    ctx.lineTo(x, lanes[1] + laneH * 0.55);
    ctx.stroke();
    ctx.fillStyle = "#d5d8de";
    ctx.fillText(label, x + 4, lanes[0] - laneH * 0.62);
  }

  const start = sx(0);
  ctx.strokeStyle = "rgba(255,255,255,.7)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(start, lanes[0] - laneH * 0.5);
  ctx.lineTo(start, lanes[1] + laneH * 0.5);
  ctx.stroke();

  ctx.fillStyle = "#c5cad1";
  ctx.textAlign = "right";
  ctx.fillText("You", w - 16, lanes[1] - laneH * 0.58);
  if (rival) ctx.fillText(scene.rivalName || "Other lane", w - 16, lanes[0] - laneH * 0.58);
  ctx.textAlign = "left";

  // state.x is the nose. The sprite's nose is its right edge, so the tail sits one car length behind the beam.
  if (rival) {
    drawCar(ctx, rival.car, rival.paint, sx(rival.state.x) - rival.car.length * px, lanes[0] + laneH * 0.42, px, {
      tireRadius: rival.spec.tireRadius,
      spin: rival.state.x / rival.spec.tireRadius,
      face: "right",
      ...lookOpts(rival.build),
    });
  }
  drawCar(ctx, player.car, player.paint, sx(player.state.x) - player.car.length * px, lanes[1] + laneH * 0.42, px, {
    tireRadius: player.spec.tireRadius,
    spin: (player.state.x || 0) / player.spec.tireRadius,
    face: "right",
    ...lookOpts(player.build),
  });
}

function lookOpts(build = {}) {
  return {
    induction: build.induction || 0,
    exhaust: build.exhaust || 0,
    suspension: build.suspension || 0,
    tires: build.tires || 0,
    weight: build.weight || 0,
  };
}

export function cameraFor(w, player, rival) {
  const lead = Math.max(player.state.x, rival ? rival.state.x : 0);
  const trail = Math.min(player.state.x, rival ? rival.state.x : player.state.x);
  const span = Math.max(18, lead - trail + player.car.length + 6);
  const px = Math.max(18, Math.min(52, (w * 0.78) / span));
  let cam = lead - (w * 0.62) / px;
  const minCam = -player.car.length - (w * 0.08) / px;
  if (cam < minCam) cam = minCam;
  return { px, cam };
}
