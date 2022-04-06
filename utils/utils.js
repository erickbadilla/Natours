const fs = require('fs');

const isObject = (value) => {
  if (value == null) throw new Error('Value is undefined or null');

  return typeof value === 'object';
};
const isObjectEmpty = (object) =>
  !isObject(object) ? false : !Object.keys(object).length;

const getDataFromRequest = ({ body }) =>
  isObjectEmpty(body) ? null : { ...body };

const updateFile = (path, tours, callback) =>
  fs.writeFile(path, JSON.stringify(tours), callback);

const isLessOrEqual = (value, valueToCompare) =>
  value < valueToCompare && value >= 0;

const getParamFromRequest = (request, field) => request.params[field];

module.exports = {
  isObject,
  isObjectEmpty,
  getDataFromRequest,
  updateFile,
  isLessOrEqual,
  getParamFromRequest,
};
