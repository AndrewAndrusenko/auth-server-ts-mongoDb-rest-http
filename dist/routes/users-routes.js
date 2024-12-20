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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express = __importStar(require("express"));
const rxjs_1 = require("rxjs");
const auth_module_1 = require("../auth/auth-module");
const mongodb_1 = require("../mongo-db/mongodb");
const email_module_1 = require("../mail/email-module");
exports.router = express.Router();
const mongoClient = new mongodb_1.mongoDBClient();
const emailHandler = new email_module_1.EmailHandler();
/* GET users listing. */
exports.router.get('/', function (req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        (0, rxjs_1.from)(mongoClient.checkConnectionStatus()).pipe((0, rxjs_1.switchMap)(() => mongoClient.getUsers())).subscribe(data => res.send(data));
    });
});
/* GET check if userId is unique. */
exports.router.get('/checkId', function (req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        (0, rxjs_1.from)(mongoClient.checkConnectionStatus()).pipe((0, rxjs_1.switchMap)(() => mongoClient.checkUserIdUnique(req.query.userId))).subscribe(data => res.send(data));
    });
});
/* GET check if email is unique. */
exports.router.get('/checkEmail', function (req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        (0, rxjs_1.from)(mongoClient.checkConnectionStatus()).pipe((0, rxjs_1.switchMap)(() => mongoClient.checkEmailUnique(req.query.email))).subscribe(data => res.send(data));
    });
});
/* Insert new user data. */
exports.router.post('/', function (req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        let newUser = req.body;
        (0, rxjs_1.from)(mongoClient.checkConnectionStatus()).pipe((0, rxjs_1.switchMap)(() => (0, auth_module_1.hashUserPassword)(newUser.password)), (0, rxjs_1.switchMap)((hashPassword) => mongoClient.addUser(Object.assign(Object.assign({}, newUser), { password: hashPassword }))), (0, rxjs_1.catchError)(e => {
            res.send(e);
            return rxjs_1.EMPTY;
        })).subscribe(data => res.send(data));
    });
});
/* Update user data. */
exports.router.post('/update', function (req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        let newUser = req.body;
        (0, rxjs_1.from)(mongoClient.checkConnectionStatus()).pipe((0, rxjs_1.switchMap)(() => mongoClient.updateUser(newUser)), (0, rxjs_1.catchError)(e => {
            res.send(e);
            return rxjs_1.EMPTY;
        })).subscribe(data => res.send(data));
    });
});
/*Authenticate user data*/
exports.router.post('/login', function (req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        let userFromUI = req.body;
        (0, rxjs_1.from)(mongoClient.checkConnectionStatus()).pipe((0, rxjs_1.switchMap)(() => mongoClient.findUser(userFromUI)), (0, rxjs_1.switchMap)((userDB) => userDB === null ? (0, rxjs_1.throwError)(() => new Error('Incorrect userId')) : (0, rxjs_1.of)(userDB)), (0, rxjs_1.switchMap)((userDB) => (userDB === null || userDB === void 0 ? void 0 : userDB.emailConfirmed) === true ? (0, rxjs_1.of)(userDB) : (0, rxjs_1.throwError)(() => {
            let emailErr = new Error('Email address has not been confirmed');
            emailErr.stack = JSON.stringify(userDB);
            emailErr.name = 'email';
            return emailErr;
        })), (0, rxjs_1.switchMap)((userDB) => (0, auth_module_1.verifyUserPassword)(userFromUI.password, userDB.password)), (0, rxjs_1.switchMap)((passwordOk) => passwordOk ? (0, rxjs_1.of)(passwordOk) : (0, rxjs_1.throwError)(() => new Error('Incorrect password'))), (0, rxjs_1.catchError)(e => {
            console.log('e', e);
            res.send({ errorResponse: { message: e.message, name: e.name, stack: e === null || e === void 0 ? void 0 : e.stack } });
            return rxjs_1.EMPTY;
        })).subscribe(data => res.send(data));
    });
});
/*Confirm user email*/
exports.router.post('/email/confirm', function (req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Confirm user emai', req.body);
        (0, rxjs_1.from)(mongoClient.checkConnectionStatus()).pipe((0, rxjs_1.switchMap)(() => mongoClient.confirmEmail(req.body)), (0, rxjs_1.tap)(r => console.log('r00', r)), (0, rxjs_1.switchMap)(updateResult => (0, rxjs_1.of)(updateResult.modifiedCount !== 0 || updateResult.matchedCount !== 0)), (0, rxjs_1.catchError)(e => {
            console.log('Error route:', req.url);
            console.log(e);
            res.send(false);
            return rxjs_1.EMPTY;
        })).subscribe(data => res.send(data));
    });
});
/* Close connection to MongoDB */
exports.router.get('/close', function (req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        (0, rxjs_1.from)(mongoClient.close()).subscribe(() => res.send('MongoDB connection is closed'));
    });
});
