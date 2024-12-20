import * as express from "express";
import { EmailHandler, IConfirmEmailParams} from "../mail/email-module";
import { catchError, EMPTY, first, from } from "rxjs";

export const router = express.Router()
const mailService = new EmailHandler();
router.post('/send', ((req,res,next)=>{
  let mailOption = req.body as IConfirmEmailParams
  from(mailService.sendMessage(mailOption)).pipe(
    catchError(e=>{
      console.log('sendMessage error',e);
      res.status(400).send({errorResponse:  {message: (e as Error).message,name:(e as Error).name}});
      return EMPTY
    })
  ).subscribe(data=>res.send(data))
}))
