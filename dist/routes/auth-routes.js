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
const rxjs_1 = require("rxjs");
const authModule = __importStar(require("../modules/auth-module"));
exports.router = (0, express_1.Router)();
/*Authenticate user data*/
exports.router.post('/login', async function (req, res, next) {
    authModule.logInUser(req, res, next);
});
//Log out user by removing tokens from cookies and redis 
exports.router.post('/logout', async function (req, res, next) {
    authModule.logOutUser(req, res, next)
        .pipe((0, rxjs_1.catchError)(err => {
        res.status(500).send(err);
        return rxjs_1.EMPTY;
    }))
        .subscribe(data => res.send({ userId: data.userId, logout: data.deleted }));
});
/* Sigh up new user. */
exports.router.post('/', async function (req, res, next) {
    authModule.signUpNewUser(req, res, next);
});
/* Update user data. */
exports.router.post('/update', async function (req, res, next) {
    authModule.updateUserData(req, res, next);
});
//PASSWORD RESET
//Setting token for password reset
exports.router.post('/set_password_token', async function (req, res, next) {
    authModule.setResetPasswordToken(req, res, next);
});
//Greating new password
exports.router.post('/set_new_password', async function (req, res, next) {
    authModule.setNewPassword(req, res, next);
});
//EMAIL
/*Confirm user email*/
exports.router.post('/email/confirm', async function (req, res, next) {
    authModule.confirmEmailAddress(req, res, next);
});
//VALIDATORS
/* GET check if userId is unique. */
exports.router.get('/checkId', async function (req, res, next) {
    authModule.checkUserIdUnique(req, res, next);
});
/* GET check if email is unique. */
exports.router.get('/checkEmail', async function (req, res, next) {
    authModule.checkEmailUnique(req, res, next);
});
//UTILS
/* Close connection to MongoDB */
exports.router.get('/close', async function (req, res, next) {
    authModule.mongoClientClose(req, res, next);
});
