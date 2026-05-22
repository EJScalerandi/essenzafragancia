const express = require('express');
const { authRequired, adminRequired } = require('../middlewares/auth');

const adminProducts = require('../controllers/adminProducts.controller');
const adminOrders = require('../controllers/adminOrders.controller');
const store = require('../controllers/store.controller');

const router = express.Router();

router.use(authRequired, adminRequired);

// Products
router.get('/products', adminProducts.list);
router.post('/products', adminProducts.create);
router.put('/products/:id', adminProducts.update);
router.post('/products/:id/images/:kind', adminProducts.uploadProductImage);
router.delete('/products/:id', adminProducts.remove);

// Orders
router.get('/orders', adminOrders.list);
router.get('/inbox', adminOrders.inbox);
router.get('/orders/:id', adminOrders.getById);
router.patch('/orders/:id/fulfillment', adminOrders.patchFulfillment);
router.patch('/orders/:id/payment/verify-bank-transfer', adminOrders.verifyBankTransferPayment);

// Order messages (private, admin)
router.get('/orders/:id/messages', adminOrders.listMessages);
router.post('/orders/:id/messages', adminOrders.postMessage);

// Store settings
router.patch('/store/settings', store.patchSettings);
router.post('/store/music-tracks', store.uploadMusicTrack);
router.delete('/store/music-tracks/:id', store.deleteMusicTrack);
router.post('/store/home-images', store.uploadHomeImage);
router.delete('/store/home-images/:id', store.deleteHomeImage);

module.exports = router;
