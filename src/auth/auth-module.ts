import bcrypt from 'bcrypt'
import { from, Observable, switchMap } from 'rxjs'

export function hashUserPassword (password:string):Observable<string> {
  return from(bcrypt.genSalt()).pipe(
    switchMap(salt=>bcrypt.hash(password,salt))
  )
}
export function verifyUserPassword (password:string,hashedPassword:string):Observable<boolean> {
  return from(bcrypt.compare(password,hashedPassword))
}