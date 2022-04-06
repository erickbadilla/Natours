const router = require('express').Router();
const viewController = require('../controllers/viewController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

router.get(
  '/',
  bookingController.createBookingCheckout,
  authController.isUserLoggedIn,
  viewController.getOverviewViewHandler
);
router.get(
  '/tour/:slug',
  authController.isUserLoggedIn,
  viewController.getTourViewHandler
);
router.get(
  '/login',
  authController.isUserLoggedIn,
  viewController.getLoginFormViewHandler
);
router.get(
  '/me',
  authController.protectRouteHandler,
  viewController.getAccountHandler
);

router.post(
  '/submit-user-data',
  authController.protectRouteHandler,
  viewController.updateUserDataHandler
);

router.get(
  '/my-tours',
  authController.protectRouteHandler,
  viewController.getMyToursHandler
);

module.exports = router;
