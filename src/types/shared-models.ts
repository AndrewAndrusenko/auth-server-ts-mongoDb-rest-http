import { SerializeOptions } from "cookie"
import { JwtPayload } from "jsonwebtoken"
import { ObjectId } from "mongodb"
export const ACESS_ROLES = ['user','admin'] as const
export type TAcRole = typeof ACESS_ROLES[number]
export interface IUser {
  _id?:ObjectId,
  userId:string,
  password:string,
  email:string,
  emailConfirmed?:boolean
  role:TAcRole
}
export interface IJWTInfo {
  _id:ObjectId,
  userId:string,
  role:TAcRole
}
export interface IJWTPayload extends JwtPayload,IJWTInfo {}
export interface IJWTInfoToken {
  jwt:string,
  refreshToken:string
  jwtInfo:IJWTInfo|null
}
export const serializeOptions:SerializeOptions = {
  httpOnly:true,
  secure:true,
  sameSite:'strict',
  maxAge:60*60*24*30,
  path:'/'
}
export const serializeOptionsShared:SerializeOptions = {
  // httpOnly:true,
  secure:true,
  sameSite:'strict',
  maxAge:60*60*24*30,
  path:'/',
  domain:'euw.devtunnels.ms'
}