const User = require('../models/userModel');
const Car = require('../models/carModel');
const Booking = require('../models/bookingModel');

exports.getDashboardStats = async (req, res) => {
    try {
        const currentDate = new Date();
        const lastMonth = new Date(currentDate.setMonth(currentDate.getMonth() - 1));

        // Get current counts
        const [totalUsers, availableCars, activeBookings] = await Promise.all([
            User.countDocuments(),
            Car.countDocuments({ isAvailable: true }),
            Booking.countDocuments({ status: 'confirmed' })
        ]);

        // Get last month's counts for growth calculation
        const [lastMonthUsers, lastMonthCars, lastMonthBookings] = await Promise.all([
            User.countDocuments({ createdAt: { $lt: lastMonth } }),
            Car.countDocuments({ createdAt: { $lt: lastMonth } }),
            Booking.countDocuments({ createdAt: { $lt: lastMonth } })
        ]);

        // Calculate growth percentages
        const calculateGrowth = (current, previous) => {
            if (previous === 0) return '+100%';
            const growth = ((current - previous) / previous) * 100;
            return `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`;
        };

        res.json({
            totalUsers,
            availableCars,
            activeBookings,
            userGrowth: calculateGrowth(totalUsers, lastMonthUsers),
            carGrowth: calculateGrowth(availableCars, lastMonthCars),
            bookingGrowth: calculateGrowth(activeBookings, lastMonthBookings)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getMonthlyRevenue = async (req, res) => {
    try {
        // Get current date and reset time to start of day
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        // Calculate current month start and end
        const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const currentMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        // Calculate last month start and end
        const lastMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        const lastMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);

        // Get current month's revenue with proper date range
        const currentMonthRevenue = await Booking.aggregate([
            {
                $match: {
                    createdAt: { 
                        $gte: currentMonthStart,
                        $lte: currentMonthEnd
                    },
                    status: 'confirmed'
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$totalAmount' }
                }
            }
        ]);

        // Get last month's revenue with proper date range
        const lastMonthRevenue = await Booking.aggregate([
            {
                $match: {
                    createdAt: { 
                        $gte: lastMonthStart,
                        $lte: lastMonthEnd
                    },
                    status: 'confirmed'
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$totalAmount' }
                }
            }
        ]);

        // Get yearly data with proper month grouping
        const yearlyData = await Booking.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1)
                    },
                    status: 'confirmed'
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    revenue: { $sum: '$totalAmount' }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const formattedMonthlyData = yearlyData.map(item => ({
            month: months[item._id.month - 1],
            revenue: item.revenue
        }));

        const currentMonthTotal = currentMonthRevenue[0]?.total || 0;
        const lastMonthTotal = lastMonthRevenue[0]?.total || 0;

        // Calculate growth percentage
        let revenueGrowth;
        if (lastMonthTotal === 0 && currentMonthTotal === 0) {
            revenueGrowth = '0%';
        } else if (lastMonthTotal === 0) {
            revenueGrowth = 'N/A';
        } else {
            const growthRate = ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
            revenueGrowth = `${growthRate >= 0 ? '+' : ''}${growthRate.toFixed(1)}%`;
        }

        res.json({
            currentMonthRevenue: currentMonthTotal,
            revenueGrowth: revenueGrowth,
            monthlyData: formattedMonthlyData
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getRecentBookings = async (req, res) => {
    try {
        const recentBookings = await Booking.find()
            .populate('userId', '_id name email')
            .populate('carId', '_id name brand model')
            .sort({ createdAt: -1 })
            .limit(10);

        const formattedBookings = recentBookings.map(booking => ({
            _id: booking._id,
            userId: {
                _id: booking.userId._id,
                name: booking.userId.name,
                email: booking.userId.email
            },
            carId: {
                _id: booking.carId._id,
                name: booking.carId.name,
                brand: booking.carId.brand,
                model: booking.carId.model
            },
            startDate: booking.startDate,
            endDate: booking.endDate,
            amount: booking.totalAmount,
            status: booking.status,
            createdAt: booking.createdAt
        }));

        res.json(formattedBookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};