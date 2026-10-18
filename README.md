## Dawid Sajewski: Earth observation and geospatial data science

I build Earth-observation pipelines in Python and validate them against independent ground measurements.
My rule: every number on a map comes with its validation error, and negative results are reported too.

**Focus:** EO time series · drought and vegetation monitoring · InSAR ground motion · forest disturbance<br>
**Stack:** Python (pandas, NumPy, SciPy, rasterio, GeoPandas, scikit-learn, TensorFlow/PyTorch) ·
Google Earth Engine · Copernicus (Sentinel-1/2, ERA5-Land, EGMS) · QGIS · ArcGIS · PostGIS<br>
**Currently building:** cloud-native EO workflows (STAC, xarray, Docker, CI) and deep-learning segmentation

### Featured projects

**[AgriScreen](https://github.com/geoworldlook/agriscreen)**: drought monitoring for a vineyard in Gers (France) from open Copernicus data.
It issues a 10-day drought status in the style of the European Drought Observatory, combining ERA5-Land soil moisture,
SPI and Sentinel-2 NDVI super-resolved to 2.5 m. Every layer is validated against an ISMN soil-moisture station
and Météo-France weather stations:
- soil moisture vs the in-situ station: R = 0.58 over 2,976 days;
- heat days: 68% detected with 9% false alarms on held-out years.

**[EGMS Check](https://github.com/geoworldlook/egms-check)**: does satellite InSAR agree with the ground? This project validates
the European Ground Motion Service against GNSS stations (Groningen) and state levelling (North Rhine-Westphalia),
with acceptance criteria fixed before any computation:
- Groningen: 91% of station-track pairs agree within 1.5 mm/yr;
- North Rhine-Westphalia: slope 0.96 on 1,216 benchmarks and 100% sign agreement in subsidence bowls.

### Earlier work (2024)

| Project | Data | What it shows |
|---|---|---|
| [landsat-lst-ndvi](https://github.com/geoworldlook/landsat-lst-ndvi) | Landsat 8 thermal and optical | land surface temperature with NDVI-based emissivity (ArcPy) |
| [lidar-powerline-classification](https://github.com/geoworldlook/lidar-powerline-classification) | airborne LiDAR (LAS) | detection of power-line conductor points with a neural network (TensorFlow) |
| [renewable-energy-site-selection](https://github.com/geoworldlook/renewable-energy-site-selection) | BDOT10k, solar and wind rasters | multi-criteria PV and wind site screening for all 16 Polish provinces (PyQGIS, PostGIS) |
| [f1-race-pace-prediction](https://github.com/geoworldlook/f1-race-pace-prediction) | FastF1 timing data | per-driver LSTM forecasts, checked race by race in 2024 |
| [pulsar-classification](https://github.com/geoworldlook/pulsar-classification) | radio-astronomy candidates | imbalanced classification done honestly (PCA + KNN, grid search) |

### Contact

📫 geo.world.look@gmail.com · 🌍 [geoworldlook.vercel.app](https://geoworldlook.vercel.app)
