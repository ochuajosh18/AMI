const request = require('request').defaults({json: true});
const async = require('async');
const config = require('../config/config');
const moment = require('moment');
const winston = require('winston');
const couchbucket = config.db.bucket;

function reportModel(){}

function logErrors({ func, subfunc }, { user, timestamp }, err) {
	if (err.hasOwnProperty('body')) err = err.body;
	console.log(`\n\n${func} - ${subfunc}\n`, JSON.stringify(err));
	winston.error(`${func} ${subfunc}`, err)
}

// report automation
reportModel.loadYtdSalesAndOrder = ({ startDate, endDate }, sessionId, callback) => {
	const query = `
	SELECT count(distinct salesOrderNo) AS ytdOrderNo FROM ${couchbucket}					
	WHERE docType='ORDER' AND orderItemStatus='invoiced' AND dateCreated between '${startDate}' AND '${endDate}'
	UNION SELECT SUM(TO_NUMBER(amount)) AS ytdSales	FROM ${couchbucket}					
	WHERE docType='ORDER' AND orderItemStatus='invoiced' AND dateCreated between '${startDate}' AND '${endDate}'`;

	const options = {
		headers : {'Accept': 'application/json', 'Cookie': sessionId},
		url     : config.public.n1ql_url,
		method  : 'POST',
		body    : {statement: query}
	};

	request(options, (err, res) => {
		try {
			if (err) throw err;
  			else if (res.statusCode >= 300) throw res;
  			else {
				let result = res.body.results;
				callback(null, { statusCode: 200, result });
			}
		} catch (err) {
			logErrors({ func: 'loadYtdFirstOfMonth', subfunc: 'get ORDER doc' }, {}, err);
			callback(err, null);
		}
	});
}

// report automation
reportModel.loadTopBuyers = ({ startDate, endDate }, sessionId, callback) => {
	const query = `
	SELECT r.orders AS numberOfOrders, c2.name1 AS customerName, c2.customerCode AS customerCode
	FROM 
	(
		SELECT count(distinct o.salesOrderNo) as \`orders\`, o.customerId
		FROM ${couchbucket} o
		JOIN ${couchbucket} c ON KEYS o.customerId
		WHERE o.docType='ORDER' AND o.orderItemStatus='invoiced' AND o.dateCreated BETWEEN '${startDate}' AND '${endDate}'
		group by o.customerId
	) r
	JOIN ${couchbucket} c2 ON KEYS r.customerId order by r.orders DESC LIMIT 5`;

	const options = {
		headers : {'Accept': 'application/json', 'Cookie': sessionId},
		url     : config.public.n1ql_url,
		method  : 'POST',
		body    : {statement: query}
	};

	request(options, (err, res) => {
		try {
			if (err) throw err;
  			else if (res.statusCode >= 300) throw res;
  			else {
				let result = res.body.results;
				callback(null, { statusCode: 200, result });
			}
		} catch (err) {
			logErrors({ func: 'loadTopBuyers', subfunc: 'get ORDER doc' }, {}, err);
			callback(err, null);
		}
	});
}

// report automation
reportModel.loadOrderDetails = ({ startDateDetails, endDateDetails }, sessionId, callback) => {
	const query = `
	SELECT salesOrderNoSAP AS sapNo, salesOrderNo AS orNo, salesOrderItemNo AS itemNo, dateCreated||' '||timeCreated AS dateOrdered,
	orderItemStatus AS \`status\`, orderType AS \`type\`, customerCode, materialCode, price, quantity, amount					
	FROM ${couchbucket}					
	WHERE docType='ORDER' AND orderItemStatus='invoiced' AND dateCreated between '${startDateDetails}' AND '${endDateDetails}'`;

	const options = {
		headers : {'Accept': 'application/json', 'Cookie': sessionId},
		url     : config.public.n1ql_url,
		method  : 'POST',
		body    : {statement: query}
	};

	request(options, (err, res) => {
		try {
			if (err) throw err;
  			else if (res.statusCode >= 300) throw res;
  			else {
				let result = res.body.results;
				callback(null, { statusCode: 200, result });
			}
		} catch (err) {
			logErrors({ func: 'loadOrderDetails', subfunc: 'get ORDER doc' }, {}, err);
			callback(err, null);
		}
	});
}

module.exports.reportModel = reportModel;