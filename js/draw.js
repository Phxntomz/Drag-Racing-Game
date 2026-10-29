/** Original side views. Proportions follow published length, height, and wheelbase. */

import { sampleCurve } from "./sim.js";

const OUTLINES = {
  e30: [
    [0.01, 0.26], [0.07, 0.48], [0.36, 0.46], [0.44, 0.74], [0.66, 0.8],
    [0.8, 0.52], [0.97, 0.48], [1, 0.3], [1, 0.2], [0.01, 0.2],
  ],
  e36: [
    [0.02, 0.22], [0.1, 0.4], [0.34, 0.4], [0.44, 0.7], [0.64, 0.76],
    [0.8, 0.46], [0.98, 0.4], [1, 0.24], [1, 0.18], [0.02, 0.18],
  ],
  e46: [
    [0.03, 0.22], [0.12, 0.38], [0.34, 0.38], [0.46, 0.68], [0.66, 0.74],
    [0.82, 0.44], [0.98, 0.36], [1, 0.22], [1, 0.17], [0.03, 0.17],
  ],
  e92: [
    [0.04, 0.2], [0.14, 0.36], [0.36, 0.34], [0.46, 0.64], [0.68, 0.7],
    [0.84, 0.4], [0.98, 0.32], [1, 0.2], [1, 0.16], [0.04, 0.16],
  ],
  e82: [
    [0.02, 0.24], [0.1, 0.42], [0.32, 0.42], [0.42, 0.72], [0.7, 0.78],
    [0.86, 0.46], [0.98, 0.4], [1, 0.24], [1, 0.18], [0.02, 0.18],
  ],
  e90: [
    [0.02, 0.24], [0.1, 0.42], [0.28, 0.42], [0.36, 0.72], [0.62, 0.78],
    [0.7, 0.48], [0.9, 0.46], [0.99, 0.34], [1, 0.2], [0.02, 0.2],
  ],
  e39: [
    [0.02, 0.24], [0.12, 0.42], [0.3, 0.42], [0.38, 0.74], [0.64, 0.8],
    [0.72, 0.48], [0.92, 0.46], [1, 0.32], [1, 0.2], [0.02, 0.2],
  ],
  e60: [
    [0.03, 0.22], [0.12, 0.38], [0.32, 0.36], [0.4, 0.68], [0.66, 0.74],
    [0.74, 0.42], [0.94, 0.38], [1, 0.24], [1, 0.16], [0.03, 0.16],
  ],
  f80: [
    [0.05, 0.18], [0.16, 0.34], [0.38, 0.32], [0.48, 0.62], [0.7, 0.68],
    [0.82, 0.38], [0.98, 0.3], [1, 0.18], [1, 0.14], [0.05, 0.14],
  ],
  f87: [
    [0.04, 0.2], [0.14, 0.38], [0.34, 0.36], [0.44, 0.66], [0.68, 0.74],
    [0.84, 0.42], [0.98, 0.34], [1, 0.2], [1, 0.15], [0.04, 0.15],
  ],
  g20: [
    [0.06, 0.16], [0.14, 0.4], [0.32, 0.38], [0.4, 0.7], [0.64, 0.76],
    [0.72, 0.44], [0.92, 0.4], [1, 0.22], [1, 0.14], [0.06, 0.14],
  ],
  f90: [
    [0.06, 0.16], [0.16, 0.4], [0.34, 0.36], [0.42, 0.68], [0.66, 0.76],
    [0.74, 0.42], [0.94, 0.38], [1, 0.2], [1, 0.14], [0.06, 0.14],
  ],
  f92: [
    [0.06, 0.14], [0.16, 0.32], [0.38, 0.28], [0.48, 0.56], [0.72, 0.62],
    [0.86, 0.32], [0.98, 0.24], [1, 0.14], [1, 0.12], [0.06, 0.12],
  ],
  g80: [
    [0.07, 0.14], [0.12, 0.46], [0.34, 0.4], [0.44, 0.68], [0.66, 0.76],
    [0.78, 0.42], [0.96, 0.36], [1, 0.18], [1, 0.13], [0.07, 0.13],
  ],
  g87: [
    [0.07, 0.16], [0.13, 0.48], [0.32, 0.4], [0.42, 0.7], [0.68, 0.78],
    [0.82, 0.44], [0.97, 0.36], [1, 0.18], [1, 0.14], [0.07, 0.14],
  ],
};

