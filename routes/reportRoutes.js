const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/adminAuthMiddleware');
const { 
    getRevenueReport, 
    getBookingStats, 
    getOverviewReport,
    getCarPerformance 
} = require('../controllers/reportsController');

router.get('/', protect, getOverviewReport);
router.get('/revenue', protect, getRevenueReport);
router.get('/bookings', protect, getBookingStats);
router.get('/car-performance', protect, getCarPerformance);

module.exports = router;