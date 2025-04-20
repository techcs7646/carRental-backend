const express = require('express');
const router = express.Router();
const { protect: userProtect } = require('../middleware/userAuthMiddleware');
const { createPaymentIntent, confirmPayment } = require('../controllers/paymentController');

router.post('/create-payment-intent', userProtect, createPaymentIntent);
router.post('/confirm-payment', userProtect, confirmPayment);

module.exports = router;