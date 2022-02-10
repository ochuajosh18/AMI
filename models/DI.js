const request = require('request').defaults({json: true});
const async = require('async');
const config = require('../config/config');
const moment = require('moment');
const uuid = require('uuid');

function DIModel(){}

// normalsales, specialsales, creditoverdue
DIModel.stockStatus = (stock, sessionId, callback) => {
	const options = {
		headers : {'Accept': 'application/json'},
		url     : `${config.DIservice.url}Stock/stockstatus`,
		method  : 'POST',
		body    : stock
	};

  	request(options, (err, res) => {
  		try	{
			if (err) {
				return callback(err, null);
			} else if (res.statusCode >= 300) {
				console.log('\nstockStatus', res.body);
				return callback(res, null);
			} else {
				let result = JSON.parse(res.body);
				callback(null, { statusCode: 200, result });
			}
		} catch (err) {
			console.log('\nstockStatus', err);
			callback(err, null);
		}
	});
}

// normalsales, specialsales, creditoverdue
DIModel.creditStatus = (credit, sessionId, callback) => {
	const options = {
		headers : {'Accept': 'application/json'},
		url     : `${config.DIservice.url}CreditLimit/checkCreditLimit`,
		method  : 'POST',
		body    : credit
	};

	request(options, (err, res) => {
		try	{
			if (err) {
				return callback(err, null);
			} else if (res.statusCode >= 300) {
				console.log('\ncreditStatus', res.body);
				return callback(res, null);
			} else {
				let result = JSON.parse(res.body);
				callback(null, { statusCode: 200, result });
			}
		} catch (err) {
			console.log('\ncreditStatus', err);
			callback(err, null);
		}
	});
}

// normalsales, specialsales, creditoverdue
DIModel.overduePaymentStatus = (overdue, sessionId, callback) => {
	const options = {
		headers : {'Accept': 'application/json'},
		url     : `${config.DIservice.url}Overdue/checkOverduePayment`,
		method  : 'POST',
		body    : overdue
	};

  	request(options, (err, res) => {
  		try	{
  			if (err) {
  				return callback(err, null);
  			} else if (res.statusCode >= 300) {
  				console.log('\noverduePaymentStatus', res.body);
  				return callback(res, null);
  			} else {
  				let result = JSON.parse(res.body);
  				callback(null, { statusCode: 200, result });
  			}
  		} catch (err) {
  			console.log('\noverduePaymentStatus', err);
  			callback(err, null);
  		}
  	});
}

// normalsales, specialsales, creditoverdue
DIModel.createreleaseOrder = (order, sessionId, callback) => {
	console.log(order)
	const options = {
		headers : {'Accept': 'application/json'},
		url     : `${config.DIservice.url}order/Create`,
		method  : 'POST',
		body    : order
	};

	request(options, (err, res) => {
		try	{
			if (err) {
				return callback(err, null);
			} else if (res.statusCode >= 300) {
				console.log('\ncreatereleaseOrder', res.body);
				return callback(res, null);
			} else {
				let result = JSON.parse(res.body);
				callback(null, { statusCode: 200, result });
			}
		} catch (err) {
			console.log('\ncreatereleaseOrder', err);
			callback(err, null);
		}
	});
}

// normalsales, specialsales, creditoverdue
DIModel.releaseDeliveryBlock = (order, sessionId, callback) => {
	console.log(order)
	const options = {
		headers : {'Accept': 'application/json'},
		url     : `${config.DIservice.url}RealTime/releasedeliveryblock`,
		method  : 'POST',
		body    : order
	};

	request(options, (err, res) => {
		try	{
			if (err) {
				return callback(err, null);
			} else if (res.statusCode >= 300) {
				console.log('\nreleasedeliveryblock', res.body);
				return callback(res, null);
			} else {
				let result = JSON.parse(res.body);
				callback(null, { statusCode: 200, result });
			}
		} catch (err) {
			console.log('\nreleasedeliveryblock', err);
			callback(err, null);
		}
	});
}

// creditoverdue
DIModel.rejectCreditStatus = (order, sessionId, callback) => {
	console.log(order)
	const options = {
		headers : {'Accept': 'application/json'},
		url     : `${config.DIservice.url}RealTime/rejectcreditstatus`,
		method  : 'POST',
		body    : order
	};

	request(options, (err, res) => {
		try	{
			if (err) {
				return callback(err, null);
			} else if (res.statusCode >= 300) {
				console.log('\nrejectcreditstatus', res.body);
				return callback(res, null);
			} else {
				let result = JSON.parse(res.body);
				callback(null, { statusCode: 200, result });
			}
		} catch (err) {
			console.log('\nrejectcreditstatus', err);
			callback(err, null);
		}
	});
}

// creditoverdue
DIModel.releaseCreditBlock = (order, sessionId, callback) => {
	const options = {
		headers : {'Accept': 'application/json'},
		url     : `${config.DIservice.url}order/ReleaseOrder`,
		method  : 'POST',
		body    : order
	};

	request(options, (err, res) => {
		try	{
			if (err) {
				return callback(err, null);
			} else if (res.statusCode >= 300) {
				console.log('\nreleaseCreditBlock', res.body);
				return callback(res, null);
			} else {
				let result = JSON.parse(res.body);
				callback(null, { statusCode: 200, result });
			}
		} catch (err) {
			console.log('\nreleaseCreditBlock', err);
			callback(err, null);
		}
	});
}

// normalsales, specialsales
DIModel.rejectOrderSO = (order, sessionId, callback) => {
	console.log(order)
	const options = {
		headers : {'Accept': 'application/json'},
		url     : `${config.DIservice.url}RealTime/rejectSOWOS`,
		method  : 'POST',
		body    : order
	};

	request(options, (err, res) => {
		try	{
			if (err) {
				return callback(err, null);
			} else if (res.statusCode >= 300) {
				console.log('\nrejectorderso', res.body);
				return callback(res, null);
			} else {
				let result = JSON.parse(res.body);
				callback(null, { statusCode: 200, result });
			}
		} catch (err) {
			console.log('\nrejectorderso', err);
			callback(err, null);
		}
	});
}

DIModel.calculateDisocunt = (order, sessionId, callback) => {
	const options = {
		headers : {'Accept': 'application/json'},
		url     : `${config.DIservice.url}order/discount`,
		method  : 'POST',
		body    : order
	};

	request(options, (err, res) => {
		try	{
			if (err) {
				return callback(err, null);
			} else if (res.statusCode >= 300) {
				console.log('\ncalculateDisocunt', res.body);
				return callback(res, null);
			} else {
				let result = JSON.parse(res.body);
				callback(null, { statusCode: 200, result });
			}
		} catch (err) {
			console.log('\ncalculateDisocunt', err);
			callback(err, null);
		}
	});
}

DIModel.orderStatus = (order, sessionId, callback) => {
	const options = {
		headers : {'Accept': 'application/json'},
		url     : `${config.DIservice.url}order/orderstatus`,
		method  : 'POST',
		body    : order
	};

	request(options, (err, res) => {
		try	{
			if (err) {
				return callback(err, null);
			} else if (res.statusCode >= 300) {
				console.log('\norderStatus', res.body);
				return callback(res, null);
			} else {
				let result = JSON.parse(res.body);
				callback(null, { statusCode: 200, result });
			}
		} catch (err) {
			console.log('\norderStatus', err);
			callback(err, null);
		}
	});
}

module.exports.DIModel = DIModel;