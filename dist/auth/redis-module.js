"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClientAuth = void 0;
const redis_1 = require("redis");
const rxjs_1 = require("rxjs");
class redisClientAuth {
    constructor() {
        this.client = null;
    }
    init() {
        return (0, rxjs_1.from)((0, redis_1.createClient)().connect()).pipe((0, rxjs_1.tap)(newClient => this.client = newClient), (0, rxjs_1.switchMap)(() => (0, rxjs_1.of)(true)), (0, rxjs_1.catchError)(e => {
            return (0, rxjs_1.of)(false);
        }));
    }
    saveRefresh(data) {
        return (0, rxjs_1.from)(this.client?.set(data.jwtInfo.userId, JSON.stringify(data))).pipe((0, rxjs_1.tap)(res => console.log('User:', data.jwtInfo.userId, '| Refresh token has been saved?', res)), (0, rxjs_1.switchMap)(() => (0, rxjs_1.of)(data)), (0, rxjs_1.catchError)(e => {
            console.log('\x1b[31merror_saveRefresh', e, '\x1b[0m');
            return rxjs_1.EMPTY;
        }));
    }
    getRefreshTocken(userId) {
        return this.client ? (0, rxjs_1.from)(this.client?.get(userId)).pipe((0, rxjs_1.switchMap)(res => (0, rxjs_1.of)(JSON.parse(res)))) : rxjs_1.EMPTY;
    }
    removeRefreshTocken(userId) {
        return this.client ? (0, rxjs_1.from)(this.client.del(userId)).pipe((0, rxjs_1.switchMap)(res => (0, rxjs_1.of)({ userId: userId, deleted: res }))) : rxjs_1.EMPTY;
    }
}
exports.redisClientAuth = redisClientAuth;
