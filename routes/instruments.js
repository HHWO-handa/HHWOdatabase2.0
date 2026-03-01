'use strict';

const express = require('express');
const router = express.Router();
const db = require('../config/database');

// 楽器一覧表示
router.get('/', (req, res) => {
  db.all(`
    SELECT * FROM instruments ORDER BY created_at DESC
  `, (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).render('error', { message: 'データベースエラーが発生しました' });
    }
    res.render('instruments', { title: '楽器一覧', instruments: rows || [] });
  });
});

// 楽器作成フォーム表示
router.get('/new', (req, res) => {
  res.render('instrument-form', { title: '楽器を追加', instrument: null });
});

// 楽器作成
router.post('/', (req, res) => {
  const { name, type, description, manufacturer } = req.body;

  if (!name) {
    return res.status(400).render('error', { message: '楽器名は必須です' });
  }

  db.run(`
    INSERT INTO instruments (name, type, description, manufacturer)
    VALUES (?, ?, ?, ?)
  `, [name, type, description, manufacturer], function(err) {
    if (err) {
      console.error(err);
      return res.status(500).render('error', { message: 'データベースエラーが発生しました' });
    }
    res.redirect('/instruments');
  });
});

// 楽器詳細表示
router.get('/:id', (req, res) => {
  const { id } = req.params;

  db.get(`
    SELECT * FROM instruments WHERE id = ?
  `, [id], (err, instrument) => {
    if (err) {
      console.error(err);
      return res.status(500).render('error', { message: 'データベースエラーが発生しました' });
    }
    if (!instrument) {
      return res.status(404).render('error', { message: '楽器が見つかりません' });
    }
    res.render('instrument-detail', { title: instrument.name, instrument });
  });
});

// 楽器編集フォーム表示
router.get('/:id/edit', (req, res) => {
  const { id } = req.params;

  db.get(`
    SELECT * FROM instruments WHERE id = ?
  `, [id], (err, instrument) => {
    if (err) {
      console.error(err);
      return res.status(500).render('error', { message: 'データベースエラーが発生しました' });
    }
    if (!instrument) {
      return res.status(404).render('error', { message: '楽器が見つかりません' });
    }
    res.render('instrument-form', { title: '楽器を編集', instrument });
  });
});

// 楽器更新
router.post('/:id', (req, res) => {
  const { id } = req.params;
  const { name, type, description, manufacturer } = req.body;

  if (!name) {
    return res.status(400).render('error', { message: '楽器名は必須です' });
  }

  db.run(`
    UPDATE instruments
    SET name = ?, type = ?, description = ?, manufacturer = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [name, type, description, manufacturer, id], function(err) {
    if (err) {
      console.error(err);
      return res.status(500).render('error', { message: 'データベースエラーが発生しました' });
    }
    res.redirect(`/instruments/${id}`);
  });
});

// 楽器削除
router.post('/:id/delete', (req, res) => {
  const { id } = req.params;

  db.run(`
    DELETE FROM instruments WHERE id = ?
  `, [id], function(err) {
    if (err) {
      console.error(err);
      return res.status(500).render('error', { message: 'データベースエラーが発生しました' });
    }
    res.redirect('/instruments');
  });
});

module.exports = router;