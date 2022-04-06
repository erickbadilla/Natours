const express = require('express');

const {
  getUserHandler,
  updateUserHandler,
  deleteUserHandler,
  createUserHandler,
  getAllUsersHandler,
  updateMeHandler,
  deleteMeHandler,
  getMeMiddleware,
  uploadUserPhoto,
  resizeUserPhoto,
} = require('../controllers/userController');

const {
  signUpHandler,
  loginHandler,
  protectRouteHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
  updatePasswordHandler,
  restrictTo,
  logoutHandler,
} = require('../controllers/authController');

const router = express.Router();

//Not authenticated
router.post('/signup', signUpHandler);
router.post('/login', loginHandler);
router.get('/logout', logoutHandler);
router.post('/forgotPassword', forgotPasswordHandler);
router.patch('/resetPassword/:token', resetPasswordHandler);

//User must be authenticated
//Protects all this routes from this middleware
router.use(protectRouteHandler);

router.patch('/updateMyPassword', updatePasswordHandler);
router.patch('/updateMe', uploadUserPhoto, resizeUserPhoto, updateMeHandler);
router.delete('/deleteMe', deleteMeHandler);
router.get('/me', getMeMiddleware, getUserHandler);

//Restricts to admin this routes
router.use(restrictTo('admin'));

router.route('/').get(getAllUsersHandler).post(createUserHandler);

router
  .route('/:id')
  .get(protectRouteHandler, getUserHandler)
  .patch(protectRouteHandler, restrictTo('admin'), updateUserHandler)
  .delete(protectRouteHandler, restrictTo('admin'), deleteUserHandler);

module.exports = router;
