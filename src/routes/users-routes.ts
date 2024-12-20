import * as express from "express";
import {switchMap,from, catchError, EMPTY, of, throwError, tap } from 'rxjs';
import {hashUserPassword,verifyUserPassword } from "../auth/auth-module";
import {mongoDBClient}  from '../mongo-db/mongodb';
import {EmailHandler} from '../mail/email-module'
import { IUser } from "../types/shared-models";

export const router = express.Router();
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
  let userFromUI = req.body as IUser;
  from(mongoClient.checkConnectionStatus()).pipe( 
    switchMap(()=>mongoClient.findUser(userFromUI)),
    switchMap((userDB)=>userDB===null? throwError(()=>new Error('Incorrect userId')) : of(userDB)),
    switchMap((userDB)=>userDB?.emailConfirmed===true? of(userDB) : throwError(()=>{
      let emailErr = new Error('Email address has not been confirmed')
      emailErr.stack=JSON.stringify(userDB)
      emailErr.name='email';
      return emailErr;
      })) ,
    switchMap((userDB)=>verifyUserPassword (userFromUI.password,userDB.password)),
    switchMap((passwordOk)=>passwordOk? of(passwordOk) : throwError(()=>new Error('Incorrect password')) ),
    catchError(e=>{
      console.log('e',e);
      res.send({errorResponse:  {message: (e as Error).message,name:(e as Error).name,stack:(e as Error)?.stack}});
      return EMPTY;
    })
  ).subscribe(data=>res.send(data))
});

/*Confirm user email*/
router.post('/email/confirm', async function(req, res, next) {
  console.log('Confirm user emai',req.body);
  from(mongoClient.checkConnectionStatus()).pipe( 
    switchMap(()=>mongoClient.confirmEmail(req.body)),
    tap(r=>console.log('r00',r)),
    switchMap(updateResult=>of(updateResult.modifiedCount!==0||updateResult.matchedCount!==0)),
    catchError(e=>{
      console.log('Error route:', req.url);
      console.log(e);
      res.send(false);
      return EMPTY;
    })
  ).subscribe(data=>res.send(data))
});
/* Close connection to MongoDB */
router.get('/close', async function(req, res, next) {
  from(mongoClient.close()).subscribe(()=>res.send('MongoDB connection is closed'))
});
