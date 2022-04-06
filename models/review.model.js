const mongoose = require('mongoose');
const Tour = require('./tour.model');

const ReviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      minLength: [4, 'A review must contain a minimum 4 characters'],
      maxLength: [200, 'A review must contain a maximum of 200 characters'],
      required: [true, 'A review must have an review'],
    },
    rating: {
      type: Number,
      min: [0, 'The minimum rating of the review is 0'],
      max: [5, 'The maximum rating of the review is 5'],
      required: [true, 'A review must have a rating'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tour',
      required: [true, 'A review must belong to a tour'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A review must belong to a user'],
    },
  },
  {
    //This is important, because virtuals won't appear on request
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
    autoIndex: true,
  }
);

ReviewSchema.index(
  {
    tour: 1,
    user: 1,
  },
  { unique: true }
);

ReviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: 'user',
  //   select: 'name',
  // }).populate({
  //   path: 'tour',
  //   select: 'name photo',
  // });

  this.populate({
    path: 'user',
    select: 'name photo',
  });

  next();
});

ReviewSchema.statics.calculateAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRatings: {
          $sum: 1,
        },
        avgRating: {
          $avg: '$rating',
        },
      },
    },
  ]);

  //No reviews, set default value
  if (!stats[0]) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }

  const { nRatings: ratingsQuantity, avgRating: ratingsAverage } = stats[0];

  await Tour.findByIdAndUpdate(tourId, {
    ratingsQuantity,
    ratingsAverage,
  });
};

//It's better to use post because it won't take in account the saved document
// ReviewSchema.pre('save', function (next) {
//   //This point to current review to be saved
//
//   this.constructor.calculateAverageRatings(this.tour);
//   next();
// });

////ONE WAY
ReviewSchema.post('save', function (document, next) {
  //This point to current review to be saved
  this.constructor.calculateAverageRatings(this.tour);
  next();
});
//SECOND WAY
// ReviewSchema.post('save', (document, next) => {
//   document.constructor.calculateAverageRatings(document.tour);
//   next();
// });

// ReviewSchema.pre(/^findOneAnd/, async function (next) {
//   const review = await this.clone().findOne();
//   console.log(review);
//   next();
// });

//Jonas way to tackle problem
// ReviewSchema.pre(/^findOneAnd/, async function (next) {
//   this.review = await this.clone().findOne();
//   next();
// });
//
// ReviewSchema.post(/^findOneAnd/, async function () {
//   await this.review.constructor.calculateAverageRatings(this.review.tour);
// });

//My solution
ReviewSchema.post(/^findOneAnd/, (document, next) => {
  if (!document) return next();

  document.constructor.calculateAverageRatings(document.tour);

  next();
});

module.exports = mongoose.model('Review', ReviewSchema);
