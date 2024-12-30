"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashUserPassword = hashUserPassword;
exports.verifyUserPassword = verifyUserPassword;
const bcrypt_1 = require("bcrypt");
const rxjs_1 = require("rxjs");
function hashUserPassword(password) {
    return (0, rxjs_1.from)((0, bcrypt_1.genSalt)()).pipe((0, rxjs_1.switchMap)(salt => (0, bcrypt_1.hash)(password, salt)));
}
function verifyUserPassword(passwordFromUser, userData) {
    return (0, rxjs_1.from)((0, bcrypt_1.compare)(passwordFromUser, userData.password)).pipe((0, rxjs_1.map)(confirmed => { return { passwordConfirmed: confirmed, userData: userData }; }));
}
