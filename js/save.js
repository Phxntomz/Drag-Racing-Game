/**
 * Paddock save for the GitHub Pages link.
 * The file lives in this browser's localStorage, so the same link reloads
 * cash, cars, parts, setup, and slips. A second copy is kept beside it.
 */
import { defaultBuild } from "./data.js?v=3";

export const SAVE_KEY = "bimmer-strip-v1";
export const BACKUP_KEY = "bimmer-strip-v1-backup";

export function starterSave(makeId) {
  const uid = makeId();
  return {
    cash: 8000,
    cars: [
      {
        uid,
        carId: "e90335",
        paint: "black",
        name: "Shop 335i",
        build: defaultBuild(),
        setup: null,
        damage: null,
        heat: 0,
      },
    ],
    active: uid,
    slips: [],
    savedAt: null,
  };
}

function finite(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function stamp(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function normalizeCar(car) {
  if (!car || typeof car.carId !== "string" || !car.uid) return null;
  const build = defaultBuild();
  if (car.build && typeof car.build === "object") {
    for (const key of Object.keys(build)) build[key] = finite(car.build[key], 0);
  }
  let setup = null;
  if (car.setup && typeof car.setup === "object") {
    setup = {
      launchRpm: finite(car.setup.launchRpm, 0),
      shiftRpm: finite(car.setup.shiftRpm, 0),
      psi: finite(car.setup.psi, 32),
      boost: finite(car.setup.boost, 1),
      fdTrim: finite(car.setup.fdTrim, 1),
    };
  }
  return {
    uid: String(car.uid),
    carId: car.carId,
    paint: typeof car.paint === "string" && car.paint ? car.paint : "black",
    name: typeof car.name === "string" && car.name.trim() ? car.name.trim().slice(0, 32) : "Car",
    build,
    setup,
    damage: car.damage === "engine" || car.damage === "axle" ? car.damage : null,
    heat: Math.min(1, Math.max(0, finite(car.heat, 0))),
  };
}

export function normalizeSave(parsed) {
  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.cars)) return null;
  const cars = parsed.cars.map(normalizeCar).filter(Boolean);
  if (!cars.length) return null;
  const slips = Array.isArray(parsed.slips)
    ? parsed.slips.filter((slip) => slip && typeof slip === "object").slice(0, 40)
    : [];
  return {
    cash: finite(parsed.cash, 0),
    cars,
    active: cars.some((car) => car.uid === parsed.active) ? parsed.active : cars[0].uid,
    slips,
    savedAt: stamp(parsed.savedAt),
  };
}

function parse(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function readSave(storage, makeId) {
  let blocked = false;
  let primary = null;
  let backup = null;
  try {
    primary = parse(storage.getItem(SAVE_KEY));
    backup = parse(storage.getItem(BACKUP_KEY));
  } catch {
    blocked = true;
  }
  const save = normalizeSave(primary) || normalizeSave(backup);
  if (save) return { save, restored: true, blocked: false };
  return { save: starterSave(makeId), restored: false, blocked };
}

export function writeSave(storage, save) {
  save.savedAt = Date.now();
  const payload = JSON.stringify(save);
  storage.setItem(SAVE_KEY, payload);
  try {
    storage.setItem(BACKUP_KEY, payload);
  } catch {
    /* The primary file is the one the next visit reads. */
  }
}

export function clearSave(storage) {
  storage.removeItem(SAVE_KEY);
  storage.removeItem(BACKUP_KEY);
}