const WINDOWS = {
  e30: [[0.46, 0.48], [0.5, 0.7], [0.64, 0.74], [0.74, 0.52]],
  e36: [[0.46, 0.42], [0.5, 0.66], [0.62, 0.7], [0.74, 0.48]],
  e46: [[0.48, 0.4], [0.52, 0.64], [0.64, 0.68], [0.76, 0.46]],
  e92: [[0.48, 0.36], [0.52, 0.6], [0.66, 0.64], [0.78, 0.4]],
  e82: [[0.44, 0.44], [0.48, 0.68], [0.66, 0.72], [0.78, 0.48]],
  e90: [[0.38, 0.44], [0.42, 0.68], [0.6, 0.72], [0.68, 0.48]],
  e39: [[0.4, 0.44], [0.44, 0.7], [0.62, 0.74], [0.7, 0.48]],
  e60: [[0.42, 0.4], [0.46, 0.64], [0.64, 0.68], [0.72, 0.44]],
  f80: [[0.5, 0.36], [0.54, 0.58], [0.68, 0.62], [0.78, 0.4]],
  f87: [[0.46, 0.4], [0.5, 0.62], [0.66, 0.68], [0.78, 0.44]],
  g20: [[0.42, 0.42], [0.46, 0.66], [0.62, 0.7], [0.7, 0.46]],
  f90: [[0.44, 0.4], [0.48, 0.64], [0.64, 0.7], [0.72, 0.44]],
  f92: [[0.5, 0.32], [0.54, 0.52], [0.7, 0.56], [0.8, 0.34]],
  g80: [[0.46, 0.42], [0.5, 0.64], [0.64, 0.7], [0.74, 0.44]],
  g87: [[0.44, 0.42], [0.48, 0.66], [0.66, 0.72], [0.76, 0.46]],
};

const GRILLE = {
  e30: [0.02, 0.3, 0.07, 0.46],
  e36: [0.03, 0.26, 0.09, 0.4],
  e46: [0.03, 0.24, 0.09, 0.38],
  e92: [0.04, 0.22, 0.1, 0.36],
  e82: [0.02, 0.28, 0.08, 0.42],
  e90: [0.02, 0.26, 0.08, 0.42],
  e39: [0.02, 0.26, 0.09, 0.42],
  e60: [0.03, 0.24, 0.1, 0.38],
  f80: [0.04, 0.2, 0.11, 0.36],
  f87: [0.03, 0.24, 0.1, 0.4],
  g20: [0.02, 0.18, 0.1, 0.42],
  f90: [0.02, 0.18, 0.11, 0.44],
  f92: [0.03, 0.16, 0.11, 0.36],
  g80: [0.015, 0.16, 0.1, 0.5],
  g87: [0.015, 0.18, 0.1, 0.52],
};

