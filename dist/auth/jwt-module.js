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
exports.redisStore = void 0;
exports.jwtSet = jwtSet;
exports.verifyAccess = verifyAccess;
exports.saveRefreshToStore = saveRefreshToStore;
exports.getAllRefreshToStore = getAllRefreshToStore;
exports.deleteRefreshToken = deleteRefreshToken;
const environment_1 = require("../environment/environment");
const jsonwebtoken_1 = require("jsonwebtoken");
const rxjs_1 = require("rxjs");
const shared_models_1 = require("../types/shared-models");
const cookie_parser_1 = require("cookie-parser");
const cookie_1 = require("cookie");
const redis_module_1 = require("./redis-module");
const access_roles_model_1 = require("../routes/access-roles-model");
const path = __importStar(require("path"));
const logger_module_1 = require("../shared/logger-module");
exports.redisStore = new redis_module_1.redisClientAuth();
exports.redisStore.init().pipe((0, rxjs_1.catchError)(err => {
    localLogger.error({ fn: 'redisStore.init()', msg: err.code });
    return rxjs_1.EMPTY;
})).subscribe();
const localLogger = logger_module_1.loggerPino.child({ ml: path.basename(__filename) });
function issueAccessJWT(jwtInfo) {
    return (0, rxjs_1.from)(new Promise((resolve, reject) => {
        try {
            resolve((0, jsonwebtoken_1.sign)(jwtInfo, environment_1.ENVIRONMENT.JWT.JWT_SECRET, environment_1.ENVIRONMENT.JWT.JWT_SETTINGS));
        }
        catch (error) {
            reject((error));
        }
    }));
}
function issueRefreshJWT(jwtInfo) {
    return (0, rxjs_1.from)(new Promise((resolve, reject) => {
        try {
            resolve((0, jsonwebtoken_1.sign)(jwtInfo, environment_1.ENVIRONMENT.JWT.JWT_REFRESH_SECRET, environment_1.ENVIRONMENT.JWT.JWT_SETTINGS_SECRET));
        }
        catch (error) {
            reject((error));
        }
    }));
}
function jwtSet(jwtInfo) {
    return (0, rxjs_1.forkJoin)({
        jwt: issueAccessJWT(jwtInfo),
        refreshToken: issueRefreshJWT(jwtInfo),
        jwtInfo: (0, rxjs_1.of)(jwtInfo)
    }).pipe((0, rxjs_1.catchError)(err => {
        localLogger.error({ fn: 'jwtSet', user: jwtInfo.userId, msg: err.message });
        return (0, rxjs_1.of)({ jwt: '', refreshToken: '', jwtInfo: jwtInfo });
    }));
}
function verifyAccess(req, res, next) {
    verifyJWT(String((0, cookie_parser_1.JSONCookies)(req.cookies)['A3_AccessToken']), String((0, cookie_parser_1.JSONCookies)(req.cookies)['A3_RefreshToken']), res, next, req.originalUrl);
}
function verifyJWT(accessToken, refreshToken, res, next, url) {
    const boundJwtVerify = (0, rxjs_1.bindNodeCallback)(jsonwebtoken_1.verify);
    let jwtVerify$ = boundJwtVerify(accessToken, environment_1.ENVIRONMENT.JWT.JWT_SECRET);
    jwtVerify$.pipe((0, rxjs_1.tap)(decoded => {
        if (!access_roles_model_1.ACCESS_ROUTES_ROLES.find(el => el.route === url)?.roles.includes(decoded.role)) {
            localLogger.info({ fn: 'verifyJWT', user: decoded.userId, route: url, msg: 'Access is forbidden' });
            res.status(403).send({ ml: 'JWT', msg: 'Access is forbidden' });
            let e = { ...(new Error()), name: 'AccessForbiden' };
            throw e;
        }
    }), (0, rxjs_1.catchError)(err => {
        switch (err?.name) {
            case 'TokenExpiredError':
                localLogger.info({ fn: 'verifyJWT', msg: err.message, jwt: accessToken.split('.')[2] });
                refreshTokenFunc(refreshToken, res).subscribe(res_jwtInfoToken => {
                    res_jwtInfoToken = res_jwtInfoToken;
                    verifyJWT(res_jwtInfoToken.jwtInfoToken.jwt, res_jwtInfoToken.jwtInfoToken.refreshToken, res_jwtInfoToken.response, next, url);
                });
                break;
            case 'AccessForbiden':
                break;
            default:
                localLogger.error({ fn: 'verifyJWT', jwt: accessToken, msg: `${err?.name} : ${err.message}` });
                res.headersSent ? null : res.status(401).send(`${err?.name} : ${err.message}`);
                break;
        }
        return rxjs_1.EMPTY;
    })).subscribe(() => next());
}
function refreshTokenFunc(refreshToken, res) {
    const boundJwtVerify = (0, rxjs_1.bindNodeCallback)(jsonwebtoken_1.verify);
    return boundJwtVerify(refreshToken, environment_1.ENVIRONMENT.JWT.JWT_REFRESH_SECRET).pipe((0, rxjs_1.switchMap)(jwtInfo => exports.redisStore.getRefreshToken(jwtInfo.userId)
        .pipe((0, rxjs_1.switchMap)(jwtInfoToken => {
        if (jwtInfoToken?.refreshToken === refreshToken) {
            return (0, rxjs_1.of)(jwtInfo);
        }
        else {
            localLogger.error({ fn: 'refreshTokenFunc', user: jwtInfo.userId, msg: 'refreshToken has not been found', });
            res.status(401).send('JsonWebTokenError : RefreshToken has not been found');
            return rxjs_1.EMPTY;
        }
    }), (0, rxjs_1.catchError)(e => { return (0, rxjs_1.throwError)(() => e); }))), (0, rxjs_1.tap)(jwtInfo => localLogger.debug('User:', jwtInfo.userId, '| New token is being issued')), (0, rxjs_1.switchMap)(jwtInfo => jwtSet({ _id: jwtInfo._id, userId: jwtInfo.userId, role: jwtInfo.role })), (0, rxjs_1.switchMap)(jwtInfoToken => exports.redisStore.saveRefresh(jwtInfoToken)), (0, rxjs_1.tap)(jwtInfoToken => res.setHeader('Set-Cookie', [
        (0, cookie_1.serialize)('A3_AccessToken', jwtInfoToken.jwt, shared_models_1.serializeOptions),
        (0, cookie_1.serialize)('A3_RefreshToken', jwtInfoToken.refreshToken, shared_models_1.serializeOptions),
        (0, cookie_1.serialize)('A3_AccessToken_Shared', jwtInfoToken.jwt, shared_models_1.serializeOptionsShared)
    ])), (0, rxjs_1.switchMap)(jwtInfoToken => (0, rxjs_1.of)({ response: res, jwtInfoToken: jwtInfoToken })), (0, rxjs_1.catchError)(err => {
        res.status(401).send(`${err?.name} : ${err.message}`);
        return rxjs_1.EMPTY;
    }));
}
function saveRefreshToStore(jwtInfoToken) {
    return exports.redisStore.saveRefresh(jwtInfoToken).pipe((0, rxjs_1.catchError)(err => {
        localLogger.error({ fn: 'saveRefreshToStore', user: jwtInfoToken.jwtInfo?.userId, msg: err.message });
        return (0, rxjs_1.of)(jwtInfoToken);
    }));
}
function getAllRefreshToStore(req, res) {
    console.log('getAllRefreshToStore jwt');
    return exports.redisStore.gelAllRefreshTokens().pipe((0, rxjs_1.catchError)(err => {
        localLogger.error({ fn: 'gelAllRefreshTokens', msg: err.message });
        return (0, rxjs_1.throwError)(() => err);
    }));
}
function deleteRefreshToken(req, res) {
    return exports.redisStore.removeRefreshToken(req.body.userId)
        .pipe((0, rxjs_1.catchError)(err => {
        localLogger.error({ fn: 'deleteRefreshToken', user: req.body.userId, msg: err.message });
        err.module = 'JWT';
        return (0, rxjs_1.throwError)(() => err);
    }));
}
