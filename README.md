# Bimmer strip

A BMW-only drag racing game. You start in a 2008 335i, tune it the way the real platforms are tuned, and race other BMWs.

The cars are original side views scaled from published length, height, and wheelbase. This is not a BMW product, and it does not use BMW's artwork or 3D models.

## Play

```bash
python3 -m http.server 8765
```

Open `http://127.0.0.1:8765`.

- **Garage** picks the car, the paint, and the name.
- **Tune** buys the ladder: software, breathing, fuel, turbos or a kit, clutch, axles, gearing, weight, and tires. The dyno and the estimated quarter update as you change the launch rpm, shift rpm, tire pressure, boost, and final drive.
- **Strip** is a full 0.500 tree or a 0.400 pro tree. Space launches. Shift or the up arrow grabs the next gear on a manual. DCT, ZF, and SMG cars shift themselves at the rpm you set.
- **Timeslips** keeps the reaction, 60-foot, and quarter.
- **Paddock** sells the rest of the roster. Prices are game money.

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
