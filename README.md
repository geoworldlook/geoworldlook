## Dawid Sajewski

**Earth observation and geospatial data science** · Python · Copernicus · validation first

I build Earth-observation pipelines from open data and validate them against independent ground measurements.
Acceptance criteria are fixed before the results are computed. Every number on a map comes with its error,
and negative results are reported too.

---

### GeoWorldLook modules

[GeoWorldLook](https://geoworldlook.vercel.app) is the umbrella for my open-data EO projects.
Each module is a standalone repository with its own pipeline, validation and documentation.

| Module | Question | Data | Validated against | Status |
|---|---|---|---|---|
| [**AgriScreen**](https://github.com/geoworldlook/agriscreen) | Is this vineyard entering drought? | Sentinel-2 (10 m), ERA5-Land, satellite soil water index | soil sensors at 11 sites (ICOS, ISMN), Météo-France | v1.4.0 · active, runs weekly |
| [**EGMS Check**](https://github.com/geoworldlook/egms-check) | Can EGMS InSAR be trusted to monitor subsidence? | EGMS L2b / L3, Sentinel-1 | GNSS (NGL), state levelling (NRW) | v1.0.0 · active |
| [**Air Check**](https://github.com/geoworldlook/air-check) | Is the air-quality forecast right in my city? | CAMS PM2.5 forecast (Copernicus Atmosphere) | official stations in 27 cities (EEA) | v1.1.0 · active, runs daily |
| [**Water Check**](https://github.com/geoworldlook/water-check) | Does radar see the water level change in a reservoir? | Sentinel-1 radar (RTC, from a STAC catalogue) | water-level gauges at 9 lakes and reservoirs (4 national networks) | v1.1.0 · active, runs daily |
| [**geoworldlook-web**](https://github.com/geoworldlook/geoworldlook-web) | Where the results are published | Next.js, MapLibre | — | live |

<details>
<summary><b>AgriScreen</b>: key results</summary>

- “Dry soil” hint confirmed by soil sensors in the ground on 81% of days (49% by chance): 4,783 days at 11 sites in France, test rules registered before computing.
- 30-day rainfall vs the Météo-France rain gauge in Condom: R = 0.90; heat days: 70% detected, 15% false alarms.
- Reported as not confirmed: the vegetation hint vs measured evapotranspiration (67% vs 52% by chance).
- [Live panel](https://geoworldlook.github.io/agriscreen/showcase/agriscreen_panel.html), updated automatically every week (GitHub Actions).

</details>

<details>
<summary><b>EGMS Check</b>: key results</summary>

- North Rhine-Westphalia (1,216 levelling benchmarks, independent of GNSS): EGMS shows the same height change as
  levelling (slope 0.96, up to −140 mm in 3 years); same direction of motion at all 54 benchmarks in subsidence bowls.
- Groningen (24 subsiding GNSS stations): the EGMS subsidence rate agrees with GNSS within 1.5 mm/yr for 91% of
  station × track pairs (release 2019–2023) and 99% (release 2020–2024).
- Reported as failed: a constant ≈ −2 mm/yr offset to the levelling datum (3 of 4 pre-registered rules not met) and
  the stable-station check in Groningen.
- One command runs the pipeline on a normal computer; offline tests run in CI on every change.

</details>

<details>
<summary><b>Air Check</b>: key results</summary>

- Daily automatic check of the Copernicus (CAMS) fine-dust forecast against official stations in 27 cities in 6 countries.
- Corrected forecast (a small regression per station, MOS; rules fixed before the hold-out year was computed):
  beats the rule "tomorrow will be like today" in 27 of 27 cities and the raw forecast in 27 of 27
  (median error 3.95 µg/m³ against 5.48 raw and 5.16 for the rule).
- Raw forecast, last 365 days: clearly better than the rule in 9 cities, clearly worse in 7 (winter over-forecast
  in Milano, Katowice, Warszawa and Torino).
- Live tests with rules fixed in advance: raw forecast 2026-11-16 to 2027-02-13, corrected forecast 2026-11-18 to 2027-02-15.
- [Live panel](https://geoworldlook.github.io/air-check/showcase/aircheck_panel.html), updated automatically every day.

</details>

<details>
<summary><b>Water Check</b>: key results</summary>

- Water area from Sentinel-1 radar against gauge levels at 9 lakes and reservoirs; 5,335 scenes since 2022;
  rules registered before the test years (2024–2025) were computed.
- Confirmed on 2 of 6 water bodies where a signal was expected (Lokka and Porttipahta in Lapland: rank correlation
  0.92 and 0.97, level within 20 and 15 cm for a range of about 1 m).
- Reported as negative: 3 water bodies not confirmed and 1 only partly; all 3 control lakes stable.
- Method v2 from recent studies (smoothing, one curve, yearly refit): lower level error on 5 of 6 water bodies,
  but its confirmation year 2026 is negative. Reported as measured.
- [Live panel](https://geoworldlook.github.io/water-check/showcase/watercheck_panel.html), updated automatically every day.

</details>

---

### Skills

| Area | Tools and methods |
|---|---|
| EO data | Sentinel-1/2, ERA5-Land, EGMS, Landsat 8, airborne LiDAR |
| Processing | Python (pandas, NumPy, SciPy, rasterio, GeoPandas), Google Earth Engine, QGIS / PyQGIS, ArcGIS, PostGIS |
| Machine learning | scikit-learn, TensorFlow, PyTorch (SEN2SR super-resolution) |
| Validation | in-situ match-ups, bootstrap confidence intervals, Brier score, pre-registered criteria |
| Engineering | reproducible Colab pipelines, daily GitHub Actions runs, Docker, STAC, offline self-tests, manifests with checksums |
| Learning now | xarray, U-Net segmentation |

---

### Earlier work (2024, archived)

| Project | Data | What it shows |
|---|---|---|
| [landsat-lst-ndvi](https://github.com/geoworldlook/landsat-lst-ndvi) | Landsat 8 thermal and optical | land surface temperature with NDVI-based emissivity (ArcPy) |
| [lidar-powerline-classification](https://github.com/geoworldlook/lidar-powerline-classification) | airborne LiDAR (LAS) | power-line conductor detection with a neural network (TensorFlow), MSc thesis |
| [renewable-energy-site-selection](https://github.com/geoworldlook/renewable-energy-site-selection) | BDOT10k, solar and wind rasters | PV and wind site screening for all 16 Polish provinces (PyQGIS, PostGIS) |
| [f1-race-pace-prediction](https://github.com/geoworldlook/f1-race-pace-prediction) | FastF1 timing data | per-driver LSTM forecasts, checked race by race |
| [pulsar-classification](https://github.com/geoworldlook/pulsar-classification) | radio-astronomy candidates | imbalanced classification done honestly (PCA + KNN) |

---

### Contact

📫 geo.world.look@gmail.com · 🌍 [geoworldlook.vercel.app](https://geoworldlook.vercel.app)
