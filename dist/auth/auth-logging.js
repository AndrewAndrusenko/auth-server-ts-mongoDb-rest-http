"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logInUser = logInUser;
exports.logOutUser = logOutUser;
const rxjs_1 = require("rxjs");
const auth_hash_module_1 = require("./auth-hash-module");
const jwt_module_1 = require("./jwt-module");
const cookie_1 = require("cookie");
const shared_models_1 = require("../types/shared-models");
const mongodb_1 = require("../mongo-db/mongodb");
const mongoClient = new mongodb_1.mongoDBClient();
initTemp();
function initTemp() {
    console.log('mongoClient.isOpened', mongoClient.isOpened);
}
function logInUser(req, res, next) {
    console.log('mongoClient.isOpened', mongoClient.isOpened);
    let userFromUI = req.body;
    (0, rxjs_1.from)(mongoClient.isDBConnected()).pipe((0, rxjs_1.switchMap)(() => mongoClient.findUser(userFromUI)), (0, rxjs_1.switchMap)(user => user === null ? (0, rxjs_1.throwError)(() => new Error('Incorrect userId')) : (0, rxjs_1.of)(user)), (0, rxjs_1.switchMap)(user => user?.emailConfirmed === true ? (0, rxjs_1.of)(user) :
        (0, rxjs_1.throwError)(() => {
            let emailErr = new Error('Email address has not been confirmed');
            emailErr.stack = JSON.stringify(user);
            emailErr.name = 'email';
            return emailErr;
        })), (0, rxjs_1.switchMap)(user => (0, auth_hash_module_1.verifyUserPassword)(userFromUI.password, user)), (0, rxjs_1.switchMap)(userPassword => userPassword.passwordConfirmed ? (0, rxjs_1.of)(userPassword.userData) : (0, rxjs_1.throwError)(() => new Error('Incorrect password'))), (0, rxjs_1.switchMap)(user => (0, jwt_module_1.jwtSet)({ _id: user._id, userId: user.userId, role: user.role })), (0, rxjs_1.switchMap)(jwtInfoToken => (0, jwt_module_1.saveRefreshToStore)(jwtInfoToken)), (0, rxjs_1.catchError)(e => {
        console.log('\x1b[31merror_logInUser', e.message, '\x1b[0m');
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
    res.send({ userId: req.body.userId, logout: true });
}
