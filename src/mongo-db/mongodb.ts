import {Db, InsertOneResult, MongoClient, ObjectId, UpdateResult} from 'mongodb';
import { catchError, from, map, Observable, tap } from 'rxjs';
import { ENVIRONMENT } from '../environment/environment';
import { IUser } from '../types/shared-models';


export class mongoDBClient extends MongoClient {
  dbInst = new Db (this,ENVIRONMENT.MONGO_DB_CONFIG.mongdDBName)
  constructor() {super(ENVIRONMENT.MONGO_DB_CONFIG.mongoUrl)}
  checkConnectionStatus():Observable<{ok:number}> {
      return from(this.dbInst.admin().ping()).pipe(
        catchError(():Observable<{ok:number}> =>{
          return from(this.connect()).pipe(
            tap(()=>console.log('new connection')),
            map(()=>{return {ok:1}})
          )
        }),
        map(()=>{return {ok:1}})
      );
  }
  findUser (user:IUser):Observable<IUser|null> {
    return from(this.dbInst.collection<IUser>('auth-users-data').findOne({userId:user.userId}))
  }
  addUser (newUser:IUser):Observable<InsertOneResult<IUser>> {
    return from(this.dbInst.collection<IUser>('auth-users-data').insertOne (newUser));
  }
  updateUser (newUser:IUser):Observable<UpdateResult<IUser>> {
    let dataWitoutId = {...newUser};
    delete dataWitoutId._id
    return from(this.dbInst.collection<IUser>('auth-users-data').updateOne ({_id:new  ObjectId(newUser._id)},{$set:{...dataWitoutId}}));
  }
  getUsers ():Observable<IUser[]> {
    return from(this.dbInst.collection<IUser>('auth-users-data').find({}).toArray());
  }
  checkUserIdUnique (newUserID:string):Observable<boolean> {
    return from(this.dbInst.collection<IUser>('auth-users-data').find({userId:newUserID}).toArray())
    .pipe(map(res=>{return res.length>0}));
  }
  checkEmailUnique (newEmail:string):Observable<boolean> {
    return from(this.dbInst.collection<IUser>('auth-users-data').find({email:newEmail}).toArray())
    .pipe(map(res=>{return res.length>0}));
  }
  confirmEmail (data:{id:string,token:string}):Observable<UpdateResult> {
    return from(this.dbInst.collection<UpdateResult>('auth-users-data').updateOne({_id:new ObjectId(data.id),token:data.token},{$set: {emailConfirmed:true}}));
  }
}