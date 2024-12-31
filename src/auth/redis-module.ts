import { createClient, RedisClientType } from "redis";
import { catchError, EMPTY, from, Observable, of,switchMap,tap } from "rxjs";
import { IJWTInfo, IJWTInfoToken } from "../types/shared-models";
interface IRefreshDelete {
  userId:string
  deleted:number,
}
export class redisClientAuth {
  private client:RedisClientType|null;
  public isOpen:boolean = false;
  constructor() {
    this.client = null
  }
  init ():Observable<boolean> {
    return from(createClient().connect()).pipe(
      tap(newClient => this.client = newClient as RedisClientType),
      tap(() => this.isOpen = this.client?.isOpen||false),
      tap(() => this.client?.on('error',(e)=>{
        this.client?.disconnect()
        console.log('\x1b[31mredis_server error: ', e.message,'\x1b[0m')
      })),
      switchMap(()=>of(true)),
      tap(res=>console.log('redis store has been connected?',res)),
      catchError(e=>{
        return of(false);
      })
    )
  }
  
  saveRefresh (data:IJWTInfoToken):Observable<IJWTInfoToken>  {
    return of(this.client?.isOpen).pipe(
      switchMap(isOpened=>isOpened? of(isOpened) : this.init()),
      tap(isOpened=>isOpened? null: console.log('\x1b[31merror', 'Redis server is unavailable','\x1b[0m' )),
      switchMap(isOpened=>isOpened? 
        from(this.client?.set((data.jwtInfo as IJWTInfo).userId,JSON.stringify(data)) as Promise<string|null>)
        : of( {refreshToken:'', jwt:'', jwtInfo:null }) ),
      tap(res=>(res as IJWTInfoToken).jwtInfo? console.log('User:',(data.jwtInfo as IJWTInfo).userId,'| Refresh token has been saved?', res):null),
      switchMap(()=>of(data)),
      catchError (e=>{
        console.log('\x1b[31merror_saveRefresh', e,'\x1b[0m' )
        return EMPTY;
      })
    )
  }
  
  getRefreshTocken (userId:string):Observable<IJWTInfoToken> {
    return of(this.client?.isOpen).pipe(
      switchMap(isOpened=>isOpened? of(isOpened) : this.init()),
      tap(isOpened=>isOpened? null: console.log('\x1b[31merror', 'Redis server is unavailable','\x1b[0m' )),
      switchMap(isOpened=>isOpened? 
        from(this.client?.get(userId) as Promise<string|null>).pipe(switchMap(res=>of(JSON.parse(res as string)))) 
        : of( {refreshToken:'', jwt:'', jwtInfo:null }) 
      )
    )

  }
  removeRefreshTocken (userId:string):Observable<IRefreshDelete> {
    return this.client? 
      from(this.client.del(userId)).pipe(switchMap(res=>of({userId:userId,deleted:res})))
      :EMPTY;
  }
}
