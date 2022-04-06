const Review = require('../models/review.model');
const handlerFactory = require('./handlerFactory');

exports.setTourUserIdsHandler = (req, res, next) => {
  const { body: reviewPayload } = req;

  //Allow nested route
  //Will get data from params if no data in body
  if (!reviewPayload.tour) reviewPayload.tour = req.params.tourId;
  //Will get user from token
  if (!reviewPayload.user) reviewPayload.user = req.user.id;

  next();
};

exports.createReviewHandler = handlerFactory.createOne(Review);
exports.getAllReviewsHandler = handlerFactory.getAll(Review);
exports.updateReviewHandler = handlerFactory.updateOne(Review);
exports.getSingleReviewHandler = handlerFactory.getOne(Review);
exports.deleteReviewHandler = handlerFactory.deleteOne(Review);
