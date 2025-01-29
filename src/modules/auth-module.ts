import { ObjectId } from "mongodb";
import { catchError, EMPTY, from, of, switchMap, throwError } from "rxjs";
import { hashUserPassword, verifyUserPassword } from "./auth-hash-module";
import { jwtSet, saveRefreshToStore,deleteRefreshToken } from "./jwt-module";
import { serialize } from "cookie";
import { IUser, serializeOptions, serializeOptionsShared } from "../types/shared-models";
import { mongoDBClient } from "./mongodb-module";
import { NextFunction, Request, Response } from "express"
import { loggerPino } from "./logger-module";
import { basename} from "path"
const localLogger= loggerPino.child({ml:basename(__filename)});
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
    res.send(jwtInfoToken);
    localLogger.info({fn:'logInUser',msg:'success',user:userFromUI.userId})
  })
}
export function logOutUser (req:Request, res:Response, next:NextFunction) {
  res.clearCookie('A3_AccessToken', { httpOnly: true });
  res.clearCookie('A3_RefreshToken', { httpOnly: true });
  res.clearCookie ('A3_AccessToken_Shared', {domain:serializeOptionsShared.domain});
  deleteRefreshToken(req,res)  
  .pipe(catchError(err=>{
      res.status(500).send(err);
      return EMPTY;
    }))
  .subscribe(data=>{
    res.send({userId:req.body.userId, logout:data.deleted});
    localLogger.info({fn:'logOutUser',msg:'success',user:req.body.userId})
  })
}
export function signUpNewUser (req:Request, res:Response, next:NextFunction) {
  let newUser = req.body as IUser;
 return from(mongoClient.isDBConnected())
 .pipe( 
    switchMap(()=>hashUserPassword(newUser.password)),
    switchMap((hashPassword)=>mongoClient.addUser({...newUser,password:hashPassword})),
    catchError(err=>{
      res.status(500).send(err);
      localLogger.error({fn:'signUpNewUser',msg:err.message});
      return EMPTY
    }))
  .subscribe(data=>{
    res.send(data);
    localLogger.info({fn:'signUpNewUser',msg:'success',user:newUser.userId})
  })
}
export function updateUserData (req:Request, res:Response, next:NextFunction) {
  let newUser = req.body as IUser;
  from(mongoClient.isDBConnected()).pipe( 
    switchMap(()=>mongoClient.updateUser(newUser)),
    catchError(e=>{
      res.status(500).send(e);
      return EMPTY
    })
  ).subscribe(data=>{
    res.send(data);
    localLogger.info({fn:'updateUserData',msg:JSON.stringify(newUser),user:newUser.userId})
  })
}
export function findAllUserData (req:Request, res:Response, next:NextFunction) {
  from(mongoClient.isDBConnected()).pipe( 
    switchMap(()=>mongoClient.findAllUsers()),
    catchError(e=>{
      res.status(500).send(e);
      return EMPTY
    })
  ).subscribe(data=>res.send(data))
}
export function deleteUser (req:Request, res:Response, next:NextFunction) {
  from(mongoClient.isDBConnected()).pipe( 
    switchMap(()=>mongoClient.deleteUser(req.body.userId)),
    catchError(e=>{
      res.status(500).send(e);
      return EMPTY
    })
  ).subscribe(data=>{
    res.send(data)
    localLogger.info({fn:'deleteUser',msg:data?.deletedCount? 'success':'fail',user:req.body.userId})
  })
}

export function setResetPasswordToken (req:Request, res:Response, next:NextFunction) {
  let data = req.body as {email:string,passwordToken:string};
  from(mongoClient.isDBConnected()).pipe( 
    switchMap(()=>mongoClient.setResetPasswordToken(data.email,data.passwordToken)),
    catchError(err=>{
      res.status(500).send(err);
      return EMPTY
    })
  ).subscribe(data=>{
    res.send(data)
    localLogger.info({fn:'setResetPasswordToken',msg:req.body.data?.passwordToken,user:data?.email})
  })
}
export function setNewPassword (req:Request, res:Response, next:NextFunction) {
  let data = req.body as {id:string, token:string, password:string};
  from(mongoClient.isDBConnected())
  .pipe( 
    switchMap(()=>hashUserPassword(data.password)),
    switchMap(hashedPassword=>mongoClient.resetPassword(data.id,data.token, hashedPassword)),
    catchError(err=>{
      res.status(500).send(err);
      return EMPTY
    })
  ).subscribe(data=>{
    res.send(data)
    localLogger.info({fn:'setNewPassword',msg: data? 'success':`failed for token ${req.body.token}`,user:req.body.id})
  })
}
export function confirmEmailAddress (req:Request, res:Response, next:NextFunction) {
  from(mongoClient.isDBConnected()).pipe( 
    switchMap(()=>mongoClient.confirmEmail(req.body)),
    switchMap(updateResult=>of(updateResult.modifiedCount!==0||updateResult.matchedCount!==0)),
    catchError(err=>{
      res.status(500).send(err);
      localLogger.error({fn:'confirmEmailAddress',user:req.url,msg:err.message})
      return EMPTY;
    })
  ).subscribe(data=>{
    res.send(data)
    localLogger.info({fn:'confirmEmailAddress',msg:data? 'success':'fail',user:req.body.data.id})
  })
}
//VALIDATORS
export function checkEmailUnique (req:Request, res:Response, next:NextFunction) {
  from(mongoClient.isDBConnected()).pipe( 
    switchMap(()=>mongoClient.checkEmailUnique((req.query as {email:string}).email)),
    catchError(err=>{
      res.status(500).send(err);
      localLogger.error({fn:'checkEmailUnique',msg:err.message,user:(req.query as {userId:string}).userId});
      return EMPTY
    })
  ).subscribe(data=>res.send(data))
}
export function checkUserIdUnique (req:Request, res:Response, next:NextFunction) {
  from(mongoClient.isDBConnected()).pipe( 
    switchMap(()=>mongoClient.checkUserIdUnique((req.query as {userId:string}).userId)),
    catchError(err=>{
      res.status(500).send(err);
      localLogger.error({fn:'checkUserIdUnique',msg:err.message,user:(req.query as {userId:string}).userId});
      return EMPTY
    })
  ).subscribe(data=>res.send(data))
}
//UTILS
export function mongoClientClose (req:Request, res:Response, next:NextFunction) {
  from(mongoClient.close()).subscribe(()=>res.send('MongoDB connection is closed'))
}