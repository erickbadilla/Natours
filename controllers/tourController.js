const multer = require('multer');
const sharp = require('sharp');

const Tour = require('../models/tour.model');
const { getParamFromRequest } = require('../utils/utils');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const handlerFactory = require('./handlerFactory');

const multerStorage = multer.memoryStorage();

//Predicate to test if it's really an image
const multerFiler = (req, file, callback) => {
  if (!file.mimetype.startsWith('image'))
    return callback(
      new AppError('Not an image! Please upload only images.', 400),
      false
    );

  callback(null, true);
};

//No storage image will be saved in memory, but not persisted
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFiler,
});

exports.resizeTourImage = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover && !req.files.images) return next();

  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  req.body.images = [];

  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333, {})
    .toFormat('jpeg', {})
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  await Promise.all(
    req.files.images.map(async (image, index) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${index + 1}.jpeg`;

      await sharp(image.buffer)
        .resize(2000, 1333, {})
        .toFormat('jpeg', {})
        .jpeg({ quality: 80 })
        .toFile(`public/img/tours/${filename}`);

      req.body.images.push(filename);
    })
  );

  next();
});

exports.uploadTourImagesHandler = upload.fields([
  {
    name: 'imageCover',
    maxCount: 1,
  },
  {
    name: 'images',
    maxCount: 3,
  },
]);

exports.aliasTopToursHandler = async (req, res, next) => {
  const { query } = req;
  query.limit = 5;
  query.sort = '-ratingsAverage,price';
  query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getTourStatsHandler = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: {
          $toUpper: '$difficulty',
        },
        toursQuantity: {
          $sum: 1,
        },
        ratingsQuantity: {
          $sum: '$ratingsQuantity',
        },
        averageRating: {
          $avg: '$ratingsAverage',
        },
        averagePrice: {
          $avg: '$price',
        },
        minPrice: {
          $min: '$price',
        },
        maxPrice: {
          $max: '$price',
        },
      },
    },
    {
      $sort: {
        averagePrice: 1,
      },
    },
    // {
    //   $match: {
    //     _id: { $ne: 'EASY' },
    //   },
    // },
  ]);

  if (!stats) return next(new AppError('Error getting stats', 404));

  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlanHandler = catchAsync(async (req, res, next) => {
  const year = parseInt(getParamFromRequest(req, 'year'), 10);

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: {
          $month: '$startDates',
        },
        toursQuantityStarts: {
          $sum: 1,
        },
        tours: {
          $push: '$name',
        },
      },
    },
    {
      $addFields: {
        month: '$_id',
      },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: {
        toursQuantityStarts: -1,
      },
    },
    // {
    //   $limit: 3,
    // },
  ]);

  if (!plan) return next(new AppError('Error getting plan', 404));

  res.status(200).json({
    status: 'success',
    data: {
      results: plan.length,
      plan,
      year,
    },
  });
});
// '/tours-within/:distance/center/:latitudeLongitude/unit/:unit',
// '/tours-within/:distance/center/:34.019940638313265,-118.46212453351873/unit/:unit',

exports.getTourWithinHandler = catchAsync(async (req, res, next) => {
  const { distance, latitudeLongitude, unit } = req.params;
  const [latitude, longitude] = latitudeLongitude.split(',');
  //Mongo DB Expects Radiant unit distance divided between
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!latitude || !longitude)
    return next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lan.',
        400
      )
    );

  console.log(latitude, longitude, distance, unit);

  const tours = await Tour.find({
    startLocation: {
      $geoWithin: {
        $centerSphere: [[longitude, latitude], radius],
      },
    },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: tours,
  });
});

exports.getDistancesHandler = catchAsync(async (req, res, next) => {
  const { latitudeLongitude, unit } = req.params;
  const [latitude, longitude] = latitudeLongitude.split(',');

  if (!latitude || !longitude)
    return next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lan.',
        400
      )
    );

  //Convert miles to kilometers, convert meters to kilometers
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [parseInt(longitude, 10), parseInt(latitude, 10)],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier, //In Kilometers
      },
    },
    {
      $project: {
        distance: true,
        name: true,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    results: distances.length,
    data: distances,
  });
});

exports.addNewTourHandler = handlerFactory.createOne(Tour);
exports.getAllToursHandler = handlerFactory.getAll(Tour);
exports.getSingleTourHandler = handlerFactory.getOne(Tour, {
  path: 'reviews',
});
exports.patchTourHandler = handlerFactory.updateOne(Tour);
exports.deleteTourHandler = handlerFactory.deleteOne(Tour);
