import * as express from "express";
import { EmailHandler, IConfirmEmailParams} from "../modules/email-module";
import { catchError, EMPTY, first, from } from "rxjs";

export const router = express.Router()
const mailService = new EmailHandler();
router.post('/send', ((req,res,next)=>{
  let mailOption = req.body as IConfirmEmailParams
  from(mailService.sendMessage(mailOption)).pipe(
    catchError(e=>{
      console.log('sendMessage error',e);
      res.status(500).send({msg: (e as Error).message,name:(e as Error).name, ml:'MailService'});
      return EMPTY
    })
  ).subscribe(data=>res.send(data))
}))
