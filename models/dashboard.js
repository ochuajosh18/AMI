const request = require('request').defaults({json: true});
const async = require('async');
const config = require('../config/config');
const moment = require('moment');
const uuid = require('uuid');
const winston = require('winston');
const nodemailer = require('nodemailer');
const smtpTransport = nodemailer.createTransport('SMTP', config.email.setting);
const emailSender = config.email.sender;
const couchbucket = config.db.bucket;

function dashboardModel(){}

function logErrors({ func, subfunc }, { user, timestamp }, err) {
	if (err.hasOwnProperty('body')) err = err.body;
	console.log(`\n\n${func} - ${subfunc}\n`, JSON.stringify(err));
	winston.error(`${func} ${subfunc}`, err)
}

// index
dashboardModel.loadDealers = ({ customerRoleId }, { sessionId }, callback) => {
	let query = `
	SELECT RAW COUNT(DISTINCT customerCode) 
	FROM ${couchbucket}
	WHERE docType='USER'
	AND roleId='${customerRoleId}'
	AND status='active'
	AND firstName is not missing and lastName is not missing`;

	const options = {
		headers : {'Accept': 'application/json'},
		url     : config.public.n1ql_url,
		method  : 'POST',
		body    : {statement: query}
	};

	request(options, (err, res) => {
		try {
			if (err) throw err;
			else if (res.statusCode >= 300) throw res;
			else {
				const result = res.body.results;
				if (result.length > 0) callback(null, { statusCode: 200, result: result });
				else throw { statusCode: 400, message: 'No document' };
			}
		} catch (err) {
			logErrors({ func: 'load BST USERS', subfunc: 'get USER doc' }, {}, err);
			callback(err, null);
		}
	});
}

// index
dashboardModel.loadSalespersons = ({ salespersonRoleId }, { sessionId }, callback) => {
	let query = `
	SELECT RAW COUNT(DISTINCT customerCode) 
	FROM ${couchbucket}
	WHERE docType='USER'
	AND roleId='${salespersonRoleId}'
	AND status='active'
	AND firstName is not missing and lastName is not missing`;

	const options = {
		headers : {'Accept': 'application/json'},
		url     : config.public.n1ql_url,
		method  : 'POST',
		body    : {statement: query}
	};

	request(options, (err, res) => {
		try {
			if (err) throw err;
			else if (res.statusCode >= 300) throw res;
			else {
				const result = res.body.results;
				if (result.length > 0) callback(null, { statusCode: 200, result: result });
				else throw { statusCode: 400, message: 'No document' };
			}
		} catch (err) {
			logErrors({ func: 'load Salesperson USERS', subfunc: 'get USER doc' }, {}, err);
			callback(err, null);
		}
	});
}

// index
dashboardModel.loadUsers = ({ salespersonRoleId, customerRoleId }, { sessionId }, callback) => {
	let query = `
	SELECT RAW COUNT(*) 
	FROM ${couchbucket}
	WHERE docType='USER' AND roleId NOT IN ['${salespersonRoleId}', '${customerRoleId}']`;

	const options = {
		headers : {'Accept': 'application/json'},
		url     : config.public.n1ql_url,
		method  : 'POST',
		body    : {statement: query}
	};

	request(options, (err, res) => {
		try {
			if (err) throw err;
			else if (res.statusCode >= 300) throw res;
			else {
				const result = res.body.results;
				if (result.length > 0) callback(null, { statusCode: 200, result: result });
				else throw { statusCode: 400, message: 'No document' };
			}
		} catch (err) {
			logErrors({ func: 'load BST USERS', subfunc: 'get USER doc' }, {}, err);
			callback(err, null);
		}
	});
}

// index
dashboardModel.loadNormalOrderCount = (sessionId, callback) => {
	let query = `
	SELECT RAW COUNT(DISTINCT salesOrderNo) FROM ${couchbucket}
	WHERE docType = 'ORDER'
	AND orderType='Normal Order'
	AND orderItemStatus='saved'
	AND isDeleted IS MISSING AND salesOrderNo IS NOT MISSING 
	AND customerCode IS NOT MISSING`;

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
				const result = res.body.results;
				if (result.length > 0) callback(null, { statusCode: 200, result: result });
				else throw { statusCode: 400, message: 'No document' };
			}
		} catch (err) {
			logErrors({ func: 'load Normal Orders', subfunc: 'get ORDER doc' }, {}, err);
			callback(err, null);
		}
	});
}

// index
dashboardModel.loadSpecialOrderCount = (sessionId, callback) => {
	let query = `
	SELECT RAW COUNT(DISTINCT salesOrderNo) FROM ${couchbucket}
	WHERE docType = 'ORDER'
	AND orderType='Special Order'
	AND orderItemStatus='pending order approval'
	AND isDeleted IS MISSING AND salesOrderNo IS NOT MISSING 
	AND customerCode IS NOT MISSING`;

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
				const result = res.body.results;
				if (result.length > 0) callback(null, { statusCode: 200, result: result });
				else throw { statusCode: 400, message: 'No document' };
			}
		} catch (err) {
			logErrors({ func: 'load Special Orders', subfunc: 'get ORDER doc' }, {}, err);
			callback(err, null);
		}
	});
}

