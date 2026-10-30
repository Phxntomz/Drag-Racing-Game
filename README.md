# Bimmer strip

A BMW-only drag racing game. You start in a 2008 335i, tune it the way the real platforms are tuned, and race other BMWs.

E30, E36, and E46 side views are original traces of the body, glass, and wheels. The other chassis are original outlines scaled from published length, height, and wheelbase. This is not a BMW product, and it does not use BMW's artwork or 3D models.

## Play

GitHub hosts the game at <https://phxntomz.github.io/Drag-Racing-Game/>. Cash, cars, parts, setup, and timeslips are stored in that browser. Open the same link again and the paddock is still there. A different browser or phone keeps its own paddock. Reset paddock clears this one.

To play from a checkout, run a static server in the repo folder:

```bash
python3 -m http.server 8765
```

The server prints a local address. Open that address in the same machine’s browser.

- **Garage** is the car in the bay: paint, name, and the window sticker.
- **Shop** is the catalog. Maps are flashed like an OTS file (stage, then 93 / E30 / E85). Hardware is a parts grid. Setup holds launch rpm, shift rpm, tire pressure, boost, and final drive.
- **Strip** is a full 0.500 tree or a 0.400 pro tree. Space launches. Shift or the up arrow grabs the next gear on a manual. DCT, ZF, and SMG cars shift themselves at the rpm you set.
- **Slips** keeps each pass as a timeslip.
- **Lot** sells the rest of the roster. Prices are game money.

Suspension, a drag-radial tire, or a weight cut swaps a traced car to the modified body and wheels. A street tire alone changes the wheel only. The other chassis keep their own nose, greenhouse, and deck.

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
