"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashUserPassword = hashUserPassword;
exports.verifyUserPassword = verifyUserPassword;
const bcrypt_1 = require("bcrypt");
const rxjs_1 = require("rxjs");
const logger_module_1 = require("./logger-module");
const path_1 = require("path");
const localLogger = logger_module_1.loggerPino.child({ ml: (0, path_1.basename)(__filename) });
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
