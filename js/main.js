import {
  CARS,
  CLASSES,
  PAINTS,
  RIVAL_BUILDS,
  SOURCES,
  canEnter,
  carById,
  classForBuild,
  defaultBuild,
  optionCost,
  paintById,
  partGroups,
  unmetRequires,
} from "./data.js";
import { beep, engineRpm, isMuted, setMuted, stopEngine } from "./audio.js";
import { cameraFor, drawCar, drawDyno, drawStrip } from "./draw.js";
import {
  EIGHTH,
  FT1000,
  FT330,
  FT60,
  QUARTER,
  coachNotes,
  compile,
  createState,
  formatEt,
  simulate,
  step,
} from "./sim.js";

const KEY = "bimmer-strip-v1";
const MARKS = [
  ["ft60", FT60],
  ["ft330", FT330],
  ["eighth", EIGHTH],
  ["ft1000", FT1000],
  ["quarter", QUARTER],
];

const app = document.querySelector("#app");
let save = load();
let view = location.hash.replace("#", "") || "garage";
if (!["garage", "tune", "strip", "slips", "paddock"].includes(view)) view = "garage";
let era = "all";
let classId = "street";
let treeMode = "full";
let notice = "";
let night = null;
let race = null;
let raf = 0;
let lastNow = 0;

const search = document.querySelector("#search");
const cashEl = document.querySelector("#cash");

function load() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "");
    if (parsed?.cars?.length) return parsed;
  } catch {
    /* fresh paddock */
  }
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
      },
    ],
    active: uid,
    slips: [],
  };
}

function persist() {
  localStorage.setItem(KEY, JSON.stringify(save));
  cashEl.textContent = money(save.cash);
}

function makeId() {
  return `c${Date.now().toString(36)}${Math.floor(Math.random() * 9999).toString(36)}`;
}

