const express = require('express');
const session = require('express-session');
const path = require('path');
const dotenv = require('dotenv');
const db = require('./config/database');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ミドルウェア
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// セッション設定
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 24時間
}));

// ビューエンジン設定
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ルート設定
app.use('/', require('./routes/index'));
app.use('/scores', require('./routes/scores'));
app.use('/instruments', require('./routes/instruments'));
app.use('/protected', require('./routes/protected'));

// エラーハンドリング
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { message: 'サーバーエラーが発生しました' });
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`サーバーが http://localhost:${PORT} で起動しました`);
});
