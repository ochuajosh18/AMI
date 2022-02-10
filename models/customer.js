const request = require('request').defaults({json: true});
const async = require('async');
const config = require('../config/config');
const moment = require('moment');
const uuid = require('uuid');

function customerModel(){}

// user, customer
customerModel.loadMainCustomers = (sessionId, callback) => {
	try {
		/* const query = `
		SELECT META(${config.db.bucket}).id AS id, customerCode, mainCustomerCode, name1 || ' ' || name2 AS customerName, smtpAddr, telNumber, faxNumber, country, street, postCode1 
		FROM ${config.db.bucket}
		WHERE docType='CUSTOMER' AND partnerType=''
		AND customerCode IS NOT MISSING AND mainCustomerCode IS NOT MISSING`; */

		const query = `
		SELECT u.status, META(c).id AS id, c.customerCode, c.mainCustomerCode, c.name1 || ' ' || c.name2 AS customerName, c.smtpAddr, c.telNumber, c.faxNumber, c.country, c.street, c.postCode1
		FROM ${config.db.bucket} AS u
		JOIN ${config.db.bucket} AS c ON KEYS u.customerId
		WHERE c.docType='CUSTOMER' AND c.partnerType='' AND u.docType='USER'
		AND c.customerCode IS NOT MISSING AND c.mainCustomerCode IS NOT MISSING`;

		const options = {
			headers : {'Accept': 'application/json', 'Cookie': sessionId},
			url     : config.public.n1ql_url,
			method  : 'POST',
			body    : {statement: query}
		};

		request(options, (err, res) => {
			if (err) {
				return callback(err, null);
			} else if (res.statusCode >= 300) {
				console.log(res.body);
				return callback(res, null);
			} else {
				const result = res.body.results;
				callback(null, { statusCode : 200, result });
			}
		});
	} catch (err) {
		console.log(err);
		callback(err, null);
	}
}

// customer
customerModel.loadAllCustomerShipTo = (sessionId, callback) => {
	let query = `
	SELECT customerCode, id, mainCustomerCode, street||' '||strSuppl3 AS address, name1 || ' ' || name2 AS customerName, city1, postCode1, country
	FROM ${config.db.bucket}
	WHERE docType='CUSTOMER' AND partnerType='SH' AND deletionFlag=''
	AND customerCode IS NOT MISSING
	AND mainCustomerCode IS NOT MISSING`;

	const options = {
		headers : {'Accept': 'application/json'},
		url     : config.public.n1ql_url,
		method  : 'POST',
		body    : {statement: query}
	};

	request(options, (err, res) => {
		try {
			if (err) {
	  			return callback(err, null);
	  		} else if (res.statusCode >= 300) {
	  			console.log('\nloadCustomerShipTo', res.body);
	  			return callback(res, null);
	  		} else {
				const result = res.body.results;
				if (result.length > 0) callback(null, { statusCode: 200, result });
				else callback(null, { statusCode: 400, message: 'No document' });
			}
		} catch (err) {
			console.log('\nloadCustomerShipTo', res.body);
			callback(err, null);
		}
	});
}

module.exports.customerModel = customerModel;