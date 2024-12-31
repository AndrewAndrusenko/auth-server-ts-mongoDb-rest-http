"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClientAuth = void 0;
const redis_1 = require("redis");
const rxjs_1 = require("rxjs");
class redisClientAuth {
    constructor() {
        this.isOpen = false;
        this.client = null;
    }
    init() {
        return (0, rxjs_1.from)((0, redis_1.createClient)().connect()).pipe((0, rxjs_1.tap)(newClient => this.client = newClient), (0, rxjs_1.tap)(() => this.isOpen = this.client?.isOpen || false), (0, rxjs_1.tap)(() => this.client?.on('error', (e) => {
            this.client?.disconnect();
            console.log('\x1b[31mredis_server error: ', e.message, '\x1b[0m');
        })), (0, rxjs_1.switchMap)(() => (0, rxjs_1.of)(true)), (0, rxjs_1.tap)(res => console.log('redis store has been connected?', res)), (0, rxjs_1.catchError)(e => {
            return (0, rxjs_1.of)(false);
        }));
    }
    saveRefresh(data) {
        return (0, rxjs_1.of)(this.client?.isOpen).pipe((0, rxjs_1.switchMap)(isOpened => isOpened ? (0, rxjs_1.of)(isOpened) : this.init()), (0, rxjs_1.tap)(isOpened => isOpened ? null : console.log('\x1b[31merror', 'Redis server is unavailable', '\x1b[0m')), (0, rxjs_1.switchMap)(isOpened => isOpened ?
            (0, rxjs_1.from)(this.client?.set(data.jwtInfo.userId, JSON.stringify(data)))
            : (0, rxjs_1.of)({ refreshToken: '', jwt: '', jwtInfo: null })), (0, rxjs_1.tap)(res => res.jwtInfo ? console.log('User:', data.jwtInfo.userId, '| Refresh token has been saved?', res) : null), (0, rxjs_1.switchMap)(() => (0, rxjs_1.of)(data)), (0, rxjs_1.catchError)(e => {
            console.log('\x1b[31merror_saveRefresh', e, '\x1b[0m');
            return rxjs_1.EMPTY;
        }));
    }
    getRefreshTocken(userId) {
        return (0, rxjs_1.of)(this.client?.isOpen).pipe((0, rxjs_1.switchMap)(isOpened => isOpened ? (0, rxjs_1.of)(isOpened) : this.init()), (0, rxjs_1.tap)(isOpened => isOpened ? null : console.log('\x1b[31merror', 'Redis server is unavailable', '\x1b[0m')), (0, rxjs_1.switchMap)(isOpened => isOpened ?
            (0, rxjs_1.from)(this.client?.get(userId)).pipe((0, rxjs_1.switchMap)(res => (0, rxjs_1.of)(JSON.parse(res))))
            : (0, rxjs_1.of)({ refreshToken: '', jwt: '', jwtInfo: null })));
    }
    removeRefreshTocken(userId) {
        return this.client ?
            (0, rxjs_1.from)(this.client.del(userId)).pipe((0, rxjs_1.switchMap)(res => (0, rxjs_1.of)({ userId: userId, deleted: res })))
            : rxjs_1.EMPTY;
    }
}
exports.redisClientAuth = redisClientAuth;
