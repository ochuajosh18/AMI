const request = require('request').defaults({json: true});
const async = require('async');
const config = require('../config/config');
const moment = require('moment');
const countrycode = require('../public/localdata/countryModel');
const couchbucket = config.db.bucket;

function materialModel(){}

// materialblock
materialModel.updateMaterial = (id, changes, sessionId, callback) => {
	let SETquery = [], vartype, key, change;
	for (let i in changes) {
		key = i, value = changes[i], vartype = typeof value;

		if (vartype == 'string') SETquery.push(`\`${key}\`='${value}'`);
		else if (vartype == 'object') SETquery.push(`\`${key}\`=${JSON.stringify(value)}`);
	}

  	const query = `
  	UPDATE ${couchbucket} USE KEYS '${id}'
  	SET ${SETquery.toString()} RETURNING META(${couchbucket}).id as id`;

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
				console.log('\nupdateMaterial', res.body);
				return callback(res, null);
			} else {
				let result = res.body.results;
				if (result.length == 1) callback(null, { statusCode: 200, result: result[0] });
				else {
					console.log('\nupdateMaterial', res.body);
					callback({ statusCode: 400, message: 'No document' });
				}
			}
		} catch (err) {
			console.log('\nupdateMaterial', err);
			callback(err, null);
		}
  	});
}

// materialblock
materialModel.updateMaterialLevel2 = (id, changes, sessionId, callback) => {
	let SETquery = [], vartype, key1, value1, key2, value2;
	for (let i in changes) {
		key1 = i, value1 = changes[i];

		for (let j in value1) {
			key2 = j, value2 = changes[i][j], vartype = typeof value2;

			if (vartype == 'string') SETquery.push(`\`${key1}\`.\`${key2}\`='${value2}'`);
			else if (vartype == 'object') SETquery.push(`\`${key1}\`.\`${key2}\`=${JSON.stringify(value2)}`);
		}
	}

  	const query = `
  	UPDATE ${couchbucket} USE KEYS '${id}'
  	SET ${SETquery.toString()} RETURNING META(${couchbucket}).id as id`;

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
				console.log('\nupdateMaterial', res.body);
				return callback(res, null);
			} else {
				let result = res.body.results;
				if (result.length == 1) callback(null, { statusCode: 200, result: result[0] });
				else {
					console.log('\nupdateMaterial', res.body);
					callback({ statusCode: 400, message: 'No document' });
				}
			}
		} catch (err) {
			console.log('\nupdateMaterial', err);
			callback(err, null);
		}
  	});
}

// material block
materialModel.updateUnsetMaterial = (id, changes, sessionId, callback) => {
	let UNSETquery = [];
	for (let i in changes) UNSETquery.push(`\`${i}\``);

  	const query = `
  	UPDATE ${couchbucket} USE KEYS '${id}'
  	UNSET ${UNSETquery.toString()} RETURNING META(${couchbucket}).id as id`;

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
				console.log('\nupdateUnsetMaterial', res.body);
				return callback(res, null);
			} else {
				let result = res.body.results;
				if (result.length == 1) callback(null, { statusCode: 200, result: result[0] });
				else {
					console.log('\nupdateUnsetMaterial', res.body);
					callback({ statusCode: 400, message: 'No document' });
				}
			}
		} catch (err) {
			console.log('\nupdateUnsetMaterial', err);
			callback(err, null);
		}
  	});
}

// material block
materialModel.updateUnsetMaterialLevel2 = (id, changes, sessionId, callback) => {
	let SETquery = [], vartype, key1, value1, key2, value2;
	for (let i in changes) {
		key1 = i, value1 = changes[i];

		for (let j in value1) {
			key2 = j, value2 = changes[i][j], vartype = typeof value2;

			SETquery.push(`\`${key1}\`.\`${key2}\``);
		}
	}

  	const query = `
  	UPDATE ${couchbucket} USE KEYS '${id}'
  	UNSET ${SETquery.toString()} RETURNING META(${couchbucket}).id as id`;

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
				console.log('\nupdateUnsetMaterialLevel2', res.body);
				return callback(res, null);
			} else {
				let result = res.body.results;
				if (result.length == 1) callback(null, { statusCode: 200, result: result[0] });
				else {
					console.log('\nupdateUnsetMaterialLevel2', res.body);
					callback({ statusCode: 400, message: 'No document' });
				}
			}
		} catch (err) {
			console.log('\nupdateUnsetMaterialLevel2', err);
			callback(err, null);
		}
  	});
}

