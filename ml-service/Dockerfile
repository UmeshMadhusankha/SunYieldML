FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 OPENBLAS_NUM_THREADS=1 OMP_NUM_THREADS=1
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && useradd --create-home app
COPY --chown=app:app app ./app
COPY --chown=app:app models ./models
USER app
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s CMD python -c "import os,urllib.request; r=urllib.request.Request('http://127.0.0.1:8000/health',headers={'x-service-key':os.environ.get('ML_SERVICE_KEY','')});urllib.request.urlopen(r,timeout=3)"
CMD ["uvicorn","app.main:app","--host","0.0.0.0","--port","8000","--workers","1"]