function poly(ctx, pts, L, H, ground) {
  ctx.beginPath();
  pts.forEach((pt, i) => {
    const x = pt[0] * L;
    const y = ground - pt[1] * H;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
}

export function drawCar(ctx, car, paint, x, ground, px, opts = {}) {
  const shape = OUTLINES[car.shape] ? car.shape : "e46";
  const L = car.length * px;
  const H = car.height * px;
  const wheelR = (opts.tireRadius || 0.33) * px;
  const front = (car.length - car.wheelbase) * 0.44 * px;
  const rear = front + car.wheelbase * px;
  ctx.save();
  ctx.translate(x, 0);
  ctx.fillStyle = "rgba(0,0,0,.35)";
  ctx.beginPath();
  ctx.ellipse(L * 0.5, ground + 2, L * 0.42, Math.max(3, px * 0.08), 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = paint;
  poly(ctx, OUTLINES[shape], L, H, ground);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.18)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = "rgba(0,0,0,.28)";
  poly(ctx, WINDOWS[shape], L, H, ground);
  ctx.fill();

  const g = GRILLE[shape];
  const gx = g[0] * L;
  const gy = ground - g[3] * H;
  const gw = (g[2] - g[0]) * L;
  const gh = (g[3] - g[1]) * H;
  ctx.fillStyle = "#0c0c0e";
  roundRect(ctx, gx, gy, gw * 0.42, gh, 2);
  roundRect(ctx, gx + gw * 0.52, gy, gw * 0.42, gh, 2);
  ctx.fillStyle = "rgba(255,255,255,.55)";
  ctx.fillRect(L * 0.9, ground - H * 0.34, Math.max(3, L * 0.03), H * 0.06);
  ctx.fillStyle = "#9a3030";
  ctx.fillRect(L * 0.96, ground - H * 0.32, Math.max(3, L * 0.025), H * 0.07);

  if (opts.induction >= 2) {
    ctx.fillStyle = "#111";
    ctx.fillRect(L * 0.22, ground - H * 0.4, L * 0.1, Math.max(3, H * 0.035));
  }
  if (opts.exhaust) {
    ctx.fillStyle = "#cfcfcf";
    ctx.beginPath();
    ctx.arc(L * 0.98, ground - H * 0.16, Math.max(2, px * 0.045), 0, Math.PI * 2);
    ctx.fill();
  }

  drawWheel(ctx, front, ground, wheelR, opts.spin || 0);
  drawWheel(ctx, rear, ground, wheelR, opts.spin || 0);
  ctx.restore();
}

function drawWheel(ctx, cx, ground, r, spin) {
  ctx.save();
  ctx.translate(cx, ground - r);
  ctx.fillStyle = "#0e0e0e";
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#d9d9d9";
  ctx.lineWidth = Math.max(1, r * 0.12);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2);
  ctx.stroke();
  ctx.rotate(spin);
  ctx.strokeStyle = "#9a9a9a";
  ctx.lineWidth = Math.max(1, r * 0.08);
  for (let i = 0; i < 5; i += 1) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos((i / 5) * Math.PI * 2) * r * 0.62, Math.sin((i / 5) * Math.PI * 2) * r * 0.62);
    ctx.stroke();
  }
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}

