/**
 * Quarter-mile simulation.
 *
 * Longitudinal model: crank torque from a curve anchored to published peak
 * horsepower and peak torque, multiplied by the gear and final drive, then
 * capped by a weight-transfer traction model. All-wheel-drive cars can use
 * both axles. Shift time, clutch capacity, axle rating, and a fuel/internals
 * limit are the tuning outputs.
 */

import { FAMILIES, partTier } from "./data.js?v=3";

export const FT60 = 18.288;
export const FT330 = 100.584;
export const EIGHTH = 201.168;
export const FT1000 = 304.8;
export const QUARTER = 402.336;

const G = 9.80665;
const AIR = 1.18;
const HP_FROM_NM = 7121;

const TIRE = {
  0: { mu: 1.28, radius: 0.33, idealPsi: 32, name: "street" },
  1: { mu: 1.42, radius: 0.332, idealPsi: 30, name: "sticky" },
  2: { mu: 1.68, radius: 0.345, idealPsi: 18, name: "radial" },
  3: { mu: 1.95, radius: 0.348, idealPsi: 13, name: "slick" },
};

const TRANS = {
  manual: { eff: 0.9, shift: 0.26, dump: 0.28, auto: false },
  dct: { eff: 0.91, shift: 0.065, dump: 0.14, auto: true },
  auto: { eff: 0.88, shift: 0.1, dump: 0.18, auto: true },
  smg: { eff: 0.89, shift: 0.13, dump: 0.2, auto: true },
};

export function engineTorque(spec, rpm) {
  if (rpm < 650 || rpm > spec.redline) return 0;
  const tqAtHp = (spec.hp * HP_FROM_NM) / spec.peakHpRpm;
  if (rpm <= spec.tqPeakRpm) {
    const span = Math.max(1, spec.tqPeakRpm - 700);
    const u = Math.max(0, (rpm - 700) / span);
    const base = spec.turbo ? 0.78 : 0.45;
    let tq = spec.tq * (base + (1 - base) * Math.sin(Math.min(1, u) * Math.PI * 0.5));
    if (spec.turbo && rpm < spec.spoolRpm) {
      const s = Math.max(0, rpm / spec.spoolRpm);
      tq *= 0.42 + 0.58 * s * s;
    }
    return tq;
  }
  if (rpm <= spec.peakHpRpm) {
    const u = (rpm - spec.tqPeakRpm) / Math.max(1, spec.peakHpRpm - spec.tqPeakRpm);
    return spec.tq + (tqAtHp - spec.tq) * u;
  }
  const u = (rpm - spec.peakHpRpm) / Math.max(1, spec.redline - spec.peakHpRpm);
  return tqAtHp * (1 - 0.08 * u);
}

