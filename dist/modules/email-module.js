"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailHandler = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const rxjs_1 = require("rxjs");
const mails_drafts_1 = require("../types/mails-drafts");
const environment_1 = require("../environment/environment");
const logger_module_1 = require("./logger-module");
const path_1 = require("path");
const localLogger = logger_module_1.loggerPino.child({ ml: (0, path_1.basename)(__filename) });
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
        let mailOptions = {
            from: environment_1.ENVIRONMENT.MAILING.emailAdress,
            to: mailData.emailUser,
            subject: mails_drafts_1.mailDrafts[mailData.type].subject,
            text: mails_drafts_1.mailDrafts[mailData.type].text + mailData.confirmLink + mails_drafts_1.mailDrafts[mailData.type].text2,
            html: ''
        };
        return (0, rxjs_1.from)(this.transport.sendMail(mailOptions)).pipe((0, rxjs_1.catchError)(err => {
            localLogger.error({ fn: 'sendMessage', msg: err.message, user: mailData.confirmLink });
            return (0, rxjs_1.throwError)(() => err);
        }));
    }
}
exports.EmailHandler = EmailHandler;
