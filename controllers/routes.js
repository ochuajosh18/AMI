const express = require('express');
const router = express.Router();
const winston = require('winston');

router.use('/create', require('./create'));
router.use('/update', require('./update'));
router.use('/delete', require('./delete'));
router.use('/credential', require('./credential'));
router.use('/load', require('./load'));
router.use('/email', require('./email'));
router.use('/SAP', require('./SAP'));

router.use('/authentication', require('./authentication'));
router.use('/role', require('./role'));
router.use('/user', require('./user'));
router.use('/material', require('./material'));
router.use('/customer', require('./customer'));
router.use('/stock', require('./stock'));
router.use('/order', require('./order'));
router.use('/discount', require('./discount'));
router.use('/emailnotif', require('./emailnotif'));
router.use('/DI', require('./DI'));
router.use('/log', require('./log'));
router.use('/creditexceedapprovallogs', require('./creditexceedapprovallogs'));
router.use('/dashboard', require('./dashboard'));
router.use('/report', require('./report'));
router.use('/maxorderquantity', require('./maxorderquantity'));

winston
	.add(winston.transports.File, { filename: 'error.log' })
	.remove(winston.transports.Console);

module.exports = router