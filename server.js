const dotenv = require('dotenv');
const mongoose = require('mongoose');

//Handler of node synchronous errors
process.on('uncaughtException', ({ name, message }) => {
  console.log('UNCAUGHT EXCEPTION!', 'Shutting down...');
  console.log(name, message);
  process.exit(1);
});

dotenv.config({ path: './config.env' });

const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose.connect(DB).then(() => console.log('DB Connection successful!'));

const port = process.env.PORT || 3000;
const hostname = process.env.HOSTNAME;

const server = app.listen(port, hostname, () => {
  console.log(
    `App is running on port ${port} in ${hostname} on ${process.env.NODE_ENV} mode`
  );
});

//Safety Net last result server errors
//Handling of asynchronous errors
process.on('unhandledRejection', ({ name, message }) => {
  console.log('UNHANDLED REJECTION!', 'Shutting down...');
  console.log(name, message);

  server.close(() => process.exit(1));
});

//Handler of synchronous errors
process.on('uncaughtException', ({ name, message }) => {
  console.log('UNCAUGHT EXCEPTION!', 'Shutting down...');
  console.log(name, message);
  server.close(() => process.exit(1));
});
