import express, { Request, Response } from 'express';
const createError = require('http-errors');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const helmet = require('helmet');

const indexRouter = require('./routes/index');

const errorHandler = require('./middleware/errorHandler');

const PORT = 3000; 

const app = express();

app.use(helmet()); // https://expressjs.com/en/advanced/best-practice-security.html#use-helmet
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use((req: Request, res: Response, next: any) => {
  next(createError.NotFound());
});

// pass any errors to the error handler
app.use(errorHandler);

app.listen(PORT);

module.exports = app;
