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
exports.logInUser = logInUser;
exports.logOutUser = logOutUser;
exports.signUpNewUser = signUpNewUser;
const rxjs_1 = require("rxjs");
const auth_hash_module_1 = require("./auth-hash-module");
const jwt_module_1 = require("./jwt-module");
const cookie_1 = require("cookie");
const shared_models_1 = require("../types/shared-models");
const mongodb_1 = require("../mongo-db/mongodb");
const logger_module_1 = require("../shared/logger-module");
const path = __importStar(require("path"));
const localLogger = logger_module_1.loggerPino.child({ ml: path.basename(__filename) });
const mongoClient = new mongodb_1.mongoDBClient();
function logInUser(req, res, next) {
    localLogger.debug(`mongoClient.isOpened ${mongoClient.isOpened} `);
    let userFromUI = req.body;
    (0, rxjs_1.from)(mongoClient.isDBConnected()).pipe((0, rxjs_1.switchMap)(() => mongoClient.findUser(userFromUI)), (0, rxjs_1.switchMap)(user => user === null ? (0, rxjs_1.throwError)(() => new Error('Incorrect userId')) : (0, rxjs_1.of)(user)), (0, rxjs_1.switchMap)(user => user?.emailConfirmed === true ? (0, rxjs_1.of)(user) :
        (0, rxjs_1.throwError)(() => {
            let emailErr = new Error('Email address has not been confirmed');
            emailErr.stack = JSON.stringify(user);
            emailErr.name = 'email';
            return emailErr;
        })), (0, rxjs_1.switchMap)(user => (0, auth_hash_module_1.verifyUserPassword)(userFromUI.password, user)), (0, rxjs_1.switchMap)(userPassword => userPassword.passwordConfirmed ? (0, rxjs_1.of)(userPassword.userData) : (0, rxjs_1.throwError)(() => new Error('Incorrect password'))), (0, rxjs_1.switchMap)(user => (0, jwt_module_1.jwtSet)({ _id: user._id, userId: user.userId, role: user.role })), (0, rxjs_1.switchMap)(jwtInfoToken => (0, jwt_module_1.saveRefreshToStore)({ ...jwtInfoToken, timeSaved: new Date().toLocaleString() })), (0, rxjs_1.catchError)(e => {
        localLogger.error({ fn: 'logInUser', user: userFromUI.userId, msg: e.message, err_name: e.name });
        res.send({ errorResponse: { message: e.message, name: e.name, stack: e?.stack } });
        return rxjs_1.EMPTY;
    })).subscribe(jwtInfoToken => {
        const accessToken = (0, cookie_1.serialize)('A3_AccessToken', jwtInfoToken.jwt, shared_models_1.serializeOptions);
        const accessTokenConsumer = (0, cookie_1.serialize)('A3_AccessToken_Shared', jwtInfoToken.jwt, shared_models_1.serializeOptionsShared);
        const refreshToken = (0, cookie_1.serialize)('A3_RefreshToken', jwtInfoToken.refreshToken, shared_models_1.serializeOptions);
        res.setHeader('Set-Cookie', [accessToken, refreshToken, accessTokenConsumer]);
        res.send(jwtInfoToken);
    });
}
function logOutUser(req, res, next) {
    res.clearCookie('A3_AccessToken', { httpOnly: true });
    res.clearCookie('A3_RefreshToken', { httpOnly: true });
    res.clearCookie('A3_AccessToken_Shared', { domain: shared_models_1.serializeOptionsShared.domain });
    return (0, jwt_module_1.deleteRefreshToken)(req, res);
}
function signUpNewUser(req, res, next) {
    let newUser = req.body;
    return (0, rxjs_1.from)(mongoClient.isDBConnected()).pipe((0, rxjs_1.switchMap)(() => (0, auth_hash_module_1.hashUserPassword)(newUser.password)), (0, rxjs_1.switchMap)((hashPassword) => mongoClient.addUser({ ...newUser, password: hashPassword })), (0, rxjs_1.catchError)(err => {
        localLogger.error({ fn: 'signUpNewUser', msg: err.message });
        return (0, rxjs_1.throwError)(() => err);
    }));
}
