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
exports.redisClientAuth = void 0;
const redis_1 = require("redis");
const rxjs_1 = require("rxjs");
const environment_1 = require("../environment/environment");
const path = __importStar(require("path"));
const logger_module_1 = require("./logger-module");
const localLogger = logger_module_1.loggerPino.child({ ml: path.basename(__filename) });
class redisClientAuth {
    constructor() {
        this.isOpen = false;
        this.client = null;
    }
    init() {
        if (this.client?.isOpen) {
            return (0, rxjs_1.of)(true);
        }
        else {
            return (0, rxjs_1.from)((0, redis_1.createClient)().connect()).pipe((0, rxjs_1.tap)(newClient => this.client = newClient), (0, rxjs_1.tap)(() => this.isOpen = this.client?.isOpen || false), (0, rxjs_1.tap)(() => this.client?.on('error', () => {
                this.client?.disconnect();
                localLogger.info({ fn: 'redisClientAuth.init', msg: 'redis client disconneted' });
            })), (0, rxjs_1.switchMap)(() => (0, rxjs_1.of)(true)), (0, rxjs_1.catchError)(err => {
                localLogger.error({ fn: 'redisClientAuth.init', msg: err.code });
                return (0, rxjs_1.throwError)(() => new Error(err.code));
            }));
        }
    }
    saveRefresh(data) {
        return this.init().pipe((0, rxjs_1.switchMap)(() => (0, rxjs_1.from)(this.client?.hSet(environment_1.ENVIRONMENT.JWT.JWT_STORE_NAME, data.jwtInfo.userId, JSON.stringify({ ...data, timeSaved: new Date().toLocaleString() })))), (0, rxjs_1.tap)(() => localLogger.debug('User:', data.jwtInfo.userId, '| Refresh token has been saved?', true)), (0, rxjs_1.switchMap)(() => (0, rxjs_1.of)(data)), (0, rxjs_1.catchError)(err => {
            localLogger.error({ fn: 'saveRefresh', user: data.jwtInfo?.userId, msg: err.message });
            return (0, rxjs_1.of)(data);
        }));
    }
    getRefreshToken(userId) {
        return this.init().pipe((0, rxjs_1.switchMap)(() => (0, rxjs_1.from)(this.client?.hGet(environment_1.ENVIRONMENT.JWT.JWT_STORE_NAME, (userId))).pipe((0, rxjs_1.map)(res => JSON.parse(res)))), (0, rxjs_1.catchError)(err => {
            localLogger.error({ fn: 'getRefreshToken', user: userId, msg: err.message });
            return (0, rxjs_1.of)({ refreshToken: '', jwt: '', jwtInfo: null });
        }));
    }
    removeRefreshToken(userId) {
        return this.init().pipe((0, rxjs_1.switchMap)(() => (0, rxjs_1.from)(this.client?.HDEL(environment_1.ENVIRONMENT.JWT.JWT_STORE_NAME, userId)).pipe((0, rxjs_1.map)(res => { return { userId: userId, deleted: res }; }))), (0, rxjs_1.catchError)(err => {
            localLogger.error({ fn: 'removeRefreshToken', user: userId, msg: err.message });
            return (0, rxjs_1.of)({ userId: userId, deleted: 0 });
        }));
    }
    gelAllRefreshTokens() {
        return this.init().pipe((0, rxjs_1.switchMap)(() => (0, rxjs_1.from)(this.client?.hGetAll(environment_1.ENVIRONMENT.JWT.JWT_STORE_NAME)).pipe((0, rxjs_1.map)(res => {
            return Object.entries(res).map(el => { return { userId: el[0], data: JSON.parse(el[1]) }; });
        }))), (0, rxjs_1.catchError)(err => {
            localLogger.error({ fn: 'gelAllRefreshTokens', msg: err.message });
            err.module = 'Redis';
            return (0, rxjs_1.throwError)(() => err);
        }));
    }
}
exports.redisClientAuth = redisClientAuth;
