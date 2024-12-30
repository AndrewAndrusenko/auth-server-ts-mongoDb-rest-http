import { genSalt,hash,compare } from 'bcrypt'
import { from, map, Observable, switchMap } from 'rxjs'
import { IUser } from '../types/shared-models'

export function hashUserPassword (password:string):Observable<string> {
  return from(genSalt()).pipe(switchMap(salt=>hash(password,salt)))
}

export function verifyUserPassword (passwordFromUser:string,userData:IUser):Observable<{passwordConfirmed:boolean,userData:IUser}> {
  return from(compare(passwordFromUser,userData.password)).pipe(
    map(confirmed=>{return {passwordConfirmed:confirmed,userData:userData}})
  )
}