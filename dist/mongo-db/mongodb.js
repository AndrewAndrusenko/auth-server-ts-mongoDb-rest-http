"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mongoDBClient = void 0;
const mongodb_1 = require("mongodb");
const rxjs_1 = require("rxjs");
const environment_1 = require("../environment/environment");
class mongoDBClient extends mongodb_1.MongoClient {
    constructor() {
        super(environment_1.ENVIRONMENT.MONGO_DB_CONFIG.mongoUrl);
        this.dbInst = new mongodb_1.Db(this, environment_1.ENVIRONMENT.MONGO_DB_CONFIG.mongdDBName);
    }
    checkConnectionStatus() {
        return (0, rxjs_1.from)(this.dbInst.admin().ping()).pipe((0, rxjs_1.catchError)(() => {
            return (0, rxjs_1.from)(this.connect()).pipe((0, rxjs_1.tap)(() => console.log('new connection')), (0, rxjs_1.map)(() => { return { ok: 1 }; }));
        }), (0, rxjs_1.map)(() => { return { ok: 1 }; }));
    }
    findUser(user) {
        return (0, rxjs_1.from)(this.dbInst.collection('auth-users-data').findOne({ userId: user.userId }));
    }
    addUser(newUser) {
        return (0, rxjs_1.from)(this.dbInst.collection('auth-users-data').insertOne(newUser));
    }
    updateUser(newUser) {
        let dataWitoutId = { ...newUser };
        delete dataWitoutId._id;
        return (0, rxjs_1.from)(this.dbInst.collection('auth-users-data').updateOne({ _id: new mongodb_1.ObjectId(newUser._id) }, { $set: { ...dataWitoutId } }));
    }
    getUsers() {
        return (0, rxjs_1.from)(this.dbInst.collection('auth-users-data').find({}).toArray());
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
