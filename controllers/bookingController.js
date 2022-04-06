const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tour.model');
const Booking = require('../models/bookings.model');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const handlerFactory = require('./handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  const { tourID } = req.params;

  if (!tourID || typeof tourID !== 'string')
    return next(new AppError('An unexpected error happened'));

  // 1) Get the current booked tour
  const tour = await Tour.findById(req.params.tourID);

  //2) Create Checkout Session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/?tour=${
      req.params.tourID
    }&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: tourID,
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [`https://www.natours.dev/img/tours/${tour.imageCover}.jpg`],
        amount: tour.price * 100, //Cents
        currency: 'usd',
        quantity: 1,
      },
    ],
  });

  //3) Create Session Response
  res.status(200).json({
    status: 'success',
    session,
  });
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  //This is temporally, unsecure everyone can make bookings without paying
  const { tour, user, price } = req.query;

  if (!tour || !user || !price) return next();

  await Booking.create({
    tour,
    user,
    price,
  });

  res.redirect(req.originalUrl.split('?')[0]);
});

exports.createBookingHandler = handlerFactory.createOne(Booking);
exports.getSingleBookingHandler = handlerFactory.getOne(Booking);
exports.getAllBookingsHandler = handlerFactory.getAll(Booking);
exports.updateBookingHandler = handlerFactory.updateOne(Booking);
exports.deleteBookingHandler = handlerFactory.deleteOne(Booking);
