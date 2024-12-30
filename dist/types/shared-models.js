"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeOptions = exports.AcRoles = void 0;
exports.AcRoles = ['user'];
exports.serializeOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 30,
    path: '/'
};
