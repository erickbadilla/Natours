const { unslugify } = require('unslugify');
const catchAsync = require('../utils/catchAsync');
const Tour = require('../models/tour.model');
const User = require('../models/user.model');
const Booking = require('../models/bookings.model');

const AppError = require('../utils/appError');

exports.getOverviewViewHandler = catchAsync(async (req, res, _next) => {
  //Get tour data
  const tours = await Tour.find();

  res.status(200).render('overview', {
    title: 'All Tours',
    tours,
  });
});

exports.getTourViewHandler = catchAsync(async (req, res, next) => {
  const { slug } = req.params;

  const tour = await Tour.findOne({
    slug,
  }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });

  if (!tour) return next(new AppError('There is no tour with that name.', 404));

  res.status(200).render('tour', {
    tour,
    unslugify,
  });
});

exports.getLoginFormViewHandler = catchAsync(async (req, res, _next) => {
  res.status(200).render('login', {
    title: 'Log into your account',
  });
});

exports.getAccountHandler = (req, res) => {
  res.status(200).render('account', {
    title: 'Your account',
  });
};

exports.updateUserDataHandler = catchAsync(async (req, res, next) => {
  const { email, name } = req.body;

  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    { email, name },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).render('account', {
    title: 'Your account',
    user: updatedUser,
  });
});

exports.getMyToursHandler = catchAsync(async (req, res, next) => {
  const { user } = req;

  //Find all user bookings
  const bookings = await Booking.find({
    user: user.id,
  });

  //Find tours
  const tourIDs = bookings.map((booking) => booking.tour);
  const tours = await Tour.find({
    _id: { $in: tourIDs },
  });

  res.status(200).render('overview', {
    title: 'My tours',
    tours,
  });
});
