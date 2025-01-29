"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ACCESS_ROUTES_ROLES = void 0;
exports.ACCESS_ROUTES_ROLES = [
    { route: '/quote', roles: ['user', 'admin'] },
    { route: '/admin', roles: ['admin'] },
    { route: '/admin/getAllTokens', roles: ['admin'] },
    { route: '/admin/delToken', roles: ['admin'] },
    { route: '/admin/all', roles: ['admin'] },
    { route: '/admin/user-del', roles: ['admin'] },
];
