const express = require('express');
const router = express.Router();
const { 
    createBooking, 
    updateBookingStatus, 
    getUserBookings,
    getBookingById,
    cancelBooking 
} = require('../controllers/bookingController');
const { protect } = require('../middleware/userAuthMiddleware');

router.post('/', createBooking);
router.get('/my-bookings', protect, getUserBookings);
router.get('/:id', protect, getBookingById);
router.put('/:id/status', protect, updateBookingStatus);
router.put('/:id/cancel', protect, cancelBooking);

module.exports = router;