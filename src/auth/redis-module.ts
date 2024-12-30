import { createClient, RedisClientType } from "redis";
import { catchError, EMPTY, from, Observable, of,switchMap,tap } from "rxjs";
import { IJWTInfoToken } from "../types/shared-models";
interface IRefreshDelete {
  userId:string
  deleted:number,
}
export class redisClientAuth {
  private client:RedisClientType|null;
  constructor() {
    this.client = null
  }
  init ():Observable<boolean> {
    return from(createClient().connect()).pipe(
      tap(newClient => this.client = newClient as RedisClientType),
      switchMap(()=>of(true)),
      catchError(e=>{
        return of(false);
      })
    )
  }
  saveRefresh (data:IJWTInfoToken):Observable<IJWTInfoToken>  {
    return from(this.client?.set(data.jwtInfo.userId,JSON.stringify(data)) as Promise<string|null>).pipe(
      tap(res=>console.log('User:',data.jwtInfo.userId,'| Refresh token has been saved?', res)),
      switchMap(()=>of(data)),
      catchError (e=>{
        console.log('\x1b[31merror_saveRefresh', e,'\x1b[0m' )
        return EMPTY;
      })
    )
  }
  getRefreshTocken (userId:string):Observable<IJWTInfoToken> {
    return this.client? from(this.client?.get(userId)).pipe(switchMap(res=>of(JSON.parse(res as string)))):EMPTY;
  }
  removeRefreshTocken (userId:string):Observable<IRefreshDelete> {
    return this.client? from(this.client.del(userId)).pipe(
      switchMap(res=>of({userId:userId,deleted:res}))):EMPTY
  }
}
