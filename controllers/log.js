const express = require('express');
const router = express.Router();
const logModel = require('../models/log').logModel;

// logs
router.post('/loadLog_ByDate', (req, res) => {
	logModel.loadLog_ByDate(req.body, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

// logs
router.put('/updateLogs/:id', (req, res) => {
	const { id, } = req.params, { log, timestamp } = req.body;
	logModel.updateLogs(id, log, timestamp, (error, result) => {
		(error) ? res.send(error) : res.send(result);
	});
});

module.exports = router;