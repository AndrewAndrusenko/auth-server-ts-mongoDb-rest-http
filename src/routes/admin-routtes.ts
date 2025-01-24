import { Router} from 'express'
import { deleteRefreshToken, getAllRefreshToStore, verifyAccess } from '../modules/jwt-module'
import { catchError, EMPTY } from 'rxjs'
import { CustomLogger, loggerPino } from '../modules/logger-module'
import * as path from "path"
export const router = Router()
const  localLogger:CustomLogger = loggerPino.child({ml:path.basename(__filename)})

router.get('/getAllTokens',verifyAccess, (req, res) => {
  getAllRefreshToStore(req,res)
  .pipe(catchError(e=>{
    res.status(500).send({msg:e.message,ml:e.module});
    return EMPTY;
  }))
  .subscribe(data=>res.send(data))
})
router.post('/delToken',verifyAccess, (req, res) => {
  deleteRefreshToken(req,res)
  .pipe(catchError(e=>{
    res.status(500).send({msg:e.message,ml:e.module});
    return EMPTY;
  }))
  .subscribe(data=>{
    if (data.deleted) {
      res.send(data)
    } else {
      localLogger.error({fn:'/delToken',user: req.body.userId, msg:'Token has not been deleted'})
      res.status(500).send({msg:'Token has not been deleted', ml:'JWT'})
    }
  })
})