export function compile(car, build, setup, heat = 0) {
  const family = FAMILIES[car.family];
  const trans = TRANS[car.trans];
  let requested = 1;
  if (build.intake) requested += family.intake;
  if (build.exhaust) requested += family.exhaust;
  if (build.cooling) requested += family.cooling;
  if (build.software >= 1) requested += family.stage1;
  if (build.software >= 2 && build.exhaust >= 1) requested += family.stage2;
  if (build.fuel === 1) requested += family.e30;
  if (build.fuel === 2) requested += family.e85;
  const inductionLive = build.software >= 1 && (build.induction < 2 || (build.software >= 2 && build.exhaust >= 1));
  if (inductionLive && build.induction === 1) requested += family.mild;
  if (inductionLive && build.induction === 2) requested += family.big;

  let cap = family.stockCap;
  if (build.induction === 1) cap = family.mildCap;
  if (build.induction === 2) cap = family.bigCap;
  const fuelCap = build.fuel === 0 ? family.fuel0 : build.fuel === 1 ? family.fuel1 : family.fuel2;
  const safe = build.bottom ? family.forgedSafe : family.stockSafe;

  let mult = Math.min(requested, cap, fuelCap);
  const boost = carBoost(car, build, setup);
  const boosted = mult * boost;
  let knockRate = 0;
  if (requested > fuelCap + 0.03) knockRate += (requested - fuelCap) * 0.85;
  if (boosted > fuelCap + 0.02) knockRate += (boosted - fuelCap) * 1.1;
  mult = Math.min(boosted, fuelCap, cap);
  if (mult > safe) knockRate += (mult - safe) * 0.7;
  if (!build.cooling && (build.induction > 0 || mult > 1.38)) knockRate += 0.05;
  if (build.cooling) knockRate *= 0.7;

  const hardware = hardwareFactor(build);
  mult *= hardware.power;
  knockRate *= 1 + hardware.fragile * 0.12;
  knockRate *= Math.max(0.7, 1 - hardware.stout * 0.04);

  const timing = timingTrim(setup);
  mult *= 1 + (timing - 1) * 0.45;
  if (timing > 1) knockRate += (timing - 1) * 1.4;
  if (timing < 1) knockRate *= 0.55 + 0.45 * ((timing - 0.94) / 0.06);

  const coolRate = !build.cooling
    ? 0.075
    : partTier(build, "cooling") === "budget"
      ? 0.05
      : partTier(build, "cooling") === "works"
        ? 0.012
        : 0.02;
  const soaked = heat > 0 ? coolRate * Math.min(1, heat) : 0;
  mult *= 1 - soaked;

  const tire = TIRE[build.tires] || TIRE[0];
  const psi = setup?.psi ?? tire.idealPsi;
  const psiMiss = Math.abs(psi - tire.idealPsi) / tire.idealPsi;
  const mu = tire.mu * Math.max(0.84, 1 - psiMiss * 0.28);

  let bite = 1;
  if (build.diff === 1) bite += 0.035;
  if (build.diff === 2) bite += 0.07;
  if (build.suspension) bite += 0.045;

  const massDrop = build.weight === 0 ? 0 : build.weight === 1 ? 40 : 105;
  const cg = Math.max(0.42, car.cg - (build.weight === 2 ? 0.02 : build.weight === 1 ? 0.01 : 0));

  const life = Math.max(0.62, 1 - hardware.fragile * 0.08) * (1 + hardware.stout * 0.03);
  const clutchMul = (build.clutch === 0 ? 1.15 : build.clutch === 1 ? 1.85 : 3.3) * (build.clutch ? life : 1);
  const dumpMul = build.clutch === 2 ? 0.72 : build.clutch === 1 ? 0.85 : 1;
  const axleMul = (build.driveline === 0 ? 1.45 : build.driveline === 1 ? 2.15 : 3.4) * (build.driveline ? life : 1);
  const shiftMul = build.gearbox ? 0.72 : 1;
  const fd = car.finalDrive * (build.gearing ? setup?.fdTrim || 1 : 1);
  const gears = trimmedGears(car, build, setup);

  const first = gears[0] * fd;
  const peakTq = car.tq * mult;

  const warnings = [];
  if (build.software >= 2 && build.exhaust < 1) {
    warnings.push(family.turbo ? "Stage 2 is loaded but the downpipes are still stock, so that file is not in the power." : "Stage 2 wants headers before that file adds power.");
  }
  if (build.induction >= 1 && build.software < 1) warnings.push("The hardware is installed and still on the factory calibration.");
  if (requested > fuelCap + 0.04) warnings.push("The fuel system is the ceiling. More turbo does not show up until the pumps do.");
  if (mult > safe + 0.02) warnings.push("This power is past what the bottom end is rated for. A full pass can knock it out.");
  if (boost > 1.03 && mult >= fuelCap - 0.01) warnings.push("Boost past the fuel cap only adds knock.");
  if (hardware.fragile > 0) warnings.push("Budget parts are on the car. They make a little less power and give up sooner.");
  if (timing > 1.03) warnings.push("Timing is advanced. The sheet looks stronger, and a long hit knocks.");

  const spec = {
    carId: car.id,
    name: `${car.year} ${car.chassis} ${car.name}`,
    hp: car.hp * mult,
    tq: car.tq * mult,
    stockHp: car.hp,
    mult,
    requested,
    fuelCap,
    safe,
    redline: car.redline + (!family.turbo && build.induction === 1 ? 250 : 0),
    tqPeakRpm: car.tqPeakRpm,
    peakHpRpm: Math.min(car.peakHpRpm, car.redline + (!family.turbo && build.induction === 1 ? 200 : 0)),
    spoolRpm: family.turbo ? car.spoolRpm + (build.induction === 2 ? 900 : build.induction === 1 ? 350 : 0) : 0,
    turbo: family.turbo || build.induction === 2,
    mass: car.mass - massDrop,
    drive: car.drive,
    awd: car.drive === "awd",
    awdFactor: 0.93,
    rearFrac: Math.min(0.56, car.rearFrac + (build.suspension ? 0.02 : 0)),
    cg,
    wheelbase: car.wheelbase,
    length: car.length,
    height: car.height,
    cd: car.cd,
    area: car.area,
    gears,
    finalDrive: fd,
    eff: trans.eff - (car.drive === "awd" ? 0.03 : 0),
    shiftTime: trans.shift * shiftMul,
    dumpTime: trans.dump * dumpMul,
    autoShift: trans.auto,
    tireRadius: tire.radius,
    mu,
    bite,
    psi,
    idealPsi: tire.idealPsi,
    launchRpm: setup?.launchRpm || (family.turbo ? car.spoolRpm + 800 : car.tqPeakRpm),
    shiftRpm: setup?.shiftRpm || Math.round(car.redline * 0.985),
    clutchNm: peakTq * clutchMul,
    axleNm: car.tq * first * axleMul,
    knockRate,
    heat: soaked,
    shape: car.shape,
    paint: car.paint,
    warnings,
    trans: car.trans,
  };
  spec.suggestedLaunch = biteRpm(spec);
  return spec;
}

