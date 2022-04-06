const express = require('express');
const {
  addNewTourHandler,
  getAllToursHandler,
  deleteTourHandler,
  patchTourHandler,
  getSingleTourHandler,
  aliasTopToursHandler,
  getTourStatsHandler,
  getMonthlyPlanHandler,
  getTourWithinHandler,
  getDistancesHandler,
  uploadTourImagesHandler,
  resizeTourImage,
} = require('../controllers/tourController');

const {
  protectRouteHandler,
  restrictTo,
} = require('../controllers/authController');

const router = express.Router();

const reviewRouter = require('./reviewRouter');

// router.param('id', checkIdMiddleware);

//The way to used nested routes
router.use('/:tourId/reviews', reviewRouter);

router.route('/stats').get(protectRouteHandler, getTourStatsHandler);
router
  .route('/monthly-plan/:year')
  .get(
    protectRouteHandler,
    restrictTo('admin', 'lead-guide', 'guide'),
    getMonthlyPlanHandler
  );

router
  .route('/top-5-cheap')
  .get(protectRouteHandler, aliasTopToursHandler, getAllToursHandler);

router
  .route('/tours-within/:distance/center/:latitudeLongitude/unit/:unit')
  .get(getTourWithinHandler);

router
  .route('/distances/:latitudeLongitude/unit/:unit')
  .get(getDistancesHandler);

router
  .route('/')
  .get(getAllToursHandler)
  .post(
    protectRouteHandler,
    restrictTo('admin', 'lead-guide'),
    addNewTourHandler
  );

router
  .route('/:id')
  .get(protectRouteHandler, getSingleTourHandler)
  .patch(
    protectRouteHandler,
    restrictTo('admin', 'lead-guide'),
    uploadTourImagesHandler,
    resizeTourImage,
    patchTourHandler
  )
  .delete(
    protectRouteHandler,
    restrictTo('admin', 'lead-guide'),
    deleteTourHandler
  );

module.exports = router;
