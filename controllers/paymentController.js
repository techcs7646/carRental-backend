const stripe = require('../config/stripe');
const Booking = require('../models/bookingModel');

exports.createPaymentIntent = async (req, res) => {
    try {
        const { bookingId } = req.body;
        const booking = await Booking.findById(bookingId).populate('car');

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: booking.totalPrice * 100,
            currency: 'usd',
            metadata: {
                bookingId: booking._id.toString(),
                carId: booking.car._id.toString(),
                userId: req.user._id.toString()
            }
        });

        res.json({
            paymentIntentId: paymentIntent.id,  // This is what you need for confirmation
            clientSecret: paymentIntent.client_secret  // This is for the frontend Stripe SDK
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Add this function to generate receipt
const generateReceipt = async (booking, paymentIntent) => {
    return {
        receiptNumber: `RCP-${Date.now()}`,
        date: new Date(),
        customerName: booking.user.name,
        customerEmail: booking.user.email,
        carDetails: {
            name: booking.car.name,
            brand: booking.car.brand,
            model: booking.car.model
        },
        bookingDetails: {
            startDate: booking.startDate,
            endDate: booking.endDate,
            totalDays: Math.ceil((new Date(booking.endDate) - new Date(booking.startDate)) / (1000 * 60 * 60 * 24))
        },
        paymentDetails: {
            amount: booking.totalPrice,
            paymentId: paymentIntent.id,
            paymentStatus: 'Paid',
            paymentDate: new Date(paymentIntent.created * 1000)
        }
    };
};

// Update the confirmPayment function
exports.confirmPayment = async (req, res) => {
    try {
        const { bookingId, paymentIntentId } = req.body;
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        
        switch (paymentIntent.status) {
            case 'succeeded':
                const booking = await Booking.findById(bookingId)
                    .populate('user', 'name email')
                    .populate('car', 'name brand model');
                
                booking.paymentStatus = 'paid';
                booking.status = 'confirmed';
                await booking.save();

                // Generate receipt
                const receipt = await generateReceipt(booking, paymentIntent);
                
                return res.json({ 
                    message: 'Payment confirmed successfully', 
                    booking,
                    receipt 
                });

            case 'processing':
                return res.status(202).json({ message: 'Payment is still processing' });

            case 'requires_payment_method':
                return res.status(400).json({ message: 'Payment failed, please try again' });

            default:
                return res.status(400).json({ 
                    message: `Payment status: ${paymentIntent.status}. Please contact support.` 
                });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
