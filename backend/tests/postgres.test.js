const {PostgresRepository}=require('../src/repositories/postgres');
const {randomUUID}=require('node:crypto');
const enabled=process.env.RUN_PG_TESTS==='1';
(enabled?describe:describe.skip)('PostgreSQL ownership and constraints',()=>{
  let repo,user,other;
  beforeAll(async()=>{repo=new PostgresRepository(process.env.DATABASE_URL);await repo.health();user=await repo.createUser({name:'Integration',email:`${randomUUID()}@example.com`,passwordHash:'integration-only',accountType:'household'});other=await repo.createUser({name:'Other',email:`${randomUUID()}@example.com`,passwordHash:'integration-only',accountType:'business'});});
  afterAll(async()=>{if(repo){if(user)await repo.pool.query('DELETE FROM users WHERE id=ANY($1::uuid[])',[[user.id,other?.id].filter(Boolean)]);await repo.close();}});
  test('owner filtering, immutable snapshots and cascade work',async()=>{const site=await repo.create('sites',user.id,{name:'test'});expect(await repo.get('sites',site.id,other.id)).toBeNull();const scenario=await repo.create('scenarios',user.id,{name:'plan'},{siteId:site.id});const estimate=await repo.create('estimates',user.id,{snapshot:'original'},{siteId:site.id,scenarioId:scenario.id});await repo.updateSite(site.id,user.id,{name:'changed'});expect((await repo.get('estimates',estimate.id,user.id)).snapshot).toBe('original');await expect(repo.create('scenarios',other.id,{name:'unauthorized'},{siteId:site.id})).rejects.toMatchObject({code:'23503'});await repo.deleteSite(site.id,user.id);expect(await repo.get('estimates',estimate.id,user.id)).toBeNull();});
});
