const express = require('express');
const router = express.Router();

// ホームページ
router.get('/', (req, res) => {
  res.render('index', { title: 'ホーム' });
});

module.exports = router;