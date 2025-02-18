"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mongoDBClient = void 0;
const mongodb_1 = require("mongodb");
const rxjs_1 = require("rxjs");
const environment_1 = require("../environment/environment");
const logger_module_1 = require("./logger-module");
const path_1 = require("path");
const localLogger = logger_module_1.loggerPino.child({ ml: (0, path_1.basename)(__filename) });
class mongoDBClient extends mongodb_1.MongoClient {
    get isOpened() {
        return this._isOpened;
    }
    constructor() {
        super(environment_1.ENVIRONMENT.MONGO_DB_CONFIG.mongoUrl, {
            connectTimeoutMS: 1000,
            serverSelectionTimeoutMS: 1000
        });
        this.dbInst = new mongodb_1.Db(this, environment_1.ENVIRONMENT.MONGO_DB_CONFIG.mongdDBName);
        this._isOpened = false;
        this.on('open', () => {
            // localLogger.info({fn:'mongoDBClient.constructor',msg:'MongoDB server is connected'})
            this._isOpened = true;
        });
        this.on('close', () => {
            localLogger.error({ fn: 'mongoDBClient.constructor', msg: 'MongoDB server is disconnected' });
            this._isOpened = false;
        });
    }
    isDBConnected() {
        return (0, rxjs_1.of)(this._isOpened).pipe((0, rxjs_1.switchMap)(isConnected => isConnected ? (0, rxjs_1.of)(isConnected) : (0, rxjs_1.from)(this.connect()).pipe((0, rxjs_1.map)(() => { return true; }), (0, rxjs_1.catchError)(err => {
            err.msg = err.message,
                err.ml = 'MongoService';
            return (0, rxjs_1.throwError)(() => err);
        }))));
    }
    findUser(user) {
        return this.isDBConnected().pipe((0, rxjs_1.switchMap)(isConnected => isConnected ? this.dbInst.collection('auth-users-data').findOne({ userId: user.userId }) : rxjs_1.EMPTY), (0, rxjs_1.catchError)(err => { return (0, rxjs_1.throwError)(() => new Error(err)); }));
    }
    findAllUsers() {
        return this.isDBConnected().pipe((0, rxjs_1.switchMap)(isConnected => isConnected ? this.dbInst.collection('auth-users-data').find().toArray() : rxjs_1.EMPTY), (0, rxjs_1.catchError)(err => { return (0, rxjs_1.throwError)(() => new Error(err)); }));
    }
    deleteUser(userId) {
        return this.isDBConnected().pipe((0, rxjs_1.switchMap)(isConnected => isConnected ? this.dbInst.collection('auth-users-data').deleteOne({ userId: userId }) : rxjs_1.EMPTY), (0, rxjs_1.catchError)(err => { return (0, rxjs_1.throwError)(() => new Error(err)); }));
    }
    addUser(newUser) {
        return (0, rxjs_1.from)(this.dbInst.collection('auth-users-data').insertOne(newUser));
    }
    updateUser(newUser) {
        let dataWitoutId = { ...newUser };
        delete dataWitoutId._id;
        return (0, rxjs_1.from)(this.dbInst.collection('auth-users-data').updateOne({ _id: new mongodb_1.ObjectId(newUser._id) }, { $set: { ...dataWitoutId } }))
            .pipe((0, rxjs_1.catchError)(err => {
            localLogger.error({ fn: 'updateUser', msg: err.message, user: JSON.stringify(dataWitoutId) });
            err.msg = err.message,
                err.ml = 'MongoService';
            return (0, rxjs_1.throwError)(() => err);
        }));
    }
    resetPassword(id, token, password) {
        return (0, rxjs_1.from)(this.dbInst.collection('auth-users-data').findOneAndUpdate({ _id: new mongodb_1.ObjectId(id), passwordToken: token }, { $set: { password: password } }));
    }
    setResetPasswordToken(email, passwordToken) {
        return (0, rxjs_1.from)(this.dbInst.collection('auth-users-data').findOneAndUpdate({ email: email }, { $set: { passwordToken: passwordToken } }, { returnDocument: 'after' }));
    }
    checkUserIdUnique(newUserID) {
        return (0, rxjs_1.from)(this.dbInst.collection('auth-users-data').find({ userId: newUserID }).toArray())
            .pipe((0, rxjs_1.map)(res => { return res.length > 0; }));
    }
    checkEmailUnique(newEmail) {
        return (0, rxjs_1.from)(this.dbInst.collection('auth-users-data').find({ email: newEmail }).toArray())
            .pipe((0, rxjs_1.map)(res => { return res.length > 0; }));
    }
    confirmEmail(data) {
        return (0, rxjs_1.from)(this.dbInst.collection('auth-users-data').updateOne({ _id: new mongodb_1.ObjectId(data.id), token: data.token }, { $set: { emailConfirmed: true } }));
    }
}
exports.mongoDBClient = mongoDBClient;
