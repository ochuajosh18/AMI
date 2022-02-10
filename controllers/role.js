const express = require('express');
const router = express.Router();
const roleModel = require('../models/role').roleModel;

// permission, role, user
router.get('/', (req, res) => {
	const sessionId = req.header('x-sessionId');
	roleModel.loadAllRoles(sessionId, (error, result) => {
		(error) ? res.status(500).send(error) : res.send(result);
	});
});

// role
router.post('/', (req, res) => {
	const sessionId = req.header('x-sessionId');
	roleModel.createRole(req.body, sessionId, (error, result) => {
		(error) ? res.status(500).send(error) : res.send(result);
	});
});

// role
router.put('/:id', (req, res) => {
	const sessionId = req.header('x-sessionId');
	const { id } = req.params;
	roleModel.updateRole(id, req.body, sessionId, (error, result) => {
		(error) ? res.status(500).send(error) : res.send(result);
	});
});

// role
router.delete('/:id', (req, res) => {
	const sessionId = req.header('x-sessionId');
	const { id } = req.params;
	roleModel.deleteRole(id, sessionId, (error, result) => {
		(error) ? res.status(500).send(error) : res.send(result);
	});
});

// permission
router.put('/permission/:id', (req, res) => {
	const sessionId = req.header('x-sessionId');
	const { id } = req.params, { app, permission } = req.body;
	roleModel.updatePermission(id, app, permission, sessionId, (error, result) => {
		(error) ? res.send(error) : res.send(result);
	});
});

module.exports = router;