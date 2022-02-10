const express = require('express');
const router = express.Router();
const emailnotifModel = require('../models/emailnotif').emailnotifModel;

// email
router.post('/loadAllEmails', (req, res) => {
	const sessionId = req.header('x-sessionId');
	emailnotifModel.loadAllEmails(sessionId, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

// email
router.put('/updateEmailTemplate/:id', (req, res) => {
	const { id } = req.params;
	emailnotifModel.updateEmailTemplate(id, req.body,(error, result) => {
		(error) ? res.send(error) : res.send(result);
	});
});

// normalsales, specialsales, creditoverdue
router.post('/order', (req, res) => {
	emailnotifModel.orderNotif(req.body, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

// normalsales, specialsales, creditoverdue
router.post('/rejectorder', (req, res) => {
	emailnotifModel.rejectOrderNotif(req.body, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

// user
router.post('/resendInvite', (req, res) => {
	emailnotifModel.resendInvite(req.body, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

module.exports = router;