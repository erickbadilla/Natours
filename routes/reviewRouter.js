const router = require('express').Router({
  mergeParams: true, //Nested Routes, we will gain access of the params of tour router
});

const {
  getAllReviewsHandler,
  createReviewHandler,
  deleteReviewHandler,
  updateReviewHandler,
  setTourUserIdsHandler,
  getSingleReviewHandler,
} = require('../controllers/reviewController');
const {
  protectRouteHandler,
  restrictTo,
} = require('../controllers/authController');

router.use(protectRouteHandler);

router
  .route('/')
  .get(getAllReviewsHandler)
  .post(restrictTo('user'), setTourUserIdsHandler, createReviewHandler);

router
  .route('/:id')
  .get(getSingleReviewHandler)
  .patch(restrictTo('user', 'admin'), updateReviewHandler)
  .delete(restrictTo('user', 'admin'), deleteReviewHandler);

module.exports = router;
