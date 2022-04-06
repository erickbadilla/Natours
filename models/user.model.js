const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const AppError = require('../utils/appError');

//Schema entries are used for validations, but we can be undefined them before save
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: [true, 'A user must have a name'],
    minLength: [5, 'A user name must have more or equal then 5 characters'],
  },
  email: {
    type: String,
    unique: true, //Not validator
    trim: true, //Not validator
    lowercase: true, //Not validator
    required: [true, 'A user must have an email'],
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    select: false,
    required: [true, 'Please enter a valid password'],
    minLength: [8, 'Password must have more or equal then 8 characters'],
  },
  passwordConfirm: {
    type: String,
    select: false,
    required: [true, 'Please enter a valid confirm password'],
    minLength: [
      8,
      'Confirm password must have more or equal then 8 characters',
    ],
    validate: {
      //Works only on create(), save()
      validator: function (confirmPassword) {
        return this.password === confirmPassword;
      },
    },
  },
  passwordChangedAt: {
    type: Date,
    select: false,
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  loginAttempts: {
    type: Number,
    default: 0,
    select: false,
  },
  lockUntil: {
    type: Date,
    select: false,
  },
});

//Login attempts implementation, maximum 5
userSchema.post('findOne', async (doc, next) => {
  if (!doc || !doc.lockUntil) return next();

  if (doc.lockUntil.getTime() > Date.now()) {
    return next(
      new AppError(`Account locked please try again at ${doc.lockUntil}`)
    );
  }

  doc.lockUntil = undefined;
  doc.loginAttempts = 0;
  await doc.save();
});

userSchema.post('findOne', async (doc, next) => {
  //Test login attempts TODO
  if (!doc || (doc.loginAttempts || 0) < 5) return next();

  //Three hours in milliseconds
  doc.lockUntil = Date.now() + 10800000;
  await doc.save();

  next(
    new AppError('Logging attempts exceeded, please try again in 3 hours', 401)
  );
});

//Used to hash when user change password or first set it up
//If it's not a password update it will don't do anything
userSchema.pre('save', async function (next) {
  //Clause to stop code execution if password was not modified
  if (!this.isModified('password')) return next();

  //Before we save the user to db, we need to hash password, and set confirmPassword to undefined because it's not need
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;

  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  //This solves token creation comparison from password change at
  //Sometimes token generation will be first, because writing in database password change At is slow
  //This is why we subtract 1 second, simple hack
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

//This is for any query to filter just the active users
userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

// userSchema.pre(/^find/, function (next) {
//   this.projection({
//     __v: false,
//   });
//   next();
// });

userSchema.methods.correctPassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (!this.passwordChangedAt) return false;

  const changedDate = new Date(this.passwordChangedAt).getTime() / 1000;
  return changedDate > JWTTimestamp;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

module.exports = mongoose.model('User', userSchema);