function hardwareFactor(build) {
  const quality = build?.quality || {};
  let bonus = 0;
  let penalty = 0;
  let fragile = 0;
  let stout = 0;
  for (const slot of Object.keys(quality)) {
    if (!(build[slot] > 0)) continue;
    const tier = partTier(build, slot);
    if (tier === "budget") {
      penalty += 0.012;
      fragile += 1;
    } else if (tier === "works") {
      bonus += 0.006;
      stout += 1;
    }
  }
  return {
    power: (1 + Math.min(0.04, bonus)) * (1 - Math.min(0.1, penalty)),
    fragile,
    stout,
  };
}

function timingTrim(setup) {
  const raw = Number(setup?.timing);
  if (!Number.isFinite(raw)) return 1;
  return Math.min(1.06, Math.max(0.94, raw));
}

function trimmedGears(car, build, setup) {
  if (!build?.gearing) return car.gears;
  return car.gears.map((ratio, index) => {
    const trim = Number(setup?.gears?.[index]);
    const clamped = Number.isFinite(trim) ? Math.min(1.08, Math.max(0.92, trim)) : 1;
    return ratio * clamped;
  });
}

function carBoost(car, build, setup) {
  const family = FAMILIES[car.family];
  const boosted = family.turbo || build.induction === 2;
  if (!boosted || !setup) return 1;
  const raw = Number(setup.boost);
  if (!Number.isFinite(raw)) return 1;
  return Math.min(1.12, Math.max(0.9, raw));
}

function forceAtRpm(spec, rpm, gearIndex) {
  const tq = Math.min(engineTorque(spec, rpm), spec.clutchNm);
  const ratio = spec.gears[gearIndex] * spec.finalDrive;
  return (tq * ratio * spec.eff) / spec.tireRadius;
}

