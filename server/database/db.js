import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { CONFIG } from '../config/config.js';

// Ensure database directory exists
const dbDir = path.dirname(CONFIG.DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Ensure uploads directories exist
[CONFIG.UPLOADS_DIR, CONFIG.QUARANTINE_DIR, CONFIG.DELIVERABLES_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const sqlite = sqlite3.verbose();
const db = new sqlite.Database(CONFIG.DB_PATH, (err) => {
  if (err) {
    console.error('[-] SQLite connection error:', err.message);
  } else {
    console.log('[+] Connected to SQLite database:', CONFIG.DB_PATH);
  }
});

// Promisified DB helpers
export const queryAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export const queryGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const queryRun = (sql, params = []) => {
  return new Promise(function (resolve, reject) {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

export const queryExec = (sql) => {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

export const initSchema = async () => {
  const schemaSql = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('client', 'freelancer', 'admin', 'auditor')),
      full_name TEXT NOT NULL,
      avatar TEXT,
      bio TEXT,
      skills TEXT,
      rating REAL DEFAULT 5.0,
      reviews_count INTEGER DEFAULT 0,
      wallet_balance REAL DEFAULT 1000.00,
      mfa_enabled INTEGER DEFAULT 0,
      mfa_secret TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS gigs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      freelancer_id INTEGER NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      cover_image TEXT,
      tier_basic_title TEXT NOT NULL,
      tier_basic_price REAL NOT NULL,
      tier_basic_days INTEGER NOT NULL,
      tier_basic_features TEXT,
      tier_standard_title TEXT NOT NULL,
      tier_standard_price REAL NOT NULL,
      tier_standard_days INTEGER NOT NULL,
      tier_standard_features TEXT,
      tier_premium_title TEXT NOT NULL,
      tier_premium_price REAL NOT NULL,
      tier_premium_days INTEGER NOT NULL,
      tier_premium_features TEXT,
      security_rating TEXT DEFAULT 'A+',
      is_verified INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      gig_id INTEGER NOT NULL REFERENCES gigs(id),
      client_id INTEGER NOT NULL REFERENCES users(id),
      freelancer_id INTEGER NOT NULL REFERENCES users(id),
      package_tier TEXT NOT NULL CHECK(package_tier IN ('basic', 'standard', 'premium')),
      amount REAL NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('escrow_locked', 'in_progress', 'delivered', 'completed', 'disputed', 'refunded')),
      escrow_tx_hash TEXT NOT NULL,
      requirements TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS deliverables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id),
      freelancer_id INTEGER NOT NULL REFERENCES users(id),
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      sha256_hash TEXT NOT NULL,
      scan_status TEXT NOT NULL CHECK(scan_status IN ('clean', 'suspicious', 'quarantined')),
      scan_details TEXT,
      notes TEXT,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id),
      sender_id INTEGER NOT NULL REFERENCES users(id),
      receiver_id INTEGER NOT NULL REFERENCES users(id),
      message TEXT NOT NULL,
      dlp_flagged INTEGER DEFAULT 0,
      dlp_warning TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id),
      gig_id INTEGER NOT NULL REFERENCES gigs(id),
      client_id INTEGER NOT NULL REFERENCES users(id),
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      comment TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      event_type TEXT NOT NULL,
      severity TEXT NOT NULL CHECK(severity IN ('INFO', 'WARN', 'HIGH', 'CRITICAL')),
      user_id INTEGER,
      ip_address TEXT NOT NULL,
      user_agent TEXT,
      details TEXT NOT NULL,
      previous_hash TEXT NOT NULL,
      current_hash TEXT NOT NULL
    );
  `;
  await queryExec(schemaSql);
  console.log('[+] Database tables initialized successfully.');
};

export default db;
