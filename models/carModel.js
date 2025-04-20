const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add car name']
    },
    brand: {
        type: String,
        required: [true, 'Please add brand name']
    },
    model: {
        type: String,
        required: [true, 'Please add model']
    },
    year: {
        type: Number,
        required: [true, 'Please add year']
    },
    price: {
        type: Number,
        required: [true, 'Please add price per day']
    },
    image: {
        type: String,
        required: [true, 'Please add car image']
    },
    features: [{
        type: String
    }],
    transmission: {
        type: String,
        enum: ['automatic', 'manual'], 
        required: true
    },
    fuelType: {
        type: String,
        enum: ['petrol', 'diesel', 'electric', 'hybrid'], 
        required: true
    },
    seats: {
        type: Number,
        required: true
    },
    isAvailable: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Car', carSchema);