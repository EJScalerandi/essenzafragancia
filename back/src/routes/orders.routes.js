const express = require('express');
const { authOptional } = require('../middlewares/auth');
const { create, getById, getPaymentProof, listMessages, postMessage, rotateToken } = require('../controllers/orders.controller');

const router = express.Router();

router.post('/', authOptional, create);

// Buyer access via order token OR admin via Bearer token (optional auth)
router.get('/:id', authOptional, getById);
router.get('/:id/payment-proof', authOptional, getPaymentProof);
router.get('/:id/messages', authOptional, listMessages);
router.post('/:id/messages', authOptional, postMessage);

// Optional: rotate/issue a new private token (buyer or admin)
router.post('/:id/rotate-token', authOptional, rotateToken);

module.exports = router;
