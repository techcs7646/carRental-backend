const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/userAuthMiddleware');
const {
    registerUser,
    loginUser,
    getProfile,
    updateProfile,
    changePassword
} = require('../controllers/userController');

// Auth routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Profile routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

module.exports = router;