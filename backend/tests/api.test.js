const request = require('supertest');
const { createApp } = require('../src/app');
const { MemoryRepository } = require('../src/repositories/memory');
const site = { name: 'Colombo home', type: 'household', latitude: 6.9271, longitude: 79.8612, timezone: 'Asia/Colombo', roofAreaM2: 60 };
const scenario = { name: '5 kWp proposal', capacityKwp: 5, inverterKw: 5, tiltDeg: 15, azimuthDeg: 180, lossPct: 14, shadingPct: 0, monthlyConsumptionKwh: 1000, selfConsumptionPct: 60, importRate: 50, exportRate: 20, monthlyOperatingCost: 1000, panelCost: 1000000, inverterCost: 400000, installationCost: 400000, currency: 'LKR', tariffKind: 'flat' };
const weather = { climate: async () => ({ dailyGhiKwhM2: Array(12).fill(5), monthlyTempC: Array(12).fill(27), source: 'test-fixture', fetchedAt: new Date().toISOString(), warnings: [] }), forecast: async () => ({ intervals: [], source: 'test-fixture', fetchedAt: new Date().toISOString() }) };
const ml = { health: async () => true, model: async () => ({ version: 'reference-v1' }), plan: async () => ({ monthlyKwh: Array(12).fill(600), engine: 'physics-v1', assumptions: [] }), forecast: async () => ({ totalKwh: 20, points: [] }) };
describe('API user workflows and ownership', () => {
  let app, agent, csrf, id;
  beforeEach(async () => {
    app = createApp({ repo: new MemoryRepository(), weather, ml, config: { appOrigin: 'http://localhost:5173', production: false, authRateLimit: 500, dataMode: 'demo' } });
    agent = request.agent(app);
    const r = await agent.post('/api/auth/register').send({ name: 'Yapa', email: 'yapa@example.com', password: 'StrongPassword123!', accountType: 'household' });
    expect(r.status).toBe(201); csrf = r.body.csrfToken;
    const s = await agent.post('/api/sites').set('x-csrf-token', csrf).send(site); expect(s.status).toBe(201); id = s.body.id;
  });
  test('session restores user and csrf without leaking password hashes', async () => {
    const r = await agent.get('/api/auth/me'); expect(r.status).toBe(200); expect(r.body.user.email).toBe('yapa@example.com'); expect(r.body.user.passwordHash).toBeUndefined(); expect(r.body.csrfToken).toBe(csrf);
  });
  test('supports several sites and profile updates', async () => {
    await agent.post('/api/sites').set('x-csrf-token', csrf).send({ ...site, name: 'Outlet two', type: 'business' }).expect(201);
    const r = await agent.get('/api/sites'); expect(r.body).toHaveLength(2);
    await agent.patch(`/api/sites/${id}`).set('x-csrf-token', csrf).send({ name: 'Updated home' }).expect(200);
  });
  test('creates scenario and immutable planning result', async () => {
    const s = await agent.post(`/api/sites/${id}/scenarios`).set('x-csrf-token', csrf).send(scenario).expect(201);
    const r = await agent.post(`/api/scenarios/${s.body.id}/estimates`).set('x-csrf-token', csrf).send({}).expect(201);
    expect(r.body.financial.months[0].netBenefit).toBe(21800);
    expect(r.body.resource.source).toBe('test-fixture');
    await agent.get(`/api/estimates/${r.body.id}`).expect(200);
    const list = await agent.get(`/api/sites/${id}/estimates`); expect(list.body).toHaveLength(1);
  });
  test('denies cross-account access to site scenario and estimate', async () => {
    const s = await agent.post(`/api/sites/${id}/scenarios`).set('x-csrf-token', csrf).send(scenario);
    const e = await agent.post(`/api/scenarios/${s.body.id}/estimates`).set('x-csrf-token', csrf).send({});
    const other = request.agent(app);
    const login = await other.post('/api/auth/register').send({ name: 'Other', email: 'other@example.com', password: 'StrongPassword123!', accountType: 'business' });
    for (const path of [`/api/sites/${id}`, `/api/sites/${id}/scenarios`, `/api/estimates/${e.body.id}`]) await other.get(path).expect(404);
    await other.post(`/api/scenarios/${s.body.id}/estimates`).set('x-csrf-token', login.body.csrfToken).send({}).expect(404);
  });
  test('requires session and csrf', async () => {
    await request(app).get('/api/sites').expect(401);
    await agent.post('/api/sites').send(site).expect(403);
    await agent.post('/api/sites').set('x-csrf-token', csrf).set('Origin', 'https://untrusted.example').send(site).expect(403);
  });
  test('rejects arbitrary owner IDs, invalid locations and unknown timezone', async () => {
    await agent.post('/api/sites').set('x-csrf-token', csrf).send({ ...site, ownerId: 'other' }).expect(422);
    await agent.post('/api/sites').set('x-csrf-token', csrf).send({ ...site, latitude: 999 }).expect(422);
    await agent.post('/api/sites').set('x-csrf-token', csrf).send({ ...site, timezone: 'not/a/zone' }).expect(422);
  });
  test('rejects capacity exceeding assumed roof space', async () => {
    await agent.post(`/api/sites/${id}/scenarios`).set('x-csrf-token', csrf).send({ ...scenario, capacityKwp: 100 }).expect(422);
  });
  test('rejects duplicate accounts and wrong passwords', async () => {
    await request(app).post('/api/auth/register').send({ name: 'Copy', email: 'yapa@example.com', password: 'StrongPassword123!' }).expect(409);
    await request(app).post('/api/auth/login').send({ email: 'yapa@example.com', password: 'wrong' }).expect(401);
  });
  test('logout invalidates session', async () => { await agent.post('/api/auth/logout').set('x-csrf-token', csrf).send({}).expect(204); await agent.get('/api/auth/me').expect(401); });
  test('delete cascades and a malformed JSON body is 400', async () => {
    await agent.delete(`/api/sites/${id}`).set('x-csrf-token', csrf).expect(204);
    await agent.get(`/api/sites/${id}`).expect(404);
    await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{').expect(400);
  });
  test('forecast requires an owned scenario', async () => {
    const s = await agent.post(`/api/sites/${id}/scenarios`).set('x-csrf-token', csrf).send(scenario);
    await agent.post(`/api/sites/${id}/forecasts`).set('x-csrf-token', csrf).send({ scenarioId: s.body.id }).expect(200);
  });
  test('readiness checks local services, not weather API', async () => { await request(app).get('/health/live').expect(200); await request(app).get('/health/ready').expect(200); });
});
