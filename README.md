# Bimmer strip

A BMW-only drag racing game. You start in a 2008 335i, tune it the way the real platforms are tuned, and race other BMWs.

E30, E36, and E46 side views are the reference photos, cut out and overlaid. The other chassis are original outlines scaled from published length, height, and wheelbase. This is not a BMW product, and it does not use BMW's artwork or 3D models.

## Play

GitHub hosts the game at <https://phxntomz.github.io/Drag-Racing-Game/> once Pages is allowed to deploy this repo. That switch is off right now, which is why the link 404s. Turn it on once:

1. Open [Pages settings](https://github.com/Phxntomz/Drag-Racing-Game/settings/pages).
2. Set **Build and deployment** → **Source** to **GitHub Actions**.
3. Re-run the **Publish the game** workflow. The next push publishes on its own.

To play from a checkout before that, run a static server in the repo folder:

```bash
python3 -m http.server 8765
```

The server prints a local address. Open that address in the same machine’s browser.

- **Garage** is the car in the bay: paint, name, and the window sticker.
- **Shop** opens on the dyno. Pull the rollers, then cool the car if the last pass is still in the sheet. Tune holds launch, shift, timing, tire pressure, boost, and, once the gears are swapped, each ratio. Maps are flashed like an OTS file. Hardware is sold three ways: a cheap part, a name-brand part, and a works part. The cheap ones make a little less power and fail sooner.
- **Strip** is a full 0.500 tree or a 0.400 pro tree. Space launches. Shift or the up arrow grabs the next gear on a manual. DCT, ZF, and SMG cars shift themselves at the rpm you set.
- **Slips** keeps each pass as a timeslip.
- **Lot** sells the rest of the roster. Prices are game money.

Suspension, a drag-radial tire, or a weight cut swaps an E30, E36, or E46 to the modified photo. On the strip every car points downtrack. The other chassis keep their own nose, greenhouse, and deck.

A red light loses. Power past the fuel system or the bottom end knocks, and an axle that is too small breaks on the hit.

## Checks

```bash
node test/ets.mjs
```

Stock quarters are held against a band taken from public magazine tests and timeslip roundups.

## Sources for the cars and the tune steps

- [BMW M, M3 generations](https://www.bmw-m.com/en/topics/magazine-article-pool/bmw-m3-generationen.html)
- [Road & Track, F80 M3](https://www.roadandtrack.com/reviews/a37909261/with-f80-the-m3-leaped-into-the-future/)
- [DragTimes BMW timeslips](https://www.dragtimes.com/BMW--all-Drag-Racing.html)
- [STR Performance, S55 and S58 stages](https://strperformance.com/en/blog/details-conseils-technique/bmw-s55-s58-the-ultimate-tuning-guide-from-stage-1-to-stage-4)
- [Nashville Performance, N54 and B58](https://nashvilleperformance.com/article/b58-vs-n54-stock-vs-modified-power-gains-from-ecu-tune-downpipes-and-fuel-upgrades/)
- [Bend Calibration, B58 build path](https://www.bendcalibration.com/blog/b58-g2-build-path)
- [Build Journal gear ratios](https://thebuildjournal.com/tech-guides/bmw-gear-ratio-final-drive-e30-e36-e46-e90-e92-e93-m3/)
