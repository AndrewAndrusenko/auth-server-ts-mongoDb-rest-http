import { ObjectId } from "mongodb"

export interface IUser {
  _id?:ObjectId,
  userId:string,
  password:string,
  email:string,
  emailConfirmed?:boolean
}