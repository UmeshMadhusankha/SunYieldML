# Testing, TDD and CV evidence

## Claims must follow execution

The Jest finance, breaker and API acceptance tests were authored before their implementation. They could not run here because dependency downloads were denied. A small independent Node native acceptance suite was actually run before implementation (module missing) and then passed after implementation; it was expanded to nine passing checks. That is narrow test-first evidence, **not** an executed Jest TDD history for this entire codebase. Frontend/Python test suites are supplied but no broad TDD claim is made for them.

To build your own credible Jest TDD record, make a feature branch for the next behavior, write a meaningful failing assertion, run `npm test -- --watch=false` and commit the test, implement the minimum passing behavior, then refactor and rerun. Keep commits and CI run links. A good next exercise is month-specific demand: add a case where January demand differs from June, implement a 12-month demand contract, then update the form. Another is owner-scoped installer organization memberships.

| Layer | Tool | Behavior tested |
|---|---|---|
| Pure domain | Jest + native Node checks | Savings/export accounting, payback boundaries, progressive blocks, kW×hours |
| Integrations | Jest + injected clock/fixtures | Breaker states, recovery concurrency, cache freshness/staleness, provider units/windows |
| API | Jest + Supertest | Auth/session/CSRF, owner isolation, validation, persistence orchestration |
| Database | Jest + PostgreSQL service | Composite owner FK, immutable payload, cascading deletion |
| UI | Jest + Testing Library | Registration profile/session, resource/storage disclosure, login failure |
| Inference | pytest + FastAPI TestClient | PV boundaries, clipping, gaps, validation and research separation |
| Release | Compose + smoke script | Local service readiness and authenticated save/calculate/delete |

CI coverage gates are configured for finance, breaker and frontend formatting. They are proposed minimum gates; **coverage has not been measured here**. Broaden UI coverage to editing a property, comparing reports, forecast failure and screen-reader behavior once dependencies are installed. Do not report coverage or passing Jest counts until a real CI run produces the artifacts.

## Reproducible model results

`ml-service/models/reference_model.json` includes data hashes, exact dataset commit, split, preprocessing and coefficients. Run `scripts/train.py` against the original CSV files to regenerate. The last seven calendar days are held out; train-only preprocessing and train-only target reference avoid full-dataset scaling leakage.

| Metric | Local result | Meaning |
|---|---:|---|
| Train / test timestamps | 2,487 / 670 | Chronological split, cutoff 2020-06-11 |
| All-hour R² | 0.991874 | Variance explained on this holdout, not accuracy % |
| All-hour MAE | 1.494066 pp | Percentage points of normalized plant output |
| All-hour RMSE | 2.424928 pp | Same target scale |
| Daytime-proxy MAE | 2.649773 pp | Native irradiation >0.05, not measured sunrise mask |
| MAE reduction vs irradiation-only linear baseline | 11.520975% | Same held-out rows, no cross-site conclusion |

Night observations make all-hour results look stronger. Always show the daytime result and single-plant/34-day limitation when explaining the model. The physics engine has no measured site accuracy result yet; validate it against installed meter data before making that claim.

## Runtime performance

Run the controlled cache benchmark from the project root:

```bash
node backend/scripts/benchmark.js
```

The supplied `evidence/cache-benchmark.json` is an actual local run with 100 sequential repeated requests to one key and an artificial 20 ms upstream delay: uncached calls 100, cached calls 1, a 99% call reduction. This measures cache behavior alone; it is not HTTP endpoint latency, PostgreSQL throughput, ML inference speed or production speedup. Timing values vary by machine. Keep that qualifier in any CV bullet.

For end-to-end evidence, install k6 and start the full demo stack with PostgreSQL and the real inference service:

```bash
BASE_URL=http://localhost:3001 k6 run --summary-export evidence/api-load-demo.json benchmarks/api.k6.js
docker stats --no-stream
```

Use a disposable database: the script registers a load-test account and cleans up its property, but does not delete the account. k6 uses 5 virtual users for 30 seconds, posts real stored estimates, and gates request failures <1% and estimate p95 <2 seconds. Those are targets, not observed results. Extend duration/concurrency only after confirming CPU/RAM behavior. Do not load-test public weather APIs; use demo mode or approved fixtures. For live measurements, explicitly record provider cost and permission.

Record git SHA, machine, Node/Python versions, database size, model/engine versions, data mode, warm/cold cache, concurrency, request count, p50/p95/p99, failures, requests/s, CPU, peak RAM and provider calls. Compare equivalent workloads and repeated runs. Also measure the built frontend with browser Lighthouse and export its report; no Lighthouse score is claimed here. Never use the tiny local microbenchmark timings as a frontend or API performance metric.

## CV wording

Use these only after you understand the code and complete the indicated checks:

- “Designed a three-tier solar-planning application with React, an Express MVC application layer, PostgreSQL ownership constraints and a private Python inference component.” Source exists; demonstrate the architecture and tradeoffs in an interview.
- “Re-evaluated a solar plant regression using a chronological seven-day holdout, achieving R² 0.9919 and MAE 1.49 percentage points of normalized output; reduced MAE 11.5% against an irradiation-only baseline.” Locally reproduced; single-plant scope must stay clear.
- “Implemented bounded caching and request coalescing, reducing upstream calls from 100 to 1 in a controlled repeated-key benchmark.” Locally reproduced; not production traffic.
- “Practiced test-driven development with Jest, Supertest and Testing Library.” Use after actually running red–green–refactor cycles and retaining commits/CI evidence. This delivery alone does not establish that personal claim.
- “Implemented GitHub Actions CI/CD with integration tests, Docker releases, AWS OIDC and authenticated smoke checks.” Workflow source supplied; add deployment claims, coverage and timings only after real runs.

Keep a short evidence folder with the CI URLs, coverage output, benchmark JSON and a deployment screenshot. Prefer precise modest claims to invented numbers.
