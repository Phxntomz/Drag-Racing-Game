import { BACKUP_KEY, SAVE_KEY, clearSave, readSave, writeSave } from "../js/save.js";

function memoryStorage(seed = {}) {
  const data = new Map(Object.entries(seed));
  return {
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      data.set(key, String(value));
    },
    removeItem(key) {
      data.delete(key);
    },
  };
}

let ids = 0;
const makeId = () => `id${++ids}`;

const empty = readSave(memoryStorage(), makeId);
if (empty.restored) throw new Error("empty storage should start a new paddock");
if (empty.save.cash !== 8000) throw new Error("starter cash");
if (empty.save.cars[0].carId !== "e90335") throw new Error("starter car");
if (empty.save.cars[0].name !== "Shop 335i") throw new Error("starter name");

const storage = memoryStorage();
const played = {
  cash: 4200,
  cars: [
    {
      uid: "mine",
      carId: "e30m3",
      paint: "alpine",
      name: "Track E30",
      build: { software: 2, exhaust: 1, tires: 1 },
      setup: { launchRpm: 4100, shiftRpm: 7000, psi: 18, boost: 1, fdTrim: 1.05 },
      damage: "axle",
      heat: 1,
    },
  ],
  active: "missing",
  slips: [{ id: "s1", car: "Track E30", quarter: 13.2 }],
};
writeSave(storage, played);
const loaded = readSave(storage, makeId);
if (!loaded.restored) throw new Error("a written paddock should come back");
if (loaded.save.cash !== 4200) throw new Error("cash was not restored");
if (loaded.save.cars.length !== 1 || loaded.save.cars[0].name !== "Track E30") throw new Error("car was not restored");
if (loaded.save.cars[0].build.software !== 2 || loaded.save.cars[0].build.intake !== 0) throw new Error("build was not restored");
if (loaded.save.cars[0].setup.launchRpm !== 4100 || loaded.save.cars[0].setup.fdTrim !== 1.05) throw new Error("setup was not restored");
if (loaded.save.cars[0].damage !== "axle" || loaded.save.cars[0].heat !== 1) throw new Error("damage or heat was not restored");
if (loaded.save.active !== "mine") throw new Error("active car should fall back to the car that exists");
if (loaded.save.slips[0].quarter !== 13.2) throw new Error("timeslip was not restored");
if (!loaded.save.savedAt) throw new Error("save should record when it was written");

storage.setItem(SAVE_KEY, "{not json");
const fromBackup = readSave(storage, makeId);
if (!fromBackup.restored || fromBackup.save.cars[0].uid !== "mine") {
  throw new Error("a broken primary file should fall back to the backup");
}

clearSave(storage);
const cleared = readSave(storage, makeId);
if (cleared.restored || storage.getItem(SAVE_KEY) || storage.getItem(BACKUP_KEY)) {
  throw new Error("reset should remove both copies");
}

const blocked = {
  getItem() {
    throw new Error("blocked");
  },
  setItem() {
    throw new Error("blocked");
  },
  removeItem() {},
};
const denied = readSave(blocked, makeId);
if (!denied.blocked || denied.restored) throw new Error("blocked storage should not pretend a save exists");

console.log("save checks passed");