export function tractionCap(spec, accel) {
  const m = spec.mass;
  const rear = spec.rearFrac;
  let Nr = m * G * rear + (m * accel * spec.cg) / spec.wheelbase;
  let Nf = m * G * (1 - rear) - (m * accel * spec.cg) / spec.wheelbase;
  if (Nf < 0) {
    Nf = 0;
    Nr = m * G;
  }
  if (Nr < 0) Nr = 0;
  const mu = spec.mu * spec.bite * (accel > 7 ? 1 : 1);
  if (spec.awd) return spec.awdFactor * mu * (Nf + Nr);
  return mu * Nr;
}

function biteRpm(spec) {
  let a = 4;
  let cap = tractionCap(spec, a);
  for (let i = 0; i < 4; i += 1) {
    a = cap / spec.mass;
    cap = tractionCap(spec, a);
  }
  let suggested = spec.turbo ? Math.max(1600, spec.spoolRpm + 200) : Math.round(spec.tqPeakRpm * 0.85);
  for (let rpm = 1200; rpm < spec.redline - 200; rpm += 40) {
    const force = forceAtRpm(spec, rpm, 0);
    if (force >= cap * 0.92) {
      suggested = rpm;
      break;
    }
    suggested = rpm;
  }
  return suggested;
}

export function createState(spec) {
  return {
    x: 0,
    v: 0,
    a: 0,
    rpm: spec.launchRpm,
    gear: 1,
    launched: false,
    shiftLeft: 0,
    runT: 0,
    spin: false,
    knock: 0,
    blown: false,
    axle: false,
    limiterTime: 0,
    clutchHeat: 0,
  };
}

function dragForce(spec, v) {
  const aero = 0.5 * AIR * spec.cd * spec.area * v * v;
  const roll = 0.0115 * spec.mass * G * (1 + v / 55);
  return aero + roll;
}

export function step(state, spec, dt, input) {
  if (state.axle) {
    state.v = Math.max(0, state.v - dragForce(spec, state.v) / spec.mass * dt);
    state.x += state.v * dt;
    state.a = 0;
    return state;
  }

  const throttle = input?.throttle ? 1 : 0;
  if (!state.launched) {
    state.rpm = spec.launchRpm;
    state.v = 0;
    if (throttle) state.launched = true;
    return state;
  }

  state.runT += dt;
  const ratio = spec.gears[state.gear - 1] * spec.finalDrive;
  const radius = spec.tireRadius;

  if (input?.shift && state.shiftLeft <= 0 && state.gear < spec.gears.length && state.runT > spec.dumpTime * 0.5) {
    state.shiftLeft = spec.shiftTime;
    state.rpmAtShift = state.rpm;
  }

  if (state.shiftLeft > 0) {
    state.shiftLeft -= dt;
    const drag = dragForce(spec, state.v);
    const a = -drag / spec.mass;
    state.a = a;
    state.v = Math.max(0, state.v + a * dt);
    state.x += state.v * dt;
    state.spin = false;
    if (throttle) state.rpm = Math.min(spec.redline, state.rpm + 400 * dt);
    if (state.shiftLeft <= 0) {
      state.gear += 1;
      state.rpm = speedRpm(state.v, spec, state.gear);
    }
    return state;
  }

  const road = speedRpm(state.v, spec, state.gear);
  const dumpU = Math.min(1, state.runT / spec.dumpTime);
  let rpm = state.runT < spec.dumpTime ? spec.launchRpm * (1 - dumpU) + Math.max(road, 800) * dumpU : Math.max(road, 800);
  if (rpm > spec.redline) {
    state.limiterTime += dt;
    rpm = spec.redline;
  }
  state.rpm = rpm;

  let tq = throttle * engineTorque(spec, Math.min(rpm, spec.redline));
  if (rpm >= spec.redline - 20) tq *= 0.08;
  const clutchAvail = spec.clutchNm * (0.15 + 0.85 * dumpU);
  if (tq > clutchAvail) {
    state.clutchHeat += ((tq - clutchAvail) / spec.clutchNm) * dt;
    tq = clutchAvail;
  }
  if (state.clutchHeat > 1.2) tq *= 0.86;

  if (state.knock > 0.55) tq *= Math.max(0.4, 1 - (state.knock - 0.55));

  const axleTorque = tq * spec.gears[0] * spec.finalDrive;
  if (state.gear === 1 && state.runT < 0.9 && axleTorque > spec.axleNm) {
    state.axle = true;
    state.a = 0;
    return state;
  }

  let a = state.a || 3;
  let spinning = false;
  let net = 0;
  const inertia = 0.035 * (ratio / radius) * (ratio / radius);
  const mass = spec.mass + inertia;
  for (let i = 0; i < 3; i += 1) {
    const cap = tractionCap(spec, Math.max(0, a));
    let force = (tq * ratio * spec.eff) / radius;
    if (force > cap) {
      const over = (force - cap) / Math.max(1, cap);
      if (over > 0.65 && state.v < 13) {
        force = cap * Math.max(0.7, 1 - (over - 0.65) * 0.35);
        spinning = true;
      } else {
        force = cap;
        spinning = false;
      }
    }
    net = force - dragForce(spec, state.v);
    a = net / mass;
  }

  if (throttle && spec.knockRate) state.knock += spec.knockRate * dt * (0.65 + 0.35 * Math.min(1, rpm / spec.redline));
  if (state.knock > 1.15) state.blown = true;

  state.spin = spinning;
  state.a = a;
  state.v = Math.max(0, state.v + a * dt);
  state.x += state.v * dt;
  return state;
}

