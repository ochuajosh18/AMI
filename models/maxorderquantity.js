const request = require('request').defaults({json: true});
const async = require('async');
const config = require('../config/config');
const moment = require('moment');
const couchbucket = config.db.bucket;

function maxOrderQuantityModel(){}

maxOrderQuantityModel.loadMaxOrderQuantity = (id, sessionId, callback) => {
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
				console.log('\loadMaxOrderQuantity', res.body);
				return callback(res, null);
			} else {
				let result = res.body.results;
				if (result.length > 0) callback(null, { statusCode: 200, result: result[0] });
				else callback({ statusCode: 400, message: 'No document' }, null);
			}
		} catch (err) {
			console.log('\loadMaxOrderQuantity', err);
			callback(err, null);
		}
	});
}

// max order quantity
maxOrderQuantityModel.updateMaxOrderQuantity = (id, changes, sessionId, callback) => {
	try {
		let SETquery = [];
		for (let i in changes){
			key = i, value = changes[i], vartype = typeof value;

			if (vartype == 'string') SETquery.push(`\`${key}\`='${value}'`);
			else if (vartype == 'object') SETquery.push(`\`${key}\`=${JSON.stringify(value)}`);
		}

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

maxOrderQuantityModel.updateAllMaxOrderQuantity = (materials, sessionId, callback) => {
	async.forEachOf(materials, (material, id, callback) => {
		let SETquery = [];
		for (let i in material) SETquery.push(`\`${i}\`='${material[i]}'`);

		const query = `
		UPDATE ${couchbucket} USE KEYS '${id}'
		SET ${SETquery.toString()} RETURNING META(bridgestone).id`;

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
					let result = res.body.results;
					if (result.length == 1) callback();
					else throw { statusCode: 400, message: 'No document' };
				}
			} catch (err) {
				logErrors({ func: 'updateMaterials', subfunc: 'update MATERIAL doc' }, {}, err);
				return callback(err, null);
			}
		});
	}, (err, res) => {
		if (err) callback(err, null);
		else callback(null, { statusCode: 200, result: 'All updated' });
	});
}

// material, visible stock
maxOrderQuantityModel.loadAllMaterial = (sessionId, callback) => {
	let stocksDoc = [], materialsDoc = [];
	async.parallel([
		// get stock
		(callback) => {
			const query = `
			SELECT materialCode, totalStock AS stock, size||' '||oldMaterialNumber AS sizePattern, size||' '||oldMaterialNumber||' '||country AS combination
			FROM ${config.db.bucket}
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
						console.log('\nloadAllMaterial', res.body);
						return callback(res, null);
					} else {
						let result = res.body.results;
						if (result.length > 0) {
							stocksDoc = result
							// console.log(stocksDoc)
							callback(null, result)
						}
						else callback({ statusCode: 400, message: 'Unable to get stocks' }, null);
					}
				} catch (err) {
					console.log('\nloadAllMaterial', err);
					callback(err, null);
				}
			});
		},

		// get material
		(callback) => {
			const query = `
			SELECT m.id, m.materialCode, m.size, m.oldMaterialNumber, m.maxOrderQuantity, m.materialGroup, m.storageLocation, m.country, m.size||' '||m.oldMaterialNumber AS sizePattern, m.size||' '||m.oldMaterialNumber||' '||m.country AS combination,
			s.totalStock AS stockOwn
			FROM ${config.db.bucket} AS m
			JOIN ${config.db.bucket} AS s ON KEYS m.stockId
			WHERE m.docType='MATERIAL' AND s.docType='STOCK::LIMIT'
			AND m.materialCode IS NOT MISSING AND m.size IS NOT MISSING`;

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
						console.log('\nloadAllMaterial', res.body);
						return callback(res, null);
					} else {
						let result = res.body.results;
						if (result.length > 0) {
							materialsDoc = result;
							callback(null, result);
						}
						else callback({ statusCode: 400, message: 'Unable to get stocks' }, null);
					}
				} catch (err) {
					console.log('\nloadAllMaterial', err);
					callback(err, null);
				}
			});
		}
	],

	(err, [ stocksDoc, materialsDoc ]) => {
		if (err) {
			console.log('\nloadAllMaterial', err);
			return callback(err, null);
		}

		let material, stocks;
		let combination;
		let stocksCache = {}, stockCache;

		for (let i in materialsDoc) {
			material = materialsDoc[i];

			combination = material.combination;
			stockCache = stocksCache[combination];
			material.stockOwn = parseInt(material.stockOwn);
			
			// stock
			if (!stockCache) {
				stocks = stocksDoc.filter(item => item.combination == combination);
				material.stock = stocks.reduce((sum, item) => sum + parseInt(item.stock), 0);
				material.sameitem = stocks.length;
				stocksCache[combination] = {
					stock: material.stock,
					items: stocks.length
				};
			} else {
				material.stock = stockCache.stock;
				material.sameitem = stockCache.items;
			}

		}

		callback(null, { statusCode: 200, result: materialsDoc });
	});
}

module.exports.maxOrderQuantityModel = maxOrderQuantityModel;