function money(value) {
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

function owned() {
  return save.cars.find((car) => car.uid === save.active) || save.cars[0];
}

function resolveSetup(car, item) {
  const seed = compile(car, item.build, {
    launchRpm: item.setup?.launchRpm || (FAMILIES_FALLBACK(car)),
    shiftRpm: item.setup?.shiftRpm || Math.round(car.redline * 0.985),
    psi: item.setup?.psi ?? 32,
    boost: item.setup?.boost ?? 1,
    fdTrim: item.setup?.fdTrim ?? 1,
  }, 0);
  item.setup = {
    launchRpm: item.setup?.launchRpm || seed.suggestedLaunch,
    shiftRpm: item.setup?.shiftRpm || Math.round(car.redline * 0.985),
    psi: item.setup?.psi ?? seed.idealPsi,
    boost: item.setup?.boost ?? 1,
    fdTrim: item.setup?.fdTrim ?? 1,
  };
  return item.setup;
}

function FAMILIES_FALLBACK(car) {
  return car.turbo || car.spoolRpm ? car.spoolRpm + 700 : car.tqPeakRpm;
}

function preview(item) {
  const car = carById(item.carId);
  const setup = resolveSetup(car, item);
  const spec = compile(car, item.build, setup, item.heat || 0);
  const slip = simulate(spec, { rt: 0, launchRpm: setup.launchRpm, shiftRpm: setup.shiftRpm });
  return { car, setup, spec, slip };
}

function stockSpec(car) {
  return compile(car, defaultBuild(), {
    launchRpm: 3000,
    shiftRpm: car.redline,
    psi: 32,
    boost: 1,
    fdTrim: 1,
  });
}

function go(next) {
  if (race && race.phase !== "done") {
    notice = "You left the lanes. The buy-in stays with the tower.";
    cancelRace();
  }
  view = next;
  history.replaceState(null, "", `#${next}`);
  paint();
}

function paint() {
  document.querySelectorAll(".ms-tabs a").forEach((link) => {
    const on = link.dataset.view === view;
    link.setAttribute("aria-current", on ? "page" : "false");
    link.classList.toggle("is-active", on);
  });
  cashEl.textContent = money(save.cash);
  app.replaceChildren();
  if (view === "garage") renderGarage();
  else if (view === "tune") renderTune();
  else if (view === "strip") renderStrip();
  else if (view === "slips") renderSlips();
  else renderPaddock();
}

function renderGarage() {
  const item = owned();
  const { car, spec, slip } = preview(item);
  const hero = el("section", { class: "ms-hero" }, [
    el("p", { class: "ms-eyebrow" }, "Garage"),
    el("h1", { class: "ms-h1" }, item.name),
    el("p", { class: "ms-lead" }, "Every car on this property is a BMW. The drawings are original side views scaled from published length, height, and wheelbase."),
  ]);
  const canvas = el("canvas", { class: "preview", id: "hero-car" });
  hero.append(canvas);
  const rename = el("input", { class: "ms-field", id: "rename", value: item.name, maxlength: "32" });
  rename.addEventListener("change", () => {
    item.name = rename.value.trim() || car.name;
    persist();
    paint();
  });
  hero.append(el("div", { class: "stack", style: "margin-top:14px" }, [
    el("label", { class: "ms-eyebrow", for: "rename" }, "Name"),
    rename,
  ]));
  const colors = el("div", { class: "row", style: "margin-top:12px" });
  for (const paint of PAINTS) {
    const chip = el("button", {
      class: `ms-chip${item.paint === paint.id ? " is-active" : ""}`,
      type: "button",
      "aria-pressed": item.paint === paint.id ? "true" : "false",
    }, paint.name);
    chip.addEventListener("click", () => {
      item.paint = paint.id;
      persist();
      paint();
    });
    colors.append(chip);
  }
  hero.append(colors);

  const facts = el("div", { class: "ms-card" }, [
    el("p", { class: "ms-eyebrow" }, "Factory sheet"),
    line("Car", `${car.year} BMW ${car.chassis} ${car.name}`),
    line("Engine", `${car.engine} · ${car.aspiration}`),
    line("Output", `${car.hp} hp · ${car.tq} Nm`),
    line("Redline", `${car.redline.toLocaleString("en-US")} rpm`),
    line("Weight", `${car.mass.toLocaleString("en-US")} kg`),
    line("Gearbox", transLabel(car.trans)),
    line("Published quarter", car.published),
    el("p", { class: "ms-lead" }, car.blurb),
    el("p", { class: "ms-lead" }, `In this build, a perfect leave is ${formatEt(slip.quarter)} at ${slip.quarterMph ? slip.quarterMph.toFixed(1) : "—"} mph. Crank power right now is ${Math.round(spec.hp)} hp.`),
  ]);
  if (item.damage) {
    facts.append(el("p", { class: "notice" }, item.damage === "engine" ? "The engine needs a rebuild before it stages again." : "An axle is out. Fix it before the next hit."));
    const fix = el("button", { class: "ms-btn", type: "button" }, `Repair · ${money(repairCost(item))}`);
    fix.addEventListener("click", () => repair(item));
    facts.append(fix);
  }
  const actions = el("div", { class: "row", style: "margin-top:12px" }, [
    button("Tune this car", () => go("tune"), "ms-btn"),
    button("Take it to the strip", () => go("strip"), "ms-btn ms-btn-ghost"),
  ]);
  if (save.cars.length > 1) {
    actions.append(button("Sell", () => sell(item), "ms-btn ms-btn-danger"));
  }
  facts.append(actions);

  const list = el("div", { class: "car-grid" });
  for (const ownedCar of save.cars.filter((entry) => matches(carById(entry.carId), entry.name))) {
    const info = carById(ownedCar.carId);
    const card = el("button", { class: `ms-card car-pick${ownedCar.uid === item.uid ? " is-selected" : ""}`, type: "button" }, [
      el("p", { class: "ms-eyebrow" }, info.chassis),
      el("h2", { class: "ms-h1", style: "font-size:1.25rem" }, ownedCar.name),
      el("p", { class: "ms-lead" }, `${info.year} · ${info.engine} · ${className(classForBuild(ownedCar.build))}`),
    ]);
    card.addEventListener("click", () => {
      save.active = ownedCar.uid;
      persist();
      paint();
    });
    list.append(card);
  }

  app.append(hero, el("div", { class: "split", style: "margin-top:16px" }, [facts, list]));
  requestAnimationFrame(() => {
    const node = document.getElementById("hero-car");
    if (!node) return;
    sizeCanvas(node);
    const ctx = node.getContext("2d");
    const cssW = node.clientWidth || 640;
    const cssH = node.clientHeight || 210;
    ctx.clearRect(0, 0, cssW, cssH);
    const px = Math.min(78, (cssW - 48) / car.length);
    drawCar(ctx, car, paintById(item.paint).hex, 28, cssH * 0.8, px, {
      tireRadius: spec.tireRadius,
      induction: item.build.induction,
      exhaust: item.build.exhaust,
    });
  });
}

function renderTune() {
  const item = owned();
  const { car, spec, slip, setup } = preview(item);
  app.append(el("section", { class: "ms-hero" }, [
    el("p", { class: "ms-eyebrow" }, `${className(classForBuild(item.build))} combination`),
    el("h1", { class: "ms-h1" }, `Tune the ${car.chassis}`),
    el("p", { class: "ms-lead" }, "Power steps follow published BMW shop paths: flash, breathing, fuel, then turbos or a kit. The dyno is this car's curve, not a catalog horsepower claim."),
  ]));

  const dynoCard = el("div", { class: "ms-card" }, [
    el("p", { class: "ms-eyebrow" }, "Dyno"),
    el("canvas", { class: "dyno", id: "dyno" }),
  ]);
  const stats = el("div", { id: "tune-stats" });
  dynoCard.append(stats, el("div", { id: "tune-warn" }));
  const sliders = el("div", { id: "sliders", style: "margin-top:12px" });
  dynoCard.append(sliders);
  sliders.append(slider("Launch rpm", setup.launchRpm, 1400, car.redline - 150, 10, (value) => {
    item.setup.launchRpm = value;
    refreshTune(item);
  }));
  sliders.append(slider("Shift rpm", setup.shiftRpm, 3000, car.redline, 10, (value) => {
    item.setup.shiftRpm = value;
    refreshTune(item);
  }));
  sliders.append(slider("Tire pressure", setup.psi, 10, 40, 0.5, (value) => {
    item.setup.psi = value;
    refreshTune(item);
  }, "psi"));
  if (spec.turbo) {
    sliders.append(slider("Boost target", setup.boost, 0.9, 1.12, 0.01, (value) => {
      item.setup.boost = value;
      refreshTune(item);
    }, "x"));
  }
  if (item.build.gearing) {
    sliders.append(slider("Final drive trim", setup.fdTrim, 0.9, 1.16, 0.01, (value) => {
      item.setup.fdTrim = value;
      refreshTune(item);
    }, "x"));
  }
  const bite = button("Set the launch to the bite", () => {
    item.setup.launchRpm = spec.suggestedLaunch;
    item.setup.psi = spec.idealPsi;
    persist();
    paint();
  }, "ms-btn ms-btn-ghost");
  dynoCard.append(el("div", { class: "row" }, [bite, button("Race this tune", () => go("strip"), "ms-btn")]));

  const parts = el("div", { class: "ms-card", id: "parts" });
  for (const group of partGroups(car)) {
    parts.append(el("p", { class: "ms-eyebrow", style: "margin-top:8px" }, group.label));
    const current = item.build[group.id] || 0;
    for (const option of group.options) {
      const block = el("div", { class: "part" }, [
        el("h3", {}, option.name),
        el("p", {}, option.note),
      ]);
      const row = el("div", { class: "row" });
      if (option.level === current) {
        row.append(el("span", { class: "ms-lead" }, "Fitted"));
        if (option.level > 0) {
          row.append(button("Remove", () => {
            save.cash += Math.round(optionCost(car, group.id, option.level) * 0.4);
            item.build[group.id] = option.level - 1;
            persist();
            paint();
          }, "ms-btn ms-btn-ghost"));
        }
      } else if (option.level === current + 1) {
        const unmet = unmetRequires(car, item.build, group.id, option.level);
        const cost = optionCost(car, group.id, option.level);
        const install = button(cost ? `Install · ${money(cost)}` : "Install", () => {
          if (unmet.length || save.cash < cost) return;
          save.cash -= cost;
          item.build[group.id] = option.level;
          persist();
          paint();
        }, "ms-btn ms-btn-ghost");
        if (unmet.length || save.cash < cost) install.disabled = true;
        row.append(install);
        if (unmet.length) row.append(el("span", { class: "ms-lead" }, unmet[0].reason));
        else if (save.cash < cost) row.append(el("span", { class: "ms-lead" }, "Short on cash."));
      }
      block.append(row);
      parts.append(block);
    }
  }

  app.append(el("div", { class: "split", style: "margin-top:16px" }, [dynoCard, parts]));
  fillTuneStats(item);
  requestAnimationFrame(() => redrawDyno(item));
}

function refreshTune(item) {
  persist();
  fillTuneStats(item);
  redrawDyno(item);
}

function fillTuneStats(item) {
  const { car, spec, slip, setup } = preview(item);
  const stats = document.getElementById("tune-stats");
  const warn = document.getElementById("tune-warn");
  if (!stats) return;
  stats.replaceChildren(
    line("Crank", `${Math.round(spec.hp)} hp · ${Math.round(spec.tq)} Nm`),
    line("At the wheels", `${Math.round(spec.hp * spec.eff)} hp`),
    line("Mass", `${Math.round(spec.mass)} kg`),
    line("Final drive", spec.finalDrive.toFixed(2)),
    line("Bite", `${spec.suggestedLaunch} rpm`),
    line("Your launch", `${Math.round(setup.launchRpm)} rpm`),
    line("Vehicle quarter", slip.quarter ? `${formatEt(slip.quarter)} at ${slip.quarterMph.toFixed(1)} mph` : "Won't finish"),
    line("60 foot", formatEt(slip.ft60)),
    line("Class", className(classForBuild(item.build))),
  );
  warn.replaceChildren();
  for (const message of spec.warnings) warn.append(el("p", { class: "warn" }, message));
  if (item.heat) warn.append(el("p", { class: "warn" }, "Heat soak from the last pass is still in the cooler."));
  const label = document.querySelector("[data-live='fd']");
  if (label) label.textContent = `${setup.fdTrim.toFixed(2)}× · ${spec.finalDrive.toFixed(2)}`;
}

function redrawDyno(item) {
  const canvas = document.getElementById("dyno");
  if (!canvas) return;
  const car = carById(item.carId);
  const { spec } = preview(item);
  drawDyno(canvas, spec, stockSpec(car));
}

function renderStrip() {
  const item = owned();
  const { car, spec, slip } = preview(item);
  const legal = canEnter(item.build, classId);
  if (!night || night.classId !== classId || night.against !== item.uid) rollNight();

  app.append(el("section", { class: "ms-hero" }, [
    el("p", { class: "ms-eyebrow" }, "Strip"),
    el("h1", { class: "ms-h1" }, "Stage it"),
    el("p", { class: "ms-lead" }, "Full tree is a 0.500 cadence. Pro tree is 0.400. Space or Launch on the last amber is a red light. Manuals shift with Shift or the up arrow. DCT, ZF, and SMG cars shift themselves at the light you set."),
  ]));

  const tree = el("div", { class: "tree", id: "tree" }, [
    bulb("pre"), bulb("stage"), bulb("amber"), bulb("amber"), bulb("amber"), bulb("green"), bulb("red"),
  ]);
  const canvas = el("canvas", { class: "race-canvas", id: "race" });
  const readout = el("div", { class: "readout", id: "readout" }, [
    el("span", { id: "gear" }, "Gear —"),
    el("span", { id: "speed" }, "0 mph"),
    el("span", { id: "rpm" }, "0 rpm"),
    el("span", { id: "flag" }, ""),
  ]);
  const tach = el("div", { class: "tach", id: "tach" }, [
    el("div", { class: "tach-fill", id: "tach-fill" }),
    el("div", { class: "tach-mark", id: "tach-mark" }),
  ]);
  const pedals = el("div", { class: "pedals", id: "pedals" });
  const live = el("div", { id: "live", "aria-live": "polite" });
  const board = el("div", { class: "ms-card" }, [
    el("div", { class: "strip-board" }, [tree, el("div", {}, [canvas, tach, readout, pedals])]),
    live,
    el("div", { id: "result" }),
  ]);

  const side = el("div", { class: "ms-card" }, [
    el("p", { class: "ms-eyebrow" }, "Class"),
    el("div", { class: "row", id: "class-row" }),
    el("div", { class: "row", id: "tree-row", style: "margin-top:8px" }),
    el("div", { id: "rival-card", style: "margin-top:12px" }),
  ]);
  if (notice) side.append(el("p", { class: "notice" }, notice));

  app.append(el("div", { class: "split", style: "margin-top:16px" }, [board, side]));
  fillClassChips();
  fillRival(item, spec, slip, legal);
  armPedals(item, legal);
  requestAnimationFrame(drawIdle);
}

function fillClassChips() {
  const row = document.getElementById("class-row");
  const trees = document.getElementById("tree-row");
  row.replaceChildren();
  for (const entry of CLASSES) {
    const chip = el("button", {
      class: `ms-chip${classId === entry.id ? " is-active" : ""}`,
      type: "button",
      "aria-pressed": classId === entry.id ? "true" : "false",
    }, entry.name);
    chip.addEventListener("click", () => {
      classId = entry.id;
      night = null;
      paint();
    });
    row.append(chip);
  }
  trees.replaceChildren();
  for (const mode of [["full", "Full tree"], ["pro", "Pro tree"]]) {
    const chip = el("button", {
      class: `ms-chip${treeMode === mode[0] ? " is-active" : ""}`,
      type: "button",
      "aria-pressed": treeMode === mode[0] ? "true" : "false",
    }, mode[1]);
    chip.addEventListener("click", () => {
      treeMode = mode[0];
      paint();
    });
    trees.append(chip);
  }
}

function fillRival(item, spec, slip, legal) {
  const card = document.getElementById("rival-card");
  const entry = CLASSES.find((row) => row.id === classId);
  card.replaceChildren(
    el("p", { class: "ms-eyebrow" }, "Your pace"),
    line("Vehicle ET", slip.quarter ? `${formatEt(slip.quarter)} @ ${slip.quarterMph.toFixed(1)}` : "—"),
    line("60 foot", formatEt(slip.ft60)),
    line("Power", `${Math.round(spec.hp)} hp`),
    el("p", { class: "ms-lead" }, entry.blurb),
    el("p", { class: "ms-lead" }, `Buy-in ${money(entry.entry)} · win ${money(entry.purse)} · a loss returns ${money(Math.round(entry.entry * 0.35))}.`),
  );
  if (!legal) {
    card.append(el("p", { class: "notice" }, `This combination is filed as ${className(classForBuild(item.build))}.`));
  }
  if (night) {
    card.append(
      el("p", { class: "ms-eyebrow", style: "margin-top:12px" }, "In the other lane"),
      line("Car", `${night.car.year} ${night.car.chassis} ${night.car.name}`),
      line("Power", `${Math.round(night.spec.hp)} hp`),
      line("Pace", `${formatEt(night.slip.quarter)} @ ${night.slip.quarterMph.toFixed(1)}`),
      el("p", { class: "ms-lead" }, "Their light is hidden. A better reaction beats a slightly quicker car."),
    );
  }
  const row = el("div", { class: "row" });
  row.append(button("New opponent", () => {
    night = null;
    rollNight();
    paint();
  }, "ms-btn ms-btn-ghost"));
  if (item.heat) {
    row.append(button("Cool the car", () => {
      item.heat = 0;
      persist();
      paint();
    }, "ms-btn ms-btn-ghost"));
  }
  card.append(row);
}

function armPedals(item, legal) {
  const pedals = document.getElementById("pedals");
  const entry = CLASSES.find((row) => row.id === classId);
  const practice = button("Test hit", () => startRace("practice"), "ms-btn ms-btn-ghost");
  const buy = button(`Buy in · ${money(entry.entry)}`, () => startRace("race"), "ms-btn");
  if (item.damage) {
    practice.disabled = true;
    buy.disabled = true;
  }
  if (!legal || save.cash < entry.entry) buy.disabled = true;
  pedals.append(practice, buy);
}

function startRace(mode) {
  const item = owned();
  if (item.damage) {
    notice = "Repair the car first.";
    paint();
    return;
  }
  const entry = CLASSES.find((row) => row.id === classId);
  if (mode === "race") {
    if (!canEnter(item.build, classId)) return;
    if (save.cash < entry.entry) return;
    if (!night) rollNight();
    if (!night) {
      notice = "Nobody was ready in that class. The buy-in was not taken.";
      paint();
      return;
    }
    save.cash -= entry.entry;
    persist();
  }
  const car = carById(item.carId);
  const setup = resolveSetup(car, item);
  const spec = compile(car, item.build, setup, item.heat || 0);
  const rival = mode === "race" ? night : null;
  race = {
    mode,
    phase: "staging",
    stageT: 0,
    holdT: 0,
    delay: 1.05 + Math.random() * 1.45,
    treeT: 0,
    amberLit: 0,
    green: false,
    red: false,
    launchedInput: false,
    shiftEdge: false,
    clock: 0,
    player: {
      car,
      item,
      spec,
      state: createState(spec),
      traps: blankTraps(),
      prevX: 0,
      shifts: [],
    },
    rival: rival
      ? {
          car: rival.car,
          spec: rival.spec,
          build: rival.build,
          paint: rival.paintHex,
          state: createState(rival.spec),
          traps: blankTraps(),
          prevX: 0,
          rt: rival.rt,
          shiftRpm: rival.shiftRpm,
          red: rival.rt < 0,
        }
      : null,
    result: null,
  };
  lastNow = performance.now();
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(loop);
  const pedals = document.getElementById("pedals");
  const waiting = button("Wait for the tree", () => {}, "ms-btn");
  waiting.disabled = true;
  pedals.replaceChildren(waiting, button("Shift", requestShift, "ms-btn ms-btn-ghost"));
  document.getElementById("result")?.replaceChildren();
  document.getElementById("live").textContent = "Staged. Wait for the tree.";
}

function requestLaunch() {
  if (!race || race.phase === "done" || race.phase === "staging" || race.phase === "hold") return;
  if (race.launchedInput) return;
  race.launchedInput = true;
  race.launchTreeT = race.treeT;
  if (!race.green) race.red = true;
  else race.reaction = race.clock;
}

function requestShift() {
  if (!race || !race.launchedInput || race.phase === "done") return;
  race.shiftEdge = true;
}

function loop(now) {
  if (!race) return;
  const dt = Math.min(0.034, Math.max(0.001, (now - lastNow) / 1000));
  lastNow = now;
  tick(dt);
  drawFrame();
  if (race && race.phase !== "done") raf = requestAnimationFrame(loop);
  else stopEngine();
}

function tick(dt) {
  const greenAt = treeMode === "pro" ? 0.4 : 1.5;
  if (race.phase === "staging") {
    race.stageT += dt;
    if (race.stageT >= 0.45) race.phase = "hold";
  } else if (race.phase === "hold") {
    race.holdT += dt;
    if (race.holdT >= race.delay) {
      race.phase = "tree";
      race.treeT = 0;
    }
  } else if (race.phase === "tree" || race.phase === "racing") {
    if (!race.green) {
      race.treeT += dt;
      const ambers = treeMode === "pro" ? [0] : [0, 0.5, 1];
      ambers.forEach((mark, index) => {
        if (race.treeT >= mark && race.amberLit < index + 1) {
          race.amberLit = index + 1;
          beep(680, 0.08);
        }
      });
      if (!race.launchReady) {
        race.launchReady = true;
        const pedals = document.getElementById("pedals");
        if (pedals) {
          pedals.replaceChildren(
            button("Launch", requestLaunch, "ms-btn"),
            button("Shift", requestShift, "ms-btn ms-btn-ghost"),
          );
        }
      }
      if (race.treeT >= greenAt) {
        race.green = true;
        race.phase = "racing";
        beep(race.red ? 140 : 880, 0.16, "square", 0.05);
      }
    } else {
      race.phase = "racing";
      race.clock += dt;
    }
    integrate(dt);
    if (finished()) finish();
  }
  paintBulbs();
  paintReadout();
}

function integrate(dt) {
  const steps = Math.max(1, Math.ceil(dt / (1 / 200)));
  const h = dt / steps;
  for (let i = 0; i < steps; i += 1) {
    const playerShift = i === 0 && consumeShift(race.player);
    step(race.player.state, race.player.spec, h, {
      throttle: race.launchedInput,
      shift: playerShift,
    });
    if (race.rival) {
      const go = rivalThrottle();
      const shift = go && race.rival.state.launched && race.rival.state.rpm >= race.rival.shiftRpm && race.rival.state.shiftLeft <= 0;
      step(race.rival.state, race.rival.spec, h, { throttle: go, shift: shift && i === 0 });
    }
  }
    noteTraps(race.player, race.green ? race.clock : 0, dt);
    if (race.rival) noteTraps(race.rival, race.green ? race.clock : 0, dt);
  }

function consumeShift(player) {
  const spec = player.spec;
  const state = player.state;
  let shift = race.shiftEdge;
  race.shiftEdge = false;
  if (spec.autoShift && state.launched && state.shiftLeft <= 0 && state.rpm >= spec.shiftRpm && state.runT > spec.dumpTime) {
    shift = true;
  }
  if (shift) player.shifts.push(Math.round(state.rpm));
  return shift;
}

function rivalThrottle() {
  const greenAt = treeMode === "pro" ? 0.4 : 1.5;
  if (race.rival.rt < 0) return race.treeT >= greenAt + race.rival.rt && race.phase !== "staging" && race.phase !== "hold";
  return race.green && race.clock >= race.rival.rt;
}

function noteTraps(bucket, clock, frameDt) {
  const state = bucket.state;
  for (const [key, dist] of MARKS) {
    if (bucket.traps[key] == null && bucket.prevX < dist && state.x >= dist) {
      const span = state.x - bucket.prevX || 1;
      const frac = (dist - bucket.prevX) / span;
      bucket.traps[key] = Math.max(0, clock - frameDt * (1 - frac));
      const speed = state.v * 2.23694;
      if (key === "eighth") bucket.traps.eighthMph = speed;
      if (key === "quarter") bucket.traps.quarterMph = speed;
    }
  }
  bucket.prevX = state.x;
}

function finished() {
  const state = race.player.state;
  const dead = state.axle || (state.blown && state.knock > 1.4);
  const playerDone = race.player.traps.quarter != null || dead;
  if (!playerDone) return false;
  if (!race.rival) return true;
  const rivalDead = race.rival.state.axle || (race.rival.state.blown && race.rival.state.knock > 1.4);
  return race.rival.traps.quarter != null || rivalDead || race.clock > 28;
}

function finish() {
  race.phase = "done";
  const item = race.player.item;
  item.heat = 1;
  const slip = slipFrom(race.player, race.red);
  const rivalSlip = race.rival ? slipFrom(race.rival, race.rival.red) : null;
  let outcome = "time";
  if (race.mode === "race" && rivalSlip) {
    outcome = judge(slip, rivalSlip);
    const entry = CLASSES.find((row) => row.id === classId);
    if (outcome === "win") save.cash += entry.purse;
    else save.cash += Math.round(entry.entry * 0.35);
  }
  if (slip.dnf === "engine" || slip.blown) item.damage = "engine";
  else if (slip.dnf === "axle" || slip.axle) item.damage = "axle";
  save.slips.unshift({
    id: makeId(),
    car: item.name,
    chassis: race.player.car.chassis,
    mode: race.mode,
    classId,
    outcome,
    rt: slip.rt,
    quarter: slip.quarter,
    mph: slip.quarterMph,
    ft60: slip.ft60,
    rival: race.rival ? `${race.rival.car.chassis} ${race.rival.car.name}` : "",
  });
  save.slips = save.slips.slice(0, 40);
  persist();
  const notes = coachNotes(race.player.spec, slip, item.setup);
  const result = document.getElementById("result");
  const heading = outcome === "win" ? "Win" : outcome === "loss" ? "Loss" : "Timeslip";
  result.replaceChildren(el("div", { class: "ms-card", style: "margin-top:12px" }, [
    el("p", { class: "ms-eyebrow" }, heading),
    el("h2", { class: "ms-h1" }, slip.quarter ? `${formatEt(slip.quarter)} at ${slip.quarterMph.toFixed(1)} mph` : "No finish"),
    renderSlipTable(slip, rivalSlip),
    ...notes.map((note) => el("p", { class: "ms-lead" }, note)),
    el("div", { class: "row" }, [
      button("Run it back", () => {
        race = null;
        paint();
      }, "ms-btn"),
    ]),
  ]));
  document.getElementById("live").textContent = `${heading}. ${notes[0] || ""}`;
  document.getElementById("result")?.scrollIntoView({ block: "nearest" });
  document.getElementById("pedals")?.replaceChildren();
  cashEl.textContent = money(save.cash);
}

function judge(slip, rival) {
  const playerOut = slip.dnf || slip.quarter == null;
  const rivalOut = rival.dnf || rival.quarter == null;
  if (playerOut && rivalOut) return "loss";
  if (playerOut) return "loss";
  if (rivalOut) return slip.red ? "loss" : "win";
  if (slip.red && !rival.red) return "loss";
  if (rival.red && !slip.red) return "win";
  if (slip.red && rival.red) return slip.rt >= rival.rt ? "win" : "loss";
  return slip.quarter <= rival.quarter ? "win" : "loss";
}

function slipFrom(bucket, red) {
  const state = bucket.state;
  return {
    rt: bucket === race.player ? playerRt() : bucket.rt,
    ...bucket.traps,
    dnf: state.axle ? "axle" : state.blown && !bucket.traps.quarter ? "engine" : null,
    blown: state.blown,
    axle: state.axle,
    knock: state.knock,
    limiterTime: state.limiterTime,
    finishRpm: state.rpm,
    finishGear: state.gear,
    red: Boolean(red),
    shifts: bucket.shifts || [],
  };
}

function playerRt() {
  const greenAt = treeMode === "pro" ? 0.4 : 1.5;
  if (race.red) return (race.launchTreeT ?? 0) - greenAt;
  return race.reaction ?? 0;
}

function renderSlipTable(slip, rival) {
  const rows = [
    ["Reaction", slip.rt, rival?.rt],
    ["60 ft", slip.ft60, rival?.ft60],
    ["330 ft", slip.ft330, rival?.ft330],
    ["1/8", slip.eighth, rival?.eighth],
    ["1/8 mph", slip.eighthMph, rival?.eighthMph],
    ["1000 ft", slip.ft1000, rival?.ft1000],
    ["1/4", slip.quarter, rival?.quarter],
    ["1/4 mph", slip.quarterMph, rival?.quarterMph],
  ];
  const grid = el("div", { class: "slip-grid" });
  grid.append(el("span", {}, ""), el("b", {}, "You"), el("b", {}, rival ? "Rival" : ""));
  for (const [label, a, b] of rows) {
    const mphRow = label.includes("mph");
    grid.append(
      el("span", {}, label),
      el("b", {}, showSlip(a, mphRow)),
      el("span", {}, rival ? showSlip(b, mphRow) : ""),
    );
  }
  return grid;
}

function showSlip(value, mphRow) {
  if (value == null || Number.isNaN(value)) return "—";
  return mphRow ? Number(value).toFixed(1) : Number(value).toFixed(3);
}

function paintBulbs() {
  const nodes = document.querySelectorAll("#tree .bulb");
  if (!nodes.length || !race) return;
  const [pre, stage, a1, a2, a3, green, red] = nodes;
  const staged = race.phase !== "staging";
  setBulb(pre, true);
  setBulb(stage, staged);
  const ambers = treeMode === "pro" ? race.amberLit > 0 && !race.green : null;
  setBulb(a1, race.phase === "tree" || race.phase === "racing" ? (treeMode === "pro" ? race.amberLit > 0 && !race.green : race.amberLit >= 1 && !race.green) : false);
  setBulb(a2, treeMode === "pro" ? ambers : race.amberLit >= 2 && !race.green);
  setBulb(a3, treeMode === "pro" ? ambers : race.amberLit >= 3 && !race.green);
  setBulb(green, race.green && !race.red);
  setBulb(red, race.red);
}

function setBulb(node, on) {
  if (node) node.classList.toggle("on", Boolean(on));
}

function paintReadout() {
  if (!race) return;
  const state = race.player.state;
  const spec = race.player.spec;
  const gear = document.getElementById("gear");
  const speed = document.getElementById("speed");
  const rpm = document.getElementById("rpm");
  const flag = document.getElementById("flag");
  const fill = document.getElementById("tach-fill");
  const mark = document.getElementById("tach-mark");
  const tach = document.getElementById("tach");
  if (!gear) return;
  gear.textContent = state.launched ? `Gear ${state.gear}` : "Staged";
  speed.textContent = `${Math.round(state.v * 2.23694)} mph`;
  rpm.textContent = `${Math.round(state.rpm)} rpm`;
  flag.textContent = race.red ? "Red light" : state.spin ? "Tires loose" : state.knock > 0.45 ? "Knock" : state.shiftLeft > 0 ? "Shift" : "";
  const ratio = Math.max(0, Math.min(1, state.rpm / spec.redline));
  fill.style.width = `${ratio * 100}%`;
  mark.style.left = `${(spec.shiftRpm / spec.redline) * 100}%`;
  tach.classList.toggle("limit", state.rpm >= spec.redline - 30 && state.launched);
  if (race.phase !== "done") engineRpm(state.launched ? state.rpm : spec.launchRpm, race.launchedInput ? 1 : 0.35);
}

function drawFrame() {
  const canvas = document.getElementById("race");
  if (!canvas || !race) return;
  sizeCanvas(canvas);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const ctx = canvas.getContext("2d");
  const scenePlayer = {
    car: race.player.car,
    state: race.player.state,
    spec: race.player.spec,
    build: race.player.item.build,
    paint: paintById(race.player.item.paint).hex,
  };
  const sceneRival = race.rival
    ? {
        car: race.rival.car,
        state: race.rival.state,
        spec: race.rival.spec,
        build: race.rival.build,
        paint: race.rival.paint,
      }
    : null;
  const cam = cameraFor(w, scenePlayer, sceneRival);
  drawStrip(ctx, w, h, {
    ...cam,
    player: scenePlayer,
    rival: sceneRival,
    rivalName: sceneRival ? `${sceneRival.car.chassis}` : "",
  });
}

function drawIdle() {
  const item = owned();
  const car = carById(item.carId);
  const spec = preview(item).spec;
  const canvas = document.getElementById("race");
  if (!canvas) return;
  sizeCanvas(canvas);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const fake = {
    car,
    state: { x: 0, v: 0, rpm: 0 },
    spec,
    build: item.build,
    paint: paintById(item.paint).hex,
  };
  let rival = null;
  if (night) {
    rival = {
      car: night.car,
      state: { x: 0 },
      spec: night.spec,
      build: night.build,
      paint: night.paintHex,
    };
  }
  drawStrip(canvas.getContext("2d"), w, h, {
    ...cameraFor(w, fake, rival),
    player: fake,
    rival,
    rivalName: night ? night.car.chassis : "",
  });
}

function rollNight() {
  const item = owned();
  const mine = preview(item);
  const goal = (mine.slip.quarter || 14) + (Math.random() * 0.3 - 0.08);
  const templates = RIVAL_BUILDS[classId];
  let best = null;
  for (let i = 0; i < 8; i += 1) {
    const car = CARS[Math.floor(Math.random() * CARS.length)];
    const template = templates[Math.floor(Math.random() * templates.length)];
    const build = { ...defaultBuild(), ...template };
    if (car.family && build.induction >= 2 && !canEnter(build, classId)) build.induction = 1;
    const rough = compile(car, build, { launchRpm: 3500, shiftRpm: car.redline * 0.97, psi: 32, boost: 1, fdTrim: build.gearing ? 1.04 : 1 });
    const setup = {
      launchRpm: rough.suggestedLaunch,
      shiftRpm: Math.round(car.redline * (0.95 + Math.random() * 0.035)),
      psi: rough.idealPsi,
      boost: 1,
      fdTrim: build.gearing ? 1.03 : 1,
    };
    const spec = compile(car, build, setup);
    const slip = simulate(spec, { rt: 0, launchRpm: setup.launchRpm, shiftRpm: setup.shiftRpm });
    if (!slip.quarter) continue;
    const err = Math.abs(slip.quarter - goal);
    if (!best || err < best.err) best = { err, car, build, setup, spec, slip };
  }
  if (!best) return;
  night = {
    ...best,
    classId,
    against: item.uid,
    paintHex: paintById(best.car.paint).id === item.paint ? "#c5c8ce" : paintById(best.car.paint).hex,
    rt: rollRt(classId),
    shiftRpm: best.setup.shiftRpm,
  };
}

function rollRt(level) {
  const odds = { street: 0.08, sport: 0.05, pro: 0.03, outlaw: 0.02 };
  if (Math.random() < odds[level]) return -(0.02 + Math.random() * 0.08);
  const span = { street: [0.055, 0.2], sport: [0.04, 0.15], pro: [0.02, 0.1], outlaw: [0.012, 0.075] }[level];
  return span[0] + Math.random() * (span[1] - span[0]);
}

function renderSlips() {
  app.append(el("section", { class: "ms-hero" }, [
    el("p", { class: "ms-eyebrow" }, "Timeslips"),
    el("h1", { class: "ms-h1" }, "What the clocks caught"),
    el("p", { class: "ms-lead" }, "Reaction is included in the elapsed time, the way a real slip is written."),
  ]));
  const q = search.value.trim().toLowerCase();
  const rows = save.slips.filter((slip) => !q || `${slip.car} ${slip.chassis} ${slip.rival}`.toLowerCase().includes(q));
  const table = el("table", { class: "ms-table" }, [
    el("thead", {}, el("tr", {}, ["When it was", "Car", "Class", "R/T", "60 ft", "1/4", "Mph", "Result"].map((label) => el("th", {}, label)))),
  ]);
  const body = el("tbody");
  for (const slip of rows) {
    body.append(el("tr", {}, [
      el("td", {}, slip.mode === "practice" ? "Test" : "Race"),
      el("td", {}, slip.car),
      el("td", {}, className(slip.classId)),
      el("td", {}, slip.rt == null ? "—" : Number(slip.rt).toFixed(3)),
      el("td", {}, formatEt(slip.ft60)),
      el("td", {}, formatEt(slip.quarter)),
      el("td", {}, slip.mph ? Number(slip.mph).toFixed(1) : "—"),
      el("td", {}, slip.outcome === "win" ? "Win" : slip.outcome === "loss" ? "Loss" : "Time"),
    ]));
  }
  table.append(body);
  app.append(el("div", { class: "ms-card", style: "margin-top:16px" }, rows.length ? [table] : [el("p", { class: "ms-lead" }, "No slips yet. Stage the car.")]));
}

function renderPaddock() {
  app.append(el("section", { class: "ms-hero" }, [
    el("p", { class: "ms-eyebrow" }, "Paddock"),
    el("h1", { class: "ms-h1" }, "Buy another BMW"),
    el("p", { class: "ms-lead" }, "Prices are game money, ordered like a used lot, not an appraisal. Specs are the factory numbers the model is built from."),
  ]));
  const chips = el("div", { class: "row", style: "margin:16px 0" });
  for (const [id, label] of [["all", "All"], ["classic", "Classic"], ["turbo", "Turbo six"], ["v8", "V8 and V10"]]) {
    const chip = el("button", {
      class: `ms-chip${era === id ? " is-active" : ""}`,
      type: "button",
      "aria-pressed": era === id ? "true" : "false",
    }, label);
    chip.addEventListener("click", () => {
      era = id;
      paint();
    });
    chips.append(chip);
  }
  app.append(chips);
  const grid = el("div", { class: "car-grid" });
  for (const car of CARS.filter((candidate) => matches(candidate, candidate.name) && (era === "all" || candidate.era === era))) {
    const ownedAlready = save.cars.some((item) => item.carId === car.id);
    const card = el("article", { class: "ms-card" }, [
      el("p", { class: "ms-eyebrow" }, `${car.year} · ${car.chassis}`),
      el("h2", { class: "ms-h1", style: "font-size:1.3rem" }, `${car.name}`),
      el("p", { class: "ms-lead" }, `${car.engine} · ${car.hp} hp · ${car.tq} Nm · ${car.mass} kg`),
      el("p", { class: "ms-lead" }, car.blurb),
      el("p", { class: "ms-lead" }, car.published),
    ]);
    const buy = button(ownedAlready ? "In the garage" : `Buy · ${money(car.price)}`, () => buyCar(car), "ms-btn");
    if (ownedAlready || save.cash < car.price) buy.disabled = true;
    card.append(buy);
    if (!ownedAlready && save.cash < car.price) {
      card.append(el("p", { class: "ms-lead" }, `${money(car.price - save.cash)} short.`));
    }
    grid.append(card);
  }
  app.append(grid);
}

function buyCar(car) {
  if (save.cash < car.price) return;
  if (save.cars.some((item) => item.carId === car.id)) return;
  save.cash -= car.price;
  const uid = makeId();
  save.cars.push({
    uid,
    carId: car.id,
    paint: car.paint,
    name: `${car.year} ${car.name}`,
    build: defaultBuild(),
    setup: null,
    damage: null,
    heat: 0,
  });
  save.active = uid;
  notice = `${car.chassis} ${car.name} is in the garage.`;
  persist();
  go("garage");
}

function sell(item) {
  if (save.cars.length < 2) return;
  const car = carById(item.carId);
  let parts = 0;
  for (const group of partGroups(car)) {
    const level = item.build[group.id] || 0;
    for (let step = 1; step <= level; step += 1) parts += optionCost(car, group.id, step);
  }
  save.cash += Math.round(car.price * 0.6 + parts * 0.4);
  save.cars = save.cars.filter((entry) => entry.uid !== item.uid);
  save.active = save.cars[0].uid;
  persist();
  paint();
}

function repair(item) {
  const cost = repairCost(item);
  if (save.cash >= cost) {
    save.cash -= cost;
    item.heat = 0;
  } else {
    save.cash = 0;
    item.heat = 1;
    notice = "The shop patched it. It will heat-soak until you pay for a proper rebuild next time.";
  }
  item.damage = null;
  persist();
  paint();
}

function repairCost(item) {
  const car = carById(item.carId);
  return item.damage === "engine" ? Math.round(700 + car.price * 0.03) : Math.round(450 + car.price * 0.015);
}

function blankTraps() {
  return { ft60: null, ft330: null, eighth: null, eighthMph: null, ft1000: null, quarter: null, quarterMph: null };
}

function cancelRace() {
  cancelAnimationFrame(raf);
  race = null;
  stopEngine();
}

function matches(car, name) {
  const q = search.value.trim().toLowerCase();
  if (!q) return true;
  return `${car.year} ${car.name} ${car.chassis} ${car.engine} ${car.series} ${name}`.toLowerCase().includes(q);
}

function className(id) {
  return CLASSES.find((row) => row.id === id)?.name || "Street";
}

function transLabel(trans) {
  if (trans === "dct") return "7-speed DCT";
  if (trans === "auto") return "8-speed automatic";
  if (trans === "smg") return "7-speed SMG";
  return "Manual";
}

function line(label, value) {
  return el("div", { class: "stat-line" }, [el("span", {}, label), el("span", {}, value)]);
}

function button(label, onClick, className) {
  const node = el("button", { class: className, type: "button" }, label);
  node.addEventListener("click", onClick);
  return node;
}

function bulb(kind) {
  return el("div", { class: `bulb ${kind}` });
}

function slider(label, value, min, max, step, onInput, suffix) {
  const id = `s-${label.replace(/\s+/g, "-").toLowerCase()}`;
  const input = el("input", { id, type: "range", min: String(min), max: String(max), step: String(step), value: String(value) });
  const readout = el("span", { class: "ms-lead", "data-live": label.includes("Final") ? "fd" : "" }, formatSlider(value, suffix));
  input.addEventListener("input", () => {
    const next = Number(input.value);
    readout.textContent = formatSlider(next, suffix);
    onInput(next);
  });
  return el("div", { class: "slider-block" }, [
    el("label", { class: "ms-eyebrow", for: id }, label),
    input,
    readout,
  ]);
}

function formatSlider(value, suffix) {
  if (suffix === "psi") return `${Number(value).toFixed(1)} psi`;
  if (suffix === "x") return `${Number(value).toFixed(2)}×`;
  return `${Math.round(value)} rpm`;
}

function el(tag, attrs, children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    if (key === "class") node.className = value;
    else if (value != null) node.setAttribute(key, String(value));
  }
  const list = Array.isArray(children) ? children : children == null ? [] : [children];
  for (const child of list) {
    if (child == null || child === false) continue;
    node.append(child.nodeType ? child : document.createTextNode(String(child)));
  }
  return node;
}

