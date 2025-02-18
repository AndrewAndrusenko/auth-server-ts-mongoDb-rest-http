import { Db, DeleteResult, InsertOneResult, MongoClient, ObjectId, UpdateResult, WithId} from 'mongodb';
import { catchError, EMPTY, from, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { ENVIRONMENT } from '../environment/environment';
import { IUser } from '../types/shared-models';
import { CustomLogger, loggerPino } from './logger-module';
import { basename} from 'path'

const localLogger:CustomLogger = loggerPino.child({ml:basename(__filename)})
export class mongoDBClient extends MongoClient {
  private dbInst = new Db (this,ENVIRONMENT.MONGO_DB_CONFIG.mongdDBName)
  private  _isOpened:boolean = false;
  get isOpened():boolean {
    return this._isOpened
  }
  constructor() 
  {
    super(ENVIRONMENT.MONGO_DB_CONFIG.mongoUrl, {
      connectTimeoutMS: 1000,
      serverSelectionTimeoutMS: 1000
    });
    this.on('open',()=>{
      // localLogger.info({fn:'mongoDBClient.constructor',msg:'MongoDB server is connected'})
      this._isOpened = true
    })
    this.on('close',()=>{
      localLogger.error({fn:'mongoDBClient.constructor',msg:'MongoDB server is disconnected'})
      this._isOpened = false
    })
  }
  isDBConnected():Observable<boolean> {
    return of(this._isOpened).pipe(
      switchMap(isConnected=>isConnected?  of(isConnected) : from(this.connect()).pipe(
        map(()=>{return true}),
        catchError(err=>{
          err.msg = err.message, 
          err.ml = 'MongoService'
          return throwError(()=> err)
        })
      )))
  }
  findUser (user:IUser):Observable<IUser|null> {
    return this.isDBConnected().pipe(
      switchMap(isConnected=>isConnected? this.dbInst.collection<IUser>('auth-users-data').findOne({userId:user.userId}):EMPTY),
      catchError(err=>{return throwError(()=> new Error(err))}))
  }
  findAllUsers ():Observable<IUser[]|null> {
    return this.isDBConnected().pipe(
      switchMap(isConnected=>isConnected? this.dbInst.collection<IUser>('auth-users-data').find().toArray():EMPTY),
      catchError(err=>{return throwError(()=> new Error(err))}))
  }
  deleteUser (userId:string):Observable<DeleteResult|null> {
    return this.isDBConnected().pipe(
      switchMap(isConnected=>isConnected? this.dbInst.collection<DeleteResult>('auth-users-data').deleteOne({userId:userId}):EMPTY),
      catchError(err=>{return throwError(()=> new Error(err))}))
  }
  addUser (newUser:IUser):Observable<InsertOneResult<IUser>> {
    return from(this.dbInst.collection<IUser>('auth-users-data').insertOne (newUser));
  }
  updateUser (newUser:IUser):Observable<UpdateResult<IUser>> {
    let dataWitoutId = {...newUser};
    delete dataWitoutId._id
    return from(this.dbInst.collection<IUser>('auth-users-data').updateOne ({_id:new  ObjectId(newUser._id)},{$set:{...dataWitoutId}}))
    .pipe(
      catchError(err=>{
        localLogger.error({fn:'updateUser',msg:err.message, user:JSON.stringify(dataWitoutId)})
        err.msg = err.message, 
        err.ml = 'MongoService'
        return throwError(()=>err)
      })
    );
  }
  resetPassword (id:string,token:string, password:string):Observable<WithId<IUser> | null> {
    return from(this.dbInst.collection<IUser>('auth-users-data').findOneAndUpdate ({_id:new ObjectId(id),passwordToken:token},{$set:{password:password}}));
  }
  setResetPasswordToken (email:string,passwordToken:string):Observable<WithId<IUser> | null> {
    return from(this.dbInst.collection<IUser>('auth-users-data').findOneAndUpdate ({email:email},{$set:{passwordToken:passwordToken}},{returnDocument:'after'}));
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