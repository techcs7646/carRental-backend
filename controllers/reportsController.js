const Booking = require('../models/bookingModel');

exports.getRevenueReport = async (req, res) => {
    try {
        const { period = 'monthly', year = new Date().getFullYear() } = req.query;
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        if (period === 'monthly') {
            // Get monthly revenue data
            const monthlyData = await Booking.aggregate([
                {
                    $match: {
                        createdAt: {
                            $gte: new Date(year, 0, 1),
                            $lte: new Date(year, 11, 31)
                        }
                    }
                },
                {
                    $group: {
                        _id: { $month: '$createdAt' },
                        revenue: { $sum: '$totalAmount' },
                        bookings: { $sum: 1 }
                    }
                },
                { $sort: { '_id': 1 } }
            ]);

            // Create data for all months, even if no bookings
            const revenueData = months.map((month, index) => {
                const monthData = monthlyData.find(data => data._id === index + 1);
                return {
                    name: `${month} ${year}`,
                    revenue: monthData ? monthData.revenue : 0,
                    bookings: monthData ? monthData.bookings : 0
                };
            });

            res.json({
                success: true,
                revenueData
            });
        } else if (period === 'weekly') {
            // Get current week number
            const currentDate = new Date();
            const startOfYear = new Date(year, 0, 1);
            const currentWeek = Math.ceil((((currentDate - startOfYear) / 86400000) + startOfYear.getDay() + 1) / 7);

            // Generate data for all weeks up to current week
            const revenueData = [];
            for (let week = 1; week <= currentWeek; week++) {
                const weekData = await Booking.aggregate([
                    {
                        $match: {
                            createdAt: {
                                $gte: new Date(year, 0, (week - 1) * 7),
                                $lt: new Date(year, 0, week * 7)
                            }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            revenue: { $sum: '$totalAmount' },
                            bookings: { $sum: 1 }
                        }
                    }
                ]);

                revenueData.push({
                    name: `Week ${week}`,
                    revenue: weekData[0] ? weekData[0].revenue : 0,
                    bookings: weekData[0] ? weekData[0].bookings : 0
                });
            }

            res.json({
                success: true,
                revenueData
            });
        }
    } catch (error) {
        console.error('Error in getRevenueReport:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getBookingStats = async (req, res) => {
    try {
        const bookingStats = await Booking.aggregate([
            {
                $group: {
                    _id: '$status',
                    value: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    name: { $toUpper: { $substr: ['$_id', 0, 1] } },
                    value: 1
                }
            },
            { $sort: { name: 1 } }
        ]);

        const statusMap = {
            'pending': 'Pending',
            'confirmed': 'Confirmed',
            'completed': 'Completed',
            'cancelled': 'Cancelled'
        };

        const formattedStats = Object.entries(statusMap).map(([key, name]) => {
            const stat = bookingStats.find(s => s.name.toLowerCase() === key[0]);
            return {
                name,
                value: stat ? stat.value : 0
            };
        });

        res.json({
            success: true,
            bookingStats: formattedStats
        });
    } catch (error) {
        console.error('Error in getBookingStats:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getOverviewReport = async (req, res) => {
    try {
        const currentDate = new Date();
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const firstDayOfLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);

        // Get current month stats
        const currentMonthStats = await Booking.aggregate([
            {
                $match: {
                    createdAt: { $gte: firstDayOfMonth }
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$totalAmount' },
                    totalBookings: { $sum: 1 }
                }
            }
        ]);

        // Get last month stats
        const lastMonthStats = await Booking.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: firstDayOfLastMonth,
                        $lt: firstDayOfMonth
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$totalAmount' },
                    totalBookings: { $sum: 1 }
                }
            }
        ]);

        const currentRevenue = currentMonthStats[0]?.totalRevenue || 0;
        const currentBookings = currentMonthStats[0]?.totalBookings || 0;
        const lastRevenue = lastMonthStats[0]?.totalRevenue || 0;
        const lastBookings = lastMonthStats[0]?.totalBookings || 0;

        // Calculate daily average (current month)
        const daysInCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
        const averageDailyRevenue = currentRevenue / daysInCurrentMonth;

        // Calculate growth percentages
        const calculateGrowth = (current, previous) => {
            if (previous === 0) return 0;
            return ((current - previous) / previous) * 100;
        };

        res.json({
            success: true,
            overview: {
                totalRevenue: currentRevenue,
                totalBookings: currentBookings,
                averageDailyRevenue: Math.round(averageDailyRevenue * 100) / 100,
                revenueGrowth: Math.round(calculateGrowth(currentRevenue, lastRevenue) * 100) / 100,
                bookingGrowth: Math.round(calculateGrowth(currentBookings, lastBookings) * 100) / 100
            }
        });
    } catch (error) {
        console.error('Error in getOverviewReport:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getCarPerformance = async (req, res) => {
    try {
        const carStats = await Booking.aggregate([
            {
                $lookup: {
                    from: 'cars',
                    localField: 'carId',
                    foreignField: '_id',
                    as: 'carDetails'
                }
            },
            {
                $unwind: '$carDetails'
            },
            {
                $group: {
                    _id: '$carId',
                    name: { $first: '$carDetails.name' },
                    bookings: { $sum: 1 },
                    revenue: { $sum: '$totalAmount' }
                }
            },
            {
                $project: {
                    _id: 0,
                    name: 1,
                    bookings: 1,
                    revenue: 1
                }
            },
            {
                $sort: { revenue: -1 } 
            }
        ]);

        res.json({
            success: true,
            carStats
        });
    } catch (error) {
        console.error('Error in getCarPerformance:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};