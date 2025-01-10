"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeOptionsShared = exports.serializeOptions = exports.ACESS_ROLES = void 0;
exports.ACESS_ROLES = ['user', 'admin'];
exports.serializeOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 30,
    path: '/'
};
exports.serializeOptionsShared = {
    // httpOnly:true,
    secure: true,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
    domain: 'euw.devtunnels.ms'
};
