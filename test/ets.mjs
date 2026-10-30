import { CARS, defaultBuild, FAMILIES, partGroups } from "../js/data.js";
import { compile, findBite, simulate } from "../js/sim.js";

const BANDS = {
  e30m3: [14.5, 15.5],
  e36m3: [13.9, 14.9],
  e46m3: [12.9, 13.9],
  e39m5: [12.6, 13.7],
  e60m5: [11.9, 13.0],
  e90335: [13.3, 14.4],
  e821m: [12.5, 13.6],
  e92m3: [12.5, 13.6],
  f80m3: [11.9, 13.0],
  f87m2c: [12.0, 13.2],
  g20m340: [12.0, 13.2],
  f90m5c: [10.5, 11.6],
  f92m8c: [10.6, 11.7],
  g80m3: [11.0, 12.2],
  g87m2: [12.0, 13.2],
};

function setupFor(car, spec) {
  return {
    launchRpm: spec.suggestedLaunch,
    shiftRpm: Math.round(spec.redline * 0.985),
    psi: spec.idealPsi,
    boost: 1,
    fdTrim: 1,
  };
}

const failures = [];
function expect(cond, message) {
  if (!cond) failures.push(message);
}

console.log("car".padEnd(22), "hp".padStart(6), "bite".padStart(6), "60ft".padStart(7), "1/4".padStart(8), "mph".padStart(7));
const stockEt = {};
for (const car of CARS) {
  partGroups(car);
  const build = defaultBuild();
  let spec = compile(car, build, { launchRpm: 3500, shiftRpm: car.redline * 0.98, psi: 32, boost: 1, fdTrim: 1 });
  const setup = setupFor(car, spec);
  spec = compile(car, build, setup);
  const best = findBite(spec);
  const slip = best?.slip;
  stockEt[car.id] = slip?.quarter;
  const label = `${car.year} ${car.chassis}`;
  console.log(
    label.padEnd(22),
    spec.hp.toFixed(0).padStart(6),
    String(best?.rpm ?? "-").padStart(6),
    (slip?.ft60?.toFixed(3) ?? "DNF").padStart(7),
    (slip?.quarter?.toFixed(3) ?? "DNF").padStart(8),
    (slip?.quarterMph?.toFixed(1) ?? "-").padStart(7),
  );
  const band = BANDS[car.id];
  expect(slip?.quarter >= band[0] && slip?.quarter <= band[1], `${car.id} ET ${slip?.quarter} outside ${band}`);
  expect(!slip?.dnf, `${car.id} stock should finish`);
}

function show(title, carId, mutate) {
  const car = CARS.find((item) => item.id === carId);
  const build = defaultBuild();
  mutate(build);
  let spec = compile(car, build, { launchRpm: 4000, shiftRpm: car.redline, psi: 32, boost: 1, fdTrim: 1 });
  spec = compile(car, build, {
    launchRpm: spec.suggestedLaunch,
    shiftRpm: Math.round(spec.redline * 0.985),
    psi: spec.idealPsi,
    boost: 1,
    fdTrim: 1,
  });
  const best = findBite(spec);
  console.log(
    title.padEnd(28),
    `hp ${spec.hp.toFixed(0)}`.padEnd(12),
    `mult ${spec.mult.toFixed(2)}`.padEnd(12),
    `60 ${best?.slip.ft60?.toFixed(3) ?? "DNF"}`.padEnd(12),
    `1/4 ${best?.slip.quarter?.toFixed(3) ?? "DNF"} @ ${best?.slip.quarterMph?.toFixed(1) ?? "-"}`,
    best?.slip.dnf ? `DNF ${best.slip.dnf}` : "",
    `knock ${best?.slip.knock.toFixed(2)}`,
  );
}

console.log("\nbuilds");
show("335 stock", "e90335", () => {});
show("335 stage1", "e90335", (b) => {
  b.software = 1;
});
show("335 stage2", "e90335", (b) => {
  b.software = 2;
  b.exhaust = 1;
  b.cooling = 1;
  b.intake = 1;
  b.clutch = 1;
});
show("335 stage2 e30 radial", "e90335", (b) => {
  b.software = 2;
  b.exhaust = 1;
  b.cooling = 1;
  b.intake = 1;
  b.fuel = 1;
  b.clutch = 1;
  b.tires = 2;
  b.driveline = 1;
  b.suspension = 1;
});
show("335 outlaw", "e90335", (b) => {
  b.software = 2;
  b.exhaust = 1;
  b.cooling = 1;
  b.intake = 1;
  b.fuel = 2;
  b.induction = 2;
  b.bottom = 1;
  b.clutch = 2;
  b.driveline = 2;
  b.gearbox = 1;
  b.diff = 2;
  b.gearing = 1;
  b.weight = 2;
  b.suspension = 1;
  b.tires = 3;
});
show("335 big no fuel", "e90335", (b) => {
  b.software = 2;
  b.exhaust = 1;
  b.cooling = 1;
  b.induction = 2;
  b.bottom = 1;
  b.clutch = 2;
  b.fuel = 0;
});
show("F80 stage2", "f80m3", (b) => {
  b.software = 2;
  b.exhaust = 1;
  b.cooling = 1;
  b.intake = 1;
  b.clutch = 1;
  b.tires = 2;
});
show("F90 stock", "f90m5c", () => {});
show("G80 stock", "g80m3", () => {});

const n54 = FAMILIES.n54;
expect(n54.turbo, "n54 should be turbo");
expect(stockEt.f80m3 < stockEt.e90335, "F80 should be quicker than a stock 335i");
expect(stockEt.f90m5c < stockEt.f80m3, "M5 Competition should be quicker than a stock F80");

const starved = CARS.find((car) => car.id === "e90335");
const starvedBuild = defaultBuild();
starvedBuild.software = 2;
starvedBuild.exhaust = 1;
starvedBuild.cooling = 1;
starvedBuild.induction = 2;
starvedBuild.bottom = 1;
starvedBuild.clutch = 2;
const starvedSpec = compile(starved, starvedBuild, { launchRpm: 4000, shiftRpm: 6800, psi: 18, boost: 1.1, fdTrim: 1 });
expect(starvedSpec.hp <= starved.hp * n54.fuel0 + 1, "big turbo without fuel stays on the pump-gas cap");
expect(starvedSpec.warnings.length > 0, "fuel cap should warn");

const stage1 = defaultBuild();
stage1.software = 1;
const stage1Spec = compile(starved, stage1, { launchRpm: 4000, shiftRpm: 6800, psi: 32, boost: 1, fdTrim: 1 });
expect(stage1Spec.hp > starved.hp + 40, "stage 1 should add power");

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("\nchecks passed");
