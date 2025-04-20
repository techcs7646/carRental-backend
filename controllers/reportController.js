const Booking = require('../models/bookingModel');

exports.getRevenueReport = async (req, res) => {
    try {
        const revenueData = await Booking.aggregate([
            { $match: { status: 'confirmed' } },
            {
                $group: {
                    _id: { $month: '$createdAt' },
                    revenue: { $sum: '$totalPrice' }
                }
            },
            {
                $project: {
                    name: {
                        $switch: {
                            branches: [
                                { case: { $eq: ['$_id', 1] }, then: 'January' },
                                { case: { $eq: ['$_id', 2] }, then: 'February' },
                                { case: { $eq: ['$_id', 3] }, then: 'March' },
                                { case: { $eq: ['$_id', 4] }, then: 'April' },
                                { case: { $eq: ['$_id', 5] }, then: 'May' },
                                { case: { $eq: ['$_id', 6] }, then: 'June' },
                                { case: { $eq: ['$_id', 7] }, then: 'July' },
                                { case: { $eq: ['$_id', 8] }, then: 'August' },
                                { case: { $eq: ['$_id', 9] }, then: 'September' },
                                { case: { $eq: ['$_id', 10] }, then: 'October' },
                                { case: { $eq: ['$_id', 11] }, then: 'November' },
                                { case: { $eq: ['$_id', 12] }, then: 'December' }
                            ]
                        }
                    },
                    revenue: 1,
                    _id: 0
                }
            }
        ]);

        res.json({ revenueData });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getBookingStats = async (req, res) => {
    try {
        const totalBookings = await Booking.countDocuments();
        const confirmedBookings = await Booking.countDocuments({ status: 'confirmed' });
        const pendingBookings = await Booking.countDocuments({ status: 'pending' });
        const cancelledBookings = await Booking.countDocuments({ status: 'cancelled' });

        const bookingStats = [
            { name: 'Total Bookings', value: totalBookings },
            { name: 'Confirmed', value: confirmedBookings },
            { name: 'Pending', value: pendingBookings },
            { name: 'Cancelled', value: cancelledBookings }
        ];

        res.json({ bookingStats });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getOverviewReport = async (req, res) => {
    try {
        const today = new Date();
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1);
        const twoMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 2);

        // Current month data
        const currentMonthData = await Booking.aggregate([
            {
                $match: {
                    status: 'confirmed',
                    createdAt: { $gte: lastMonth }
                }
            },
            {
                $group: {
                    _id: null,
                    revenue: { $sum: '$totalPrice' },
                    bookings: { $sum: 1 }
                }
            }
        ]);

        // Previous month data
        const previousMonthData = await Booking.aggregate([
            {
                $match: {
                    status: 'confirmed',
                    createdAt: { 
                        $gte: twoMonthsAgo,
                        $lt: lastMonth
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    revenue: { $sum: '$totalPrice' },
                    bookings: { $sum: 1 }
                }
            }
        ]);

        // Calculate growth percentages
        const currentRevenue = currentMonthData[0]?.revenue || 0;
        const previousRevenue = previousMonthData[0]?.revenue || 0;
        const currentBookings = currentMonthData[0]?.bookings || 0;
        const previousBookings = previousMonthData[0]?.bookings || 0;

        const revenueGrowth = previousRevenue === 0 ? 100 : 
            ((currentRevenue - previousRevenue) / previousRevenue) * 100;
        
        const bookingGrowth = previousBookings === 0 ? 100 : 
            ((currentBookings - previousBookings) / previousBookings) * 100;

        const overview = {
            totalRevenue: currentRevenue,
            totalBookings: await Booking.countDocuments(),
            averageDailyRevenue: currentRevenue / 30,
            revenueGrowth: Math.round(revenueGrowth * 100) / 100,
            bookingGrowth: Math.round(bookingGrowth * 100) / 100
        };

        res.json({ overview });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};