const express = require('express');
const router = express.Router();
const customerModel = require('../models/customer').customerModel;

// user, customer
router.get('/loadMainCustomers', (req, res) => {
	const sessionId = req.header('x-sessionId');
	customerModel.loadMainCustomers(sessionId, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

// customer
router.get('/loadAllCustomerShipTo', (req, res) => {
	const sessionId = req.header('x-sessionId');
	customerModel.loadAllCustomerShipTo(sessionId, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

module.exports = router;