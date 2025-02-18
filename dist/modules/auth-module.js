"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logInUser = logInUser;
exports.logOutUser = logOutUser;
exports.signUpNewUser = signUpNewUser;
exports.updateUserData = updateUserData;
exports.findAllUserData = findAllUserData;
exports.deleteUser = deleteUser;
exports.setResetPasswordToken = setResetPasswordToken;
exports.setNewPassword = setNewPassword;
exports.confirmEmailAddress = confirmEmailAddress;
exports.checkEmailUnique = checkEmailUnique;
exports.checkUserIdUnique = checkUserIdUnique;
exports.mongoClientClose = mongoClientClose;
const rxjs_1 = require("rxjs");
const auth_hash_module_1 = require("./auth-hash-module");
const jwt_module_1 = require("./jwt-module");
const errors_model_1 = require("../types/errors-model");
const mongodb_module_1 = require("./mongodb-module");
const logger_module_1 = require("./logger-module");
const path_1 = require("path");
const localLogger = logger_module_1.loggerPino.child({ ml: (0, path_1.basename)(__filename) });
const mongoClient = new mongodb_module_1.mongoDBClient();
function logInUser(req, res, next) {
    localLogger.debug(`mongoClient.isOpened ${mongoClient.isOpened} `);
    let userFromUI = req.body;
    (0, rxjs_1.from)(mongoClient.isDBConnected()).pipe((0, rxjs_1.switchMap)(() => mongoClient.findUser(userFromUI)), (0, rxjs_1.switchMap)(user => user === null ? (0, rxjs_1.throwError)(() => new Error('Incorrect userId')) : (0, rxjs_1.of)(user)), (0, rxjs_1.switchMap)(user => user?.emailConfirmed === true ? (0, rxjs_1.of)(user) :
        (0, rxjs_1.throwError)(() => {
            let emailErr = new Error('Email address has not been confirmed');
            emailErr.stack = JSON.stringify(user);
            emailErr.name = 'email';
            return emailErr;
        })), (0, rxjs_1.switchMap)(user => (0, auth_hash_module_1.verifyUserPassword)(userFromUI.password, user)), (0, rxjs_1.switchMap)(userPassword => userPassword.passwordConfirmed ? (0, rxjs_1.of)(userPassword.userData) : (0, rxjs_1.throwError)(() => new Error('Incorrect password'))), (0, rxjs_1.switchMap)(user => (0, jwt_module_1.jwtSetAll)({ _id: user._id, userId: user.userId, role: user.role })), (0, rxjs_1.switchMap)(jwtInfoToken => (0, jwt_module_1.saveRefreshToStore)({ ...jwtInfoToken, timeSaved: new Date().toLocaleString() })), (0, rxjs_1.catchError)(e => {
        localLogger.error({ fn: 'logInUser', user: userFromUI.userId, msg: e.message, err_name: e.name });
        res.send({ errorResponse: { message: e.message, name: e.name, stack: e?.stack } });
        return rxjs_1.EMPTY;
    })).subscribe(jwtInfoToken => {
        res = (0, jwt_module_1.setCookiesJWT_Tokens)(res, jwtInfoToken.jwt, jwtInfoToken.refreshToken);
        // res.setHeader('Authorization', 'Bearer '+ jwtInfoToken.jwt)
        res.send(jwtInfoToken);
        localLogger.info({ fn: 'logInUser', msg: 'success', user: userFromUI.userId });
    });
}
function logOutUser(req, res, next) {
    res = (0, jwt_module_1.clearCookiesJWTTokens)(res);
    (0, jwt_module_1.deleteRefreshToken)(req, res)
        .pipe((0, rxjs_1.catchError)(err => {
        res.status(errors_model_1.SERVER_ERRORS.get('INTERNAL_ERROR').code).send(err);
        return rxjs_1.EMPTY;
    }))
        .subscribe(data => {
        res.send({ userId: req.body.userId, logout: data.deleted });
        localLogger.info({ fn: 'logOutUser', msg: 'success', user: req.body.userId });
    });
}
function signUpNewUser(req, res, next) {
    let newUser = req.body;
    return (0, rxjs_1.from)(mongoClient.isDBConnected())
        .pipe((0, rxjs_1.switchMap)(() => (0, auth_hash_module_1.hashUserPassword)(newUser.password)), (0, rxjs_1.switchMap)((hashPassword) => mongoClient.addUser({ ...newUser, password: hashPassword })), (0, rxjs_1.catchError)(err => {
        res.status(errors_model_1.SERVER_ERRORS.get('INTERNAL_ERROR').code).send(err);
        localLogger.error({ fn: 'signUpNewUser', msg: err.message });
        return rxjs_1.EMPTY;
    }))
        .subscribe(data => {
        res.send(data);
        localLogger.info({ fn: 'signUpNewUser', msg: 'success', user: newUser.userId });
    });
}
function updateUserData(req, res, next) {
    let newUser = req.body;
    (0, rxjs_1.from)(mongoClient.isDBConnected()).pipe((0, rxjs_1.switchMap)(() => mongoClient.updateUser(newUser)), (0, rxjs_1.catchError)(e => {
        res.status(errors_model_1.SERVER_ERRORS.get('INTERNAL_ERROR').code).send(e);
        return rxjs_1.EMPTY;
    })).subscribe(data => {
        res.send(data);
        localLogger.info({ fn: 'updateUserData', msg: JSON.stringify(newUser), user: newUser.userId });
    });
}
function findAllUserData(req, res, next) {
    (0, rxjs_1.from)(mongoClient.isDBConnected()).pipe((0, rxjs_1.switchMap)(() => mongoClient.findAllUsers()), (0, rxjs_1.catchError)(e => {
        res.status(errors_model_1.SERVER_ERRORS.get('INTERNAL_ERROR').code).send(e);
        return rxjs_1.EMPTY;
    })).subscribe(data => res.send(data));
}
function deleteUser(req, res, next) {
    (0, rxjs_1.from)(mongoClient.isDBConnected()).pipe((0, rxjs_1.switchMap)(() => mongoClient.deleteUser(req.body.userId)), (0, rxjs_1.catchError)(e => {
        res.status(errors_model_1.SERVER_ERRORS.get('INTERNAL_ERROR').code).send(e);
        return rxjs_1.EMPTY;
    })).subscribe(data => {
        res.send(data);
        localLogger.info({ fn: 'deleteUser', msg: data?.deletedCount ? 'success' : 'fail', user: req.body.userId });
    });
}
function setResetPasswordToken(req, res, next) {
    let data = req.body;
    (0, rxjs_1.from)(mongoClient.isDBConnected()).pipe((0, rxjs_1.switchMap)(() => mongoClient.setResetPasswordToken(data.email, data.passwordToken)), (0, rxjs_1.catchError)(err => {
        res.status(errors_model_1.SERVER_ERRORS.get('INTERNAL_ERROR').code).send(err);
        return rxjs_1.EMPTY;
    })).subscribe(data => {
        res.send(data);
        localLogger.info({ fn: 'setResetPasswordToken', msg: req.body.data?.passwordToken, user: data?.email });
    });
}
function setNewPassword(req, res, next) {
    let data = req.body;
    (0, rxjs_1.from)(mongoClient.isDBConnected())
        .pipe((0, rxjs_1.switchMap)(() => (0, auth_hash_module_1.hashUserPassword)(data.password)), (0, rxjs_1.switchMap)(hashedPassword => mongoClient.resetPassword(data.id, data.token, hashedPassword)), (0, rxjs_1.catchError)(err => {
        res.status(errors_model_1.SERVER_ERRORS.get('INTERNAL_ERROR').code).send(err);
        return rxjs_1.EMPTY;
    })).subscribe(data => {
        res.send(data);
        localLogger.info({ fn: 'setNewPassword', msg: data ? 'success' : `failed for token ${req.body.token}`, user: req.body.id });
    });
}
function confirmEmailAddress(req, res, next) {
    (0, rxjs_1.from)(mongoClient.isDBConnected()).pipe((0, rxjs_1.switchMap)(() => mongoClient.confirmEmail(req.body)), (0, rxjs_1.switchMap)(updateResult => (0, rxjs_1.of)(updateResult.modifiedCount !== 0 || updateResult.matchedCount !== 0)), (0, rxjs_1.catchError)(err => {
        res.status(errors_model_1.SERVER_ERRORS.get('INTERNAL_ERROR').code).send(err);
        localLogger.error({ fn: 'confirmEmailAddress', user: req.url, msg: err.message });
        return rxjs_1.EMPTY;
    })).subscribe(data => {
        res.send(data);
        localLogger.info({ fn: 'confirmEmailAddress', msg: data ? 'success' : 'fail', user: req.body.id || '0' });
    });
}
//VALIDATORS
function checkEmailUnique(req, res, next) {
    (0, rxjs_1.from)(mongoClient.isDBConnected()).pipe((0, rxjs_1.switchMap)(() => mongoClient.checkEmailUnique(req.query.email)), (0, rxjs_1.catchError)(err => {
        res.status(errors_model_1.SERVER_ERRORS.get('INTERNAL_ERROR').code).send(err);
        localLogger.error({ fn: 'checkEmailUnique', msg: err.message, user: req.query.userId });
        return rxjs_1.EMPTY;
    })).subscribe(data => res.send(data));
}
function checkUserIdUnique(req, res, next) {
    (0, rxjs_1.from)(mongoClient.isDBConnected()).pipe((0, rxjs_1.switchMap)(() => mongoClient.checkUserIdUnique(req.query.userId)), (0, rxjs_1.catchError)(err => {
        res.status(errors_model_1.SERVER_ERRORS.get('INTERNAL_ERROR').code).send(err);
        localLogger.error({ fn: 'checkUserIdUnique', msg: err.message, user: req.query.userId });
        return rxjs_1.EMPTY;
    })).subscribe(data => res.send(data));
}
//UTILS
function mongoClientClose(req, res, next) {
    (0, rxjs_1.from)(mongoClient.close()).subscribe(() => res.send('MongoDB connection is closed'));
}
