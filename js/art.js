/** Catalog drawings for the hardware pages. Original parts, not product photos. */

const PLATE = `<rect width="200" height="140" rx="0" fill="#eef1f4"/>`;

const KINDS = {
  airbox: () => `
    ${PLATE}
    <path d="M46 78h70l8-18h28v28H46z" fill="#c5ccd4" stroke="#2c3138" stroke-width="2"/>
    <path d="M54 78v-22h18l6 22" fill="#8b939e" stroke="#2c3138" stroke-width="2"/>
    <rect x="118" y="64" width="28" height="22" rx="4" fill="#2c3138"/>
  `,
  intake: () => `
    ${PLATE}
    <path d="M78 86c18-4 28-22 46-24" fill="none" stroke="#2c3138" stroke-width="8" stroke-linecap="round"/>
    <path d="M40 96c10-28 22-40 28-42 8 6 10 22 6 42z" fill="#c4552a" stroke="#2c3138" stroke-width="2"/>
    <path d="M48 70h14M50 78h12M52 86h10" stroke="#f3d2c4" stroke-width="2"/>
    <rect x="118" y="52" width="36" height="22" rx="4" fill="#2c3138"/>
  `,
  "downpipe-stock": () => `
    ${PLATE}
    <path d="M70 36h28v24c0 18-8 28-22 36" fill="none" stroke="#8b939e" stroke-width="16" stroke-linecap="round"/>
    <path d="M70 36h28v24c0 18-8 28-22 36" fill="none" stroke="#2c3138" stroke-width="2"/>
    <rect x="78" y="48" width="18" height="22" fill="#6e4b32" stroke="#2c3138"/>
  `,
  downpipe: () => `
    ${PLATE}
    <path d="M64 32h36v22c0 20-12 32-28 46" fill="none" stroke="#d5dbe3" stroke-width="16" stroke-linecap="round"/>
    <path d="M64 32h36v22c0 20-12 32-28 46" fill="none" stroke="#2c3138" stroke-width="2"/>
    <circle cx="78" cy="104" r="10" fill="#111" stroke="#d5dbe3" stroke-width="3"/>
  `,
  "manifold-stock": () => `
    ${PLATE}
    <path d="M48 40c20 10 30 18 36 40" fill="none" stroke="#8b939e" stroke-width="7"/>
    <path d="M70 40c16 12 24 20 28 40" fill="none" stroke="#8b939e" stroke-width="7"/>
    <path d="M92 42c12 14 16 22 18 38" fill="none" stroke="#8b939e" stroke-width="7"/>
    <rect x="40" y="96" width="90" height="14" rx="4" fill="#6a717a" stroke="#2c3138"/>
  `,
  headers: () => `
    ${PLATE}
    <path d="M44 36c24 8 34 20 40 48" fill="none" stroke="#d7d0c4" stroke-width="7" stroke-linecap="round"/>
    <path d="M68 34c18 12 26 24 30 50" fill="none" stroke="#d7d0c4" stroke-width="7" stroke-linecap="round"/>
    <path d="M92 36c12 16 16 26 16 48" fill="none" stroke="#d7d0c4" stroke-width="7" stroke-linecap="round"/>
    <path d="M116 40c8 16 8 28 6 44" fill="none" stroke="#d7d0c4" stroke-width="7" stroke-linecap="round"/>
    <rect x="36" y="96" width="110" height="16" rx="6" fill="#c4552a" stroke="#2c3138" stroke-width="2"/>
  `,
  "cooler-stock": () => `
    ${PLATE}
    <rect x="50" y="48" width="100" height="48" rx="4" fill="#8b939e" stroke="#2c3138" stroke-width="2"/>
    <path d="M58 56h84M58 66h84M58 76h84M58 86h84" stroke="#d5dbe3" stroke-width="2"/>
  `,
  intercooler: () => `
    ${PLATE}
    <rect x="36" y="44" width="128" height="56" rx="3" fill="#2f6f86" stroke="#2c3138" stroke-width="2"/>
    <path d="M44 52h112M44 62h112M44 72h112M44 82h112M44 92h112" stroke="#d5eef3" stroke-width="2"/>
    <rect x="28" y="58" width="14" height="28" fill="#c5ccd4" stroke="#2c3138"/>
    <rect x="158" y="58" width="14" height="28" fill="#c5ccd4" stroke="#2c3138"/>
  `,
  radiator: () => `
    ${PLATE}
    <rect x="48" y="36" width="104" height="70" rx="4" fill="#9aa3ad" stroke="#2c3138" stroke-width="2"/>
    <path d="M56 46h88M56 56h88M56 66h88M56 76h88M56 86h88M56 96h88" stroke="#2c3138" stroke-width="1.5"/>
    <circle cx="70" cy="28" r="8" fill="none" stroke="#2c3138" stroke-width="3"/>
    <circle cx="130" cy="112" r="8" fill="none" stroke="#c4552a" stroke-width="3"/>
  `,
  pump: () => `
    ${PLATE}
    <rect x="46" y="58" width="92" height="28" rx="14" fill="#c5ccd4" stroke="#2c3138" stroke-width="2"/>
    <rect x="118" y="50" width="28" height="44" rx="4" fill="#2c3138"/>
    <circle cx="70" cy="72" r="8" fill="#0c5ebd"/>
    <path d="M40 72h10M150 64h12M150 80h12" stroke="#2c3138" stroke-width="4" stroke-linecap="round"/>
  `,
  rail: () => `
    ${PLATE}
    <rect x="36" y="48" width="128" height="16" rx="8" fill="#c4552a" stroke="#2c3138" stroke-width="2"/>
    <path d="M58 64v28M86 64v28M114 64v28M142 64v28" stroke="#2c3138" stroke-width="6"/>
    <path d="M52 92h12M80 92h12M108 92h12M136 92h12" stroke="#d5dbe3" stroke-width="4"/>
    <circle cx="28" cy="56" r="6" fill="#2c3138"/>
  `,
  "turbo-stock": () => turbo(false),
  turbo: () => turbo(false),
  "turbo-big": () => turbo(true),
  cams: () => `
    ${PLATE}
    <rect x="28" y="64" width="144" height="12" rx="6" fill="#c5ccd4" stroke="#2c3138" stroke-width="2"/>
    ${[48, 78, 108, 138].map((x) => `<ellipse cx="${x}" cy="70" rx="10" ry="16" fill="#8b939e" stroke="#2c3138" stroke-width="2"/>`).join("")}
  `,
  blower: () => `
    ${PLATE}
    <rect x="48" y="46" width="104" height="48" rx="8" fill="#2c3138"/>
    <rect x="60" y="56" width="80" height="28" rx="4" fill="#4a515a"/>
    <path d="M36 70h16M148 62c16 4 18 16 10 24" fill="none" stroke="#c5ccd4" stroke-width="8" stroke-linecap="round"/>
    <circle cx="100" cy="70" r="8" fill="#0c5ebd"/>
  `,
  pistons: () => `
    ${PLATE}
    ${[46, 86, 126].map((x) => `
      <rect x="${x}" y="36" width="22" height="16" rx="2" fill="#d5dbe3" stroke="#2c3138"/>
      <rect x="${x + 6}" y="52" width="10" height="28" fill="#8b939e" stroke="#2c3138"/>
      <ellipse cx="${x + 11}" cy="92" rx="14" ry="10" fill="#c5ccd4" stroke="#2c3138" stroke-width="2"/>
    `).join("")}
  `,
  "clutch-stock": () => clutch(70),
  clutch: () => clutch(78),
  "clutch-race": () => clutch(88),
  axle: () => `
    ${PLATE}
    <path d="M36 70h128" stroke="#8b939e" stroke-width="8" stroke-linecap="round"/>
    <circle cx="40" cy="70" r="16" fill="none" stroke="#2c3138" stroke-width="4"/>
    <circle cx="160" cy="70" r="16" fill="none" stroke="#2c3138" stroke-width="4"/>
  `,
  "axle-strong": () => `
    ${PLATE}
    <path d="M36 70h128" stroke="#d5dbe3" stroke-width="12" stroke-linecap="round"/>
    <circle cx="40" cy="70" r="18" fill="#2c3138"/>
    <circle cx="160" cy="70" r="18" fill="#2c3138"/>
    <circle cx="40" cy="70" r="7" fill="#eef1f4"/>
    <circle cx="160" cy="70" r="7" fill="#eef1f4"/>
  `,
  gearbox: () => `
    ${PLATE}
    <path d="M48 48h78l22 18v28H48z" fill="#6a717a" stroke="#2c3138" stroke-width="2"/>
    <circle cx="78" cy="78" r="14" fill="none" stroke="#d5dbe3" stroke-width="4"/>
    <circle cx="108" cy="70" r="10" fill="none" stroke="#d5dbe3" stroke-width="3"/>
    <rect x="36" y="62" width="16" height="16" fill="#2c3138"/>
  `,
  diff: () => `
    ${PLATE}
    <ellipse cx="100" cy="72" rx="36" ry="28" fill="#6a717a" stroke="#2c3138" stroke-width="2"/>
    <ellipse cx="100" cy="72" rx="14" ry="10" fill="#2c3138"/>
    <path d="M28 72h40M132 72h40" stroke="#8b939e" stroke-width="10" stroke-linecap="round"/>
  `,
  "diff-drag": () => `
    ${PLATE}
    <ellipse cx="100" cy="72" rx="40" ry="30" fill="#3a4048" stroke="#d5dbe3" stroke-width="3"/>
    <path d="M24 72h40M136 72h40" stroke="#d5dbe3" stroke-width="12" stroke-linecap="round"/>
    <circle cx="100" cy="72" r="8" fill="#0c5ebd"/>
  `,
  gears: () => `
    ${PLATE}
    <circle cx="78" cy="78" r="26" fill="none" stroke="#2c3138" stroke-width="8" stroke-dasharray="6 5"/>
    <circle cx="124" cy="60" r="18" fill="none" stroke="#0c5ebd" stroke-width="7" stroke-dasharray="5 4"/>
    <circle cx="78" cy="78" r="6" fill="#2c3138"/>
    <circle cx="124" cy="60" r="5" fill="#0c5ebd"/>
  `,
  interior: () => `
    ${PLATE}
    <path d="M70 96V58c0-12 10-20 28-20h20v58" fill="#2c3138"/>
    <path d="M78 96V64c0-8 8-12 20-12h12v44" fill="#4a515a"/>
    <rect x="108" y="78" width="28" height="8" rx="2" fill="#8b939e"/>
  `,
  diet: () => `
    ${PLATE}
    <path d="M78 100V62c0-10 8-16 22-16h8v54" fill="#2c3138"/>
    <rect x="112" y="70" width="18" height="6" fill="#8b939e"/>
    <path d="M48 88h16M48 96h12" stroke="#c5ccd4" stroke-width="3"/>
  `,
  gutted: () => `
    ${PLATE}
    <path d="M84 104V68l24-18 8 6v48" fill="none" stroke="#2c3138" stroke-width="4"/>
    <path d="M96 100V74" stroke="#8b939e" stroke-width="3"/>
    <circle cx="132" cy="96" r="6" fill="none" stroke="#c4552a" stroke-width="3"/>
  `,
  suspension: () => `
    ${PLATE}
    <path d="M100 28v84" stroke="#d5dbe3" stroke-width="8"/>
    <path d="M86 46h28v36H86z" fill="none" stroke="#0c5ebd" stroke-width="6"/>
    <circle cx="100" cy="112" r="10" fill="#2c3138"/>
    <path d="M70 36h60" stroke="#2c3138" stroke-width="6" stroke-linecap="round"/>
  `,
  "tire-street": () => tire("#2c3138", 18),
  "tire-sticky": () => tire("#2c3138", 22),
  "tire-radial": () => tire("#1a1c20", 28),
  "tire-slick": () => tire("#111318", 8),
  ecu: (stage) => `
    ${PLATE}
    <rect x="54" y="28" width="92" height="78" rx="8" fill="#1c1f24" stroke="#2c3138" stroke-width="2"/>
    <rect x="62" y="38" width="76" height="48" rx="3" fill="#10141a"/>
    <path d="M70 ${78 - stage * 6}c12-8 16 6 28-2 10-8 14 4 24-${8 + stage * 4}" fill="none" stroke="#0c5ebd" stroke-width="2.5"/>
    <rect x="88" y="106" width="24" height="8" rx="2" fill="#8b939e"/>
  `,
};

