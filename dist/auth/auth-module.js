"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashUserPassword = hashUserPassword;
exports.verifyUserPassword = verifyUserPassword;
const bcrypt_1 = __importDefault(require("bcrypt"));
const rxjs_1 = require("rxjs");
function hashUserPassword(password) {
    return (0, rxjs_1.from)(bcrypt_1.default.genSalt()).pipe((0, rxjs_1.switchMap)(salt => bcrypt_1.default.hash(password, salt)));
}
function verifyUserPassword(password, hashedPassword) {
    return (0, rxjs_1.from)(bcrypt_1.default.compare(password, hashedPassword));
}
