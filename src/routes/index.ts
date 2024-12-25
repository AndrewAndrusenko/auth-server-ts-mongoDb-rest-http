import express = require('express');
export const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'REST MongoDB Server (Express)' });
});