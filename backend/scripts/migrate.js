require('dotenv').config();
const {Pool}=require('pg');
const {readFile}=require('node:fs/promises');
const path=require('node:path');
(async()=>{if(!process.env.DATABASE_URL)throw Error('DATABASE_URL required');const pool=new Pool({connectionString:process.env.DATABASE_URL});const client=await pool.connect();try{await client.query('BEGIN');await client.query('SELECT pg_advisory_xact_lock(924617)');await client.query(await readFile(path.join(__dirname,'../migrations/001_initial.sql'),'utf8'));await client.query('COMMIT');console.log('Migration 001 applied');}catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();await pool.end();}})().catch(e=>{console.error(e.message);process.exitCode=1;});
