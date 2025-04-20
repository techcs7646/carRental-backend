const express = require('express');
const router = express.Router();
const { searchCars, getCarById, getCarImage, checkCarAvailability } = require('../controllers/carController');

router.get('/', searchCars);
// Move specific routes before parameter routes
router.get('/image/:id', getCarImage);
// Parameter routes last
router.get('/:id/availability', checkCarAvailability);
router.get('/:id', getCarById);

module.exports = router;