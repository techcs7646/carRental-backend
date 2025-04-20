const User = require('../models/userModel');
const Booking = require('../models/bookingModel');

exports.getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Get total users count
        const totalUsers = await User.countDocuments();

        // Get users with pagination
        const users = await User.find()
            .select('name email createdAt status')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Get booking counts for each user
        const usersWithBookings = await Promise.all(
            users.map(async (user) => {
                const totalBookings = await Booking.countDocuments({ userId: user._id });
                return {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    joinDate: user.createdAt,
                    totalBookings,
                    status: user.status || 'Active',
                    createdAt: user.createdAt
                };
            })
        );

        res.json({
            success: true,
            users: usersWithBookings,
            totalPages: Math.ceil(totalUsers / limit),
            currentPage: page,
            totalUsers
        });
    } catch (error) {
        console.error('Error in getAllUsers:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.updateUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { status } = req.body;

        
        if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        const validStatuses = ['Active', 'Banned'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        // Find and update user
        const user = await User.findByIdAndUpdate(
            userId,
            { status },
            { new: true }
        ).select('_id status');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: `User status updated to ${status} successfully`,
            user: {
                _id: user._id,
                status: user.status
            }
        });
    } catch (error) {
        console.error('Error in updateUserStatus:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getUserDetails = async (req, res) => {
    try {
        const { userId } = req.params;

        // Check if userId is valid MongoDB ObjectId
        if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        // Get user details
        const user = await User.findById(userId)
            .select('name email createdAt status');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get user's booking history
        const bookings = await Booking.find({ userId })
            .populate('carId', 'name brand model')
            .sort({ createdAt: -1 });

        // Format booking history
        const bookingHistory = bookings.map(booking => ({
            _id: booking._id,
            carId: {
                name: booking.carId.name,
                brand: booking.carId.brand,
                model: booking.carId.model
            },
            startDate: booking.startDate,
            endDate: booking.endDate,
            amount: booking.totalAmount,
            status: booking.status
        }));

        res.json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                joinDate: user.createdAt,
                totalBookings: bookings.length,
                status: user.status,
                bookingHistory
            }
        });
    } catch (error) {
        console.error('Error in getUserDetails:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};