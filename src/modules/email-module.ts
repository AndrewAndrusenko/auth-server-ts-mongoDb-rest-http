import NodeMailer, { SentMessageInfo } from 'nodemailer'
import { MailOptions } from 'nodemailer/lib/sendmail-transport';
import { from, Observable } from 'rxjs';
import {  mailDrafts, TMailTypes } from '../types/mails-drafts';
import { ENVIRONMENT } from '../environment/environment';
export interface IMailOptions {
  to:string,
  subject:string,
  text:string,
  html:string
}
export interface IConfirmEmailParams {
  emailUser:string,
  confirmLink:string,
  type:TMailTypes
}
export class EmailHandler {
 private transport
 constructor() {
    this.transport=NodeMailer.createTransport({
      service: 'Yandex',
      auth: {
        user: ENVIRONMENT.MAILING.login,
        pass: ENVIRONMENT.MAILING.password
      },
    });
  }
  sendMessage (mailData:IConfirmEmailParams):Observable<SentMessageInfo> {
    let mailOptions:MailOptions = {
      from:ENVIRONMENT.MAILING.emailAdress,
      to:mailData.emailUser,
      subject:mailDrafts[mailData.type].subject,
      text:mailDrafts[mailData.type].text+mailData.confirmLink+mailDrafts[mailData.type].text2,
      html:''
    }
    return from(this.transport.sendMail(mailOptions))
  }
}

