const AppError = require('../utils/appError');

const handleCastErrorDB = ({ path, value }) =>
  new AppError(`Invalid ${path}: ${value}`, 400);

const handleDuplicatedFieldsDB = ({ keyValue }) => {
  const field = Object.keys(keyValue)[0];
  return new AppError(
    `Duplicated field value: ${field}. Please use another value!`,
    400
  );
};

const handleValidationErrorDB = ({ errors }) => {
  const parsedMessage = Object.values(errors).join('. ');
  return new AppError(parsedMessage, 400);
};

const handleJWTError = () =>
  new AppError('Invalid Token. Please log in again', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired. Please login again', 401);

const sendErrorDev = (error, req, res) => {
  //Api Error
  if (req.originalUrl.startsWith('/api')) {
    return res.status(error.statusCode).json({
      status: error.status,
      message: error.message,
      stack: error.stack,
    });
  }

  //View Error
  res.status(error.statusCode).render('error', {
    title: 'Something went wrong',
    message: error.message,
  });
};

const sendErrorProd = (
  { isOperational, message, statusCode, status },
  req,
  res
) => {
  if (req.originalUrl.startsWith('/api')) {
    //Programing or unknown error, do not leak data to client
    if (!isOperational) {
      return res.status(500).json({
        status: 'error',
        message: 'Something, went wrong.',
      });
    }

    //Operational Error, Trusted Errors
    return res.status(statusCode).json({
      status,
      message,
    });
  }

  //View
  //Programing or unknown error, do not leak data to client
  if (!isOperational) {
    return res.status(statusCode).render('error', {
      title: 'Something went wrong',
      message: 'Please try again later.',
    });
  }

  //Operational Error
  res.status(statusCode).render('error', {
    title: 'Something went wrong',
    message,
  });
};

const translateError = (error) => {
  const { stack, code, name } = error;

  if (stack.startsWith('CastError')) return handleCastErrorDB(error);

  //Mongo Driver Error
  if (code === 11000) return handleDuplicatedFieldsDB(error);

  //Mongoose Validation Error
  if (name === 'ValidationError') return handleValidationErrorDB(error);

  //Json Web Token Error
  if (name === 'JsonWebTokenError') return handleJWTError();

  //Json Web Token Expired Error
  if (name === 'TokenExpiredError') return handleJWTExpiredError();

  return error;
};

module.exports = (error, req, res, next) => {
  error.statusCode = error.statusCode || 500;
  error.status = error.status || 'error';

  switch (process.env.NODE_ENV) {
    case 'development':
      sendErrorDev(error, req, res);
      break;

    case 'production':
      sendErrorProd(translateError(error), req, res);
      break;

    default:
      break;
  }

  next();
};
