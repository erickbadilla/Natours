const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const { promisify } = require('util');
const catchAsync = require('../utils/catchAsync');
const Email = require('../utils/email');

const AppError = require('../utils/appError');
const User = require('../models/user.model');

const signToken = (id) =>
  jwt
    .sign(
      {
        id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN,
      }
    )
    .toString();

//Send token via HTTP-Only Cookie that way we store more secure token
const createSendToken = (res, user, status) => {
  const token = signToken(user._id);
  user.password = undefined;
  user.loginAttempts = undefined;
  user.lockUntil = undefined;

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    //This property only send the cookie if the connection is https
    //This property cannot be accessed by the browser or modified, only send it to every request to the server
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  };

  res.cookie('jwt', token, cookieOptions);

  res.status(status).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signUpHandler = catchAsync(async (req, res, next) => {
  const { name, email, password, passwordConfirm } = req.body;

  const newUser = await User.create({
    name,
    email,
    password,
    passwordConfirm,
  });

  if (!newUser) next(new AppError('User was not created', 400));

  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();

  newUser.password = undefined;

  createSendToken(res, newUser, 201);
});

exports.logoutHandler = catchAsync(async (req, res, next) => {
  res.cookie('jwt', '', {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    status: 'success',
  });
});

exports.loginHandler = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide a email and password', 400));
  }

  const user = await User.findOne({ email }).select(
    '+password +loginAttempts +lockUntil'
  );

  if (!user) {
    return next(new AppError('Incorrect email or password', 401));
  }

  if (!(await user.correctPassword(password))) {
    user.loginAttempts += 1;
    await user.save();
    return next(new AppError('Incorrect email or password', 401));
  }

  user.loginAttempts = 0;
  user.lockUntil = undefined;
  await user.save();

  createSendToken(res, user, 200);
});

//Protects Route from a user invalid token
exports.protectRouteHandler = catchAsync(async (req, res, next) => {
  // 1) Get the token from request
  const {
    headers: { authorization },
  } = req;

  let token = null;

  if (authorization || authorization?.startsWith('Bearer')) {
    token = authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) return next(new AppError('Please send a valid token.', 401));

  //2) Verify token
  const decodedToken = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET
  );

  //3) Check if user exists
  const currentUser = await User.findById(decodedToken.id);

  if (!currentUser)
    return next(
      new AppError('The user belonging this token no longer exist.', 401)
    );

  //4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decodedToken.iat)) {
    return next(
      new AppError('User recently changed password! Please login again.')
    );
  }
  //5) Grant Access to Protected Route
  req.user = currentUser;
  //This is for usage in templates
  res.locals.user = currentUser;

  next();
});

//Only for rendered pages, no errors
exports.isUserLoggedIn = async (req, res, next) => {
  if (!req.cookies.jwt) return next();

  const token = req.cookies.jwt;

  try {
    //2) Verify token
    const decodedToken = await promisify(jwt.verify)(
      token,
      process.env.JWT_SECRET
    );

    //3) Check if user exists
    const currentUser = await User.findById(decodedToken.id);

    if (!currentUser) return next();

    //4) Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decodedToken.iat)) return next();

    //5) Grant Access to Protected Route
    res.locals.user = currentUser;
  } catch (e) {
    return next();
  }

  next();
};

exports.restrictTo =
  (...roles) =>
  ({ user: { role: currentUserRole } }, res, next) => {
    if (roles.includes(currentUserRole)) return next();

    return next(
      new AppError('You do not have permission to perform this action', 403)
    );
  };

exports.forgotPasswordHandler = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const { email } = req.body;

  if (!email || !validator.isEmail(email)) {
    return next(new AppError('Please send a valid email'));
  }

  const user = await User.findOne({ email });

  if (!user) {
    return next(new AppError('There is no user with email address', 404));
  }

  // 2) Generate random reset token
  const resetToken = user.createPasswordResetToken();

  await user.save({ validateBeforeSave: false }); //Does not work

  // 3) Send it to user's email
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error sending the email. Try again later!',
        500
      )
    );
  }
});

exports.resetPasswordHandler = catchAsync(async (req, res, next) => {
  // 1) Get user based on token
  const { token: resetEmailToken } = req.params;

  if (!resetEmailToken)
    return next(new AppError('Please send a valid request', 400));

  const hashedToken = crypto
    .createHash('sha256')
    .update(resetEmailToken)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: {
      $gt: Date.now(),
    },
  });

  if (!user) return next(new AppError('Token is invalid or has expired!', 400));

  const { password, confirmPassword } = req.body;

  if (!password.length || !confirmPassword.length)
    return next(new AppError('Please sent a valid password', 400));

  // 2) If token has not expired,and there is user, set new password
  user.password = password;
  user.passwordConfirm = confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  // 3) Update changedPasswordAt property for the current user
  //Pre middleware handles this step
  await user.save();

  // 4) Log the user in, send JWT to client
  createSendToken(res, user, 201);
});

exports.updatePasswordHandler = catchAsync(async (req, res, next) => {
  const {
    user: { id },
  } = req;
  const { currentPassword, password, confirmPassword } = req.body;

  if (!currentPassword?.length || !password?.length || !confirmPassword?.length)
    return next(new AppError('Password or token is invalid', 400));

  const user = await User.findById(id).select('+password');

  if (!(await user.correctPassword(currentPassword)))
    return next(new AppError('Invalid password', 401));

  user.password = password;
  user.confirmPassword = confirmPassword;

  await user.save();

  createSendToken(res, user, 200);
});