function turbo(big) {
  const r = big ? 34 : 26;
  return `
    ${PLATE}
    <circle cx="78" cy="74" r="${r}" fill="#d5dbe3" stroke="#2c3138" stroke-width="3"/>
    <circle cx="78" cy="74" r="${r * 0.45}" fill="#2c3138"/>
    <path d="M${78 + r} 74h${big ? 46 : 36}" stroke="#8b939e" stroke-width="${big ? 16 : 12}" stroke-linecap="round"/>
    <path d="M78 ${74 - r}v-16" stroke="#c4552a" stroke-width="10" stroke-linecap="round"/>
    <circle cx="${78 + r + (big ? 28 : 22)}" cy="74" r="12" fill="#6a717a" stroke="#2c3138" stroke-width="2"/>
  `;
}

function clutch(radius) {
  return `
    ${PLATE}
    <circle cx="100" cy="72" r="${radius / 2}" fill="#6a4b32" stroke="#2c3138" stroke-width="3"/>
    <circle cx="100" cy="72" r="${radius / 3.2}" fill="none" stroke="#d5dbe3" stroke-width="6" stroke-dasharray="10 6"/>
    <circle cx="100" cy="72" r="8" fill="#2c3138"/>
  `;
}

function tire(fill, groove) {
  const tread = groove > 20
    ? `<path d="M64 40h8M80 36h8M96 34h8M112 36h8M128 40h8" stroke="#9aa3ad" stroke-width="4"/>`
    : groove < 12
      ? `<path d="M70 38h60" stroke="#3a4048" stroke-width="6"/>`
      : `<path d="M68 40h10M92 36h10M116 40h10" stroke="#9aa3ad" stroke-width="4"/>`;
  return `
    ${PLATE}
    <ellipse cx="100" cy="74" rx="62" ry="40" fill="${fill}"/>
    <ellipse cx="100" cy="74" rx="40" ry="24" fill="none" stroke="#d5dbe3" stroke-width="6"/>
    <ellipse cx="100" cy="74" rx="16" ry="10" fill="#d7dbe1"/>
    ${tread}
  `;
}

