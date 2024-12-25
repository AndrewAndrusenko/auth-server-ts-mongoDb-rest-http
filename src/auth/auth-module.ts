import bcrypt from 'bcrypt'
import { from, map, Observable, switchMap } from 'rxjs'
import { IUser } from '../types/shared-models'

export function hashUserPassword (password:string):Observable<string> {
  return from(bcrypt.genSalt()).pipe(
    switchMap(salt=>bcrypt.hash(password,salt))
  )
}
export function verifyUserPassword (passwordFromUser:string,userData:IUser):Observable<{passwordConfirmed:boolean,userData:IUser}> {
  return from(bcrypt.compare(passwordFromUser,userData.password)).pipe(
    map(confirmed=>{return {passwordConfirmed:confirmed,userData:userData}})
  )
}