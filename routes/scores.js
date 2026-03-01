const express = require('express');
const router = express.Router();
const db = require('../config/database');

// 楽譜一覧表示
router.get('/', (req, res) => {
  db.all(`
    SELECT * FROM scores ORDER BY created_at DESC
  `, (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).render('error', { message: 'データベースエラーが発生しました' });
    }
    res.render('scores', { title: '楽譜一覧', scores: rows || [] });
  });
});

// 楽譜作成フォーム表示
router.get('/new', (req, res) => {
  res.render('score-form', { title: '楽譜を追加', score: null });
});

// 楽譜作成
router.post('/', (req, res) => {
  const { title, composer, genre, difficulty, description } = req.body;

  if (!title) {
    return res.status(400).render('error', { message: 'タイトルは必須です' });
  }

  db.run(`
    INSERT INTO scores (title, composer, genre, difficulty, description)
    VALUES (?, ?, ?, ?, ?)
  `, [title, composer, genre, difficulty, description], function(err) {
    if (err) {
      console.error(err);
      return res.status(500).render('error', { message: 'データベースエラーが発生しました' });
    }
    res.redirect('/scores');
  });
});

// 楽譜詳細表示
router.get('/:id', (req, res) => {
  const { id } = req.params;

  db.get(`
    SELECT * FROM scores WHERE id = ?
  `, [id], (err, score) => {
    if (err) {
      console.error(err);
      return res.status(500).render('error', { message: 'データベースエラーが発生しました' });
    }
    if (!score) {
      return res.status(404).render('error', { message: '楽譜が見つかりません' });
    }
    res.render('score-detail', { title: score.title, score });
  });
});

// 楽譜編集フォーム表示
router.get('/:id/edit', (req, res) => {
  const { id } = req.params;

  db.get(`
    SELECT * FROM scores WHERE id = ?
  `, [id], (err, score) => {
    if (err) {
      console.error(err);
      return res.status(500).render('error', { message: 'データベースエラーが発生しました' });
    }
    if (!score) {
      return res.status(404).render('error', { message: '楽譜が見つかりません' });
    }
    res.render('score-form', { title: '楽譜を編集', score });
  });
});

// 楽譜更新
router.post('/:id', (req, res) => {
  const { id } = req.params;
  const { title, composer, genre, difficulty, description } = req.body;

  if (!title) {
    return res.status(400).render('error', { message: 'タイトル���必須です' });
  }

  db.run(`
    UPDATE scores
    SET title = ?, composer = ?, genre = ?, difficulty = ?, description = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [title, composer, genre, difficulty, description, id], function(err) {
    if (err) {
      console.error(err);
      return res.status(500).render('error', { message: 'データベースエラーが発生しました' });
    }
    res.redirect(`/scores/${id}`);
  });
});

// 楽譜削除
router.post('/:id/delete', (req, res) => {
  const { id } = req.params;

  db.run(`
    DELETE FROM scores WHERE id = ?
  `, [id], function(err) {
    if (err) {
      console.error(err);
      return res.status(500).render('error', { message: 'データベースエラーが発生しました' });
    }
    res.redirect('/scores');
  });
});

module.exports = router;