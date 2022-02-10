var request = require('request').defaults({json: true}),
	async   = require('async'),
	config  = require('../config/config'),
	uuid    = require('uuid'),
	moment  = require('moment');

function SAPModel(){}

// normalsales
SAPModel.createOrder = function(info, callback){
	var api = config.di.url + 'Orders/create?';
	var info = info.SAPdata;
	var parameters = [
		'salesOrderNo',
		'salesOrderItemNo',
		'distributionChannel',
		'division',
		'soldToParty',
		'materialCode',
		'orderQuantity',
		'percentageDisicount',
		'amountDiscount',
		'dateTime',
		'partner',
		'storageLocation',
		'poCustomer',
		'shipToParty',
		'remark',
		'paymentTerms'
	];


	for (var i in parameters) {
		var field = parameters[i];
		for (var f in info) {
			api += field + '=' + info[f][field] + '&';
		}
	}

	api = api.slice(0, -1); // remove last character (excess&)

	try {
		var syncOptions = {
			headers : {
				"Content-Type": "application/json",
				"Accept" : "application/json"
			},
			url    : api,
			method : 'GET'
		};

		request(syncOptions, function(err, res) {

			if (err) {
				console.log(err);
				return callback(err, null);
			} 

			else if (res.statusCode >= 300) {
				return callback(res, null);
			}

			else {
				// res.body = JSON.parse(res.body);
				res.body = {
					'realBody' : res.body,
					'DIAPI' : api
				}
				callback(null, res);
			}
		});
	} catch (err) {
		console.log(err)
	}
}



SAPModel.releaseSalesOrder = function(salesOrderNo, callback){
	var api = config.di.url + 'Orders/release?salesOrderNo=' + salesOrderNo;

	try {
		var syncOptions = {
			headers : {
				"Content-Type": "application/json",
				"Accept" : "application/json"
			},
			url    : api,
			method : 'POST'
		};

		request(syncOptions, function(err, res) {
			if (err) {
				console.log(err);
				return callback(err, null);
			} 

			else if (res.statusCode >= 300) {
				return callback(res, null);
			}

			else {
				// res.body = JSON.parse(res.body);
				callback(null, res);
			}
		});
	} catch (err) {
		console.log(err)
	}
}



SAPModel.stockStatus = function(materialCode, storageLocation, callback) {  
	try {
		var syncOptions = {
			headers : {
				"Content-Type": "application/json",
				"Accept" : "application/json"
			},
			url    : config.di.url + 'StockStatus/stockstatus?materialNo=' + materialCode +'&storageLocation=' + storageLocation,
			method : 'POST'
		};

		request(syncOptions, function(err, res) {
			if (err) {
				console.log(err);
				return callback(err, null);
			} 

			else if (res.statusCode >= 300) {
				return callback(res, null);
			}

			else {
				// res.URL = syncOptions.url;
				// res.body = JSON.parse(res.body);
				callback(null, res);
			}
		});

	} catch (err) {
		console.log(err)
	}
}



SAPModel.creditLimit = function(customerCode, callback) {  
	try {
		var syncOptions = {
			headers : {
				"Content-Type": "application/json",
				"Accept" : "application/json"
			},
			url    : config.di.url + 'CreditLimit/creditlimit?customerCode=' + customerCode,
			method : 'POST'
		};

		request(syncOptions, function(err, res) {
			if (err) {
				console.log(err);
				return callback(err, null);
			} 

			else if (res.statusCode >= 300) {
				return callback(res, null);
			}

			else {
				// console.log(res.statusCode);
				// res.body = JSON.parse(res.body);
				callback(null, res);
			}
		});
	} catch (err) {
		console.log(err)
	}
}



SAPModel.overduePayment = function(customerCode, callback) {  
	try {
		var syncOptions = {
			headers : {
				"Content-Type": "application/json",
				"Accept" : "application/json"
			},
			url    : config.di.url + 'Overdue/overdue?customerCode=' + customerCode,
			method : 'POST'
		};

		request(syncOptions, function(err, res) {
			if (err) {
				console.log(err);
				return callback(err, null);
			} 

			else if (res.statusCode >= 300) {
				return callback(res, null);
			}

			else {
				// console.log(res.statusCode);
				// res.body = JSON.parse(res.body);
				callback(null, res);
			}
		});
	} catch (err) {
		console.log(err)
	}
}

module.exports.SAPModel = SAPModel;