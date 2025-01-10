"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const jwt_module_1 = require("../auth/jwt-module");
exports.router = (0, express_1.Router)();
exports.router.get('/', jwt_module_1.verifyAccess, ((req, res) => {
    res.send({ data: 'Only for Admin!' });
}));
