# SunYield backend

Express MVC API, with PostgreSQL or explicitly temporary memory storage. The BE archive includes the separate `ml-service` Python inference component because the original trained model is Python-based. Extract alongside the FE archive, or use the full project.

```bash
cp .env.example .env
npm install
npm run dev
```

Node 24 is required. Defaults: API port 3001, temporary memory demo, browser origin http://localhost:5173, private ML URL http://localhost:8000. Start `ml-service` per its README; estimates and readiness require it. Register through the UI. Persistent PostgreSQL requires `STORE=postgres`, `DATABASE_URL`, and `npm run migrate` first. There is no automatic in-memory fallback on a production database failure.

From the combined project root, Docker can start just the BE components without the FE:

```bash
cp .env.example .env
# Replace example credentials; use random hex so DATABASE_URL needs no encoding.
APP_ORIGIN=http://localhost:5173 docker compose up --build -d --wait backend
```

Start FE with Vite in another terminal. Root CI expects both source folders; merge the FE archive before using those workflows. For API shapes, hosting, tests and real measured results read the `docs` directory. Jest/integration suites and Docker have not executed here; nine dependency-free Node acceptance checks did pass.
