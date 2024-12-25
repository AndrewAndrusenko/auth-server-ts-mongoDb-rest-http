"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express = require("express");
exports.router = express.Router();
/* GET home page. */
exports.router.get('/', function (req, res, next) {
    res.render('index', { title: 'REST MongoDB Server (Express)' });
});
