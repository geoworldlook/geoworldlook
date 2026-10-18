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
| [**AgriScreen**](https://github.com/geoworldlook/agriscreen) | Is this vineyard entering drought? | ERA5-Land, Sentinel-2 (super-resolved to 2.5 m) | ISMN soil-moisture station, Météo-France | v1.2 · active |
| [**EGMS Check**](https://github.com/geoworldlook/egms-check) | Can EGMS InSAR be trusted to monitor subsidence? | EGMS L2b / L3, Sentinel-1 | GNSS (NGL), state levelling (NRW) | experiments 1–2 done · active |
| [**geoworldlook-web**](https://github.com/geoworldlook/geoworldlook-web) | Where the results are published | Next.js, MapLibre, Supabase | — | live |

<details>
<summary><b>AgriScreen</b>: key results</summary>

- Root-zone soil moisture vs the in-situ station: R = 0.58 over 2,976 days.
- Heat days: 68% detected with 9% false alarms on held-out years.
- Daily Tmin / Tmax error vs Météo-France: about 1 °C.
- Reported as not confirmed: the combined soil and vegetation alert, because vegetation lags soil moisture by 1–1.5 months.

</details>

<details>
<summary><b>EGMS Check</b>: key results</summary>

- Groningen (24 subsiding GNSS stations): 91% of station × track pairs agree within 1.5 mm/yr; slope 0.96.
- North Rhine-Westphalia (1,216 levelling benchmarks):
  - slope 0.96;
  - 100% sign agreement in subsidence bowls;
  - a constant ≈ −2 mm/yr datum offset, reported as a failed pre-registered criterion.

</details>

---

### Skills

| Area | Tools and methods |
|---|---|
| EO data | Sentinel-1/2, ERA5-Land, EGMS, Landsat 8, airborne LiDAR |
| Processing | Python (pandas, NumPy, SciPy, rasterio, GeoPandas), Google Earth Engine, QGIS / PyQGIS, ArcGIS, PostGIS |
| Machine learning | scikit-learn, TensorFlow, PyTorch (SEN2SR super-resolution) |
| Validation | in-situ match-ups, bootstrap confidence intervals, Brier score, pre-registered criteria |
| Engineering | reproducible Colab pipelines, offline self-tests, manifests with checksums |
| Learning now | STAC, xarray, Docker, GitHub Actions, U-Net segmentation |

---

### Earlier work (2024, archived)

| Project | Data | What it shows |
|---|---|---|
| [landsat-lst-ndvi](https://github.com/geoworldlook/landsat-lst-ndvi) | Landsat 8 thermal and optical | land surface temperature with NDVI-based emissivity (ArcPy) |
| [lidar-powerline-classification](https://github.com/geoworldlook/lidar-powerline-classification) | airborne LiDAR (LAS) | power-line conductor detection with a neural network (TensorFlow) |
| [renewable-energy-site-selection](https://github.com/geoworldlook/renewable-energy-site-selection) | BDOT10k, solar and wind rasters | PV and wind site screening for all 16 Polish provinces (PyQGIS, PostGIS) |
| [f1-race-pace-prediction](https://github.com/geoworldlook/f1-race-pace-prediction) | FastF1 timing data | per-driver LSTM forecasts, checked race by race |
| [pulsar-classification](https://github.com/geoworldlook/pulsar-classification) | radio-astronomy candidates | imbalanced classification done honestly (PCA + KNN) |

---

### Contact

📫 geo.world.look@gmail.com · 🌍 [geoworldlook.vercel.app](https://geoworldlook.vercel.app)
