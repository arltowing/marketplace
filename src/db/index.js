const fs=require('fs');
const path=require('path');
const config=require('../config');
let cache=null;
let pool=null;
let persistQueue=Promise.resolve();
function seedDb(){return JSON.parse(fs.readFileSync(config.dataFile,'utf8'))}
async function initDb(){
  if(!process.env.DATABASE_URL){cache=seedDb();console.warn('DATABASE_URL not set; using local JSON development database');return}
  const {Pool}=require('pg');
  pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false},max:Number(process.env.PG_POOL_MAX||5),idleTimeoutMillis:30000,connectionTimeoutMillis:15000});
  await pool.query(`CREATE TABLE IF NOT EXISTS marketplace_state (id TEXT PRIMARY KEY, payload JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
  const result=await pool.query('SELECT payload FROM marketplace_state WHERE id=$1',['main']);
  if(result.rows.length){cache=result.rows[0].payload}else{cache=seedDb();await pool.query('INSERT INTO marketplace_state(id,payload) VALUES($1,$2::jsonb)',['main',JSON.stringify(cache)])}
}
function readDb(){if(!cache)throw new Error('Database not initialized');return structuredClone(cache)}
function writeDb(db){cache=structuredClone(db);if(pool){const payload=JSON.stringify(cache);persistQueue=persistQueue.then(()=>pool.query(`INSERT INTO marketplace_state(id,payload,updated_at) VALUES($1,$2::jsonb,NOW()) ON CONFLICT(id) DO UPDATE SET payload=EXCLUDED.payload,updated_at=NOW()`,['main',payload])).catch(e=>console.error('Neon persistence failed:',e.message))}else{fs.writeFileSync(config.dataFile,JSON.stringify(cache,null,2))}}
function addEvent(type,message,meta={}){const db=readDb();db.events=db.events||[];db.events.unshift({id:'ev_'+Date.now(),type,message,meta,createdAt:new Date().toISOString()});writeDb(db)}
async function health(){if(!pool)return{mode:'local-json',ok:true};const r=await pool.query('SELECT NOW() AS now');return{mode:'neon-postgres',ok:true,databaseTime:r.rows[0].now}}
async function closeDb(){await persistQueue;if(pool)await pool.end()}
module.exports={initDb,readDb,writeDb,addEvent,health,closeDb};
