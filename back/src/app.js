const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const { notFoundHandler, errorHandler } = require('./middlewares/errors');
const { streamHomeImage, streamMusicTrack, streamProductImage } = require('./controllers/media.controller');

const authRoutes = require('./routes/auth.routes');
const accountRoutes = require('./routes/account.routes');
const storeRoutes = require('./routes/store.routes');
const productsRoutes = require('./routes/products.routes');
const ordersRoutes = require('./routes/orders.routes');
const adminRoutes = require('./routes/admin.routes');
const mpRoutes = require('./routes/mp.routes');

function corsOrigin() {
  const raw = process.env.CORS_ORIGIN || '*';
  if (raw === '*') return '*';
  const values = raw.split(',').map((value) => value.trim()).filter(Boolean);
  return values.length <= 1 ? values[0] : values;
}

function createApp() {
  const app = express();

  app.set('trust proxy', 1);

  app.use(cors({
    origin: corsOrigin(),
    credentials: true,
  }));

  app.use(express.json({ limit: '80mb' }));
  app.use(morgan('dev'));

  app.get('/media/music/:fileName', streamMusicTrack);
  app.get('/media/home-images/:fileName', streamHomeImage);
  app.get('/media/products/:fileName', streamProductImage);
  app.use('/media', express.static(path.join(__dirname, '..', 'public')));

  app.get('/api/health', (req, res) => {
    res.json({ ok: true, ts: new Date().toISOString() });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/account', accountRoutes);
  app.use('/api/store', storeRoutes);
  app.use('/api/products', productsRoutes);
  app.use('/api/orders', ordersRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/payments/mp', mpRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
