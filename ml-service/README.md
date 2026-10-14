# Private inference component

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000
python -m pytest tests -q
```

Python 3.12. Keep port 8000 private. If using `ML_SERVICE_KEY`, set the same value here and in the Express API. The Docker image uses one worker and one BLAS thread for modest instances.

The served research artifact is safe JSON, with preprocessing and coefficients, generated from the original CSVs using chronological validation. New-installation planning uses the separate pvlib capacity-aware engine. `app/research.py` has no third-party runtime dependency; its two native unittest checks passed here. FastAPI/pvlib tests could not run due to dependency download restrictions. Refer to the root model/architecture documentation for boundaries and reproducible metrics.
