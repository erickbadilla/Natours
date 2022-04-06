const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/api-features');

const isValidId = (id) => !id || !id.length || id.length > 0;

const isBodyEmpty = (body) =>
  !body || typeof body !== 'object' || Object.keys(body).length === 0;

const getIdFromParams = ({ params: { id: requestId } }) => {
  if (!isValidId(requestId)) throw new AppError('Please sent a valid ID', 400);

  return requestId;
};

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const deletedDocument = await Model.findByIdAndDelete(getIdFromParams(req));

    if (!deletedDocument)
      return next(new AppError('No document found with that ID', 404));

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // if (isBodyEmpty(req.body))
    //   throw new AppError('Please sent a valid payload');

    const updatedDocument = await Model.findByIdAndUpdate(
      getIdFromParams(req),
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedDocument)
      return next(new AppError('No document found with that ID', 404));

    res.status(200).json({
      status: 'success',
      data: {
        data: updatedDocument,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const { body } = req;

    if (isBodyEmpty(body))
      return next(new AppError('Please sent a valid payload'));

    const newDocument = await Model.create(body);

    if (!newDocument) return next(new AppError('Document not created', 404));

    res.status(201).json({
      status: 'success',
      data: {
        data: newDocument,
      },
    });
  });

exports.getOne = (Model, populateOptions) =>
  catchAsync(async (req, res, next) => {
    const requestId = getIdFromParams(req);

    let query = Model.findById(requestId);

    query = populateOptions ? query.populate(populateOptions) : query;

    const document = await query;

    if (!document)
      return next(new AppError('No document found with that ID', 404));

    res.status(200).json({
      status: 'success',
      data: {
        document,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    //To Allow nested GET reviews on Tour. tour/ID/Reviews ("Hack")
    const filter = req.params.tourId ? { tour: req.params.tourId } : {};

    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    // //This is for stats of mongo db query
    // const documents = await features.query.explain();
    const documents = await features.query;

    res.status(200).json({
      status: 'success',
      results: documents.length,
      data: {
        data: documents,
      },
    });
  });
