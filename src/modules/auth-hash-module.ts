import { genSalt,hash,compare } from 'bcrypt'
import { catchError, from, map, Observable, switchMap, tap, throwError } from 'rxjs'
import { IUser } from '../types/shared-models'
import { loggerPino } from './logger-module'
import * as path from 'path'
const localLogger = loggerPino.child({ml:path.basename(__filename)});
export function hashUserPassword (password:string):Observable<string> {
  return from(genSalt()).pipe(
    switchMap(salt=>hash(password,salt)),
    catchError(err=>{
      localLogger.error({fn:'hashUserPassword',msg:err.message})
      err.msg = err.message, 
      err.ml = 'PasswordService'
      return throwError(()=>err)
    })
  )
}

export function verifyUserPassword (passwordFromUser:string,userData:IUser):Observable<{passwordConfirmed:boolean,userData:IUser}> {
  return from(compare(passwordFromUser,userData.password)).pipe(
    map(confirmed=>{return {passwordConfirmed:confirmed,userData:userData}}),
    catchError(err=>{
      localLogger.error({fn:'verifyUserPassword',msg:err.message})
      return throwError(()=>err)
    })
  )
}