// normalsales, specialsales
materialModel.loadMaterial = (id, sessionId, callback) => {
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
				console.log('\nloadMaterial', res.body);
				return callback(res, null);
			} else {
				let result = res.body.results;
				if (result.length > 0) callback(null, { statusCode: 200, result: result[0] });
				else callback({ statusCode: 400, message: 'No document' }, null);
			}
		} catch (err) {
			console.log('\nloadMaterial', err);
			callback(err, null);
		}
	});
}

// material, visible stock
materialModel.loadAllMaterial = (sessionId, callback) => {
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
			SELECT m.id, m.materialCode, m.size, m.oldMaterialNumber, m.materialGroup, m.storageLocation, m.country, m.maxOrderQuantity, m.size||' '||m.oldMaterialNumber AS sizePattern, m.size||' '||m.oldMaterialNumber||' '||m.country AS combination,
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
				material.stock = stocks.reduce((sum, item) => {
					sum = sum + parseInt(item.stock); 	
					return sum;
				}, 0);
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

// material note
materialModel.loadAllMaterialNote = (sessionId, callback) => {
	async.parallel([
		(callback) => {
			const query = `
			SELECT RAW ${couchbucket} FROM ${couchbucket}
			USE KEYS 'NOTE::MATERIAL'`;

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
						console.log('\nloadAllMaterialNote', res.body);
						return callback(res, null);
					} else {
						let result = res.body.results;
						if (result.length > 0) callback(null, result[0]);
						else callback({ statusCode: 400, message: 'No document' }, null);
					}
				} catch (err) {
					console.log('\nloadAllMaterialNote', err);
					callback(err, null);
				}
			});
		},

		// get stock
		(callback) => {
			const query = `
			SELECT materialCode, totalStock AS stock, size||' '||oldMaterialNumber AS sizePattern, size||' '||oldMaterialNumber||' '||country AS combination
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
						console.log('\nloadAllMaterialNote', res.body);
						return callback(res, null);
					} else {
						let result = res.body.results;
						if (result.length > 0) callback(null, result);
						else callback({ statusCode: 400, message: 'Unable to get stocks' }, null);
					}
				} catch (err) {
					console.log('\nloadAllMaterialNote', err);
					callback(err, null);
				}
			});
		},

		// get material
		(callback) => {
			const query = `
			SELECT m.id, m.materialCode, m.size, m.oldMaterialNumber, m.materialGroup, m.storageLocation, m.country, m.size||' '||m.oldMaterialNumber AS sizePattern, m.size||' '||m.oldMaterialNumber||' '||m.country AS combination,
			s.totalStock AS stockOwn
			FROM ${couchbucket} AS m
			JOIN ${couchbucket} AS s ON KEYS m.stockId
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
						console.log('\nloadAllMaterialNote', res.body);
						return callback(res, null);
					} else {
						let result = res.body.results;
						if (result.length > 0) callback(null, result);
						else callback({ statusCode: 400, message: 'Unable to get stocks' }, null);
					}
				} catch (err) {
					console.log('\nloadAllMaterialNote', err);
					callback(err, null);
				}
			});
		}
	],

	(err, [ notes, stocksDoc, materialsDoc ]) => {
		if (err) {
			console.log('\nloadAllMaterialNote', err);
			return callback(err, null);
		}

		let material, stocks, note, combination;
		let stocksCache = {}, stockCache;

		for (let i in materialsDoc) {
			material = materialsDoc[i];

			combination = material.combination;
			stockCache = stocksCache[combination];
			note = notes[combination];
			material.stockOwn = parseInt(material.stockOwn);
			material.note = (note) ? note : '';

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

// material block
materialModel.loadAllMaterialBlock = (sessionId, callback) => {
	let blocks = {};
	async.parallel([
		(callback) => {
			const query = `
			SELECT RAW ${couchbucket} FROM ${couchbucket}
			USE KEYS 'BLOCK::MATERIAL::NORMAL'`;

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
						console.log('\nloadAllMaterialNote', res.body);
						return callback(res, null);
					} else {
						let result = res.body.results;
						if (result.length <= 0) callback({ statusCode: 400, message: 'No document' }, null);
						else {
							let block = result[0];

							for (let i in block) {
								blocks[i] = { blockType: 'normal', customer: block[i] }
							}
							callback(null, block);
						}
					}
				} catch (err) {
					console.log('\nloadAllMaterialNote', err);
					callback(err, null);
				}
			});
		},

		(callback) => {
			const query = `
			SELECT RAW ${couchbucket} FROM ${couchbucket}
			USE KEYS 'BLOCK::MATERIAL::DATE'`;

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
						console.log('\nloadAllMaterialNote', res.body);
						return callback(res, null);
					} else {
						let result = res.body.results;
						if (result.length <= 0) callback({ statusCode: 400, message: 'No document' }, null);
						else {
							let dates = result[0], dateRange, startDate, endDate;

							for (let i in dates) {
								dateRange = i.split(' - ');
								startDate = dateRange[0], endDate = dateRange[1];
								block = dates[i];

								for (let j in block) blocks[j] = { blockType: 'date', customer: block[j], startDate, endDate }
							}
							callback(null, result[0]);
						}
					}
				} catch (err) {
					console.log('\nloadAllMaterialNote', err);
					callback(err, null);
				}
			});
		},

		// get stock
		(callback) => {
			const query = `
			SELECT materialCode, totalStock AS stock, size||' '||oldMaterialNumber AS sizePattern, size||' '||oldMaterialNumber||' '||country AS combination
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
						console.log('\nloadAllMaterialBlock', res.body);
						return callback(res, null);
					} else {
						let result = res.body.results;
						if (result.length > 0) callback(null, result);
						else callback({ statusCode: 400, message: 'Unable to get stocks' }, null);
					}
				} catch (err) {
					console.log('\nloadAllMaterialBlock', err);
					callback(err, null);
				}
			});
		},

		// get material
		(callback) => {
			const query = `
			SELECT m.id, m.materialCode, m.size, m.oldMaterialNumber, m.materialGroup, m.storageLocation, m.country, m.size||' '||m.oldMaterialNumber AS sizePattern, m.size||' '||m.oldMaterialNumber||' '||m.country AS combination,
			s.totalStock AS stockOwn
			FROM ${couchbucket} AS m
			JOIN ${couchbucket} AS s ON KEYS m.stockId
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
						console.log('\nloadAllMaterialBlock', res.body);
						return callback(res, null);
					} else {
						let result = res.body.results;
						if (result.length > 0) callback(null, result);
						else callback({ statusCode: 400, message: 'Unable to get stocks' }, null);
					}
				} catch (err) {
					console.log('\nloadAllMaterialBlock', err);
					callback(err, null);
				}
			});
		}
	],

	(err, [ block1, block2, stocksDoc, materialsDoc ]) => {
		if (err) {
			console.log('\nloadAllMaterialBlock', err);
			return callback(err, null);
		}

		let material, stocks, combination, block;
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

			// block
			block = blocks[combination];
			if (block) {
				material.isBlock = true;
				material.blockType = block.blockType;
				material.customer = block.customer;
				if (material.blockType == 'date') {
					material.blockStartDate = block.startDate;
					material.blockEndDate = block.endDate;
				}
			}
		}

		callback(null, { statusCode: 200, result: materialsDoc });
	});
}

module.exports.materialModel = materialModel;