const express = require('express');
const router = express.Router();
const authModel = require('../models/authentication').authModel;

// login
router.post('/', (req, res) => {
	authModel.authenticateUser(req.body, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

// login.js
router.delete('/:id', (req, res) => {
	const { id } = req.params;
	authModel.deleteSession(id, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

// login
router.post('/loaduserdocbyusername', (req, res) => {
	authModel.loadUserdocByUsername(req.body, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

// login
router.post('/registerWrongLogin', (req, res) => {
	authModel.registerWrongLogin(req.body, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

// profile
router.put('/passthreshold/:id', (req, res) => {
	const { id } = req.params;
	authModel.updateThreshold(id, req.body,(error, result) => {
		(error) ? res.send(error) : res.send(result);
	});
});

// profile
router.post('/encrypt/newpassword', (req, res) => {
	authModel.encryptPassword(req.body, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

// profile
router.post('/compare/oldpassword', (req, res) => {
	const { newPassword, oldPasswords } = req.body;
	authModel.comparePassword(newPassword, oldPasswords, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

module.exports = router;