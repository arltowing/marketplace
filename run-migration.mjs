import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';
const envPath=path.resolve('.env.local');
if(fs.existsSync(envPath)){
  for(const line of fs.readFileSync(envPath,'utf8').split(/\r?\n/)){
    if(!line||line.startsWith('#')||!line.includes('='))continue;
    const i=line.indexOf('=');let v=line.slice(i+1).trim();
    if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);
    process.env[line.slice(0,i).trim()]=v;
  }
}
if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL missing. Run neon link first.');
const sql=fs.readFileSync(path.resolve('..','BUILD48_GOOGLE_AUTH_MIGRATION.sql'),'utf8');
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false}});
await pool.query(sql);await pool.end();console.log('Build48 Google Admin migration completed.');
