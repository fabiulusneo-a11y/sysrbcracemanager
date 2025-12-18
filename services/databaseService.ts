
import initSqlJs, { Database } from 'sql.js';
import { City, Championship, Member, Event, AppData } from '../types';

let db: Database | null = null;

const DB_STORAGE_KEY = 'rbc_race_manager_sql_db';
const SQL_WASM_URL = 'https://esm.sh/sql.js@1.12.0/dist/sql-wasm.wasm';

export const initDatabase = async (): Promise<AppData> => {
  // Manually fetch the WASM binary to avoid 'fs.readFileSync' errors in environments
  // that polyfill Node.js APIs (like unenv) or have strict security policies.
  const wasmResponse = await fetch(SQL_WASM_URL);
  if (!wasmResponse.ok) {
    throw new Error(`Failed to fetch SQL WASM binary from ${SQL_WASM_URL}`);
  }
  const wasmBinary = await wasmResponse.arrayBuffer();

  const SQL = await initSqlJs({
    wasmBinary: wasmBinary
  });

  const savedDb = localStorage.getItem(DB_STORAGE_KEY);
  if (savedDb) {
    try {
      const u8 = new Uint8Array(JSON.parse(savedDb));
      db = new SQL.Database(u8);
    } catch (e) {
      console.error("Failed to load saved database, starting fresh:", e);
      db = new SQL.Database();
      createTables();
    }
  } else {
    db = new SQL.Database();
    createTables();
  }

  return fetchAllData();
};

const createTables = () => {
  if (!db) return;
  db.run(`
    CREATE TABLE IF NOT EXISTS cities (
      id TEXT PRIMARY KEY,
      name TEXT,
      state TEXT
    );
    CREATE TABLE IF NOT EXISTS championships (
      id TEXT PRIMARY KEY,
      name TEXT
    );
    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      name TEXT,
      role TEXT,
      active INTEGER
    );
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      championshipId TEXT,
      cityId TEXT,
      date TEXT,
      stage TEXT,
      memberIds TEXT,
      confirmed INTEGER
    );
  `);
  persist();
};

const persist = () => {
  if (!db) return;
  const data = db.export();
  const array = Array.from(data);
  localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(array));
};

export const fetchAllData = (): AppData => {
  if (!db) throw new Error("DB not initialized");

  const cities: City[] = [];
  const resCities = db.exec("SELECT * FROM cities");
  if (resCities[0]) {
    resCities[0].values.forEach(v => {
      cities.push({ id: v[0] as string, name: v[1] as string, state: v[2] as string });
    });
  }

  const championships: Championship[] = [];
  const resChamps = db.exec("SELECT * FROM championships");
  if (resChamps[0]) {
    resChamps[0].values.forEach(v => {
      championships.push({ id: v[0] as string, name: v[1] as string });
    });
  }

  const members: Member[] = [];
  const resMembers = db.exec("SELECT * FROM members");
  if (resMembers[0]) {
    resMembers[0].values.forEach(v => {
      members.push({ 
        id: v[0] as string, 
        name: v[1] as string, 
        role: v[2] as string, 
        active: v[3] === 1 
      });
    });
  }

  const events: Event[] = [];
  const resEvents = db.exec("SELECT * FROM events");
  if (resEvents[0]) {
    resEvents[0].values.forEach(v => {
      events.push({
        id: v[0] as string,
        championshipId: v[1] as string,
        cityId: v[2] as string,
        date: v[3] as string,
        stage: v[4] as string,
        memberIds: JSON.parse(v[5] as string),
        confirmed: v[6] === 1
      });
    });
  }

  return { cities, championships, members, events };
};

export const sqlInsert = (table: string, data: any) => {
  if (!db) return;
  const keys = Object.keys(data);
  const values = keys.map(k => {
    const val = data[k];
    if (Array.isArray(val)) return `'${JSON.stringify(val)}'`;
    if (typeof val === 'boolean') return val ? 1 : 0;
    return `'${val}'`;
  });
  
  db.run(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${values.join(',')})`);
  persist();
};

export const sqlUpdate = (table: string, id: string, data: any) => {
  if (!db) return;
  const sets = Object.keys(data).map(k => {
    const val = data[k];
    let finalVal = `'${val}'`;
    if (Array.isArray(val)) finalVal = `'${JSON.stringify(val)}'`;
    if (typeof val === 'boolean') finalVal = val ? '1' : '0';
    return `${k} = ${finalVal}`;
  });

  db.run(`UPDATE ${table} SET ${sets.join(', ')} WHERE id = '${id}'`);
  persist();
};

export const sqlDelete = (table: string, id: string) => {
  if (!db) return;
  db.run(`DELETE FROM ${table} WHERE id = '${id}'`);
  persist();
};
