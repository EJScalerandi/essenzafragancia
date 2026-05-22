const express = require('express');
const { getSettings } = require('../controllers/store.controller');

const router = express.Router();

router.get('/settings', getSettings);

module.exports = router;
