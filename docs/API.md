# API contract

Base `/api`. JSON request bodies; cookie-based session; authenticated writes require `x-csrf-token`. Browser Origin must match `APP_ORIGIN`. Production CloudFront additionally supplies the secret `x-origin-verify`; it is never part of the frontend bundle. Errors have `{error:{code,message,details?},requestId}`. Input errors are 422; malformed JSON 400; missing session 401; CSRF/origin 403; inaccessible ownership 404; transient dependencies 503.

| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/register` | name, email, password ≥12 chars, accountType household/business/installer |
| POST | `/auth/login` | email, password → user + csrfToken, sets cookie |
| GET | `/auth/me` | Restore current user + csrfToken |
| POST | `/auth/logout` | Invalidate session |
| GET | `/status` | Explicit resource and storage modes |
| GET | `/model` | Research model contract/evaluation |
| GET / POST | `/sites` | List or create owned properties |
| GET / PATCH / DELETE | `/sites/:id` | Read, edit or cascade-delete a property |
| GET / POST | `/sites/:id/scenarios` | List/create immutable proposals |
| POST | `/scenarios/:id/estimates` | Calculate and persist immutable annual plan; `{year?}` |
| GET | `/sites/:id/estimates` | Saved estimates for an owned property |
| GET | `/estimates/:id` | Full saved snapshot/report |
| POST | `/sites/:id/forecasts` | `{scenarioId}` → next 24 hourly intervals |
| GET | `/health/live` | Public process liveness (outside /api) |
| GET | `/health/ready` | Public local dependency readiness (outside /api) |

## Site input

```json
{"name":"Colombo home","type":"household","latitude":6.9271,"longitude":79.8612,"timezone":"Asia/Colombo","roofAreaM2":60}
```

Site edits are partial and strictly reject unknown fields, including owner IDs. Coordinates support latitudes -89…89; timezone must be recognized by Node Intl. Roof-capacity validation uses an explicit assumed density of 0.2 kWp/m², not a structural survey.

## Scenario input

```json
{"name":"5 kWp proposal","capacityKwp":5,"inverterKw":5,"tiltDeg":15,"azimuthDeg":180,"lossPct":14,"shadingPct":0,"monthlyConsumptionKwh":1000,"selfConsumptionPct":60,"importRate":50,"exportRate":20,"monthlyOperatingCost":1000,"panelCost":1000000,"inverterCost":400000,"installationCost":400000,"currency":"LKR","tariffKind":"flat"}
```

Rates and costs are illustrative, not official tariffs. Azimuth is north-clockwise (0 north, 90 east, 180 south). Flat tariff bill is demand × import rate. For progressive billing set `tariffKind=tiered` and `importBlocks=[{"upToKwh":100,"rate":10},{"upToKwh":null,"rate":20}]`. Upper bounds must increase; only the final block is open. Rates are per kWh; fixed monthly connection charges are excluded. The UI currently edits flat tariffs; tiered tariffs are available through the API.

For each month: self-consumed energy = min(demand, generation × assumed self-consumption fraction); export = generation − self consumed; bill saving = bill(demand) − bill(demand − self consumed); net benefit = bill saving + export × export rate − operating cost. Capex is the sum of three quote components. Simple payback is capex / annual net benefit if positive, otherwise null. No IRR/NPV or financed payback is implied.

## Private inference contract

Port 8000 is internal. `x-service-key` is checked if configured. `/plan` accepts site, physical scenario fields, twelve daily GHI values in kWh/m²/day, twelve temperatures °C and year. `/forecast` accepts validated one-hour contiguous intervals `{end, durationHours:1, ghiWm2,dniWm2,dhiWm2,tempC,windMs}`. End is UTC; radiation is the preceding-hour mean and midpoint is used for geometry. `/research/predict` takes the native plant irradiation unit and ambient °C; its output is explicitly not household yield.

Production should never publish inference or PostgreSQL ports. API DTOs carry provenance (`source`, `fetchedAt`, warnings/cache), model/engine/schema versions, input snapshots and financial assumptions so every saved estimate can be understood later.
