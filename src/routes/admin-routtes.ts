import { Router} from 'express'
import { deleteRefreshToken, getAllRefreshToStore, verifyAccess } from '../modules/jwt-module'
import { catchError, EMPTY } from 'rxjs'
export const router = Router()

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
  .subscribe(data=>data.deleted? res.send(data): res.status(500).send({msg:'Token has not been deleted', ml:'JWT'}))
})