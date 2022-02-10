const express = require('express');
const router = express.Router();
const userModel = require('../models/user').userModel;

// user
router.post('/other', (req, res) => {
	userModel.loadOtherUser(req.body, (error, result) => {
		(error) ? res.send(error) : res.send(result);
	});
});

// customerorder
router.post('/customer', (req, res) => {
	userModel.loadCustomerUser(req.body, (error, result) => {
		(error) ? res.send(error) : res.send(result);
	});
});

// invitation
router.post('/customers_WithoutAccount', (req, res) => {
	userModel.loadCustomers_WithoutAccount(req.body, (error, result) => {
		(error) ? res.send(error) : res.send(result);
	});
});

// user, psrtbrchannel
router.post('/salesperson', (req, res) => {
	userModel.loadSalespersonUser(req.body, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

// invitation
router.post('/salespersons_WithoutAccount', (req, res) => {
	userModel.loadSalespersons_WithoutAccount(req.body, (error, result) => {
		(error) ? res.send(error) : res.send(result);
	});
});

// creditoverdue
router.post('/customer/salesperson', (req, res) => {
	const sessionId = req.header('x-sessionId');
	userModel.loadCustomerSalesperson(req.body, { sessionId }, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

// normal sales, special sales
router.post('/customer/customersalesperson', (req, res) => {
	const sessionId = req.header('x-sessionId');
	userModel.loadCustomerSalespersonDoc(req.body, { sessionId }, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

// profile, user
router.get('/:id', (req, res) => {
	const { id } = req.params;
	userModel.loadUser(id, (error, result) => {
		(error) ? res.send(error) : res.send(result);
	});
});

// role
router.get('/count/byRole/:id', (req, res) => {
	const { id } = req.params;
	userModel.countUserByRole(id, (error, result) => {
		(error) ? res.status(500).send(error) : res.send(result);
	});
});

// psrtbrchannel.js
// router.post('/salesperson', (req, res) => {
// 	const sessionId = req.header('x-sessionId');
// 	userModel.loadAllSalesperon(req.body, (error, result) => {
// 		(error) ? res.send(error) : res.send(result);
// 	});
// });

// user
router.post('/createUser', (req, res) => {
	const sessionId = req.header('x-sessionId');
	userModel.createUser(req.body, sessionId, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

// invitation
router.post('/createCustomerUser', (req, res) => {
	const sessionId = req.header('x-sessionId');
	userModel.createCustomerUser(req.body, sessionId, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

// invitation
router.post('/createSalespersonUser', (req, res) => {
	const sessionId = req.header('x-sessionId');
	userModel.createSalespersonUser(req.body, sessionId, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

// user
router.delete('/:id', (req, res) => {
	const sessionId = req.header('x-sessionId');
	const { id } = req.params;
	userModel.deleteUser(id, sessionId, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

// user
router.put('/id/:id', (req, res) => {
	const { id } = req.params;
	userModel.updateUser(id, req.body,(error, result) => {
		(error) ? res.send(error) : res.send(result);
	});
});

// profile.js
router.put('/password/:id', (req, res) => {
	const { id } = req.params;
	const { password, newPassword } = req.body;
	userModel.updatePassword({ name : id, password, newPassword },(error, result) => {
		(error) ? res.send(error) : res.send(result);
	});
});


// login
router.post('/password/reset', (req, res) => {
	userModel.resetPassword(req.body, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

module.exports = router;