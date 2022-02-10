const express = require('express');
const router = express.Router();
const orderModel = require('../models/order').orderModel;

// normalsales
router.post('/backorder/multi', (req, res) => {
	const sessionId = req.header('x-sessionId');
	orderModel.createBackorders(req.body, sessionId, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

// normalsales, specialsales, creditoverdue
router.put('/update/multi', (req, res) => {
	const sessionId = req.header('x-sessionId');
	orderModel.updateOrders(req.body, sessionId, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

// normalsales
router.post('/normal', (req, res) => {
	const sessionId = req.header('x-sessionId');
	orderModel.loadAllNormalOrder(req.body, sessionId, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

// normalsales
router.get('/normal/backorder', (req, res) => {
	const sessionId = req.header('x-sessionId');
	orderModel.loadAllBackorder(sessionId, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

// specialsales
router.post('/special', (req, res) => {
	const sessionId = req.header('x-sessionId');
	orderModel.loadAllSpecialOrder(req.body, sessionId, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

// creditoverdue
router.post('/creditoverdue', (req, res) => {
	const sessionId = req.header('x-sessionId');
	orderModel.loadAllCreditOverduOrder(req.body, sessionId, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

// psrtbrchannel
router.post('/report/psrtbrchannel', (req, res) => {
	const sessionId = req.header('x-sessionId');
	orderModel.psrtbrChannelReport(req.body, sessionId, (error, result) => {
		(error) ? res.status(500).send(error) : res.send(result);
	});
});

// mtpgroupbysalesman
router.post('/report/mtpsalesman', (req, res) => {
	const sessionId = req.header('x-sessionId');
	orderModel.mtpSalesmanReport(req.body, sessionId, (error, result) => {
		(error) ? res.status(500).send(error) : res.send(result);
	});
});

// mtpgroupbycustomer
router.post('/report/mtpgroupbycustomer', (req, res) => {
	const sessionId = req.header('x-sessionId');
	orderModel.mtpCustomerReport(req.body, sessionId, (error, result) => {
		(error) ? res.status(500).send(error) : res.send(result);
	});
});

// customerorder
router.post('/report/customerorder', (req, res) => {
	const sessionId = req.header('x-sessionId');
	orderModel.customerOrderReport(req.body, sessionId, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

// backorder
router.post('/report/backorder', (req, res) => {
	const sessionId = req.header('x-sessionId');
	orderModel.backOrderReport(req.body, sessionId, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

// orderTransaction
router.post('/all', (req, res) => {
	const sessionId = req.header('x-sessionId');
	orderModel.loadAllOrderBackorder(req.body, sessionId, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

// orderTransaction
router.post('/bycustomercode/:customerCode', (req, res) => {
	const sessionId = req.header('x-sessionId');
	const { customerCode} = req.params;
	orderModel.loadOrderBackorderByCustomerCode(customerCode, req.body, sessionId, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

// creditapproval report
router.post('/report/creditapproval', (req, res) => {
	const sessionId = req.header('x-sessionId');
	orderModel.loadCreditApprovalReport(req.body, sessionId, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

module.exports = router;