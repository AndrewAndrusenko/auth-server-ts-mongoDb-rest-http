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
exports.jwtSet = jwtSet;
exports.verifyJWT = verifyJWT;
const environment_1 = require("../environment/environment");
const jwt = __importStar(require("jsonwebtoken"));
const rxjs_1 = require("rxjs");
const shared_models_1 = require("../types/shared-models");
function jwtSet(jwtInfo) {
    return (0, rxjs_1.of)(jwt.sign(jwtInfo, environment_1.ENVIRONMENT.JWT.JWT_SECRET, environment_1.ENVIRONMENT.JWT.JWT_SETTINGS));
}
function verifyJWT(req, res, next) {
    const jwtToken = req.headers.authorization?.substring('Bearer '.length) || '';
    console.log(jwtToken);
    try {
        const jwtInfo = jwt.verify(jwtToken, environment_1.ENVIRONMENT.JWT.JWT_SECRET);
        if (jwtInfo.iss === environment_1.ENVIRONMENT.JWT.JWT_SETTINGS.issuer && jwtInfo.exp < Date.now() && shared_models_1.AcRoles.includes(jwtInfo.role)) {
            next();
            return;
        }
        else {
            res.sendStatus(401);
        }
    }
    catch (error) {
        res.sendStatus(401);
    }
}
