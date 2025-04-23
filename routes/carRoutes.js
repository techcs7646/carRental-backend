const express = require('express');
const router = express.Router();
const { searchCars, getCarById, getCarImage, checkCarAvailability } = require('../controllers/carController');

router.get('/', searchCars);
router.get('/image/:id', getCarImage);
router.get('/:id/availability', checkCarAvailability);
router.get('/:id', getCarById);

module.exports = router;