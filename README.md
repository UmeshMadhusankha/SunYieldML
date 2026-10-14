# SunYield ML

A React, Express/Node and PostgreSQL solar-planning application with a private Python inference service. Accounts manage multiple household, business or installer properties; each property has several immutable proposals and saved estimates. Monthly generation, installation quotes, bill savings, export income and simple payback are shown separately.

This is a new implementation alongside your original research repository, reviewed at commit `9d12923eb5d24257efdcbc20e179cff1d0e3d458`. The original notebook is not overwritten. Start with the full project archive; the separate FE and BE archives use the same folder names and can be extracted into one root.

## What is implemented

- React workspace: registration/login, profile choice, multiple properties, editing/deletion, proposals, monthly charts, 24-hour forecast, saved comparison table and JSON report export.
- Express MVC: controllers validate transport input; services coordinate use cases; domain modules calculate finances; repositories own persistence; provider adapters isolate external systems.
- PostgreSQL ownership constraints, parameterized SQL, persistent server-side sessions, scrypt password hashes, HttpOnly cookies, CSRF tokens, origin checks, validation and authentication rate limits.
- NASA POWER climatology for planning; Open-Meteo hourly forecasts; optional independent OpenWeather Solar 2.0 + One Call 3.0 fallback; per-provider circuit breakers, abort timeouts, bounded/coalesced cache and explicitly labeled stale resources.
- Capacity-aware PV planning and forecasting using pvlib. The original plant regression is preserved as a separately evaluated research artifact, with portable preprocessing and coefficients.
- Jest/Testing Library/Supertest suites, PostgreSQL integration tests, Python tests, Docker Compose, GitHub Actions CI and opt-in AWS CD, load-test scripts and real local evidence.

## Run locally with Docker

Requirements: Docker Engine with Compose v2 and access to npm, PyPI and container registries.

```bash
cp .env.example .env
# Replace POSTGRES_PASSWORD and ML_SERVICE_KEY with different random hex strings.
# Keep DATA_MODE=demo initially. APP_ORIGIN=http://localhost:8080.
docker compose up --build -d --wait
```

Open `http://localhost:8080` and create an account. There is no embedded default account or production password. Demo mode uses synthetic weather, while PostgreSQL still persists account/site data. `docker compose down` preserves the database volume; `down --volumes` deletes it.

## Run FE and BE separately

Use Node 24 and Python 3.12. In three terminals:

```bash
# Terminal 1: private inference service
cd ml-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

```bash
# Terminal 2: API (temporary demo storage)
cd backend
cp .env.example .env
npm install
npm run dev
```

```bash
# Terminal 3: React (Vite proxies /api to localhost:3001)
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The default `STORE=memory` is deliberately temporary and clearly identified in the UI. To persist: start PostgreSQL, set `STORE=postgres` and `DATABASE_URL`, then run `npm run migrate` before starting the API. Production rejects memory storage.

No npm lockfiles are included because registry downloads were denied in the coding environment. Initial installation generates them. **Commit both package-lock.json files before releasing**; the install helper switches to `npm ci` when locks exist, and CD refuses publication without committed locks. Until then, first-run dependency resolution is not fully reproducible.

## Live resources

Set `DATA_MODE=live` and restart the API. New estimates then use NASA climatology and forecasts use Open-Meteo. Demo estimates remain immutable and labeled synthetic. Public Open-Meteo access is intended for permitted noncommercial use; for a commercial service, arrange licensed access, set `OPEN_METEO_URL` and `OPEN_METEO_KEY`, and review both providers' current terms and attribution requirements. Sources are shown with each report.

`OPENWEATHER_KEY` enables fallback only when primary hourly forecasting fails. The key needs access to **both Solar Irradiance 2.0 and One Call 3.0**; a basic free current-weather key is insufficient. This is optional and not assumed to be free. Planning climatology uses NASA only; bounded stale cache is its failure fallback. Neither provider failure silently substitutes synthetic data.

Circuit defaults: 5 consecutive transient failures, 30-second cooldown, one half-open probe. HTTP 429/5xx and transport/invalid-data errors count; nontransient 4xx do not. Forecast windows are exact UTC hours and are cached by location and window. Cache: 30 minutes fresh, at most 2 hours from fetch for stale service, 1,000 entries per process. For rolling forecasts, a new hour is a new key and may have no stale fallback. In-flight misses coalesce. No cross-process shared cache or distributed rate limiter is claimed.

## Tests and evidence

```bash
cd backend
npm run lint
npm test
npm run test:ci
node --test tests/native.test.cjs
# Against a disposable PostgreSQL database after migrate:
RUN_PG_TESTS=1 npm run test:integration
```

```bash
cd frontend
npm run lint
npm run test:ci
npm run build
```

```bash
cd ml-service
python -m pytest tests -q
python -m unittest discover -s tests -p test_research_native.py -v
```

[Verification](docs/VERIFICATION.md) records exactly what ran here. Nine native Node checks and two Python artifact checks passed. Training and the controlled cache benchmark ran. **Jest, frontend build, pvlib/FastAPI tests, PostgreSQL/Docker integration, live provider calls and cloud deployment have not run here**, because the required dependencies/services were unavailable. Coverage thresholds are CI requirements, not measured coverage results. CI is supplied but has not been executed on your GitHub account.

Read [architecture](docs/ARCHITECTURE.md), [API contract](docs/API.md), [testing/TDD and CV evidence](docs/TESTING_AND_METRICS.md), and [AWS hosting/deployment](docs/HOSTING.md). The same guides are included in the BE archive. Hosted deployment is not performed by this delivery.

## Model boundaries

The original target averages available inverters and divides by an observed power maximum. It is **not** a transferable household capacity factor. Its native irradiation unit is unverified. Passing weather W/m² directly into that model would be misleading. The application therefore uses capacity-aware physics for new installations, and presents plant-model metrics on a research page.

The shipped research model uses a chronological seven-day holdout with training-only preprocessing and target normalization: 2,487 training timestamps and 670 test timestamps. R² `0.991874`; MAE `1.494066` percentage points of normalized plant output; daytime-proxy MAE `2.649773` pp. Against an irradiation-only linear baseline on the same holdout, MAE was `11.520975%` lower. These are local dataset results, not new-site accuracy or long-term performance.

To retrain with your original CSVs:

```bash
cd ml-service
python scripts/train.py --data-dir /path/to/SunYieldML/data --output models/reference_model.json
```

No pickle is loaded in serving. JSON includes preprocessing, coefficients, input/target contracts, data hashes, split and evaluation. Training dependencies are separate from runtime dependencies.

Monthly physics uses a representative day scaled to daily GHI climatology, a fixed array and explicit losses. Forecasts integrate hourly average kW over hours. This is preliminary screening, not an engineered installation guarantee. Costs and rates are user-entered examples; eligibility for export compensation must be checked with the relevant provider.

## Scope and next work

Installer accounts currently organize their own clients' properties; there is no shared organization membership or cross-account invitation workflow. Add organization memberships and role permissions when collaboration is required. Other useful extensions are measured meter-data import for hourly self consumption, historical hourly yield validation, financing/degradation scenarios, authenticated PDF quotations, and anomaly detection on installed-system telemetry. Keep these behind tested contracts rather than claiming them as shipped features.
