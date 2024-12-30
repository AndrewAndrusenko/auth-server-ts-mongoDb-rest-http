"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisStore = void 0;
exports.jwtSet = jwtSet;
exports.verifyAccess = verifyAccess;
exports.removeUser = removeUser;
exports.saveRefreshToStore = saveRefreshToStore;
const environment_1 = require("../environment/environment");
const jsonwebtoken_1 = require("jsonwebtoken");
const rxjs_1 = require("rxjs");
const shared_models_1 = require("../types/shared-models");
const cookie_parser_1 = require("cookie-parser");
const cookie_1 = require("cookie");
const redis_module_1 = require("./redis-module");
exports.redisStore = new redis_module_1.redisClientAuth();
exports.redisStore.init().subscribe(res => console.log('redis store has been connected?', res));
function jwtSet(jwtInfo) {
    return (0, rxjs_1.forkJoin)({
        jwt: (0, rxjs_1.of)((0, jsonwebtoken_1.sign)(jwtInfo, environment_1.ENVIRONMENT.JWT.JWT_SECRET, environment_1.ENVIRONMENT.JWT.JWT_SETTINGS)),
        refreshToken: (0, rxjs_1.of)((0, jsonwebtoken_1.sign)(jwtInfo, environment_1.ENVIRONMENT.JWT.JWT_REFRESH_SECRET, environment_1.ENVIRONMENT.JWT.JWT_SETTINGS_SECRET)),
        jwtInfo: (0, rxjs_1.of)(jwtInfo)
    });
}
function verifyAccess(req, res, next) {
    verifyJWT(String((0, cookie_parser_1.JSONCookies)(req.cookies)['A3_AccessToken']), String((0, cookie_parser_1.JSONCookies)(req.cookies)['A3_RefreshToken']), res, next);
}
function verifyJWT(accessToken, refreshToken, res, next) {
    const boundJwtVerify = (0, rxjs_1.bindNodeCallback)(jsonwebtoken_1.verify);
    let jwtVerify$ = boundJwtVerify(accessToken, environment_1.ENVIRONMENT.JWT.JWT_SECRET);
    jwtVerify$.pipe((0, rxjs_1.tap)(decoded => {
        if (!shared_models_1.AcRoles.includes(decoded.role)) {
            res.sendStatus(403);
            next('Access is forbidden');
            return;
        }
    }), (0, rxjs_1.catchError)(err => {
        console.log('\x1b[31merror', err?.message, '\x1b[0m');
        if (err?.name === 'TokenExpiredError') {
            refreshTokenFunc(refreshToken, res).subscribe(res_jwtInfoToken => {
                res_jwtInfoToken = res_jwtInfoToken;
                verifyJWT(res_jwtInfoToken.jwtInfoToken.jwt, res_jwtInfoToken.jwtInfoToken.refreshToken, res_jwtInfoToken.response, next);
            });
        }
        else {
            res.sendStatus(401);
        }
        return rxjs_1.EMPTY;
    })).subscribe(() => next());
}
function refreshTokenFunc(refreshToken, res) {
    const boundJwtVerify = (0, rxjs_1.bindNodeCallback)(jsonwebtoken_1.verify);
    return boundJwtVerify(refreshToken, environment_1.ENVIRONMENT.JWT.JWT_REFRESH_SECRET).pipe((0, rxjs_1.switchMap)(jwtInfo => exports.redisStore.getRefreshTocken(jwtInfo.userId)
        .pipe((0, rxjs_1.switchMap)(jwtInfoToken => {
        if (jwtInfoToken?.refreshToken === refreshToken) {
            return (0, rxjs_1.of)(jwtInfo);
        }
        else {
            console.log('\x1b[31merror refreshToken has not been found\x1b[0m');
            res.status(401).send({ error: 'RefreshToken has not been found' });
            return rxjs_1.EMPTY;
        }
    }))), (0, rxjs_1.tap)(jwtInfo => console.log('User:', jwtInfo.userId, '| New token is being issued')), (0, rxjs_1.switchMap)(jwtInfo => jwtSet({ _id: jwtInfo._id, userId: jwtInfo.userId, role: jwtInfo.role })), (0, rxjs_1.switchMap)(jwtInfoToken => exports.redisStore.saveRefresh(jwtInfoToken)), (0, rxjs_1.tap)(jwtInfoToken => res.setHeader('Set-Cookie', [
        (0, cookie_1.serialize)('A3_AccessToken', jwtInfoToken.jwt, shared_models_1.serializeOptions),
        (0, cookie_1.serialize)('A3_RefreshToken', jwtInfoToken.refreshToken, shared_models_1.serializeOptions)
    ])), (0, rxjs_1.switchMap)(jwtInfoToken => (0, rxjs_1.of)({ response: res, jwtInfoToken: jwtInfoToken })), (0, rxjs_1.catchError)(err => {
        console.log('\x1b[31merror_refreshToken', err?.message, '\x1b[0m');
        res.sendStatus(401);
        return rxjs_1.EMPTY;
    }));
}
function removeUser(req, res, next) {
    let userId = req.body;
    (0, rxjs_1.from)(exports.redisStore.removeRefreshTocken(userId.userId)).pipe((0, rxjs_1.catchError)(e => {
        console.log('\x1b[31merror_removeRefreshTocken', e, '\x1b[0m');
        return (0, rxjs_1.of)({ userId: userId.userId, deleted: 0 });
    })).subscribe(data => res.send(data));
}
function saveRefreshToStore(jwtInfoToken) {
    return exports.redisStore.saveRefresh(jwtInfoToken);
}
