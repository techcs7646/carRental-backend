const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/adminAuthMiddleware');
const { getAllBookings, updateBookingStatus, getSingleBooking } = require('../controllers/adminBookingController');
const {
    loginAdmin,
    getProfile,
    updateProfile,
    changePassword,
    registerAdmin
} = require('../controllers/adminController');
const {
    addCar,
    getAllCars,
    getCarById,
    updateCar,
    deleteCar,
    getCarImage  // Add this import
} = require('../controllers/carController');
const {
    getDashboardStats,
    getMonthlyRevenue,
    getRecentBookings
} = require('../controllers/dashboardController');
const { getAllUsers, getUserDetails, updateUserStatus } = require('../controllers/adminUserController');

// Dashboard routes
router.get('/dashboard', protect, getDashboardStats);
router.get('/revenue', protect, getMonthlyRevenue);
router.get('/recent-bookings', protect, getRecentBookings);
const upload = require('../utils/multer');

// Auth routes
router.post('/login', loginAdmin);
router.post('/register', registerAdmin);

// Profile routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

// Car routes
router.post('/cars', protect, upload.single('image'), addCar);
router.get('/cars', protect, getAllCars);
router.get('/cars/:id', protect, getCarById);
router.put('/cars/:id', protect, updateCar);
router.delete('/cars/:id', protect, deleteCar);

// Booking routes
router.get('/bookings', protect, getAllBookings);
router.get('/bookings/:id', protect, getSingleBooking);
router.put('/bookings/:id/status', protect, updateBookingStatus);

// User management routes
router.get('/users', protect, getAllUsers);
router.get('/users/:userId', protect, getUserDetails);
router.put('/users/:userId/status', protect, updateUserStatus);

module.exports = router;