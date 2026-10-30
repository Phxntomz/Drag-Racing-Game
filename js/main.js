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
import { artKind, partFigure } from "./art.js";
import { cameraFor, drawCar, drawDyno, drawStrip, spriteHeight } from "./draw.js";
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
let shopSection = "maps";
let pendingMap = null;
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
  document.querySelectorAll(".nav a").forEach((link) => {
    const on = link.dataset.view === view;
    link.setAttribute("aria-current", on ? "page" : "false");
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
  app.append(head("Garage", item.name, `${car.year} ${car.chassis}. ${car.blurb}`));

  const studio = el("canvas", { class: "studio", id: "hero-car" });
  const rename = el("input", { class: "field", id: "rename", value: item.name, maxlength: "32" });
  rename.addEventListener("change", () => {
    item.name = rename.value.trim() || car.name;
    persist();
    paint();
  });
  const colors = el("div", { class: "row swatches" });
  for (const color of PAINTS) {
    const chip = el("button", {
      class: `swatch${item.paint === color.id ? " is-on" : ""}`,
      type: "button",
      title: color.name,
      "aria-label": color.name,
      "aria-pressed": item.paint === color.id ? "true" : "false",
      style: `background:${color.hex}`,
    });
    chip.addEventListener("click", () => {
      item.paint = color.id;
      persist();
      paint();
    });
    colors.append(chip);
  }
  const bay = el("div", { class: "panel" }, [
    studio,
    colors,
    el("label", { class: "kicker", for: "rename", style: "display:block;margin-top:14px" }, "Name on the slip"),
    rename,
  ]);

  const facts = el("div", { class: "panel" }, [
    el("p", { class: "kicker" }, "Window sticker"),
    line("Car", `${car.year} ${car.chassis} ${car.name}`),
    line("Engine", `${car.engine} · ${car.aspiration}`),
    line("Factory", `${car.hp} hp · ${car.tq} Nm`),
    line("This build", `${Math.round(spec.hp)} hp`),
    line("Redline", `${car.redline.toLocaleString("en-US")} rpm`),
    line("Weight", `${Math.round(spec.mass).toLocaleString("en-US")} kg`),
    line("Gearbox", transLabel(car.trans)),
    line("Perfect pass", slip.quarter ? `${formatEt(slip.quarter)} at ${slip.quarterMph.toFixed(1)} mph` : "Won't finish"),
    line("Published", car.published),
  ]);
  if (item.damage) {
    facts.append(el("p", { class: "note" }, item.damage === "engine" ? "The engine needs a rebuild before it stages." : "An axle is out. Fix it before the next hit."));
    facts.append(button(`Repair · ${money(repairCost(item))}`, () => repair(item), "btn"));
  }
  const actions = el("div", { class: "row", style: "margin-top:14px" }, [
    button("Open the shop", () => go("tune"), "btn"),
    button("Take it to the strip", () => go("strip"), "btn btn-ghost"),
  ]);
  if (save.cars.length > 1) actions.append(button("Sell", () => sell(item), "btn btn-danger"));
  facts.append(actions);

  const list = el("div", { class: "inventory" });
  for (const ownedCar of save.cars.filter((entry) => matches(carById(entry.carId), entry.name))) {
    const info = carById(ownedCar.carId);
    const card = el("button", { class: `panel pick${ownedCar.uid === item.uid ? " is-on" : ""}`, type: "button" }, [
      el("canvas", {
        class: "car-art",
        "data-car": info.id,
        "data-paint": paintById(ownedCar.paint).hex,
        "data-induction": String(ownedCar.build.induction || 0),
        "data-exhaust": String(ownedCar.build.exhaust || 0),
        "data-suspension": String(ownedCar.build.suspension || 0),
        "data-tires": String(ownedCar.build.tires || 0),
        "data-weight": String(ownedCar.build.weight || 0),
      }),
      el("p", { class: "kicker" }, info.chassis),
      el("h2", {}, ownedCar.name),
      el("p", {}, `${info.year} · ${info.engine} · ${className(classForBuild(ownedCar.build))}`),
    ]);
    card.addEventListener("click", () => {
      save.active = ownedCar.uid;
      pendingMap = null;
      persist();
      paint();
    });
    list.append(card);
  }

  app.append(el("div", { class: "layout" }, [bay, facts]), list);
  requestAnimationFrame(() => {
    drawHero(item, car, spec);
    drawMounted();
  });
}

function renderTune() {
  const item = owned();
  const { car, spec, slip } = preview(item);
  const groups = partGroups(car).filter((group) => group.id !== "software" && group.id !== "fuel");
  if (shopSection !== "maps" && shopSection !== "setup" && !groups.some((group) => group.id === shopSection)) {
    shopSection = "maps";
  }
  app.append(head(
    "Shop",
    shopSection === "maps" ? "Maps" : shopSection === "setup" ? "Setup" : groups.find((group) => group.id === shopSection).label,
    shopSection === "maps"
      ? "Pick the file that matches the hardware already on the car, then flash it. Fuel is part of the file. Downpipes and headers are not."
      : shopSection === "setup"
        ? "Launch, shift, and tire pressure. These stay in the car when you change maps."
        : `Fits this ${car.chassis}. The price is for this car.`,
  ));
  app.append(el("div", { class: "summary" }, [
    el("span", {}, [el("b", {}, `${Math.round(spec.hp)} hp`), " at the crank"]),
    el("span", {}, [el("b", {}, slip.quarter ? `${formatEt(slip.quarter)} @ ${slip.quarterMph.toFixed(1)}` : "—"), " perfect pass"]),
    el("span", {}, [el("b", {}, className(classForBuild(item.build))), " class"]),
  ]));

  const rail = el("nav", { class: "rail", "aria-label": "Catalog" });
  for (const [id, label] of [["maps", "Maps"], ...groups.map((group) => [group.id, group.label]), ["setup", "Setup"]]) {
    const tab = el("button", { type: "button", class: shopSection === id ? "is-on" : "", "aria-pressed": shopSection === id ? "true" : "false" }, label);
    tab.addEventListener("click", () => {
      shopSection = id;
      paint();
    });
    rail.append(tab);
  }

  const main = el("div", {});
  if (shopSection === "maps") main.append(renderMaps(item, car));
  else if (shopSection === "setup") main.append(renderSetup(item, car, spec));
  else main.append(renderCatalog(item, car, groups.find((group) => group.id === shopSection)));
  app.append(el("div", { class: "shop" }, [rail, main]));
  fillTuneStats(item);
  if (shopSection === "maps" || shopSection === "setup") requestAnimationFrame(() => redrawDyno(item));
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

function mapChoices() {
  return [
    { software: 0, fuel: 0, fuelLabel: "93 octane" },
    { software: 1, fuel: 0, fuelLabel: "93 octane" },
    { software: 1, fuel: 1, fuelLabel: "E30" },
    { software: 2, fuel: 0, fuelLabel: "93 octane" },
    { software: 2, fuel: 1, fuelLabel: "E30" },
    { software: 2, fuel: 2, fuelLabel: "E85" },
  ];
}

function mapTitle(software) {
  if (software === 0) return "Stock";
  if (software === 1) return "Stage 1";
  return "Stage 2";
}

function deltaCost(car, build, slot, target) {
  const from = build[slot] || 0;
  if (target === from) return 0;
  if (target > from) {
    let total = 0;
    for (let level = from + 1; level <= target; level += 1) total += optionCost(car, slot, level);
    return total;
  }
  let refund = 0;
  for (let level = target + 1; level <= from; level += 1) refund += Math.round(optionCost(car, slot, level) * 0.4);
  return -refund;
}

function renderMaps(item, car) {
  const turbo = Boolean(car.turbo || car.spoolRpm);
  const choices = mapChoices();
  const selected = pendingMap || { software: item.build.software || 0, fuel: item.build.fuel || 0 };
  const list = el("div", { class: "map-list" });
  const query = search.value.trim().toLowerCase();
  for (const choice of choices) {
    const software = partGroups(car).find((group) => group.id === "software").options[choice.software];
    const fuel = partGroups(car).find((group) => group.id === "fuel").options[choice.fuel];
    const title = `${mapTitle(choice.software)} · ${choice.fuelLabel}`;
    if (query && !`${title} ${software.note} ${fuel.note}`.toLowerCase().includes(query)) continue;
    const build = { ...item.build, software: choice.software, fuel: choice.fuel };
    if (choice.software >= 2 && (build.exhaust || 0) < 1) build.exhaust = 1;
    const spec = compile(car, build, item.setup, 0);
    const on = selected.software === choice.software && selected.fuel === choice.fuel;
    const hardware = choice.software >= 2
      ? (turbo ? "Needs high-flow downpipes on the car before this file." : "Needs headers on the car before this file.")
      : "Runs on the factory exhaust.";
    const fuelLine = choice.fuel === 0
      ? "Pump gas. Factory pumps."
      : choice.fuel === 1
        ? "The file includes pumps for an E30 mix."
        : "The file includes port injection and an E85 calibration.";
    const card = el("button", {
      class: `map${on ? " is-on" : ""}`,
      type: "button",
      "aria-pressed": on ? "true" : "false",
    }, [
      partFigure("ecu", choice.software + choice.fuel),
      el("div", { class: "map-copy" }, [
        el("strong", {}, title),
        el("p", {}, `${Math.round(spec.hp)} hp on this ${car.chassis}. ${software.note.split(". ")[0].replace(/\.$/, "")}.`),
        el("p", {}, `${hardware} ${fuelLine}`),
      ]),
    ]);
    card.addEventListener("click", () => {
      pendingMap = { software: choice.software, fuel: choice.fuel };
      paint();
    });
    list.append(card);
  }
  if (!list.childElementCount) list.append(el("p", { class: "empty" }, "No map matches that search."));

  const same = selected.software === (item.build.software || 0) && selected.fuel === (item.build.fuel || 0);
  const unmet = [
    ...unmetRequires(car, item.build, "software", selected.software),
    ...unmetRequires(car, item.build, "fuel", selected.fuel),
  ];
  const cost = deltaCost(car, item.build, "software", selected.software) + deltaCost(car, item.build, "fuel", selected.fuel);
  let label = "On the car";
  if (!same) label = cost > 0 ? `Flash · ${money(cost)}` : cost < 0 ? `Flash · refund ${money(-cost)}` : "Flash";
  const flash = button(label, () => {
    if (same || unmet.length || cost > save.cash) return;
    save.cash -= cost;
    item.build.software = selected.software;
    item.build.fuel = selected.fuel;
    pendingMap = null;
    persist();
    paint();
  }, "btn");
  if (same || unmet.length || cost > save.cash) flash.disabled = true;
  const bar = el("div", { class: "flashbar" }, [flash, button("Race this tune", () => go("strip"), "btn btn-ghost")]);
  if (unmet.length) bar.append(el("span", { class: "note" }, unmet[0].reason));
  else if (!same && cost > save.cash) bar.append(el("span", { class: "note" }, "Short on cash."));

  const dyno = el("div", { class: "panel", style: "margin-top:12px" }, [
    el("p", { class: "kicker" }, "Dyno, current file"),
    el("canvas", { class: "dyno", id: "dyno" }),
    el("div", { id: "tune-stats" }),
    el("div", { id: "tune-warn" }),
  ]);
  return el("div", {}, [list, bar, dyno]);
}

function renderSetup(item, car, spec) {
  const { setup } = preview(item);
  const panel = el("div", { class: "panel" }, [
    el("p", { class: "kicker" }, "At the line"),
    el("canvas", { class: "dyno", id: "dyno" }),
    el("div", { id: "tune-stats" }),
    el("div", { id: "tune-warn" }),
  ]);
  panel.append(slider("Launch rpm", setup.launchRpm, 1400, car.redline - 150, 10, (value) => {
    item.setup.launchRpm = value;
    refreshTune(item);
  }));
  panel.append(slider("Shift rpm", setup.shiftRpm, 3000, car.redline, 10, (value) => {
    item.setup.shiftRpm = value;
    refreshTune(item);
  }));
  panel.append(slider("Tire pressure", setup.psi, 10, 40, 0.5, (value) => {
    item.setup.psi = value;
    refreshTune(item);
  }, "psi"));
  if (spec.turbo) {
    panel.append(slider("Boost target", setup.boost, 0.9, 1.12, 0.01, (value) => {
      item.setup.boost = value;
      refreshTune(item);
    }, "x"));
  }
  if (item.build.gearing) {
    panel.append(slider("Final drive trim", setup.fdTrim, 0.9, 1.16, 0.01, (value) => {
      item.setup.fdTrim = value;
      refreshTune(item);
    }, "x"));
  }
  panel.append(el("div", { class: "row", style: "margin-top:14px" }, [
    button("Set the launch to the bite", () => {
      item.setup.launchRpm = spec.suggestedLaunch;
      item.setup.psi = spec.idealPsi;
      persist();
      paint();
    }, "btn btn-ghost"),
    button("Race this tune", () => go("strip"), "btn"),
  ]));
  return panel;
}

function renderCatalog(item, car, group) {
  const turbo = Boolean(car.turbo || car.spoolRpm);
  const current = item.build[group.id] || 0;
  const query = search.value.trim().toLowerCase();
  const grid = el("div", { class: "catalog" });
  for (const option of group.options) {
    if (query && !`${option.name} ${option.note} ${group.label}`.toLowerCase().includes(query)) continue;
    const card = el("article", { class: "panel product" }, [
      partFigure(artKind(group.id, option.level, turbo)),
      el("h2", {}, option.name),
      el("p", {}, option.note),
    ]);
    const row = el("div", { class: "row" });
    const price = option.level === 0 ? null : optionCost(car, group.id, option.level);
    if (price) row.append(el("span", { class: "price" }, money(price)));
    if (option.level === current) {
      row.append(el("span", { class: "kicker" }, "On the car"));
      if (option.level > 0) {
        row.append(button("Remove", () => {
          save.cash += Math.round(optionCost(car, group.id, option.level) * 0.4);
          item.build[group.id] = option.level - 1;
          persist();
          paint();
        }, "btn btn-ghost"));
      }
    } else if (option.level === current + 1) {
      const unmet = unmetRequires(car, item.build, group.id, option.level);
      const cost = optionCost(car, group.id, option.level);
      const install = button(cost ? "Add to car" : "Add to car", () => {
        if (unmet.length || save.cash < cost) return;
        save.cash -= cost;
        item.build[group.id] = option.level;
        persist();
        paint();
      }, "btn");
      if (unmet.length || save.cash < cost) install.disabled = true;
      row.append(install);
      if (unmet.length) card.append(el("p", { class: "note" }, unmet[0].reason));
      else if (save.cash < cost) card.append(el("p", { class: "note" }, "Short on cash."));
    } else if (option.level > current + 1) {
      card.append(el("p", { class: "note" }, "Fit the step before this one."));
    }
    card.append(row);
    grid.append(card);
  }
  if (!grid.childElementCount) grid.append(el("p", { class: "empty" }, "Nothing in this category matches."));
  return grid;
}

function renderStrip() {
  const item = owned();
  const { car, spec, slip } = preview(item);
  const legal = canEnter(item.build, classId);
  if (!night || night.classId !== classId || night.against !== item.uid) rollNight();

  const shiftHint = spec.autoShift
    ? "This gearbox shifts itself at the rpm you set in the shop."
    : "Shift or the up arrow grabs the next gear. Space launches.";
  app.append(head("Strip", item.name, `Full tree is a 0.500 cadence. Pro tree is 0.400. Leave on the last amber and it is a red light. ${shiftHint}`));

  const tree = el("div", { class: "tree-box", id: "tree" }, [
    bulb("pre"), bulb("stage"), bulb("amber"), bulb("amber"), bulb("amber"), bulb("green"), bulb("red"),
  ]);
  const canvas = el("canvas", { class: "race-canvas", id: "race" });
  const readout = el("div", { class: "dash", id: "readout" }, [
    cell("Gear", "gear", "—"),
    cell("Speed", "speed", "0 mph"),
    cell("Rpm", "rpm", "0 rpm"),
    cell("Flag", "flag", "—"),
  ]);
  const tach = el("div", { class: "tach", id: "tach" }, [
    el("div", { class: "tach-fill", id: "tach-fill" }),
    el("div", { class: "tach-mark", id: "tach-mark" }),
  ]);
  const pedals = el("div", { class: "pedals", id: "pedals" });
  const live = el("div", { class: "live", id: "live", "aria-live": "polite" });
  const board = el("div", { class: "lane" }, [
    el("div", { class: "lane-grid" }, [tree, el("div", {}, [canvas, tach, readout, pedals])]),
    live,
    el("div", { id: "result" }),
  ]);

  const side = el("div", { class: "panel" }, [
    el("p", { class: "kicker" }, "Class"),
    el("div", { class: "segment", id: "class-row" }),
    el("p", { class: "kicker", style: "margin-top:14px" }, "Tree"),
    el("div", { class: "segment", id: "tree-row" }),
    el("div", { id: "rival-card", style: "margin-top:14px" }),
  ]);
  if (notice) side.append(el("p", { class: "note" }, notice));

  app.append(el("div", { class: "layout layout-strip" }, [board, side]));
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
      class: classId === entry.id ? "is-on" : "",
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
      class: treeMode === mode[0] ? "is-on" : "",
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
    el("p", { class: "kicker" }, "Your pace"),
    line("Vehicle ET", slip.quarter ? `${formatEt(slip.quarter)} @ ${slip.quarterMph.toFixed(1)}` : "—"),
    line("60 foot", formatEt(slip.ft60)),
    line("Power", `${Math.round(spec.hp)} hp`),
    el("p", { class: "lead" }, entry.blurb),
    el("p", { class: "lead" }, `Buy-in ${money(entry.entry)} · win ${money(entry.purse)} · a loss returns ${money(Math.round(entry.entry * 0.35))}.`),
  );
  if (!legal) {
    card.append(el("p", { class: "note" }, `This combination is filed as ${className(classForBuild(item.build))}.`));
  }
  if (night) {
    card.append(
      el("p", { class: "kicker", style: "margin-top:12px" }, "Other lane"),
      line("Car", `${night.car.year} ${night.car.chassis} ${night.car.name}`),
      line("Power", `${Math.round(night.spec.hp)} hp`),
      line("Pace", `${formatEt(night.slip.quarter)} @ ${night.slip.quarterMph.toFixed(1)}`),
      el("p", { class: "lead" }, "Their light is hidden. A better reaction beats a slightly quicker car."),
    );
  }
  const row = el("div", { class: "row", style: "margin-top:12px" });
  row.append(button("New opponent", () => {
    night = null;
    rollNight();
    paint();
  }, "btn btn-ghost"));
  if (item.heat) {
    row.append(button("Cool the car", () => {
      item.heat = 0;
      persist();
      paint();
    }, "btn btn-ghost"));
  }
  card.append(row);
}

function armPedals(item, legal) {
  const pedals = document.getElementById("pedals");
  const entry = CLASSES.find((row) => row.id === classId);
  const practice = button("Test hit", () => startRace("practice"), "btn btn-ghost");
  const buy = button(`Buy in · ${money(entry.entry)}`, () => startRace("race"), "btn");
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
  const waiting = button("Wait for the tree", () => {}, "btn");
  waiting.disabled = true;
  pedals.replaceChildren(waiting, button("Shift", requestShift, "btn btn-ghost"));
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
            button("Launch", requestLaunch, "btn"),
            button("Shift", requestShift, "btn btn-ghost"),
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
  result.replaceChildren(el("div", { class: "panel", style: "margin-top:12px;background:#fff;color:#17191d" }, [
    el("p", { class: "kicker" }, heading),
    el("h2", { class: "title" }, slip.quarter ? `${formatEt(slip.quarter)} at ${slip.quarterMph.toFixed(1)} mph` : "No finish"),
    renderSlipTable(slip, rivalSlip),
    ...notes.map((note) => el("p", { class: "lead" }, note)),
    el("div", { class: "row", style: "margin-top:12px" }, [
      button("Run it back", () => {
        race = null;
        paint();
      }, "btn"),
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
  gear.textContent = state.launched ? String(state.gear) : "—";
  speed.textContent = `${Math.round(state.v * 2.23694)} mph`;
  rpm.textContent = `${Math.round(state.rpm)} rpm`;
  flag.textContent = race.red ? "Red light" : state.spin ? "Tires loose" : state.knock > 0.45 ? "Knock" : state.shiftLeft > 0 ? "Shift" : "—";
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
  app.append(head("Slips", "Timeslips", "Reaction is included in the elapsed time, the way a real slip is written."));
  const q = search.value.trim().toLowerCase();
  const rows = save.slips.filter((slip) => !q || `${slip.car} ${slip.chassis} ${slip.rival}`.toLowerCase().includes(q));
  const list = el("div", { class: "slip-list" });
  if (!rows.length) {
    list.append(el("p", { class: "empty" }, "No slips yet. Stage the car."));
  }
  for (const slip of rows) {
    const outcome = slip.outcome === "win" ? "Win" : slip.outcome === "loss" ? "Loss" : "Time";
    list.append(el("article", { class: "panel slip" }, [
      el("div", {}, [
        el("p", { class: "kicker" }, `${slip.mode === "practice" ? "Test" : "Race"} · ${slip.chassis}`),
        el("div", { class: "et" }, formatEt(slip.quarter)),
        el("p", { class: "lead" }, slip.mph ? `${Number(slip.mph).toFixed(1)} mph` : "No finish"),
      ]),
      el("div", { class: "slip-grid" }, [
        el("span", {}, "R/T"), el("b", {}, slip.rt == null ? "—" : Number(slip.rt).toFixed(3)), el("span", {}, ""),
        el("span", {}, "60 ft"), el("b", {}, formatEt(slip.ft60)), el("span", {}, ""),
        el("span", {}, "Car"), el("b", {}, slip.car), el("span", {}, className(slip.classId)),
        el("span", {}, "Lane"), el("b", {}, slip.rival || "Solo"), el("span", {}, ""),
      ]),
      el("span", { class: `tag ${slip.outcome || ""}` }, outcome),
    ]));
  }
  app.append(list);
}

function renderPaddock() {
  app.append(head("Lot", "Cars for sale", "Factory cars, game prices. Specs are the numbers the model is built from."));
  const chips = el("div", { class: "segment" });
  for (const [id, label] of [["all", "All"], ["classic", "Classic"], ["turbo", "Turbo six"], ["v8", "V8 and V10"]]) {
    const chip = el("button", {
      type: "button",
      class: era === id ? "is-on" : "",
      "aria-pressed": era === id ? "true" : "false",
    }, label);
    chip.addEventListener("click", () => {
      era = id;
      paint();
    });
    chips.append(chip);
  }
  app.append(chips);
  const grid = el("div", { class: "inventory" });
  const cars = CARS.filter((candidate) => matches(candidate, candidate.name) && (era === "all" || candidate.era === era));
  if (!cars.length) grid.append(el("p", { class: "empty" }, "Nothing on the lot matches that search."));
  for (const car of cars) {
    const ownedAlready = save.cars.some((item) => item.carId === car.id);
    const card = el("article", { class: "panel lot" }, [
      el("canvas", { class: "car-art", "data-car": car.id, "data-paint": paintById(car.paint).hex }),
      el("p", { class: "kicker" }, `${car.year} · ${car.chassis}`),
      el("h2", {}, car.name),
      el("p", {}, `${car.engine} · ${car.hp} hp · ${car.tq} Nm · ${car.mass} kg`),
      el("p", {}, car.published),
      el("span", { class: "price" }, money(car.price)),
    ]);
    const buy = button(ownedAlready ? "In the garage" : "Buy", () => buyCar(car), "btn");
    if (ownedAlready || save.cash < car.price) buy.disabled = true;
    card.append(buy);
    if (!ownedAlready && save.cash < car.price) {
      card.append(el("p", {}, `${money(car.price - save.cash)} short.`));
    }
    grid.append(card);
  }
  app.append(grid);
  requestAnimationFrame(drawMounted);
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

function head(kicker, title, lead) {
  return el("header", {}, [
    el("p", { class: "kicker" }, kicker),
    el("h1", { class: "title" }, title),
    lead ? el("p", { class: "lead" }, lead) : null,
  ]);
}

function cell(label, id, value) {
  return el("div", { class: "cell" }, [
    el("span", {}, label),
    el("b", { id }, value),
  ]);
}

function line(label, value) {
  return el("div", { class: "stat" }, [el("span", {}, label), el("span", {}, value)]);
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
  const readout = el("span", { "data-live": label.includes("Final") ? "fd" : "" }, formatSlider(value, suffix));
  input.addEventListener("input", () => {
    const next = Number(input.value);
    readout.textContent = formatSlider(next, suffix);
    onInput(next);
  });
  return el("div", { class: "slider" }, [
    el("label", { for: id }, label),
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

function drawHero(item, car, spec) {
  const node = document.getElementById("hero-car");
  if (!node) return;
  sizeCanvas(node);
  const ctx = node.getContext("2d");
  const w = node.clientWidth || 640;
  const h = node.clientHeight || 240;
  ctx.clearRect(0, 0, w, h);
  const tall = spriteHeight(car, item.build);
  const px = Math.min((h * 0.7) / tall, (w - 36) / car.length);
  drawCar(ctx, car, paintById(item.paint).hex, (w - car.length * px) / 2, h * 0.84, px, {
    tireRadius: spec.tireRadius,
    induction: item.build.induction,
    exhaust: item.build.exhaust,
    suspension: item.build.suspension,
    tires: item.build.tires,
    weight: item.build.weight,
  });
}

function drawMounted() {
  document.querySelectorAll("canvas.car-art").forEach((node) => {
    const car = carById(node.dataset.car);
    if (!car) return;
    sizeCanvas(node);
    const ctx = node.getContext("2d");
    const w = node.clientWidth || 280;
    const h = node.clientHeight || 128;
    ctx.clearRect(0, 0, w, h);
    const look = {
      induction: Number(node.dataset.induction || 0),
      exhaust: Number(node.dataset.exhaust || 0),
      suspension: Number(node.dataset.suspension || 0),
      tires: Number(node.dataset.tires || 0),
      weight: Number(node.dataset.weight || 0),
    };
    const px = Math.min((h * 0.72) / spriteHeight(car, look), (w - 16) / car.length);
    drawCar(ctx, car, node.dataset.paint || "#14161c", (w - car.length * px) / 2, h * 0.86, px, look);
  });
}

function bind() {
  document.querySelectorAll(".nav a, .wordmark").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      go(link.dataset.view || "garage");
    });
  });
  search.addEventListener("input", () => {
    if (view === "garage" || view === "paddock" || view === "slips" || view === "tune") paint();
  });
  document.querySelector("#mute").addEventListener("click", () => {
    setMuted(!isMuted());
    document.querySelector("#mute").textContent = isMuted() ? "Sound off" : "Sound on";
    localStorage.setItem("bimmer-strip-mute", isMuted() ? "1" : "0");
  });
  document.querySelector("#reset").addEventListener("click", () => {
    localStorage.removeItem(KEY);
    save = load();
    night = null;
    pendingMap = null;
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
    if (view === "garage") {
      const item = owned();
      const { car, spec } = preview(item);
      drawHero(item, car, spec);
      drawMounted();
    }
    if (view === "paddock") drawMounted();
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
}

bind();
paint();
