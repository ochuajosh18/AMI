const request = require('request').defaults({json: true});
const async = require('async');
const config = require('../config/config');
const moment = require('moment');

function discountModel(){}

// discount
discountModel.loadAllChannelDiscount = (sessionId, callback) => {
	try {
		const query = `
		SELECT d.customerCode, d.customerName,
		cp.description as PSRdescription, cp.discount as PSRdiscount,
		ct.description as TBRdescription, ct.discount as TBRdiscount
		FROM ${config.db.bucket} d
		JOIN ${config.db.bucket} cp ON KEYS d.psrChannelId
		JOIN ${config.db.bucket} ct ON KEYS d.tbrChannelId
		WHERE d.docType='DEALER::GROUP' AND cp.docType='CHANNEL::DISCOUNT' AND ct.docType='CHANNEL::DISCOUNT'`;

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

// discount
discountModel.loadAllFactoryDiscount = (sessionId, callback) => {
	try {
		const query = `
		SELECT META(${config.db.bucket}).id AS id, materialCode, discount, validFrom, validTo
		FROM ${config.db.bucket}
		WHERE docType='FACTORY::DISCOUNT'`;

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

// discount
discountModel.loadAllMoqDiscount = (sessionId, callback) => {
	try {
		const query = `
		SELECT META(${config.db.bucket}).id AS id, discount, validFrom, validTo
		FROM ${config.db.bucket}
		WHERE docType='MOQ::DISCOUNT'`;

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

// discount
discountModel.loadAllTimeLimitedDiscount = (sessionId, callback) => {
	try {
		const query = `
		SELECT META(${config.db.bucket}).id AS id, materialCode, psrtbrChannel, minimumQuantity, discount, validFrom, validTo
		FROM ${config.db.bucket}
		WHERE docType='TIMELIMITED::DISCOUNT'`;

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


module.exports.discountModel = discountModel;