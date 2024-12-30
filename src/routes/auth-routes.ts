import {Router} from "express";
import {switchMap,from, catchError, EMPTY, of, tap } from 'rxjs';
import {hashUserPassword } from "../auth/auth-hash-module";
import {mongoDBClient}  from '../mongo-db/mongodb';
import {EmailHandler} from '../mail/email-module'
import { IUser } from "../types/shared-models";
import { SerializeOptions } from "cookie";
import { logInUser, logOutUser } from "../auth/auth-logging";
import { removeUser } from "../auth/jwt-module";
const serializeOptions:SerializeOptions = {
  httpOnly:true,
  secure:true,
  sameSite:'strict',
  maxAge:60*60*24*30,
  path:'/'
}
export const router = Router();
const mongoClient = new mongoDBClient();
const emailHandler = new EmailHandler();
/* GET users listing. */
router.get('/', async function(req, res, next) {
  from(mongoClient.checkConnectionStatus()).pipe( 
      switchMap(()=>mongoClient.getUsers())
    ).subscribe(data=>res.send(data))
});
/* GET check if userId is unique. */
router.get('/checkId', async function(req, res, next) {
  from(mongoClient.checkConnectionStatus()).pipe( 
    switchMap(()=>mongoClient.checkUserIdUnique((req.query as {userId:string}).userId))
  ).subscribe(data=>res.send(data))
});
/* GET check if email is unique. */
router.get('/checkEmail', async function(req, res, next) {
  from(mongoClient.checkConnectionStatus()).pipe( 
    switchMap(()=>mongoClient.checkEmailUnique((req.query as {email:string}).email))
  ).subscribe(data=>res.send(data))
});
/* Insert new user data. */
router.post('/', async function(req, res, next) {
  let newUser = req.body as IUser;
  from(mongoClient.checkConnectionStatus()).pipe( 
    switchMap(()=>hashUserPassword(newUser.password)),
    switchMap((hashPassword)=>mongoClient.addUser({...newUser,password:hashPassword})),
    catchError(e=>{
      res.send(e);
      return EMPTY
    })
  ).subscribe(data=>res.send(data))
});
/* Update user data. */
router.post('/update', async function(req, res, next) {
  let newUser = req.body as IUser;
  from(mongoClient.checkConnectionStatus()).pipe( 
    switchMap(()=>mongoClient.updateUser(newUser)),
    catchError(e=>{
      res.send(e);
      return EMPTY
    })
  ).subscribe(data=>res.send(data))
});
/*Authenticate user data*/
router.post('/login', async function(req, res, next) {
  logInUser(req, res, next)
});
router.post('/logout', async function(req, res, next) {
  logOutUser(req, res, next)
});

/*Confirm user email*/
router.post('/email/confirm', async function(req, res, next) {
  console.log('Confirm user emai',req.body);
  from(mongoClient.checkConnectionStatus()).pipe( 
    switchMap(()=>mongoClient.confirmEmail(req.body)),
    tap(r=>console.log('r00',r)),
    switchMap(updateResult=>of(updateResult.modifiedCount!==0||updateResult.matchedCount!==0)),
    catchError(e=>{
      console.log('\x1b[31merror_email_confirm', e,'\x1b[0m' )
      console.log('\x1b[31mError route:', req.url,'\x1b[0m' )
      res.send(false);
      return EMPTY;
    })
  ).subscribe(data=>res.send(data))
});
/* Close connection to MongoDB */
router.get('/close', async function(req, res, next) {
  from(mongoClient.close()).subscribe(()=>res.send('MongoDB connection is closed'))
});
router.post('/rdsrm', async function(req, res, next) {
  removeUser (req, res, next)
});
