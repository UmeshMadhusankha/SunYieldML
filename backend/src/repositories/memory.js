const {randomUUID}=require('node:crypto');
class MemoryRepository {
  constructor(){this.users=new Map();this.sessions=new Map();this.tables={sites:new Map(),scenarios:new Map(),estimates:new Map()};}
  async health(){return true;}
  async findUser(email){return [...this.users.values()].find(u=>u.email===email)||null;}
  async user(id){return this.users.get(id)||null;}
  async createUser(data){if(await this.findUser(data.email))throw Object.assign(new Error('Duplicate account'),{code:'23505'});const row={...data,id:randomUUID()};this.users.set(row.id,row);return structuredClone(row);}
  async saveSession(session){this.sessions.set(session.id,structuredClone(session));}
  async session(id){const s=this.sessions.get(id);if(s&&new Date(s.expiresAt)>new Date())return structuredClone(s);this.sessions.delete(id);return null;}
  async deleteSession(id){this.sessions.delete(id);}
  async create(table,ownerId,payload,refs={}){const row={...payload,id:randomUUID(),ownerId,...refs,createdAt:new Date().toISOString()};this.tables[table].set(row.id,structuredClone(row));return row;}
  async get(table,id,ownerId){const row=this.tables[table].get(id);return row?.ownerId===ownerId?structuredClone(row):null;}
  async list(table,ownerId,siteId){return [...this.tables[table].values()].filter(r=>r.ownerId===ownerId&&(!siteId||r.siteId===siteId)).map(r=>structuredClone(r)).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));}
  async updateSite(id,ownerId,payload){const row=await this.get('sites',id,ownerId);if(!row)return null;const result={...row,...payload};this.tables.sites.set(id,structuredClone(result));return result;}
  async deleteSite(id,ownerId){const row=await this.get('sites',id,ownerId);if(!row)return false;this.tables.sites.delete(id);for(const table of ['scenarios','estimates'])for(const [key,r]of this.tables[table])if(r.siteId===id)this.tables[table].delete(key);return true;}
}
module.exports={MemoryRepository};
