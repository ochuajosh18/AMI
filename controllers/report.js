const express = require('express');
const router = express.Router();
const reportModel = require('../models/report').reportModel;

// report automation
router.post('/ytdsalesandorder', (req, res) => {
	const sessionId = req.header('x-sessionId');
	reportModel.loadYtdSalesAndOrder(req.body, sessionId, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

// report automation
router.post('/topbuyers', (req, res) => {
	const sessionId = req.header('x-sessionId');
	reportModel.loadTopBuyers(req.body, sessionId, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

// report automation
router.post('/loadorderdetails', (req, res) => {
	const sessionId = req.header('x-sessionId');
	reportModel.loadOrderDetails(req.body, sessionId, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

module.exports = router;