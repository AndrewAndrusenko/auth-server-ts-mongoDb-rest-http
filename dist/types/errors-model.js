"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SERVER_ERRORS = void 0;
;
exports.SERVER_ERRORS = new Map([
    ['AUTHENTICATION_FAILED', {
            code: 401,
            messageToUI: 'Your session is not authenticated.\n You have to Log In again',
            retryConnection: true
        }],
    ['ACCESS_FORBIDEN', {
            code: 403,
            messageToUI: 'Access is forbidden',
            retryConnection: true
        }],
    ['INTERNAL_ERROR', {
            code: 500,
            messageToUI: 'Server is unavailable',
            retryConnection: true
        }],
    ['JWT_EXPIRED', {
            code: 511,
            messageToUI: 'Token jwt is expired',
            retryConnection: true,
            authErr: true
        }],
    ['CLOSE_USER_CONNECTION', {
            code: 4001,
            messageToUI: 'Request to close the connection',
            retryConnection: true,
            authErr: true
        }]
]);
