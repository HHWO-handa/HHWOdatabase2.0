const express = require('express');
const router = express.Router();
const dotenv = require('dotenv');

dotenv.config();

// パスワード確認ミドルウェア
const checkPassword = (req, res, next) => {
  if (req.session.authenticated) {
    return next();
  }
  res.render('password-protect');
};

// パスワード入力ペ��ジ
router.get('/login', (req, res) => {
  res.render('password-protect');
});

// パスワード確認処理
router.post('/verify', (req, res) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  if (password === adminPassword) {
    req.session.authenticated = true;
    res.redirect('/protected/admin');
  } else {
    res.render('password-protect', { error: 'パスワードが間違っています' });
  }
});

// 保護されたページ
router.get('/admin', checkPassword, (req, res) => {
  res.render('admin-panel', { title: '管理パネル' });
});

// ログアウト
router.get('/logout', (req, res) => {
  req.session.authenticated = false;
  res.redirect('/');
});

module.exports = router;