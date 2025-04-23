const Car = require('../models/carModel');
const Booking = require('../models/bookingModel');

// Create a new car
exports.addCar = async (req, res) => {
    try {
        // Debug log
        console.log('Request body:', req.body);
        console.log('Request file:', req.file);

        if (!req.body || !req.file) {
            return res.status(400).json({
                success: false,
                message: 'Missing required data or image'
            });
        }

        // Create car with form data
        const car = await Car.create({
            name: req.body.name,
            brand: req.body.brand,
            model: req.body.model,
            year: parseInt(req.body.year),
            price: parseFloat(req.body.price),
            seats: parseInt(req.body.seats),
            fuelType: req.body.fuelType.toLowerCase(),
            transmission: req.body.transmission.toLowerCase(),
            status: req.body.status,
            type: req.body.type,
            features: req.body.features ? JSON.parse(req.body.features) : [],
            image: `/uploads/cars/${req.file.filename}`,
            isAvailable: true
        });

        res.status(201).json({
            success: true,
            data: car
        });
    } catch (error) {
        console.error('Error in addCar:', error);
        res.status(400).json({ 
            success: false, 
            message: error.message 
        });
    }
};


// Get a single car by ID
exports.getCarById = async (req, res) => {
    try {
        const car = await Car.findById(req.params.id);
        
        if (!car) {
            return res.status(404).json({ message: 'Car not found' });
        }

        const carDetails = {
            id: car._id,
            name: car.name,
            price: car.price,
            image: car.image,
            category: car.category,
            available: car.isAvailable,
            features: car.features || [],
            power: car.power,
            speed: car.speed,
            transmission: car.transmission,
            fuelType: car.fuelType,
            seatingCapacity: car.seatingCapacity
        };

        res.json(carDetails);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// Search cars by name, brand, or model
exports.searchCars = async (req, res) => {
    try {
        const {
            search,
            priceRange,
            category,
            sortBy = 'name',
            page = 1,
            limit = 12
        } = req.query;

        let query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } }
            ];
        }

        if (category) {
            query.category = category;
        }

        if (priceRange) {
            switch (priceRange) {
                case 'under50':
                    query.price = { $lt: 50 };
                    break;
                case '50to100':
                    query.price = { $gte: 50, $lte: 100 };
                    break;
                case 'over100':
                    query.price = { $gt: 100 };
                    break;
            }
        }

        // Sort options
        let sortOptions = {};
        switch (sortBy) {
            case 'price-low':
                sortOptions = { price: 1 };
                break;
            case 'price-high':
                sortOptions = { price: -1 };
                break;
            default:
                sortOptions = { name: 1 };
        }

        const skip = (page - 1) * limit;

        const cars = await Car.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(limit)
            .select('name price image category isAvailable features power speed transmission fuelType seatingCapacity');

        
        const totalItems = await Car.countDocuments(query);
        const categories = await Car.distinct('category');

        
        const formattedCars = cars.map(car => ({
            id: car._id,
            name: car.name,
            price: car.price,
            image: car.image,
            category: car.category,
            available: car.isAvailable,
            features: car.features || [],
            power: car.power,
            speed: car.speed,
            transmission: car.transmission,
            fuelType: car.fuelType,
            seatingCapacity: car.seatingCapacity
        }));

        res.json({
            cars: formattedCars,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalItems / limit),
                totalItems
            },
            categories
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createCar = async (req, res) => {
    try {
        const {
            name,
            brand,
            model,
            year,
            price,
            seats,
            fuelType,
            transmission,
            status,
            type,
            image
        } = req.body;

        const car = await Car.create({
            name,
            brand,
            model,
            year,
            price,
            seats,
            fuelType,
            transmission,
            status,
            type,
            image,
            isAvailable: true
        });

        res.status(201).json(car);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.getCarImage = async (req, res) => {
    try {
        const car = await Car.findById(req.params.id);
        if (!car || !car.image) {
            return res.status(404).json({ message: 'Car image not found' });
        }

        res.json({ imageUrl: car.image });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.checkCarAvailability = async (req, res) => {
    try {
        const { id } = req.params;
        const { startDate, endDate } = req.query;

        
        console.log('Checking availability for car ID:', id);

        // Validate dates
        if (!startDate || !endDate) {
            return res.status(400).json({
                available: false,
                message: 'Please provide both start and end dates'
            });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        // Validate date format and logic
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({
                available: false,
                message: 'Invalid date format. Please use YYYY-MM-DD'
            });
        }

        if (start > end) {
            return res.status(400).json({
                available: false,
                message: 'Start date must be before end date'
            });
        }

        // Check if car exists and is generally available
        const car = await Car.findById(id);
        console.log('Found car:', car); 

        if (!car) {
            return res.status(404).json({
                available: false,
                message: 'Car not found'
            });
        }

        if (!car.isAvailable) {
            return res.json({
                available: false,
                message: 'Car is not available for rental'
            });
        }

        // Check for existing bookings in the date range
        const existingBooking = await Booking.findOne({
            car: id, 
            $or: [
                {
                    startDate: { $lte: end },
                    endDate: { $gte: start }
                }
            ],
            status: { $nin: ['cancelled', 'completed'] }
        });

        res.json({
            available: !existingBooking,
            message: existingBooking ? 'Car is not available for the selected dates' : 'Car is available for the selected dates'
        });

    } catch (error) {
        res.status(500).json({
            available: false,
            message: error.message
        });
    }
};
