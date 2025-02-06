"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const jwt_module_1 = require("../modules/jwt-module");
exports.router = (0, express_1.Router)();
exports.router.get('/', jwt_module_1.verifyAccess, ((req, res) => {
    res.send({ data: 'You will get quotes soon!' });
}));
exports.router.post('/new', jwt_module_1.verifyAccess, ((req, res) => {
    res.send({ data: 'You will get quotes soon!' });
}));
