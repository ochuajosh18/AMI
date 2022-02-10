const express = require('express');
const router = express.Router();
const dashboardModel = require('../models/dashboard').dashboardModel;

// index
router.post('/dealers', (req, res) => {
	const sessionId = req.header('x-sessionId');
	dashboardModel.loadDealers(req.body, { sessionId }, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

// index
router.post('/salespersons', (req, res) => {
	const sessionId = req.header('x-sessionId');
	dashboardModel.loadSalespersons(req.body, { sessionId }, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

// index
router.post('/users', (req, res) => {
	const sessionId = req.header('x-sessionId');
	dashboardModel.loadUsers(req.body, { sessionId }, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

// index
router.post('/normal', (req, res) => {
	const sessionId = req.header('x-sessionId');
	dashboardModel.loadNormalOrderCount(sessionId, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

// index
router.post('/special', (req, res) => {
	const sessionId = req.header('x-sessionId');
	dashboardModel.loadSpecialOrderCount(sessionId, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

// index
router.post('/credit', (req, res) => {
	const sessionId = req.header('x-sessionId');
	dashboardModel.loadCreditOrderCount(sessionId, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

// index
router.post('/recentorders', (req, res) => {
	const sessionId = req.header('x-sessionId');
	dashboardModel.loadRecentOrders(sessionId, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

// index
router.post('/bestsellermaterials', (req, res) => {
	const sessionId = req.header('x-sessionId');
	dashboardModel.loadBestSellerMaterial(sessionId, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

// index
router.post('/topcustomers', (req, res) => {
	const sessionId = req.header('x-sessionId');
	dashboardModel.loadTopCustomers(sessionId, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

// index
router.post('/orderstoday', (req, res) => {
	const sessionId = req.header('x-sessionId');
	dashboardModel.loadOrdersToday(req.body, sessionId, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

// index
router.post('/salestoday', (req, res) => {
	const sessionId = req.header('x-sessionId');
	dashboardModel.loadSalesToday(req.body, sessionId, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});



module.exports = router;