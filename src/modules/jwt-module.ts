import { ENVIRONMENT } from "../environment/environment"
import { sign, verify} from 'jsonwebtoken'
import { bindNodeCallback, catchError, EMPTY, forkJoin, from, Observable, of,switchMap, tap, throwError } from "rxjs"
import { IJWTInfo, IJWTPayload, IJWTInfoToken, serializeOptions, serializeOptionsShared, IRefreshDelete } from "../types/shared-models"
import { NextFunction, Request, Response } from "express"
import { JSONCookies} from 'cookie-parser'
import { VerifyErrors } from "jsonwebtoken"
import { serialize } from "cookie"
import { redisClientAuth } from "./redis-module"
import { ACCESS_ROUTES_ROLES } from "../types/access-roles-model"
import { basename} from 'path'
import { CustomLogger, loggerPino } from "./logger-module"
export const redisStore = new redisClientAuth()
redisStore.init().pipe(
  catchError(err=>{
    localLogger.error({fn:'redisStore.init()',msg:err.code})
    return EMPTY;
  })
).subscribe()

const  localLogger:CustomLogger = loggerPino.child({ml:basename(__filename)})

function issueAccessJWT (jwtInfo: IJWTInfo):Observable<string> {
  return from (
      new Promise<string> ((resolve,reject)=>{
        try {resolve(sign(jwtInfo, ENVIRONMENT.JWT.JWT_SECRET,ENVIRONMENT.JWT.JWT_SETTINGS))} 
        catch (error) {reject((error))}
      }));
}
function issueRefreshJWT (jwtInfo: IJWTInfo):Observable<string> {
  return from (
      new Promise<string> ((resolve,reject)=>{
        try {resolve(sign(jwtInfo, ENVIRONMENT.JWT.JWT_REFRESH_SECRET,ENVIRONMENT.JWT.JWT_SETTINGS_SECRET))} 
        catch (error) {reject((error))}
      }));
}
export function jwtSet (jwtInfo: IJWTInfo ):Observable<IJWTInfoToken> {
  return forkJoin ({
    jwt: issueAccessJWT(jwtInfo),
    refreshToken:issueRefreshJWT(jwtInfo),
    jwtInfo:of(jwtInfo)
  }).pipe(
    catchError(err=>{
      localLogger.error({fn:'jwtSet',user:jwtInfo.userId,msg:err.message})
      return of(  {jwt:'', refreshToken:'',  jwtInfo:jwtInfo  });
  }));
}

export function verifyAccess (req:Request, res:Response, next:NextFunction ) {
  verifyJWT(String(JSONCookies(req.cookies)['A3_AccessToken']),String(JSONCookies(req.cookies)['A3_RefreshToken']),res,next,req.originalUrl)
}
function verifyJWT (accessToken:string, refreshToken:string, res:Response,next:NextFunction,url:string ) {
  const boundJwtVerify = bindNodeCallback (verify)
  let jwtVerify$ = boundJwtVerify(accessToken,ENVIRONMENT.JWT.JWT_SECRET)
  jwtVerify$.pipe(
    tap(decoded=>{
      if (!ACCESS_ROUTES_ROLES.find(el=>el.route===url)?.roles.includes((decoded as IJWTPayload).role)) {
        localLogger.info({fn:'verifyJWT',user:(decoded as IJWTPayload).userId,route:url,msg:'Access is forbidden'})
        res.status(403).send({ml:'JWT',msg:'Access is forbidden'});
        let e = {...(new Error()), name : 'AccessForbiden'}
        throw e
      } 
    }),
    catchError(err=>{
      switch (err?.name) {
        case 'TokenExpiredError':
          localLogger.info({fn:'verifyJWT', msg:err.message,jwt:accessToken.split('.')[2]})
          refreshTokenFunc(refreshToken,res).subscribe(res_jwtInfoToken=>{
            res_jwtInfoToken =  res_jwtInfoToken as { response: Response, jwtInfoToken: IJWTInfoToken}
            verifyJWT(res_jwtInfoToken.jwtInfoToken.jwt,res_jwtInfoToken.jwtInfoToken.refreshToken,res_jwtInfoToken.response,next,url)
          })
        break;
        case 'AccessForbiden':
        break;
        default:
          localLogger.error({fn:'verifyJWT',jwt:accessToken,msg:`${err?.name} : ${err.message}`})
          res.headersSent? null: res.status(401).send(`${err?.name} : ${err.message}`)
        break;
      }
      return EMPTY;
    })
  ).subscribe(()=>next())
}

function refreshTokenFunc (refreshToken:string,res:Response):Observable<{response:Response,jwtInfoToken:IJWTInfoToken}|VerifyErrors> {
  const boundJwtVerify = bindNodeCallback (verify)
  return boundJwtVerify(refreshToken,ENVIRONMENT.JWT.JWT_REFRESH_SECRET).pipe( 
    switchMap(jwtInfo=>redisStore.getRefreshToken((jwtInfo as IJWTInfo).userId)
      .pipe(
        switchMap(jwtInfoToken=>{
          if (jwtInfoToken?.refreshToken === refreshToken) {
            return of(jwtInfo)
          } else{
            localLogger.error({fn:'refreshTokenFunc', user:(jwtInfo as IJWTInfo).userId, msg:'refreshToken has not been found',})
            res.status(401).send('JsonWebTokenError : RefreshToken has not been found')
            return EMPTY
          }}),
        catchError(e=>{return throwError(()=>e)})
      )),
    tap(jwtInfo=>localLogger.debug('User:',(jwtInfo as IJWTInfo).userId,'| New token is being issued')),   
    switchMap(jwtInfo=> jwtSet({_id:(jwtInfo as IJWTInfo)._id, userId:(jwtInfo as IJWTInfo).userId, role:(jwtInfo as IJWTInfo).role})),
    switchMap(jwtInfoToken=>redisStore.saveRefresh(jwtInfoToken)),
    tap(jwtInfoToken=>res.setHeader('Set-Cookie',[
      serialize('A3_AccessToken', jwtInfoToken.jwt,serializeOptions),
      serialize('A3_RefreshToken', jwtInfoToken.refreshToken,serializeOptions),
      serialize('A3_AccessToken_Shared', jwtInfoToken.jwt,serializeOptionsShared)
    ])),
    switchMap(jwtInfoToken=>of({response:res, jwtInfoToken:jwtInfoToken})),
    catchError(err=>{
      res.status(401).send(`${err?.name} : ${err.message}`)
      return EMPTY;
    })
  )
}
export function saveRefreshToStore (jwtInfoToken:IJWTInfoToken ):Observable<IJWTInfoToken> {
    return redisStore.saveRefresh(jwtInfoToken).pipe (
      catchError(err=>{
        localLogger.error({fn:'saveRefreshToStore',user:jwtInfoToken.jwtInfo?.userId, msg:err.message})
        return of(jwtInfoToken);
      })
    )
}
export function getAllRefreshToStore (req:Request, res:Response):Observable<{userId:string, data:string}[]>{
  return redisStore.gelAllRefreshTokens().pipe(
    catchError(err=>{
      localLogger.error({fn:'gelAllRefreshTokens', msg:err.message})
      return throwError(()=>err) 
    })
  )
}
export function deleteRefreshToken (req:Request, res:Response):Observable<IRefreshDelete>{
  return redisStore.removeRefreshToken(req.body.userId)
  .pipe(catchError(err=>{
    localLogger.error({fn:'deleteRefreshToken',user:req.body.userId, msg:err.message})
    err.module = 'JWT'
    return throwError(()=>err) 
  }))
}