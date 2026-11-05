import { CARS, defaultBuild, FAMILIES, partGroups } from "../js/data.js";
import { bestSetup, compile, findBite, simulate } from "../js/sim.js";

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
const stage1Setup = { launchRpm: 4000, shiftRpm: 6800, psi: 32, boost: 1, fdTrim: 1 };
const stage1Spec = compile(starved, stage1, stage1Setup);
expect(stage1Spec.hp > starved.hp + 40, "stage 1 should add power");

const budgetBuild = { ...stage1, intake: 1, clutch: 1, quality: { software: "budget", intake: "budget", clutch: "budget" } };
const budgetSpec = compile(starved, budgetBuild, stage1Setup);
const nameBuild = { ...stage1, intake: 1, clutch: 1, quality: { software: "name", intake: "name", clutch: "name" } };
const nameSpec = compile(starved, nameBuild, stage1Setup);
expect(budgetSpec.hp < nameSpec.hp, "budget parts should make less power than the name-brand set");
expect(budgetSpec.knockRate >= nameSpec.knockRate, "budget parts should not be kinder than name-brand parts");
expect(budgetSpec.clutchNm < nameSpec.clutchNm, "a budget clutch should hold less");

const advanced = compile(starved, stage1, { ...stage1Setup, timing: 1.06 });
const neutral = compile(starved, stage1, { ...stage1Setup, timing: 1 });
expect(advanced.hp > stage1Spec.hp, "advanced timing should add power");
expect(advanced.knockRate > stage1Spec.knockRate, "advanced timing should add knock");
expect(Math.abs(neutral.hp - stage1Spec.hp) < 0.01, "timing at 1 should match an unset timing");

const stockCar = CARS.find((car) => car.id === "e90335");
const plain = defaultBuild();
const plainProbe = compile(stockCar, plain, {
  launchRpm: 2000,
  shiftRpm: Math.round(stockCar.redline * 0.985),
  psi: 32,
  boost: 1,
  fdTrim: 1,
  timing: 1,
});
const plainSetup = {
  launchRpm: plainProbe.suggestedLaunch,
  shiftRpm: Math.round(stockCar.redline * 0.985),
  psi: plainProbe.idealPsi,
  boost: 1,
  fdTrim: 1,
  timing: 1,
};
const plainSlip = simulate(compile(stockCar, plain, plainSetup), {
  rt: 0,
  launchRpm: plainSetup.launchRpm,
  shiftRpm: plainSetup.shiftRpm,
});
const tuneStarted = performance.now();
const tuned = bestSetup(stockCar, plain, 0);
const tuneMs = performance.now() - tuneStarted;
const tunedSpec = compile(stockCar, plain, tuned);
const tunedSlip = simulate(tunedSpec, { rt: 0, launchRpm: tuned.launchRpm, shiftRpm: tuned.shiftRpm });
expect(tuned.launchRpm === tunedSpec.suggestedLaunch, "best tune keeps the launch on the bite");
expect(tuned.psi === tunedSpec.idealPsi, "best tune keeps tire pressure on the bite");
expect(!tunedSlip.dnf && tunedSlip.quarter, "best tune should finish the quarter");
expect(tunedSlip.quarter <= plainSlip.quarter + 0.005, "best tune should not be slower than the bite pass");
console.log(
  `best tune 335 ${tunedSlip.quarter.toFixed(3)} vs bite ${plainSlip.quarter.toFixed(3)} in ${tuneMs.toFixed(0)} ms`,
  tuned,
);

const e30 = CARS.find((car) => car.id === "e30m3");
const e30Build = { ...defaultBuild(), suspension: 1, tires: 2, weight: 1 };
const e30Tune = bestSetup(e30, e30Build, 0);
const e30Spec = compile(e30, e30Build, e30Tune);
expect(e30Tune.launchRpm === e30Spec.suggestedLaunch, "a lowered E30 still launches on the bite");
expect(!simulate(e30Spec, { rt: 0, launchRpm: e30Tune.launchRpm, shiftRpm: e30Tune.shiftRpm }).dnf, "lowered E30 best tune should finish");

function bolted(carId) {
  const car = CARS.find((item) => item.id === carId);
  const build = {
    ...defaultBuild(),
    software: 2,
    intake: 1,
    exhaust: 1,
    cooling: 1,
    fuel: 1,
    quality: { software: "works", intake: "works", exhaust: "works", cooling: "works", fuel: "works" },
  };
  const setup = {
    launchRpm: 2000,
    shiftRpm: Math.round(car.redline * 0.985),
    psi: 32,
    boost: 1.12,
    fdTrim: 1,
    timing: 1.06,
  };
  const seed = compile(car, build, setup);
  const tuned = { ...setup, launchRpm: seed.suggestedLaunch, psi: seed.idealPsi };
  const spec = compile(car, build, tuned);
  return simulate(spec, { rt: 0, launchRpm: tuned.launchRpm, shiftRpm: tuned.shiftRpm });
}

for (const id of ["f80m3", "g20m340", "g80m3", "e90335"]) {
  const slip = bolted(id);
  expect(slip.quarter && !slip.dnf, `${id} stage 2 on stock axles should finish, got ${slip.dnf || "no quarter"}`);
}

const big = CARS.find((item) => item.id === "e90335");
const bigBuild = { ...defaultBuild(), software: 2, intake: 1, exhaust: 1, cooling: 1, fuel: 2, induction: 2, clutch: 2, bottom: 1 };
const bigSeed = compile(big, bigBuild, { launchRpm: 2500, shiftRpm: 6800, psi: 18, boost: 1.08, fdTrim: 1, timing: 1 });
const bigSetup = { launchRpm: bigSeed.suggestedLaunch, shiftRpm: 6800, psi: bigSeed.idealPsi, boost: 1.08, fdTrim: 1, timing: 1 };
const snapped = simulate(compile(big, bigBuild, bigSetup), { rt: 0, launchRpm: bigSetup.launchRpm, shiftRpm: 6800 });
expect(snapped.dnf === "axle", "a big-turbo 335 on stock axles should break an axle");
const held = simulate(compile(big, { ...bigBuild, driveline: 2 }, bigSetup), { rt: 0, launchRpm: bigSetup.launchRpm, shiftRpm: 6800 });
expect(held.quarter && !held.dnf, "drag axles should hold that same big-turbo 335");

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("\nchecks passed");
