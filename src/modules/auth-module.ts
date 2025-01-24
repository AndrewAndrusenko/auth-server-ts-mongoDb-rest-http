import { InsertOneResult, ObjectId } from "mongodb";
import { catchError, EMPTY, from, Observable, of, switchMap, tap, throwError } from "rxjs";
import { hashUserPassword, verifyUserPassword } from "./auth-hash-module";
import { jwtSet, saveRefreshToStore,deleteRefreshToken } from "./jwt-module";
import { serialize } from "cookie";
import { IRefreshDelete, IUser, serializeOptions, serializeOptionsShared } from "../types/shared-models";
import { mongoDBClient } from "./mongodb-module";
import { NextFunction, Request, Response } from "express"
import { loggerPino } from "./logger-module";
import * as path from "path"
const localLogger= loggerPino.child({ml:path.basename(__filename)});
const mongoClient = new mongoDBClient();

export function logInUser (req:Request, res:Response, next:NextFunction) {
  localLogger.debug(`mongoClient.isOpened ${mongoClient.isOpened} `)
  let userFromUI = req.body as IUser;
  from(mongoClient.isDBConnected()).pipe( 
    switchMap(()=>mongoClient.findUser(userFromUI)),
    switchMap(user=>user===null? throwError(()=>new Error('Incorrect userId')) : of(user)),
    switchMap(user=>user?.emailConfirmed===true? of(user) : 
      throwError(()=>{
        let emailErr = new Error('Email address has not been confirmed')
        emailErr.stack=JSON.stringify(user)
        emailErr.name='email';
        return emailErr;
      })
    ),
    switchMap(user=>verifyUserPassword (userFromUI.password,user)),
    switchMap(userPassword=>userPassword.passwordConfirmed? of(userPassword.userData) : throwError(()=>new Error('Incorrect password')) ),
    switchMap(user=>jwtSet({_id:user._id as ObjectId , userId:user.userId, role:user.role})),
    switchMap(jwtInfoToken=>saveRefreshToStore({...jwtInfoToken,timeSaved:new Date().toLocaleString()})),
    catchError(e=>{
      localLogger.error({fn:'logInUser',user:userFromUI.userId,msg:(e as Error).message,err_name:(e as Error).name})
      res.send({errorResponse:  {message: (e as Error).message,name:(e as Error).name,stack:(e as Error)?.stack}});
      return EMPTY;
    })
  ).subscribe(jwtInfoToken=>{
    const accessToken = serialize('A3_AccessToken', jwtInfoToken.jwt,serializeOptions);
    const accessTokenConsumer = serialize('A3_AccessToken_Shared', jwtInfoToken.jwt,serializeOptionsShared);
    const refreshToken = serialize('A3_RefreshToken', jwtInfoToken.refreshToken,serializeOptions);
    res.setHeader('Set-Cookie',[accessToken,refreshToken,accessTokenConsumer]);
    res.send(jwtInfoToken)
  })
}
export function logOutUser (req:Request, res:Response, next:NextFunction):Observable<IRefreshDelete> {
  res.clearCookie('A3_AccessToken', { httpOnly: true });
  res.clearCookie('A3_RefreshToken', { httpOnly: true });
  res.clearCookie ('A3_AccessToken_Shared', {domain:serializeOptionsShared.domain});
  return deleteRefreshToken(req,res)
}
export function signUpNewUser (req:Request, res:Response, next:NextFunction):Observable<InsertOneResult<IUser>> {
  let newUser = req.body as IUser;
 return from(mongoClient.isDBConnected()).pipe( 
    switchMap(()=>hashUserPassword(newUser.password)),
    switchMap((hashPassword)=>mongoClient.addUser({...newUser,password:hashPassword})),
    catchError(err=>{
      localLogger.error({fn:'signUpNewUser',msg:err.message});
      return throwError(()=>err)
    })
  )
}
export function updateUserData (req:Request, res:Response, next:NextFunction) {
  let newUser = req.body as IUser;
  from(mongoClient.isDBConnected()).pipe( 
    switchMap(()=>mongoClient.updateUser(newUser)),
    catchError(e=>{
      res.send(e);
      return EMPTY
    })
  ).subscribe(data=>res.send(data))
}
export function setResetPasswordToken (req:Request, res:Response, next:NextFunction) {
  let data = req.body as {email:string,passwordToken:string};
  from(mongoClient.isDBConnected()).pipe( 
    switchMap(()=>mongoClient.setResetPasswordToken(data.email,data.passwordToken)),
    catchError(e=>{
      res.send(e);
      return EMPTY
    })
  ).subscribe(data=>res.send(data))
}
export function setNewPassword (req:Request, res:Response, next:NextFunction) {
  let data = req.body as {id:string, token:string, password:string};
  from(mongoClient.isDBConnected())
  .pipe( 
    switchMap(()=>hashUserPassword(data.password)),
    switchMap(hashedPassword=>mongoClient.resetPassword(data.id,data.token, hashedPassword)),
    catchError(e=>{
      res.send(e);
      return EMPTY
    })
  ).subscribe(data=>res.send(data))
}
export function confirmEmailAddress (req:Request, res:Response, next:NextFunction) {
  from(mongoClient.isDBConnected()).pipe( 
    switchMap(()=>mongoClient.confirmEmail(req.body)),
    switchMap(updateResult=>of(updateResult.modifiedCount!==0||updateResult.matchedCount!==0)),
    catchError(err=>{
      localLogger.error({fn:'confirmEmailAddress',user:req.url,msg:err.message})
      res.status(500).send(err);
      return EMPTY;
    })
  ).subscribe(data=>res.send(data))
}
//VALIDATORS
export function checkEmailUnique (req:Request, res:Response, next:NextFunction) {
  from(mongoClient.isDBConnected()).pipe( 
    switchMap(()=>mongoClient.checkEmailUnique((req.query as {email:string}).email))
  ).subscribe(data=>res.send(data))
}
export function checkUserIdUnique (req:Request, res:Response, next:NextFunction) {
  from(mongoClient.isDBConnected()).pipe( 
    switchMap(()=>mongoClient.checkUserIdUnique((req.query as {userId:string}).userId))
  ).subscribe(data=>res.send(data))
}
//UTILS
export function mongoClientClose (req:Request, res:Response, next:NextFunction) {
  from(mongoClient.close()).subscribe(()=>res.send('MongoDB connection is closed'))
}