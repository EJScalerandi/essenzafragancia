const express = require('express');
const { authOptional } = require('../middlewares/auth');
const {
  createCheckout,
  getPaymentById,
  syncReturn,
  webhook,
} = require('../controllers/mp.controller');

const router = express.Router();

router.post('/create-checkout', authOptional, createCheckout);
router.post('/create-preference', authOptional, createCheckout);
router.post('/sync-return', authOptional, syncReturn);
router.post('/webhook', webhook);
router.get('/payment/:id', getPaymentById);

module.exports = router;
