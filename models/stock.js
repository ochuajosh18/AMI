const request = require('request').defaults({json: true});
const async = require('async');
const config = require('../config/config');
const moment = require('moment');
const couchbucket = config.db.bucket;

function stockModel(){}

// normalsales, specialsales, creditoverdue
stockModel.loadStock = (id, sessionId, callback) => {
	const query = `
	SELECT RAW ${couchbucket} FROM ${couchbucket}
	USE KEYS '${id}'`;

	const options = {
		headers : {'Accept': 'application/json', 'Cookie': sessionId},
		url     : config.public.n1ql_url,
		method  : 'POST',
		body    : {statement: query}
	};

	request(options, (err, res) => {
		try {
			if (err) {
				return callback(err, null);
			} else if (res.statusCode >= 300) {
				console.log('\nloadStock', res.body);
				return callback(res, null);
			} else {
				let result = res.body.results;
				if (result.length > 0) callback(null, { statusCode: 200, result: result[0] });
				else callback({ statusCode: 400, message: 'No document' }, null);
			}
		} catch (err) {
			console.log('\nloadStock', err);
			callback(err, null);
		}
	});
}

// normalsales, specialsales, creditoverdue
stockModel.loadAllStock = (sessionId, callback) => {
	const query = `
	SELECT materialCode, size||' '||oldMaterialNumber AS sizePattern, size||' '||oldMaterialNumber||' '||country AS combination, totalStock AS stock, storageLocation
	FROM ${couchbucket}
	WHERE docType="STOCK::LIMIT"
	AND materialCode IS NOT MISSING AND totalStock IS NOT MISSING`;

	const options = {
		headers : {'Accept': 'application/json', 'Cookie': sessionId},
		url     : config.public.n1ql_url,
		method  : 'POST',
		body    : {statement: query}
	};

	request(options, (err, res) => {
		try {
			if (err) {
				return callback(err, null);
			} else if (res.statusCode >= 300) {
				console.log('\nloadAllStock', res.body);
				return callback(res, null);
			} else {
				let result = res.body.results;
				callback(null, { statusCode: 200, result });
			}
		} catch (err) {
			console.log('\nloadAllStock', err);
			callback(err, null);
		}
	});
}

// limit(visible stock)
stockModel.updateStock = (id, changes, sessionId, callback) => {
	try {
		let SETquery = [];
		for (let i in changes) SETquery.push(`\`${i}\`='${changes[i]}'`);

	  	const query = `
	  	UPDATE ${couchbucket} USE KEYS '${id}'
	  	SET ${SETquery.toString()}`;

	  	const options = {
	  		headers : {'Accept': 'application/json'},
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
	  		} else callback(null, res);
	  	});
	} catch (err) {
		console.log(err);
		callback(err, null);
	}
}

module.exports.stockModel = stockModel;