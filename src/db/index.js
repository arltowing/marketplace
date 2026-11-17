const fs = require('fs');
const path = require('path');
const config = require('../config');
const neon = require('../neonDb');

// Neon lifecycle used by server.js on Render.
async function initDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured in Render Environment variables.');
  }
  await neon.query('select 1 as ok');
  return true;
}

async function health() {
  return neon.health();
}

async function closeDb() {
  await neon.pool.end();
}

// Legacy JSON helpers retained only for routes that have not yet moved to Neon.
function readDb() {
  return JSON.parse(fs.readFileSync(config.dataFile, 'utf8'));
}
function writeDb(db) {
  fs.writeFileSync(config.dataFile, JSON.stringify(db, null, 2));
}
function addEvent(type, message, meta = {}) {
  const db = readDb();
  db.events = db.events || [];
  db.events.unshift({ id: 'ev_' + Date.now(), type, message, meta, createdAt: new Date().toISOString() });
  writeDb(db);
}
function backupDb() {
  fs.mkdirSync(config.backupDir, { recursive: true });
  const target = path.join(config.backupDir, 'db-backup-' + Date.now() + '.json');
  fs.copyFileSync(config.dataFile, target);
  return target;
}

module.exports = { initDb, health, closeDb, readDb, writeDb, addEvent, backupDb };
