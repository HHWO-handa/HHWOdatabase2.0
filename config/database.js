const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const dbPath = process.env.DB_PATH || path.join(__dirname, '../data/database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('データベース接続エラー:', err);
    process.exit(1);
  } else {
    console.log('SQLiteデータベースに接続しました');
  }
});

// テーブル初期化
db.serialize(() => {
  // 楽譜テーブル
  db.run(`
    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      composer TEXT,
      genre TEXT,
      difficulty TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 楽器テーブル
  db.run(`
    CREATE TABLE IF NOT EXISTS instruments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT,
      description TEXT,
      manufacturer TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 楽譜と楽器の関連テーブル
  db.run(`
    CREATE TABLE IF NOT EXISTS score_instruments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      score_id INTEGER NOT NULL,
      instrument_id INTEGER NOT NULL,
      FOREIGN KEY (score_id) REFERENCES scores(id),
      FOREIGN KEY (instrument_id) REFERENCES instruments(id)
    )
  `);
});

module.exports = db;