import { Router} from "express";
import { from, catchError, EMPTY } from 'rxjs';
import * as authModule from "../modules/auth-module";

export const router = Router();

/*Authenticate user data*/
router.post('/login', async function(req, res, next) {
  authModule.logInUser(req, res, next)
});
//Log out user by removing tokens from cookies and redis 
router.post('/logout', async function(req, res, next) {
  authModule.logOutUser(req, res, next)
  .pipe(catchError(err=>{
    res.status(500).send(err);
    return EMPTY;
  }))
  .subscribe(data=>res.send({userId:data.userId, logout:data.deleted}))
})
/* Sigh up new user. */
router.post('/', async function(req, res, next) {
  authModule.signUpNewUser(req,res,next)

});
/* Update user data. */
router.post('/update', async function(req, res, next) {
  authModule.updateUserData(req, res, next)
});
//PASSWORD RESET
//Setting token for password reset
router.post('/set_password_token', async function(req, res, next) {
  authModule.setResetPasswordToken(req,res,next)
});
//Greating new password
router.post('/set_new_password', async function(req, res, next) {
  authModule.setNewPassword(req,res,next)
});
//EMAIL
/*Confirm user email*/
router.post('/email/confirm', async function(req, res, next) {
  authModule.confirmEmailAddress(req,res,next)
});

//VALIDATORS
/* GET check if userId is unique. */
router.get('/checkId', async function(req, res, next) {
  authModule.checkUserIdUnique(req,res,next)
});

/* GET check if email is unique. */
router.get('/checkEmail', async function(req, res, next) {
  authModule.checkEmailUnique(req,res,next)
});

//UTILS
/* Close connection to MongoDB */
router.get('/close', async function(req, res, next) {
  authModule.mongoClientClose(req,res,next)
});