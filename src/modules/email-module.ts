import NodeMailer, { SentMessageInfo } from 'nodemailer'
import { MailOptions } from 'nodemailer/lib/sendmail-transport';
import { from, Observable } from 'rxjs';
import { emailConfirmationMail } from '../types/mails-drafts';
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
      subject:emailConfirmationMail.subject,
      text:emailConfirmationMail.text+' - '+mailData.confirmLink+emailConfirmationMail.text2,
      html:''
    }
    return from(this.transport.sendMail(mailOptions))
  }
}

