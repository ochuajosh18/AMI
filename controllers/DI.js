const express = require('express');
const router = express.Router();
const DIModel = require('../models/DI').DIModel;

// normalsales, specialsales, creditoverdue
router.post('/stockStatus', (req, res) => {
	const sessionId = req.header('x-sessionId');
	DIModel.stockStatus(req.body, sessionId, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

// normalsales, specialsales, creditoverdue
router.post('/creditStatus', (req, res) => {
	const sessionId = req.header('x-sessionId');
	DIModel.creditStatus(req.body, sessionId, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

// normalsales, specialsales, creditoverdue
router.post('/overduePaymentStatus', (req, res) => {
	const sessionId = req.header('x-sessionId');
	DIModel.overduePaymentStatus(req.body, sessionId, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

// normalsales, specialsales, creditoverdue
router.post('/createreleaseOrder', (req, res) => {
	const sessionId = req.header('x-sessionId');
	DIModel.createreleaseOrder(req.body, sessionId, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

// normalsales, specialsales, creditoverdue
router.post('/releaseDeliveryBlock', (req, res) => {
	const sessionId = req.header('x-sessionId');
	DIModel.releaseDeliveryBlock(req.body, sessionId, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

// creditoverdue
router.post('/rejectCreditStatus', (req, res) => {
	const sessionId = req.header('x-sessionId');
	DIModel.rejectCreditStatus(req.body, sessionId, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

// creditoverdue
router.post('/releaseCreditBlock', (req, res) => {
	const sessionId = req.header('x-sessionId');
	DIModel.releaseCreditBlock(req.body, sessionId, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

// normalsales, specialsales
router.post('/rejectOrderSO', (req, res) => {
	const sessionId = req.header('x-sessionId');
	DIModel.rejectOrderSO(req.body, sessionId, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

router.post('/calculateDisocunt', (req, res) => {
	const sessionId = req.header('x-sessionId');
	DIModel.calculateDisocunt(req.body, sessionId, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

router.post('/orderStatus', (req, res) => {
	const sessionId = req.header('x-sessionId');
	DIModel.orderStatus(req.body, sessionId, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

module.exports = router;