const express = require('express');
const router = express.Router();
const stockModel = require('../models/stock').stockModel;

// normalsales, specialsales, creditoverdue
router.get('/id/:id', (req, res) => {
	const { id } = req.params, sessionId = req.header('x-sessionId');
	stockModel.loadStock(id, sessionId, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

// normalsales, specialsales, creditoverdue
router.get('/all', (req, res) => {
	const sessionId = req.header('x-sessionId');
	stockModel.loadAllStock(sessionId, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

// limit(visible stock)
router.put('/updateStock/:id', (req, res) => {
	const sessionId = req.header('x-sessionId');
	const { id } = req.params;
	stockModel.updateStock(id, req.body, sessionId, (error, result) => {
		(error) ? res.status(500).send(error) : res.send(result);
	});
});

module.exports = router;