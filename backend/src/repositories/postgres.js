const {randomUUID}=require('node:crypto');
const {Pool}=require('pg');
const TABLES=new Set(['sites','scenarios','estimates']);
function tableName(table){if(!TABLES.has(table))throw Error('Invalid table');return table;}
function record(row){return row?{...row.payload,id:row.id,ownerId:row.owner_id,...(row.site_id?{siteId:row.site_id}:{}),...(row.scenario_id?{scenarioId:row.scenario_id}:{}),createdAt:row.created_at.toISOString()}:null;}
class PostgresRepository {
  constructor(connectionString){this.pool=new Pool({connectionString,max:10,connectionTimeoutMillis:3000});}
  async health(){await this.pool.query('SELECT 1');return true;}
  async findUser(email){const r=await this.pool.query('SELECT id,name,email,password_hash AS "passwordHash",account_type AS "accountType" FROM users WHERE email=$1',[email]);return r.rows[0]||null;}
  async user(id){const r=await this.pool.query('SELECT id,name,email,password_hash AS "passwordHash",account_type AS "accountType" FROM users WHERE id=$1',[id]);return r.rows[0]||null;}
  async createUser(data){const id=randomUUID();await this.pool.query('INSERT INTO users(id,name,email,password_hash,account_type) VALUES($1,$2,$3,$4,$5)',[id,data.name,data.email,data.passwordHash,data.accountType]);return {...data,id};}
  async saveSession(s){await this.pool.query('INSERT INTO sessions(id,user_id,csrf,expires_at) VALUES($1,$2,$3,$4)',[s.id,s.userId,s.csrf,s.expiresAt]);await this.pool.query('DELETE FROM sessions WHERE expires_at<=now()');}
  async session(id){const r=await this.pool.query('SELECT id,user_id AS "userId",csrf,expires_at AS "expiresAt" FROM sessions WHERE id=$1 AND expires_at>now()',[id]);return r.rows[0]||null;}
  async deleteSession(id){await this.pool.query('DELETE FROM sessions WHERE id=$1',[id]);}
  async create(table,ownerId,payload,refs={}){
    const name=tableName(table),id=randomUUID();
    const columns=['id','owner_id','payload'],params=[id,ownerId,payload];
    if(name!=='sites'){columns.push('site_id');params.push(refs.siteId);}
    if(name==='estimates'){columns.push('scenario_id');params.push(refs.scenarioId);}
    const r=await this.pool.query(`INSERT INTO ${name}(${columns.join(',')}) VALUES(${params.map((_,i)=>`$${i+1}`).join(',')}) RETURNING *`,params);
    return record(r.rows[0]);
  }
  async get(table,id,ownerId){if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))return null;const r=await this.pool.query(`SELECT * FROM ${tableName(table)} WHERE id=$1 AND owner_id=$2`,[id,ownerId]);return record(r.rows[0]);}
  async list(table,ownerId,siteId){const name=tableName(table);const r=await this.pool.query(`SELECT * FROM ${name} WHERE owner_id=$1${siteId?' AND site_id=$2':''} ORDER BY created_at DESC`,siteId?[ownerId,siteId]:[ownerId]);return r.rows.map(record);}
  async updateSite(id,ownerId,payload){const r=await this.pool.query('UPDATE sites SET payload=$3 WHERE id=$1 AND owner_id=$2 RETURNING *',[id,ownerId,payload]);return record(r.rows[0]);}
  async deleteSite(id,ownerId){const r=await this.pool.query('DELETE FROM sites WHERE id=$1 AND owner_id=$2',[id,ownerId]);return r.rowCount>0;}
  async close(){await this.pool.end();}
}
module.exports={PostgresRepository};
