const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const { createToken } = require('../utils/jwt');

// Register new user
exports.registerUser = async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }

        const user = await User.create({
            name,
            email,
            password,
            phone,
            role: 'user'
        });

        res.status(201).json({
            success: true,
            token: createToken(user),
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone
            }
        });
    } catch (error) {
        console.error('Error in registerUser:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Login user
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (user && (await user.matchPassword(password))) {
            res.json({
                success: true,
                token: createToken(user),
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone
                }
            });
        } else {
            res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
    } catch (error) {
        console.error('Error in loginUser:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get user profile
exports.getProfile = async (req, res) => {
    try {
        // Get user details
        const user = await User.findById(req.user._id)
            .select('-password')
            .lean();

        // Get user's bookings
        const bookings = await Booking.find({ userId: req.user._id })
            .populate('carId', '_id name brand image')
            .sort({ createdAt: -1 })
            .lean();

        // Format the response
        const formattedBookings = bookings.map(booking => ({
            _id: booking._id,
            car: {
                _id: booking.carId._id,
                name: booking.carId.name,
                brand: booking.carId.brand,
                image: booking.carId.image
            },
            startDate: booking.startDate,
            endDate: booking.endDate,
            totalAmount: booking.totalAmount,
            status: booking.status
        }));

        res.json({
            success: true,
            data: {
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    joinedDate: user.createdAt
                },
                bookings: formattedBookings
            }
        });
    } catch (error) {
        console.error('Error in getProfile:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update user profile
exports.updateProfile = async (req, res) => {
    try {
        const { name, email, phone } = req.body;

        // Check if email already exists
        const existingUser = await User.findOne({ email, _id: { $ne: req.user._id } });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already in use'
            });
        }
        
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { name, email, phone },
            { new: true }
        ).select('-password');

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    joinedDate: user.createdAt
                }
            }
        });
    } catch (error) {
        console.error('Error in updateProfile:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Change password
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        const user = await User.findById(req.user._id);
        if (!(await user.matchPassword(currentPassword))) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Error in changePassword:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
