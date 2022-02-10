const request = require('request').defaults({json: true});
const async = require('async');
const config = require('../config/config');
const moment = require('moment');
const winston = require('winston');
const couchbucket = config.db.bucket;

function logModel(){}

function logErrors({ func, subfunc }, { user, timestamp }, err) {
	if (err.hasOwnProperty('body')) err = err.body;
	console.log(`\n\n${func} - ${subfunc}\n`, JSON.stringify(err));
	winston.error(`${func} ${subfunc}`, err)
}

// logs
logModel.loadLog_ByDate = ({ startDate, endDate }, callback) => {
	let query = `
	SELECT a.firstName || " " || a.lastName AS userName, a.customerCode, logs.action, logs.app, logs.dateCreated, logs.module, b.userId
    FROM ${couchbucket} b JOIN ${couchbucket} a ON KEYS b.userId
    UNNEST b.logs
    WHERE b.docType='LOG' AND a.docType='USER'
    AND logs.dateCreated BETWEEN '${startDate}' AND '${endDate}'`;

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
			logErrors({ func: 'loadLog_ByDate', subfunc: 'load logs' }, {}, err);
			callback(err, null);
		}
	});
}

// logs
logModel.updateLogs = (id, log, timestamp, callback) => {
  	const query = `
  	UPDATE ${couchbucket} AS l USE KEYS '${id}'
  	SET l.logs = ARRAY_APPEND(logs, ${JSON.stringify(log)}),
  	l.dateUpdated = '${timestamp}' WHERE docType='LOG' RETURNING *`;

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
				if (result.length > 0) callback(null, { statusCode : 200, result: result[0] });
				else throw { statusCode: 400, message: 'Error Updating', activity: JSON.stringify(log) };
			}
		} catch (err) {
			logErrors({ func: `updateLogs ${timestamp} --- ${id}`, subfunc: 'update logs' }, {}, err);
			callback(err, null);
		}
  	});
}

module.exports.logModel = logModel;