export function speedRpm(v, spec, gear) {
  const ratio = spec.gears[gear - 1] * spec.finalDrive;
  return (v * ratio * 60) / (2 * Math.PI * spec.tireRadius);
}

export function sampleCurve(spec, points = 48) {
  const rows = [];
  for (let i = 0; i <= points; i += 1) {
    const rpm = 800 + ((spec.redline - 800) * i) / points;
    const tq = engineTorque(spec, rpm);
    const hp = (tq * rpm) / HP_FROM_NM;
    rows.push({ rpm, tq, hp, whp: hp * spec.eff });
  }
  return rows;
}

function emptySlip() {
  return {
    rt: 0,
    ft60: null,
    ft330: null,
    eighth: null,
    eighthMph: null,
    ft1000: null,
    quarter: null,
    quarterMph: null,
    dnf: null,
    blown: false,
    axle: false,
    knock: 0,
    limiterTime: 0,
    shifts: [],
    trace: [],
  };
}

const MARKS = [
  ["ft60", FT60],
  ["ft330", FT330],
  ["eighth", EIGHTH],
  ["ft1000", FT1000],
  ["quarter", QUARTER],
];

export function simulate(spec, plan = {}) {
  const rt = plan.rt ?? 0;
  const shiftRpm = plan.shiftRpm ?? spec.shiftRpm;
  const state = createState(spec);
  if (plan.launchRpm) {
    spec = { ...spec, launchRpm: plan.launchRpm };
    state.rpm = plan.launchRpm;
  }
  const slip = emptySlip();
  slip.rt = rt;
  const dt = 1 / 240;
  let clock = 0;
  let prevX = 0;
  let nextTrace = 0;
  const maxClock = 40;

  while (clock < maxClock && slip.quarter == null && !state.axle) {
    const launched = clock >= rt;
    const wantShift =
      launched &&
      state.launched &&
      state.shiftLeft <= 0 &&
      state.gear < spec.gears.length &&
      state.rpm >= shiftRpm &&
      state.runT > spec.dumpTime;
    const rpmBefore = state.rpm;
    step(state, spec, dt, { throttle: launched, shift: wantShift });
    if (wantShift) slip.shifts.push(Math.round(rpmBefore));
    clock += dt;
    for (const [key, dist] of MARKS) {
      if (slip[key] == null && prevX < dist && state.x >= dist) {
        const span = state.x - prevX || 1;
        const frac = (dist - prevX) / span;
        slip[key] = clock - dt * (1 - frac);
        const speed = state.v * 2.23694;
        if (key === "eighth") slip.eighthMph = speed;
        if (key === "quarter") slip.quarterMph = speed;
      }
    }
    if (clock >= nextTrace) {
      slip.trace.push({ t: clock, x: state.x, v: state.v, rpm: state.rpm, gear: state.gear });
      nextTrace += 0.08;
    }
    prevX = state.x;
    if (state.blown && state.knock > 1.4 && clock > rt + 1) {
      slip.dnf = "engine";
      break;
    }
  }
  if (state.axle) slip.dnf = "axle";
  slip.blown = state.blown;
  slip.axle = state.axle;
  slip.knock = state.knock;
  slip.limiterTime = state.limiterTime;
  slip.finishRpm = state.rpm;
  slip.finishGear = state.gear;
  return slip;
}

