const Booking = require('../models/bookingModel');

exports.getAllBookings = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        let query = {};
        if (req.query.status) {
            query.status = req.query.status;
        }

        const totalBookings = await Booking.countDocuments(query);

        const bookings = await Booking.find(query)
            .populate('userId', '_id name email')
            .populate('carId', '_id name brand model')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const formattedBookings = bookings.map(booking => ({
            _id: booking._id,
            userId: booking.userId ? {
                _id: booking.userId._id,
                name: booking.userId.name,
                email: booking.userId.email
            } : null,
            carId: booking.carId ? {
                _id: booking.carId._id,
                name: booking.carId.name,
                brand: booking.carId.brand,
                model: booking.carId.model
            } : null,
            startDate: booking.startDate,
            endDate: booking.endDate,
            amount: booking.totalAmount,
            status: booking.status,
            createdAt: booking.createdAt,
            pickupLocation: booking.pickupLocation,
            dropoffLocation: booking.dropoffLocation
        }));

        res.json({
            success: true,
            bookings: formattedBookings,
            totalPages: Math.ceil(totalBookings / limit),
            currentPage: page,
            totalBookings
        });
    } catch (error) {
        console.error('Error in getAllBookings:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.updateBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate if ID is valid MongoDB ObjectId
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid booking ID format'
            });
        }

        const { status } = req.body;

        // Validate status
        const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        // First check if booking exists
        const existingBooking = await Booking.findById(id);
        if (!existingBooking) {
            return res.status(404).json({
                success: false,
                message: `Booking with ID ${id} not found`
            });
        }

        // Update booking status
        const booking = await Booking.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        res.json({
            success: true,
            _id: booking._id,
            status: booking.status,
            message: `Booking status updated to ${status} successfully`
        });
    } catch (error) {
        console.error('Error in updateBookingStatus:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while updating booking status'
        });
    }
};

exports.getSingleBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('userId', '_id name email')
            .populate('carId', '_id name brand model');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        const formattedBooking = {
            _id: booking._id,
            userId: booking.userId ? {
                _id: booking.userId._id,
                name: booking.userId.name,
                email: booking.userId.email
            } : null,
            carId: booking.carId ? {
                _id: booking.carId._id,
                name: booking.carId.name,
                brand: booking.carId.brand,
                model: booking.carId.model
            } : null,
            startDate: booking.startDate,
            endDate: booking.endDate,
            amount: booking.totalAmount,
            status: booking.status,
            createdAt: booking.createdAt
        };

        res.json({
            success: true,
            data: formattedBooking
        });
    } catch (error) {
        console.error('Error in getSingleBooking:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};