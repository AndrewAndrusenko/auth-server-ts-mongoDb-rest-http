import { ObjectId } from "mongodb";
import { catchError, EMPTY, from, of, switchMap, throwError } from "rxjs";
import { verifyUserPassword } from "./auth-hash-module";
import { jwtSet, saveRefreshToStore } from "./jwt-module";
import { serialize } from "cookie";
import { IUser, serializeOptions } from "../types/shared-models";
import { mongoDBClient } from "../mongo-db/mongodb";
import { NextFunction, Request, Response } from "express"

const mongoClient = new mongoDBClient();
initTemp()
function initTemp() {
  console.log('mongoClient.isOpened',mongoClient.isOpened )
}
export function logInUser (req:Request, res:Response, next:NextFunction) {
  console.log('mongoClient.isOpened',mongoClient.isOpened )
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
    switchMap(jwtInfoToken=>saveRefreshToStore(jwtInfoToken)),
    catchError(e=>{
      console.log('\x1b[31merror_logInUser', e.message,'\x1b[0m' )
      res.send({errorResponse:  {message: (e as Error).message,name:(e as Error).name,stack:(e as Error)?.stack}});
      return EMPTY;
    })
  ).subscribe(jwtInfoToken=>{
    const accessToken = serialize('A3_AccessToken', jwtInfoToken.jwt,serializeOptions);
    const refreshToken = serialize('A3_RefreshToken', jwtInfoToken.refreshToken,serializeOptions);
    res.setHeader('Set-Cookie',[accessToken,refreshToken]);
    res.send(jwtInfoToken)
  })
}
export function logOutUser (req:Request, res:Response, next:NextFunction) {
  res.clearCookie('A3_AccessToken', { httpOnly: true });
  res.clearCookie('A3_RefreshToken', { httpOnly: true });
  res.send({userId:(req.body as IUser).userId,logout:true})
}