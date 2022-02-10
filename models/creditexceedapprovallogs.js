const request = require('request').defaults({json: true});
const async = require('async');
const config = require('../config/config');
const moment = require('moment');
const winston = require('winston');
const couchbucket = config.db.bucket;

function creditExceedApprovalLogsModel(){}

function logErrors({ func, subfunc }, { user, timestamp }, err) {
	if (err.hasOwnProperty('body')) err = err.body;
	console.log(`\n\n${func} - ${subfunc}\n`, JSON.stringify(err));
	winston.error(`${func} ${subfunc}`, err)
}

creditExceedApprovalLogsModel.loadCreditExceedApprovalLogs_ByDate = ({ startDate, endDate, customerFilter, orderTypeFilter, creditExceedFilter, statusFilter }, callback) => {
	let customerFilterQuery = "", orderTypeFilterQuery = "", creditExceedFilterQuery = "", statusFilterQuery = "";

	if(customerFilter && customerFilter.length!=0){
		customerFilterQuery = `AND b.customerCode IN [${customerFilter.map(d => `'${d}'`).join(',')}]`
	}
	if(orderTypeFilter && orderTypeFilter.length!=0){
		orderTypeFilterQuery = ` AND b.orderType IN [${orderTypeFilter.map(d => `'${d}'`).join(',')}]`
	}
	if(creditExceedFilter && creditExceedFilter.length==1){
		if(creditExceedFilter[0] == "NO"){
			creditExceedFilterQuery = ` AND b.creditExceed IS MISSING AND b.overduePayment IS MISSING`;
		}
		else if(creditExceedFilter[0] == "YES"){
			creditExceedFilterQuery = ` AND (b.creditExceed IS NOT MISSING OR b.overduePayment IS NOT MISSING)`;
		}
	}
	if(statusFilter && statusFilter.length!=0){
		statusFilterQuery = ` AND b.orderItemStatus IN [${statusFilter.map(d => `'${d}'`).join(',')}]`
	}
	
	let query = `
	SELECT DISTINCT b.salesOrderNo, b.dateCreated, b.timeCreated, a.customerCode, a.firstName || " " || a.lastName AS userName, b.orderType, b.creditExceed, b.overduePayment, b.orderItemStatus
    FROM ${couchbucket} b JOIN ${couchbucket} a ON KEYS b.soldToUserId
	WHERE b.docType='ORDER' AND a.docType='USER'${customerFilterQuery}${orderTypeFilterQuery}${creditExceedFilterQuery}${statusFilterQuery}
	AND b.orderItemStatus IS NOT MISSING AND b.dateCreated BETWEEN '${startDate}' AND '${endDate}'`;

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
				callback(null, { statusCode : 200, result: result });
			}
		} catch (err) {
			logErrors({ func: 'loadCreditExceedApprovalLogs_ByDate', subfunc: 'Credit Exceed Approval Logs' }, {}, err);
			callback(err, null);
		}
	});
}

module.exports.creditExceedApprovalLogsModel = creditExceedApprovalLogsModel;