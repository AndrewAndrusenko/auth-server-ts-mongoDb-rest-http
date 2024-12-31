import { ENVIRONMENT } from "../environment/environment"
import { sign, verify} from 'jsonwebtoken'
import { bindNodeCallback, catchError, EMPTY, forkJoin, from, Observable, of,switchMap, tap } from "rxjs"
import { AcRoles, IJWTInfo, IJWTPayload, IJWTInfoToken, serializeOptions } from "../types/shared-models"
import { NextFunction, Request, Response } from "express"
import { JSONCookies} from 'cookie-parser'
import { VerifyErrors } from "jsonwebtoken"
import { serialize } from "cookie"
import { redisClientAuth } from "./redis-module"
export const redisStore = new redisClientAuth()
redisStore.init().subscribe()

export function jwtSet (jwtInfo: IJWTInfo ):Observable<IJWTInfoToken> {
  return forkJoin ({
    jwt:of(sign(jwtInfo, ENVIRONMENT.JWT.JWT_SECRET,ENVIRONMENT.JWT.JWT_SETTINGS,)),
    refreshToken:of(sign(jwtInfo, ENVIRONMENT.JWT.JWT_REFRESH_SECRET,ENVIRONMENT.JWT.JWT_SETTINGS_SECRET)),
    jwtInfo:of(jwtInfo)
  })
}

export function verifyAccess (req:Request, res:Response, next:NextFunction ) {
  verifyJWT(String(JSONCookies(req.cookies)['A3_AccessToken']),String(JSONCookies(req.cookies)['A3_RefreshToken']),res,next)
}
function verifyJWT (accessToken:string, refreshToken:string, res:Response,next:NextFunction ) {
  const boundJwtVerify = bindNodeCallback (verify)
  let jwtVerify$ = boundJwtVerify(accessToken,ENVIRONMENT.JWT.JWT_SECRET)
  jwtVerify$.pipe(
    tap(decoded=>{
      if (!AcRoles.includes((decoded as IJWTPayload).role)) {
        res.sendStatus(403);
        next('Access is forbidden')
        return;
      } 
    }),
    catchError(err=>{
      console.log('\x1b[31merror', err?.message,'\x1b[0m' )
      if (err?.name === 'TokenExpiredError') {
        refreshTokenFunc(refreshToken,res).subscribe(res_jwtInfoToken=>{
          res_jwtInfoToken =  res_jwtInfoToken as { response: Response, jwtInfoToken: IJWTInfoToken}
          verifyJWT(res_jwtInfoToken.jwtInfoToken.jwt,res_jwtInfoToken.jwtInfoToken.refreshToken,res_jwtInfoToken.response,next)
        })
      } else {
        res.sendStatus(401)
      }
      return EMPTY;
    })
  ).subscribe(()=>next())
}

function refreshTokenFunc (refreshToken:string,res:Response):Observable<{response:Response,jwtInfoToken:IJWTInfoToken}|VerifyErrors> {
  const boundJwtVerify = bindNodeCallback (verify)
  return boundJwtVerify(refreshToken,ENVIRONMENT.JWT.JWT_REFRESH_SECRET).pipe( 
    switchMap(jwtInfo=>redisStore.getRefreshTocken((jwtInfo as IJWTInfo).userId)
      .pipe(
        switchMap(jwtInfoToken=>{
          if (jwtInfoToken?.refreshToken === refreshToken) {
            return of(jwtInfo)
          } else{
            console.log('\x1b[31merror refreshToken has not been found\x1b[0m' )
            res.status(401).send({message:'RefreshToken has not been found'})
            return EMPTY
          }
        })
      )),
    tap(jwtInfo=>console.log('User:',(jwtInfo as IJWTInfo).userId,'| New token is being issued')),   
    switchMap(jwtInfo=> jwtSet({_id:(jwtInfo as IJWTInfo)._id, userId:(jwtInfo as IJWTInfo).userId, role:(jwtInfo as IJWTInfo).role})),
    switchMap(jwtInfoToken=>redisStore.saveRefresh(jwtInfoToken)),
    tap(jwtInfoToken=>res.setHeader('Set-Cookie',[
      serialize('A3_AccessToken', jwtInfoToken.jwt,serializeOptions),
      serialize('A3_RefreshToken', jwtInfoToken.refreshToken,serializeOptions)
    ])),
    switchMap(jwtInfoToken=>of({response:res, jwtInfoToken:jwtInfoToken})),
    catchError(err=>{
      console.log('\x1b[31merror_refreshToken', err?.message,'\x1b[0m' )
      res.sendStatus(401)
      return EMPTY;
    })
  )
}

export function removeUser (req:Request, res:Response, next:NextFunction) {
  let userId = req.body as {userId:string};
  from(redisStore.removeRefreshTocken(userId.userId)).pipe(
    catchError(e=>{
      console.log('\x1b[31merror_removeRefreshTocken', e,'\x1b[0m' )
      return of({userId:userId.userId,deleted:0})
    })
  ).subscribe(data=>res.send(data))
} 

export function saveRefreshToStore (jwtInfoToken:IJWTInfoToken ):Observable<IJWTInfoToken> {
  if (redisStore.isOpen) {
    return redisStore.saveRefresh(jwtInfoToken) 
  } else {
    console.log('\x1b[31merror', 'Redis server is unavailable','\x1b[0m' )
    return of(jwtInfoToken)
  }
}