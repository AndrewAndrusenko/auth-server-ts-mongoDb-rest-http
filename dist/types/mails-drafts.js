"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mailDrafts = void 0;
exports.mailDrafts = {
    'emailConfirmationMail': {
        subject: '3A platform: Please confirm your email address',
        text: `
    Welcome to 3A platform!

    Please confirm your email address by the below link\n`,
        text2: `
      
    Kind Regards!
    Your 3A Team`,
    },
    'PasswordRestMail': {
        subject: '3A platform: Reset your password',
        text: `
    Welcome to 3A platform!

    Upon your request we generated a personal link to reset your password.
    Please use the below link and follow instructions\n`,
        text2: `
      
    Kind Regards!
    Your 3A Team`,
    }
};
