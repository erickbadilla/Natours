const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: '../../config.env' });

const DB = process.env.DATABASE.replace(
  '<password>',
  process.env.DATABASE_PASSWORD
);

const fs = require('fs');
const Tour = require('../../models/tour.model');
const User = require('../../models/user.model');
const Review = require('../../models/review.model');

const toursFileData = fs
  .readFileSync(`${__dirname}/tours.json`, 'utf8')
  .toString();

const usersFileData = fs
  .readFileSync(`${__dirname}/users.json`, 'utf8')
  .toString();

const reviewsFileData = fs
  .readFileSync(`${__dirname}/reviews.json`, 'utf8')
  .toString();

const tours = JSON.parse(toursFileData);
const users = JSON.parse(usersFileData);
const reviews = JSON.parse(reviewsFileData);

const importData = async () => {
  try {
    await mongoose.connect(DB);

    await User.create(users, { validateBeforeSave: false });
    await Tour.create(tours);
    await Review.create(reviews);

    console.log('Data successfully loaded');
  } catch (e) {
    console.error(e);
  }
};

const deleteAllToursData = async () => {
  try {
    await mongoose.connect(DB);

    await User.deleteMany();
    await Tour.deleteMany();
    await Review.deleteMany();

    console.log('Data successfully deleted');
  } catch (e) {
    console.error(e);
  }
};

const resetDatabase = async () => {
  try {
    await mongoose.connect(DB);
    await deleteAllToursData();
    await importData();
    console.log('DB reset successfully ');
  } catch (e) {
    console.error(e);
  }
};

const createIndex = async () => {
  try {
    await mongoose.connect(DB);

    await Tour.collection.createIndex({
      startLocation: '2dsphere',
    });
  } catch (e) {
    console.log(e);
  }
};

const exitConsole = () => process.exit();

switch (process.argv[2]) {
  case '--import':
    importData().then(exitConsole);
    break;

  case '--delete':
    deleteAllToursData().then(exitConsole);
    break;

  case '--reset':
    resetDatabase().then(exitConsole);
    break;

  case '--index':
    createIndex().then(exitConsole);
    break;

  default: {
    console.log('No parameters');
    createIndex().then(exitConsole);
  }
}