export function drawDyno(canvas, spec, stock) {
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = canvas.clientWidth || 640;
  const h = canvas.clientHeight || 280;
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const pad = { l: 44, r: 16, t: 16, b: 28 };
  const maxRpm = Math.max(spec.redline, stock.redline);
  const maxHp = Math.max(spec.hp, stock.hp, 200) * 1.08;
  const xOf = (rpm) => pad.l + ((rpm - 800) / (maxRpm - 800)) * (w - pad.l - pad.r);
  const yOf = (hp) => pad.t + (1 - hp / maxHp) * (h - pad.t - pad.b);

  ctx.strokeStyle = "rgba(255,255,255,.1)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad.l, pad.t);
  ctx.lineTo(pad.l, h - pad.b);
  ctx.lineTo(w - pad.r, h - pad.b);
  ctx.stroke();

  ctx.fillStyle = "#9a9a9a";
  ctx.font = "12px Segoe UI, Tahoma, sans-serif";
  ctx.fillText("Crank hp", pad.l, 12);
  for (let hp = 0; hp <= maxHp; hp += Math.max(100, Math.round(maxHp / 4 / 50) * 50)) {
    const y = yOf(hp);
    ctx.fillStyle = "#9a9a9a";
    ctx.fillText(String(Math.round(hp)), 4, y + 4);
  }

  const strokeCurve = (curveSpec, color, width) => {
    const rows = sampleCurve(curveSpec, 40);
    ctx.beginPath();
    rows.forEach((row, i) => {
      const x = xOf(row.rpm);
      const y = yOf(row.hp);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  };

  strokeCurve(stock, "rgba(255,255,255,.35)", 1.5);
  strokeCurve(spec, "#f1f1f1", 2.25);
  ctx.fillStyle = "#b8b8b8";
  ctx.fillText(`${Math.round(spec.hp)} hp`, w - 78, 16);
  ctx.fillText("rpm", w - 36, h - 8);
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
  sky.addColorStop(0, "#141418");
  sky.addColorStop(0.42, "#1a1a1a");
  sky.addColorStop(1, "#111");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  const ground = h * 0.78;
  ctx.fillStyle = "#202124";
  ctx.fillRect(0, ground - h * 0.28, w, h);
  ctx.fillStyle = "#2a2c30";
  ctx.fillRect(0, ground - h * 0.22, w, h * 0.34);

  const laneH = h * 0.16;
  const lanes = [ground - laneH * 1.15, ground + laneH * 0.15];
  ctx.strokeStyle = "rgba(255,255,255,.35)";
  ctx.setLineDash([10, 10]);
  ctx.lineWidth = 2;
  lanes.forEach((y) => {
    ctx.strokeRect(0, y - laneH * 0.5, w, laneH);
  });
  ctx.setLineDash([]);

  const { px, cam, player, rival } = scene;
  const sx = (meters) => (meters - cam) * px;

  ctx.fillStyle = "#9a9a9a";
  ctx.font = "12px Segoe UI, Tahoma, sans-serif";
  for (const [dist, label] of MARKS) {
    const x = sx(dist);
    if (x < -20 || x > w + 20) continue;
    ctx.strokeStyle = label === "1320" ? "#f1f1f1" : "rgba(255,255,255,.25)";
    ctx.lineWidth = label === "1320" ? 3 : 1;
    ctx.beginPath();
    ctx.moveTo(x, ground - h * 0.24);
    ctx.lineTo(x, ground + laneH);
    ctx.stroke();
    ctx.fillStyle = "#cfcfcf";
    ctx.fillText(label, x + 4, ground - h * 0.25);
  }

  ctx.fillStyle = "#cfcfcf";
  ctx.textAlign = "right";
  ctx.fillText("You", w - 14, lanes[1] - laneH * 0.42);
  if (rival) ctx.fillText(scene.rivalName || "Rival", w - 14, lanes[0] - laneH * 0.42);
  ctx.textAlign = "left";

  if (rival) {
    drawCar(ctx, rival.car, rival.paint, sx(rival.state.x), lanes[0] + laneH * 0.35, px, {
      tireRadius: rival.spec.tireRadius,
      spin: rival.state.x / rival.spec.tireRadius,
      induction: rival.build?.induction || 0,
      exhaust: rival.build?.exhaust || 0,
    });
  }
  drawCar(ctx, player.car, player.paint, sx(player.state.x), lanes[1] + laneH * 0.35, px, {
    tireRadius: player.spec.tireRadius,
    spin: player.state.x / player.spec.tireRadius,
    induction: player.build.induction,
    exhaust: player.build.exhaust,
  });
}

export function cameraFor(w, player, rival) {
  const lead = Math.max(player.state.x, rival ? rival.state.x : 0);
  const trail = Math.min(player.state.x, rival ? rival.state.x : player.state.x);
  const span = Math.max(16, lead - trail + player.car.length + 8);
  const px = Math.max(14, Math.min(46, (w * 0.86) / span));
  let cam = lead - (w * 0.62) / px;
  const minCam = -(w * 0.16) / px;
  if (cam < minCam) cam = minCam;
  return { px, cam };
}
