const express = require('express');
const router = express.Router();
const discountModel = require('../models/discount').discountModel;

// discount
router.get('/channel', (req, res) => {
	const sessionId = req.header('x-sessionId');
	discountModel.loadAllChannelDiscount(sessionId, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

// discount
router.get('/factory', (req, res) => {
	const sessionId = req.header('x-sessionId');
	discountModel.loadAllFactoryDiscount(sessionId, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

// discount
router.get('/moq', (req, res) => {
	const sessionId = req.header('x-sessionId');
	discountModel.loadAllMoqDiscount(sessionId, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

// discount
router.get('/timeLimited', (req, res) => {
	const sessionId = req.header('x-sessionId');
	discountModel.loadAllTimeLimitedDiscount(sessionId, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

module.exports = router;