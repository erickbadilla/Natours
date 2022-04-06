const mongoose = require('mongoose');
const slugify = require('slugify');
const util = require('util');

const defaultTourErrorMessage = 'A tour must have %s';
const maxLengthDefaultErrorMessage =
  'A tour %s must have less or equal then %d characters';
const minLengthDefaultErrorMessage =
  'A tour %s must have more or equal then %d characters';

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      trim: true,
      required: [true, util.format(defaultTourErrorMessage, 'a name')],
      maxLength: [40, util.format(maxLengthDefaultErrorMessage, 'name', 40)],
      minLength: [10, util.format(minLengthDefaultErrorMessage, 'name', 10)],
      // validate: [validator.isAlpha, 'Tour name must only contains characters'],
    },
    duration: {
      type: Number,
      required: [true, util.format(defaultTourErrorMessage, 'a duration')],
    },
    maxGroupSize: {
      type: Number,
      required: [true, util.format(defaultTourErrorMessage, 'a group size')],
    },
    difficulty: {
      type: String,
      required: [true, util.format(defaultTourErrorMessage, 'a difficulty')],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty must be either: easy, medium or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating average must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: (value) => Math.round(value * 10) / 10, // 4.666 46.666 47 4.7
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, util.format(defaultTourErrorMessage, 'a name')],
    },
    //Custom Validator false trigger validation error
    discount: {
      type: Number,
      validate: {
        validator: function (value) {
          //This only points to current doc on new document creation
          //WON'T work on deletes or updates
          return value < this.price;
        },
        message: (props) =>
          `Discount price ${props.value} cannot exceed regular tour price`,
      },
    },
    summary: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      required: [true, util.format(defaultTourErrorMessage, 'a description')],
    },
    imageCover: {
      type: String,
      required: [true, util.format(defaultTourErrorMessage, 'a cover image')],
    },
    images: {
      type: [String],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    slug: String,
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
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

//Indexes
//1 Ascending, -1 Descending
tourSchema.index({
  price: 1,
  ratingsAverage: -1,
});
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

//Virtual variables that are not saved on database, ideally for conversions
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

//Virtual Populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

// Document middleware, runs before save, create command
// Doesn't work with insertMany
// This points to the document
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, {
    lower: true,
  });
  next();
});

// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(
//     async (guideId) => await User.findById(guideId)
//   );
//
//   this.guides = await Promise.all(guidesPromises);
//
//   next();
// });

// tourSchema.pre('save', function (next) {
//   console.log('Will save document...');
//   next();
// });
//
// tourSchema.post('save', (document) => {
//   console.log('Enter middleware', document);
// });
// Document middleware, runs after it's saved on database.
// tourSchema.post('save', function (next) {
//   console.log(this);
//   next();
// });

//Query Middleware
//This points to the query
tourSchema.pre(/^find/, function (next) {
  this.find({
    secretTour: {
      $ne: true,
    },
  });
  this.start = Date.now();
  this.projection({
    secretTour: false,
    __v: false,
  });
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });

  next();
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start}`);
  //console.log(docs);
  next();
});

//Aggregation Middleware
//This filters when using an aggregation pipeline the documents with secretTour set to true
tourSchema.pre('aggregate', function (next) {
  const firstElementInPipeline = this.pipeline()[0].$geoNear;
  const secretTourFilterPipe = {
    $match: {
      secretTour: {
        $ne: true,
      },
    },
  };

  if (firstElementInPipeline) {
    this.pipeline()[0].shift();
    this.pipeline().unshift(secretTourFilterPipe);
    this.pipeline().unshift(firstElementInPipeline);
    return next();
  }

  this.pipeline().unshift(secretTourFilterPipe);

  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
