const express = require('express');
const {
  register,
  login,
  me,
  updateProfile,
  myOrders,
  forgotPassword,
  resetPassword,
} = require('../controllers/account.controller');
const { authRequired } = require('../middlewares/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', authRequired, me);
router.patch('/me', authRequired, updateProfile);
router.put('/me', authRequired, updateProfile);
router.put('/profile', authRequired, updateProfile);
router.patch('/profile', authRequired, updateProfile);
router.get('/orders', authRequired, myOrders);

module.exports = router;
