import {Router} from 'express'
import { verifyAccess } from '../modules/jwt-module'
export const router = Router()
router.get('/',verifyAccess,((req,res)=>{
  res.send({data:'You will get quotes soon!'})
}))
router.post('/new',verifyAccess,((req,res)=>{
  res.send({data:'You will get quotes soon!'})
}))