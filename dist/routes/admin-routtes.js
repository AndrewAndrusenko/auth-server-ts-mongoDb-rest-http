"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const jwt_module_1 = require("../modules/jwt-module");
const rxjs_1 = require("rxjs");
exports.router = (0, express_1.Router)();
exports.router.get('/getAllTokens', jwt_module_1.verifyAccess, (req, res) => {
    (0, jwt_module_1.getAllRefreshToStore)(req, res)
        .pipe((0, rxjs_1.catchError)(e => {
        res.status(500).send({ msg: e.message, ml: e.module });
        return rxjs_1.EMPTY;
    }))
        .subscribe(data => res.send(data));
});
exports.router.post('/delToken', jwt_module_1.verifyAccess, (req, res) => {
    (0, jwt_module_1.deleteRefreshToken)(req, res)
        .pipe((0, rxjs_1.catchError)(e => {
        res.status(500).send({ msg: e.message, ml: e.module });
        return rxjs_1.EMPTY;
    }))
        .subscribe(data => data.deleted ? res.send(data) : res.status(500).send({ msg: 'Token has not been deleted', ml: 'JWT' }));
});