export function artKind(slot, level, turboCar) {
  const table = {
    intake: ["airbox", "intake"],
    exhaust: turboCar ? ["downpipe-stock", "downpipe"] : ["manifold-stock", "headers"],
    cooling: turboCar ? ["cooler-stock", "intercooler"] : ["radiator", "radiator"],
    induction: turboCar ? ["turbo-stock", "turbo", "turbo-big"] : ["cams", "cams", "blower"],
    bottom: ["pistons", "pistons"],
    clutch: ["clutch-stock", "clutch", "clutch-race"],
    driveline: ["axle", "axle-strong", "axle-strong"],
    gearbox: ["gearbox", "gearbox"],
    diff: ["diff", "diff", "diff-drag"],
    gearing: ["gears", "gears"],
    weight: ["interior", "diet", "gutted"],
    suspension: ["suspension", "suspension"],
    tires: ["tire-street", "tire-sticky", "tire-radial", "tire-slick"],
  };
  return table[slot]?.[level] || "ecu";
}

export function partFigure(kind, stage = 1) {
  const wrap = document.createElement("div");
  wrap.className = "product-art";
  const draw = KINDS[kind] || KINDS.ecu;
  wrap.innerHTML = `<svg viewBox="0 0 200 140" aria-hidden="true">${draw(stage)}</svg>`;
  return wrap;
}
