# SunYield frontend

React 19 with Vite, plain CSS, accessible native forms and charts, and Jest/Testing Library test sources. Extract this `frontend` directory alongside the BE archive's `backend` and `ml-service` directories, or use the full archive.

```bash
npm install
npm run dev
```

Requires Node 24. Open http://localhost:5173. Vite proxies `/api` to http://localhost:3001, so run the BE and private ML service first. No frontend secrets or localStorage login tokens are used. For deployed static hosting, preserve same-origin `/api/*` routing in CloudFront; see the full project's `docs/HOSTING.md`.

```bash
npm run lint
npm run test:ci
npm run build
```

Initial install generates `package-lock.json`; commit it before a release. `dist` is the deployable static output. Source and test files are supplied; JSX compilation, build and Jest execution were unavailable in the coding environment. Do not treat supplied tests or thresholds as measured passing coverage.
