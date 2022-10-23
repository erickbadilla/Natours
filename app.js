const express = require('express');
const morgan = require('morgan');
const path = require('path');

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const tourRouter = require('./routes/tourRouter');
const userRouter = require('./routes/userRouter');
const reviewRouter = require('./routes/reviewRouter');
const viewRouter = require('./routes/viewRouter');
const bookingRouter = require('./routes/bookingRouter');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const app = express();

//Sets view engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views')); //Prevent bugs of slashes

//1) Global Middlewares
//Helps cors errors
//Connecting to API
app.use(cors({ origin: true, credentials: true }));

//Set Security HTTP Headers
//Options helps CDNs and API cors, CDPs errors
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        'child-src': ['blob:', 'frame:'],
        'connect-src': [
          'https://*.mapbox.com',
          'https://cdnjs.cloudflare.com/ajax/libs/axios/0.26.0/axios.min.js',
          'https://js.stripe.com/v3',
          'http://127.0.0.1:8080/',
          `https://e-natours-app.herokuapp.com/:${process.env.PORT}/*`,
          'ws://127.0.0.1:*/',
          'ws://e-natours-app.herokuapp.com:*/',
          'https://api.stripe.com',
        ],
        'default-src': ["'self'", 'ws:'],
        'font-src': ["'self'", 'https://fonts.gstatic.com'],
        'img-src': ["'self'", 'data:', 'blob:'],
        'script-src': [
          "'self'",
          'https://*.mapbox.com',
          'https://cdnjs.cloudflare.com/ajax/libs/axios/0.26.0/axios.min.js',
          'https://js.stripe.com',
          'https://js.stripe.com/*',
        ],
        'frame-src': ['https://js.stripe.com', 'https://hooks.stripe.com'],
        'worker-src': ['blob:'],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
  })
);

//Limits the number of request of one IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from this IP, please try again in an hour',
});

app.use('/api', limiter);

//Convert Body data to JS Objects, and limits data
app.use(express.json({ limit: '10kb' }));
//Parse form data
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
//Parse cookies in server
app.use(cookieParser());

//Data Sanitization against NoSQL query injection
app.use(mongoSanitize());

//Data Sanitization against XSS
app.use(xss());

//Prevent parameter pollution on params
// /tours?sort=duration&sort=price = [duration, price]
// In this case will use the las sort of price
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

//Serve a static html
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));

//Sets request time to request
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// app.use((req, res, next) => {
//   console.log('Cookies: ', req.cookies);
//
//   // Cookies that have been signed
//   console.log('Signed Cookies: ', req.signedCookies);
//
//   next();
// });

//Helps to print in console request statistics
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

const baseApiUrlV1 = '/api/v1';

//Middleware "Sub App" adding router
app.use('/', viewRouter);
app.use(`${baseApiUrlV1}/tours`, tourRouter);
app.use(`${baseApiUrlV1}/users`, userRouter);
app.use(`${baseApiUrlV1}/reviews`, reviewRouter);
app.use(`${baseApiUrlV1}/bookings`, bookingRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl}`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
