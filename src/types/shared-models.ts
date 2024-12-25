import { JwtPayload } from "jsonwebtoken"
import { ObjectId } from "mongodb"
export const AcRoles:string[] = ['user']
export type TAcRole = (typeof AcRoles)[number]
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