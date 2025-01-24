import { Db, InsertOneResult, MongoClient, ObjectId, UpdateResult, WithId} from 'mongodb';
import { catchError, EMPTY, from, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { ENVIRONMENT } from '../environment/environment';
import { IUser } from '../types/shared-models';


export class mongoDBClient extends MongoClient {
  private dbInst = new Db (this,ENVIRONMENT.MONGO_DB_CONFIG.mongdDBName)
  private  _isOpened:boolean = false;
  get isOpened():boolean {
    return this._isOpened
  }
  constructor() 
  {
    super(ENVIRONMENT.MONGO_DB_CONFIG.mongoUrl);
    this.on('open',()=>{
      console.log('db server is connected')
      this._isOpened = true
    })
    this.on('close',()=>{
      this._isOpened = false
      console.log('db server is disconnected')
    })
  }
  isDBConnected():Observable<boolean> {
    return of(this._isOpened).pipe(
      switchMap(isConnected=>isConnected?  of(isConnected) : from(this.connect()).pipe(
        tap(()=>console.log('db server is connected')),
        map(()=>{return true}),
        catchError(err=>{
          console.log('\x1b[31merror mongo', err?.message,'\x1b[0m' )
          return throwError(()=> new Error(err))
        })
      )))
  }
  findUser (user:IUser):Observable<IUser|null> {
    return this.isDBConnected().pipe(
      switchMap(isConnected=>isConnected? this.dbInst.collection<IUser>('auth-users-data').findOne({userId:user.userId}):EMPTY),
      catchError(err=>{return throwError(()=> new Error(err))}))
  }
  addUser (newUser:IUser):Observable<InsertOneResult<IUser>> {
    return from(this.dbInst.collection<IUser>('auth-users-data').insertOne (newUser));
  }
  updateUser (newUser:IUser):Observable<UpdateResult<IUser>> {
    let dataWitoutId = {...newUser};
    delete dataWitoutId._id
    return from(this.dbInst.collection<IUser>('auth-users-data').updateOne ({_id:new  ObjectId(newUser._id)},{$set:{...dataWitoutId}}));
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