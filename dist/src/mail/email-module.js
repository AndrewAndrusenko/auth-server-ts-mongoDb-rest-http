"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailHandler = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const rxjs_1 = require("rxjs");
const environment_1 = require("../environment/environment");
const mails_drafts_1 = require("./mails-drafts");
class EmailHandler {
    constructor() {
        this.transport = nodemailer_1.default.createTransport({
            service: 'Yandex',
            auth: {
                user: environment_1.ENVIRONMENT.MAILING.login,
                pass: environment_1.ENVIRONMENT.MAILING.password
            },
        });
    }
    sendMessage(mailData) {
        console.log(mailData);
        let mailOptions = {
            from: environment_1.ENVIRONMENT.MAILING.emailAdress,
            to: mailData.emailUser,
            subject: mails_drafts_1.emailConfirmationMail.subject,
            text: mails_drafts_1.emailConfirmationMail.text + ' - ' + mailData.confirmLink + mails_drafts_1.emailConfirmationMail.text2,
            html: ''
        };
        return (0, rxjs_1.from)(this.transport.sendMail(mailOptions));
    }
}
exports.EmailHandler = EmailHandler;
