//Query Mongoose find()
//Request query params req.query

class APIFeatures {
  constructor(queryMongoose, requestQueryParams) {
    this.query = queryMongoose;
    this.requestQueryParams = requestQueryParams;
  }

  filter() {
    const queryParams = { ...this.requestQueryParams };
    const excludedFields = {
      page: true,
      sort: true,
      limit: true,
      fields: true,
    };

    const filteredQuery = Object.entries(queryParams)
      .filter(([name]) => !excludedFields[name])
      .reduce((acc, [name, value]) => {
        acc[name] = value;
        return acc;
      }, {});

    const cleanedQueryStr = JSON.stringify(filteredQuery).replace(
      /\b(gte|lte|gt|lt)\b/g,
      (match) => `$${match}`
    );

    this.query = this.query.find(JSON.parse(cleanedQueryStr));

    return this;
  }

  // filter() {
  //   const queryObj = { ...this.requestQueryParams };
  //   const excludedFields = ['page', 'sort', 'limit', 'fields'];
  //   excludedFields.forEach((el) => delete queryObj[el]);
  //
  //   // 1B) Advanced filtering
  //   let queryStr = JSON.stringify(queryObj);
  //   queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
  //
  //   this.query = this.query.find(JSON.parse(queryStr));
  //
  //   return this;
  // }

  sort() {
    if ('sort' in this.requestQueryParams) {
      const { sort } = this.requestQueryParams;
      const sortBy = sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }

    return this;
  }

  limitFields() {
    if ('fields' in this.requestQueryParams) {
      const { fields } = this.requestQueryParams;
      const queryFields = fields.split(',').join(' ');
      this.query = this.query.select(queryFields);
    } else {
      this.query = this.query.select('-__v');
    }

    return this;
  }

  paginate() {
    const page = parseInt(this.requestQueryParams.page, 10) || 1;
    const limit = parseInt(this.requestQueryParams.limit, 10) || 100;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;
