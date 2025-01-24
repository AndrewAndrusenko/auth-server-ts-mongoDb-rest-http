"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const jwt_module_1 = require("../modules/jwt-module");
const rxjs_1 = require("rxjs");
const logger_module_1 = require("../modules/logger-module");
const path = __importStar(require("path"));
exports.router = (0, express_1.Router)();
const localLogger = logger_module_1.loggerPino.child({ ml: path.basename(__filename) });
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
        .subscribe(data => {
        if (data.deleted) {
            res.send(data);
        }
        else {
            localLogger.error({ fn: '/delToken', user: req.body.userId, msg: 'Token has not been deleted' });
            res.status(500).send({ msg: 'Token has not been deleted', ml: 'JWT' });
        }
    });
});
