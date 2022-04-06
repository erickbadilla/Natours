const router = require('express').Router();
const bookingController = require('../controllers/bookingController');
const authController = require('../controllers/authController');

//Protected routes
router.use(authController.protectRouteHandler);

router.get(
  '/checkout-session/:tourID',
  authController.protectRouteHandler,
  bookingController.getCheckoutSession
);

//Restricted Routes & protected routes
router.use(authController.restrictTo('admin'));

//TODO endpoints needs to be added to postman

router
  .route('/')
  .get(bookingController.getAllBookingsHandler)
  .post(bookingController.createBookingHandler);

router
  .route('/:id')
  .get(bookingController.getSingleBookingHandler)
  .patch(bookingController.updateBookingHandler)
  .delete(bookingController.deleteBookingHandler);

module.exports = router;
