import createError, { HttpError } from 'http-errors'
import express, { Request, Response } from  'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import cors from 'cors'

import * as indexRouter from './routes/index';
import * as usersRouter from './routes/auth-routes'
import * as mailRouter from './routes/mail-routes'
import { router as quoteRouter }  from './routes/rtq-routtes'
import { ENVIRONMENT } from './environment/environment';

export const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors(({credentials: true, origin: ENVIRONMENT.CORS.ORIGINS})))
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter.router);
app.use('/users', usersRouter.router);
app.use('/mail',mailRouter.router);
app.use('/quote',quoteRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err:HttpError, req:Request, res:Response) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  // render the error page
  res.status(err.status || 500);
  res.render('error');
});