function sizeCanvas(canvas) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = canvas.clientWidth || 640;
  const h = canvas.clientHeight || 280;
  if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
  }
  canvas.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0);
}

function bind() {
  document.querySelectorAll(".ms-tabs a, #brand").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      go(link.dataset.view || "garage");
    });
  });
  search.addEventListener("input", () => {
    if (view === "garage" || view === "paddock" || view === "slips") paint();
  });
  document.querySelector("#mute").addEventListener("click", () => {
    setMuted(!isMuted());
    document.querySelector("#mute").textContent = isMuted() ? "Sound off" : "Sound on";
  });
  document.querySelector("#reset").addEventListener("click", () => {
    localStorage.removeItem(KEY);
    save = load();
    night = null;
    cancelRace();
    notice = "";
    go("garage");
  });
  window.addEventListener("keydown", (event) => {
    if (event.target.matches("input, textarea")) return;
    if (event.code === "Space") event.preventDefault();
    if (event.repeat) return;
    if (event.code === "Space") requestLaunch();
    if (event.code === "ShiftLeft" || event.code === "ShiftRight" || event.code === "ArrowUp") {
      event.preventDefault();
      requestShift();
    }
  });
  window.addEventListener("resize", () => {
    if (view === "strip" && !race) drawIdle();
    if (view === "tune") redrawDyno(owned());
  });
  const sources = document.querySelector("#sources");
  for (const source of SOURCES) {
    const link = el("a", { href: source.href, target: "_blank", rel: "noreferrer" }, source.name);
    sources.append(link);
  }
  if (localStorage.getItem("bimmer-strip-mute") === "1") {
    setMuted(true);
    document.querySelector("#mute").textContent = "Sound off";
  }
  document.querySelector("#mute").addEventListener("click", () => {
    localStorage.setItem("bimmer-strip-mute", isMuted() ? "1" : "0");
  });
}

bind();
paint();
