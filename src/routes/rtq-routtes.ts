import {Router} from 'express'
import { verifyJWT } from '../auth/jwt-module'
export const router = Router()
router.get('/',verifyJWT,((req,res)=>{
  res.send({data:'You will get quotes soon!'})
}))