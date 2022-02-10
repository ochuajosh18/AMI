const express = require('express');
const router = express.Router();
const materialModel = require('../models/material').materialModel;

// materialblock
router.put('/udpate/:id', (req, res) => {
	const { id } = req.params, sessionId = req.header('x-sessionId');
	materialModel.updateMaterial(id, req.body, sessionId, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

// materialblock
router.put('/udpate/2ndlevel/:id', (req, res) => {
	const { id } = req.params, sessionId = req.header('x-sessionId');
	materialModel.updateMaterialLevel2(id, req.body, sessionId, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

// material block
router.put('/udpate/unset/:id', (req, res) => {
	const { id } = req.params, sessionId = req.header('x-sessionId');
	materialModel.updateUnsetMaterial(id, req.body, sessionId, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

// material block
router.put('/udpate/unset/2ndlevel/:id', (req, res) => {
	const { id } = req.params, sessionId = req.header('x-sessionId');
	materialModel.updateUnsetMaterialLevel2(id, req.body, sessionId, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

// normalsales, specialsales
router.get('/id/:id', (req, res) => {
	const { id } = req.params, sessionId = req.header('x-sessionId');
	materialModel.loadMaterial(id, sessionId, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

// material, visible stock
router.post('/loadAllMaterial', (req, res) => {
	const sessionId = req.header('x-sessionId');
	materialModel.loadAllMaterial(sessionId, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

// material note
router.post('/loadAllMaterialNote', (req, res) => {
	const sessionId = req.header('x-sessionId');
	materialModel.loadAllMaterialNote(sessionId, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

// material block
router.post('/loadAllMaterialBlock', (req, res) => {
	const sessionId = req.header('x-sessionId');
	materialModel.loadAllMaterialBlock(sessionId, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});


module.exports = router;