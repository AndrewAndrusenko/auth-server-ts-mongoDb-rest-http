"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const rxjs_1 = require("rxjs");
const auth_hash_module_1 = require("../auth/auth-hash-module");
const mongodb_1 = require("../mongo-db/mongodb");
const email_module_1 = require("../mail/email-module");
const auth_logging_1 = require("../auth/auth-logging");
const jwt_module_1 = require("../auth/jwt-module");
const serializeOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 30,
    path: '/'
};
exports.router = (0, express_1.Router)();
const mongoClient = new mongodb_1.mongoDBClient();
const emailHandler = new email_module_1.EmailHandler();
/* GET users listing. */
exports.router.get('/', async function (req, res, next) {
    (0, rxjs_1.from)(mongoClient.isDBConnected()).pipe((0, rxjs_1.switchMap)(() => mongoClient.getUsers())).subscribe(data => res.send(data));
});
/* GET check if userId is unique. */
exports.router.get('/checkId', async function (req, res, next) {
    (0, rxjs_1.from)(mongoClient.isDBConnected()).pipe((0, rxjs_1.switchMap)(() => mongoClient.checkUserIdUnique(req.query.userId))).subscribe(data => res.send(data));
});
/* GET check if email is unique. */
exports.router.get('/checkEmail', async function (req, res, next) {
    (0, rxjs_1.from)(mongoClient.isDBConnected()).pipe((0, rxjs_1.switchMap)(() => mongoClient.checkEmailUnique(req.query.email))).subscribe(data => res.send(data));
});
/* Insert new user data. */
exports.router.post('/', async function (req, res, next) {
    let newUser = req.body;
    (0, rxjs_1.from)(mongoClient.isDBConnected()).pipe((0, rxjs_1.switchMap)(() => (0, auth_hash_module_1.hashUserPassword)(newUser.password)), (0, rxjs_1.switchMap)((hashPassword) => mongoClient.addUser({ ...newUser, password: hashPassword })), (0, rxjs_1.catchError)(e => {
        res.send(e);
        return rxjs_1.EMPTY;
    })).subscribe(data => res.send(data));
});
/* Update user data. */
exports.router.post('/update', async function (req, res, next) {
    let newUser = req.body;
    (0, rxjs_1.from)(mongoClient.isDBConnected()).pipe((0, rxjs_1.switchMap)(() => mongoClient.updateUser(newUser)), (0, rxjs_1.catchError)(e => {
        res.send(e);
        return rxjs_1.EMPTY;
    })).subscribe(data => res.send(data));
});
exports.router.post('/set_password_token', async function (req, res, next) {
    let data = req.body;
    (0, rxjs_1.from)(mongoClient.isDBConnected()).pipe((0, rxjs_1.switchMap)(() => mongoClient.setResetPasswordToken(data.email, data.passwordToken)), (0, rxjs_1.catchError)(e => {
        res.send(e);
        return rxjs_1.EMPTY;
    })).subscribe(data => res.send(data));
});
exports.router.post('/set_new_password', async function (req, res, next) {
    let data = req.body;
    (0, rxjs_1.from)(mongoClient.isDBConnected())
        .pipe((0, rxjs_1.switchMap)(() => (0, auth_hash_module_1.hashUserPassword)(data.password)), (0, rxjs_1.switchMap)(hashedPassword => mongoClient.resetPassword(data.id, data.token, hashedPassword)), (0, rxjs_1.catchError)(e => {
        res.send(e);
        return rxjs_1.EMPTY;
    })).subscribe(data => res.send(data));
});
/*Authenticate user data*/
exports.router.post('/login', async function (req, res, next) {
    (0, auth_logging_1.logInUser)(req, res, next);
});
exports.router.post('/logout', async function (req, res, next) {
    (0, auth_logging_1.logOutUser)(req, res, next);
});
/*Confirm user email*/
exports.router.post('/email/confirm', async function (req, res, next) {
    (0, rxjs_1.from)(mongoClient.isDBConnected()).pipe((0, rxjs_1.switchMap)(() => mongoClient.confirmEmail(req.body)), (0, rxjs_1.switchMap)(updateResult => (0, rxjs_1.of)(updateResult.modifiedCount !== 0 || updateResult.matchedCount !== 0)), (0, rxjs_1.catchError)(e => {
        console.log('\x1b[31merror_email_confirm', e, '\x1b[0m');
        console.log('\x1b[31mError route:', req.url, '\x1b[0m');
        res.send(false);
        return rxjs_1.EMPTY;
    })).subscribe(data => res.send(data));
});
/* Close connection to MongoDB */
exports.router.get('/close', async function (req, res, next) {
    (0, rxjs_1.from)(mongoClient.close()).subscribe(() => res.send('MongoDB connection is closed'));
});
exports.router.post('/rdsrm', async function (req, res, next) {
    (0, jwt_module_1.removeUser)(req, res, next);
});
