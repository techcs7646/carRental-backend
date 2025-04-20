const Booking = require('../models/bookingModel');
const Car = require('../models/carModel');

exports.createBooking = async (req, res) => {
    try {
        const {
            carId,
            userId,
            startDate,
            endDate,
            pickupTime,
            dropoffTime,
            pickupLocation,
            dropoffLocation,
            totalAmount
        } = req.body;

        // Validate dates
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date format'
            });
        }

        if (start > end) {
            return res.status(400).json({
                success: false,
                message: 'Start date must be before end date'
            });
        }

        // Check car availability
        const car = await Car.findById(carId);
        if (!car) {
            return res.status(404).json({
                success: false,
                message: 'Car not found'
            });
        }

        if (!car.isAvailable) {
            return res.status(400).json({
                success: false,
                message: 'Car is not available for rental'
            });
        }

        // Check for existing bookings
        const existingBooking = await Booking.findOne({
            carId,
            status: { $nin: ['cancelled', 'completed'] },
            $or: [
                {
                    startDate: { $lte: end },
                    endDate: { $gte: start }
                }
            ]
        });

        if (existingBooking) {
            return res.status(400).json({
                success: false,
                message: 'Car is already booked for these dates'
            });
        }

        // Create booking
        const booking = await Booking.create({
            carId,
            userId,
            startDate,
            endDate,
            pickupTime,
            dropoffTime,
            pickupLocation,
            dropoffLocation,
            totalAmount,
            status: 'pending'
        });

        res.status(201).json({
            success: true,
            data: {
                _id: booking._id,
                carId: booking.carId,
                userId: booking.userId,
                startDate: booking.startDate,
                endDate: booking.endDate,
                totalAmount: booking.totalAmount,
                status: booking.status
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.updateBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Validate status
        const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        // Update booking status
        const booking = await Booking.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        res.json({
            success: true,
            data: booking
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


exports.getUserBookings = async (req, res) => {
    try {
        const userId = req.user.id;

        const bookings = await Booking.find({ userId })
            .populate({
                path: 'carId',
                select: 'name brand model year price image fuelType transmission type seats features'
            })
            .sort({ createdAt: -1 }); 

        const formattedBookings = bookings.map(booking => ({
            _id: booking._id,
            startDate: booking.startDate,
            endDate: booking.endDate,
            pickupTime: booking.pickupTime,
            dropoffTime: booking.dropoffTime,
            pickupLocation: booking.pickupLocation,
            dropoffLocation: booking.dropoffLocation,
            totalAmount: booking.totalAmount,
            status: booking.status,
            car: {
                id: booking.carId._id,
                name: booking.carId.name,
                brand: booking.carId.brand,
                model: booking.carId.model,
                year: booking.carId.year,
                price: booking.carId.price,
                image: booking.carId.image,
                fuelType: booking.carId.fuelType,
                transmission: booking.carId.transmission,
                type: booking.carId.type,
                seats: booking.carId.seats,
                features: booking.carId.features
            }
        }));

        res.json({
            success: true,
            data: formattedBookings
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get booking by ID
exports.getBookingById = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate({
                path: 'carId',
                select: 'name brand model year price image fuelType transmission type seats features'
            });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        const formattedBooking = {
            _id: booking._id,
            carId: booking.carId._id,
            car: {
                name: booking.carId.name,
                brand: booking.carId.brand,
                model: booking.carId.model,
                year: booking.carId.year,
                price: booking.carId.price,
                image: booking.carId.image,
                fuelType: booking.carId.fuelType,
                transmission: booking.carId.transmission,
                type: booking.carId.type,
                seats: booking.carId.seats,
                features: booking.carId.features
            },
            startDate: booking.startDate,
            endDate: booking.endDate,
            pickupTime: booking.pickupTime,
            dropoffTime: booking.dropoffTime,
            pickupLocation: booking.pickupLocation,
            dropoffLocation: booking.dropoffLocation,
            totalAmount: booking.totalAmount,
            status: booking.status
        };

        res.json({
            success: true,
            data: formattedBooking
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Cancel booking
exports.cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check if booking can be cancelled
        if (booking.status === 'completed' || booking.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: `Booking cannot be cancelled as it is already ${booking.status}`
            });
        }

        // Update booking status to cancelled
        booking.status = 'cancelled';
        await booking.save();

        res.json({
            success: true,
            data: {
                _id: booking._id,
                status: booking.status,
                startDate: booking.startDate,
                endDate: booking.endDate,
                totalAmount: booking.totalAmount,
                pickupLocation: booking.pickupLocation,
                dropoffLocation: booking.dropoffLocation
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