// index
dashboardModel.loadCreditOrderCount = (sessionId, callback) => {
	let query = `
	SELECT RAW COUNT(DISTINCT salesOrderNo) FROM ${couchbucket}
	WHERE docType = 'ORDER'
	AND orderItemStatus='submitted'
	AND isDeleted IS MISSING AND salesOrderNo IS NOT MISSING 
	AND customerCode IS NOT MISSING`;

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
				const result = res.body.results;
				if (result.length > 0) callback(null, { statusCode: 200, result: result });
				else throw { statusCode: 400, message: 'No document' };
			}
		} catch (err) {
			logErrors({ func: 'load Credit Exceed Orders', subfunc: 'get ORDER doc' }, {}, err);
			callback(err, null);
		}
	});
}

// index
dashboardModel.loadRecentOrders = (sessionId, callback) => {
	let query = `
	SELECT META(o).id as id, (DISTINCT o.salesOrderNo), o.quantity, o.orderItemStatus, o.customerCode, o.dateCreated||' '||o.timeCreated AS dateCreated,
	c.name1||' '||c.name2 as customerName
	FROM ${couchbucket} AS o
	JOIN ${couchbucket} AS c ON KEYS o.customerId
	WHERE o.docType='ORDER' AND c.docType='CUSTOMER'
	AND o.orderItemStatus='saved' AND o.isDeleted IS MISSING
	AND o.salesOrderNo IS NOT MISSING AND o.customerCode IS NOT MISSING
	ORDER BY o.dateCreated DESC LIMIT 5`;

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
				const result = res.body.results;
				if (result.length > 0) callback(null, { statusCode: 200, result: result });
				else throw { statusCode: 400, message: 'No document' };
			}
		} catch (err) {
			logErrors({ func: 'load Recent Orders', subfunc: 'get ORDER doc' }, {}, err);
			callback(err, null);
		}
	});
}

// index
dashboardModel.loadBestSellerMaterial = (sessionId, callback) => {
	let query = `
	SELECT materialCode, count(distinct salesOrderNo) AS totalSalesOrderNo, sum(TONUMBER(quantity)) AS totalQuantity, 
	sum(TONUMBER(amount)) AS totalAmount
	FROM ${couchbucket}		
	WHERE docType='ORDER'
	AND salesOrderNo is not missing and customerCode is not missing
	group by materialCode
	order by totalQuantity DESC LIMIT 5`;

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
				const result = res.body.results;
				if (result.length > 0) callback(null, { statusCode: 200, result: result });
				else throw { statusCode: 400, message: 'No document' };
			}
		} catch (err) {
			logErrors({ func: 'load BEST SELLER materials', subfunc: 'get ORDER doc' }, {}, err);
			callback(err, null);
		}
	});
}

// index
dashboardModel.loadTopCustomers = (sessionId, callback) => {
	let query = `
	SELECT SUM(TONUMBER(o.amount)) AS totalAmount, SUM(TONUMBER(o.quantity)) AS totalQuantity, COUNT(distinct o.salesOrderNo) AS totalSalesOrderNo, o.customerCode, c.name1
	FROM ${couchbucket} as o
	JOIN ${couchbucket} AS c ON KEYS o.customerId
	WHERE o.docType='ORDER'
	AND o.orderItemStatus='confirmed' 
	AND o.isDeleted is missing AND o.salesOrderNo is not missing and o.customerCode is not missing
	group by o.customerCode, c.name1
	order by totalAmount DESC LIMIT 5`;

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
				const result = res.body.results;
				if (result.length > 0) callback(null, { statusCode: 200, result: result });
				else throw { statusCode: 400, message: 'No document' };
			}
		} catch (err) {
			logErrors({ func: 'load TOP customers', subfunc: 'get ORDER doc' }, {}, err);
			callback(err, null);
		}
	});
}

// index
dashboardModel.loadOrdersToday = ({ datetoday }, sessionId, callback) => {
	let query = `
	SELECT count(distinct salesOrderNo) AS totalSalesOrderNo
	FROM ${couchbucket}
	WHERE docType='ORDER'
	AND orderItemStatus != 'cancelled' AND 'rejected'
	AND dateCreated = '${datetoday}'
	AND salesOrderNo is not missing and customerCode is not missing`;

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
				const result = res.body.results;
				if (result.length > 0) callback(null, { statusCode: 200, result: result });
				else throw { statusCode: 400, message: 'No document' };
			}
		} catch (err) {
			logErrors({ func: 'load ORDERS TODAY', subfunc: 'get ORDER doc' }, {}, err);
			callback(err, null);
		}
	});
}

// index
dashboardModel.loadSalesToday = ({ datetoday }, sessionId, callback) => {
	let query = `
	SELECT SUM(TONUMBER(amount)) AS totalAmount, SUM(TONUMBER(quantity)) AS totalQuantity
	FROM ${couchbucket}
	WHERE docType='ORDER'
	AND orderItemStatus='confirmed' AND dateCreated = '${datetoday}'
	AND salesOrderNo is not missing and customerCode is not missing`;

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
				const result = res.body.results;
				if (result.length > 0) callback(null, { statusCode: 200, result: result });
				else throw { statusCode: 400, message: 'No document' };
			}
		} catch (err) {
			logErrors({ func: 'load SALES TODAY', subfunc: 'get ORDER doc' }, {}, err);
			callback(err, null);
		}
	});
}


module.exports.dashboardModel = dashboardModel;