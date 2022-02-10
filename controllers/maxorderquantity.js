const express = require('express');
const router = express.Router();
const maxOrderQuantityModel = require('../models/maxorderquantity').maxOrderQuantityModel;

router.get('/id/:id', (req, res) => {
	const { id } = req.params, sessionId = req.header('x-sessionId');
	maxOrderQuantityModel.loadMaxOrderQuantity(id, sessionId, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});


// max order quantity
router.put('/updateMaxOrderQuantity/:id', (req, res) => {
	const sessionId = req.header('x-sessionId');
	const { id } = req.params;
	maxOrderQuantityModel.updateMaxOrderQuantity(id, req.body, sessionId, (error, result) => {
		(error) ? res.status(500).send(error) : res.send(result);
	});
});

// all max order quantity
router.put('/update/multi', (req, res) => {
	const sessionId = req.header('x-sessionId');
	maxOrderQuantityModel.updateAllMaxOrderQuantity(req.body, sessionId, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

// material, visible stock
router.post('/loadAllMaterial', (req, res) => {
	const sessionId = req.header('x-sessionId');
	maxOrderQuantityModel.loadAllMaterial(sessionId, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

module.exports = router;