export function findBite(spec) {
  let best = null;
  const lo = Math.max(1200, (spec.turbo ? spec.spoolRpm : 1800) - 400);
  for (let rpm = lo; rpm < spec.redline - 300; rpm += 120) {
    const slip = simulate({ ...spec, launchRpm: rpm }, { rt: 0, launchRpm: rpm, shiftRpm: Math.round(spec.redline * 0.985) });
    if (!slip.quarter || slip.dnf) continue;
    if (!best || slip.quarter < best.slip.quarter) best = { rpm, slip };
  }
  return best;
}

export function coachNotes(spec, slip, setup) {
  const notes = [];
  if (slip.red) notes.push("Red light. The tree had not turned green.");
  else if (slip.rt > 0.35) notes.push("The leave was late. The green was already on.");
  if (slip.dnf === "axle") notes.push("An axle broke on the hit. The driveline is behind the torque.");
  if (slip.blown || slip.dnf === "engine") notes.push("It knocked hard enough to end the pass. Fuel, heat, or the bottom end is the limit.");
  if (!slip.quarter && !slip.dnf) notes.push("It did not finish the quarter. The gearing or the power fell over.");
  if (slip.limiterTime > 0.28) notes.push("Too long on the limiter. Shift earlier, or fit a shorter gear only if the stripe still has rpm left.");
  const bite = spec.suggestedLaunch;
  if (setup && slip.ft60 && !slip.dnf) {
    if (setup.launchRpm > bite + 450) notes.push(`Launch was ${setup.launchRpm} rpm. The bite is nearer ${bite}. The tires spun.`);
    else if (setup.launchRpm < bite - 500) notes.push(`Launch was ${setup.launchRpm} rpm. The bite is nearer ${bite}. It bogged.`);
  }
  if (Math.abs((setup?.psi ?? spec.psi) - spec.idealPsi) > 6) {
    notes.push(`Tire pressure is off. This tire wants about ${spec.idealPsi} psi.`);
  }
  if (slip.finishGear === spec.gears.length && slip.finishRpm < spec.peakHpRpm * 0.82 && slip.quarter) {
    notes.push("It crossed the stripe below the power peak. A shorter final drive would still be pulling.");
  }
  if (slip.finishRpm > spec.redline - 80 && slip.quarter && slip.finishGear === spec.gears.length) {
    notes.push("It was out of gear at the stripe. The final drive is too short.");
  }
  if (!notes.length && slip.quarter) notes.push("Clean pass. The setup held and the shifts landed.");
  return notes;
}

export function mph(metersPerSecond) {
  return metersPerSecond * 2.23694;
}

export function formatEt(seconds) {
  if (seconds == null || Number.isNaN(seconds)) return "—";
  return seconds.toFixed(3);
}
