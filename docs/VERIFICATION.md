# Verification record

Executed locally on 14 October 2026 with Node v24.19.0 and Python 3.12.14. Full raw results are in `evidence/local-verification.json` and the controlled cache result in `evidence/cache-benchmark.json`.

| Check | Outcome |
|---|---|
| Native Node acceptance suite | 9 checks passed: finance, progressive billing/payback, integration, breaker recovery, nontransient failure, cache/coalescing/staleness, password verification, memory ownership/snapshot/cascade, weather contracts |
| Python portable model unittest | 2 checks passed: prediction/metadata and input rejection |
| JavaScript syntax (`node --check`) | All non-JSX source/config files checked by the helper passed |
| Python AST syntax | All supplied Python files parsed |
| Workflow/Compose YAML, JSON manifests and model | Parsed successfully; parsing is not platform/schema/runtime validation |
| Bash release syntax | `bash -n` passed |
| Combined local verification helper | 59/59 individual checks passed; most are syntax/parse checks, not 59 behavioral tests |
| Plant-model training/evaluation | Actually ran using local NumPy/pandas/scikit-learn; JSON contains chronological holdout results and data hashes |
| Controlled cache microbenchmark | Actually ran; 100 uncached calls vs 1 cached call for one repeated key, artificial 20 ms latency |
| Jest, Testing Library and coverage | Not run: npm dependency downloads denied; no measured coverage claim |
| Frontend build / JSX compilation / browser interaction | Not run: React/Vite/compiler dependencies unavailable |
| FastAPI/pvlib pytest | Not run: required packages unavailable and PyPI downloads denied |
| PostgreSQL integration / Docker | Not run: services/engines unavailable locally |
| Live weather adapters | Not exercised against real provider accounts; mocked/native adapter cases passed |
| k6 end-to-end load test / Lighthouse | Scripts/measurement guidance supplied; no actual results |
| GitHub CI/CD and AWS hosting | Configuration supplied; not executed/deployed remotely |

The initial small native Node test file was run before implementation and failed because domain/breaker/cache modules did not yet exist. It passed after implementation and was expanded. Jest acceptance sources were authored before backend implementation, but the runner was unavailable. This is limited test-first evidence, not proof of user-authored TDD across the delivered project.

To rerun available local checks on your machine:

```bash
pip install -r scripts/requirements-tools.txt
python scripts/verify_local.py
```

Then install each application's dependencies and run the full checks in README and CI. Resolve real failures before enabling CD or publishing CV coverage/deployment claims. Commit generated npm lockfiles before releasing. The local trainer used preinstalled scikit-learn 1.8.0; the training requirements pin 1.6.1, so tiny floating-point metric differences may occur on regeneration. The portable JSON's exact measured values and provenance remain authoritative for this run.
