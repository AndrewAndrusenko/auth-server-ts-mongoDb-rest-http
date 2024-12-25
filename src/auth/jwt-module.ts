import { ENVIRONMENT } from "../environment/environment"
import * as jwt from 'jsonwebtoken'
import { Observable, of } from "rxjs"
import { AcRoles, IJWTInfo, IJWTPayload } from "../types/shared-models"
import { NextFunction, Request, Response } from "express"

export function jwtSet (jwtInfo: IJWTInfo ):Observable<string> {
  return of(jwt.sign(jwtInfo, ENVIRONMENT.JWT.JWT_SECRET,ENVIRONMENT.JWT.JWT_SETTINGS))
}
export function verifyJWT (req:Request,res:Response,next:NextFunction ) {
  const jwtToken:string = req.headers.authorization?.substring('Bearer '.length)||''
  console.log(jwtToken);
  try {
    const jwtInfo:IJWTPayload = jwt.verify(jwtToken,ENVIRONMENT.JWT.JWT_SECRET) as IJWTPayload
    if (jwtInfo.iss===ENVIRONMENT.JWT.JWT_SETTINGS.issuer && (jwtInfo.exp as number)  <Date.now() && AcRoles.includes(jwtInfo.role)) {
      next();
      return;
    } else {
      res.sendStatus(401)
    }
  } catch (error) {
    res.sendStatus(401)
  }
}