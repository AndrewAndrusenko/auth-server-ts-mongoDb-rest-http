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
exports.hashUserPassword = hashUserPassword;
exports.verifyUserPassword = verifyUserPassword;
const bcrypt_1 = require("bcrypt");
const rxjs_1 = require("rxjs");
const logger_module_1 = require("./logger-module");
const path = __importStar(require("path"));
const localLogger = logger_module_1.loggerPino.child({ ml: path.basename(__filename) });
function hashUserPassword(password) {
    return (0, rxjs_1.from)((0, bcrypt_1.genSalt)()).pipe((0, rxjs_1.switchMap)(salt => (0, bcrypt_1.hash)(password, salt)), (0, rxjs_1.catchError)(err => {
        localLogger.error({ fn: 'hashUserPassword', msg: err.message });
        err.msg = err.message,
            err.ml = 'PasswordService';
        return (0, rxjs_1.throwError)(() => err);
    }));
}
function verifyUserPassword(passwordFromUser, userData) {
    return (0, rxjs_1.from)((0, bcrypt_1.compare)(passwordFromUser, userData.password)).pipe((0, rxjs_1.map)(confirmed => { return { passwordConfirmed: confirmed, userData: userData }; }), (0, rxjs_1.catchError)(err => {
        localLogger.error({ fn: 'verifyUserPassword', msg: err.message });
        return (0, rxjs_1.throwError)(() => err);
    }));
}
