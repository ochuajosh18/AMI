const request = require('request').defaults({json: true});
const async = require('async');
const config = require('../config/config');
const moment = require('moment');
const winston = require('winston');
const couchbucket = config.db.bucket;

function orderModel(){}

function logErrors({ func, subfunc }, { user, timestamp }, err) {
	if (err.hasOwnProperty('body')) err = err.body;
	console.log(`\n\n${func} - ${subfunc}\n`, JSON.stringify(err));
	winston.error(`${func} ${subfunc}`, err)
}

function loggerText({error, func, action}) {
	console.log(`----- ${error}\n • ${func}\n • ${action}\n-----`);
}
// normalsales
orderModel.createBackorders = ({ backorders }, sessionId, callback) => {
	async.waterfall([
		// update backorder counter
		(callback) => {
			const query = `
			UPDATE ${couchbucket} USE KEYS 'BACKORDERSNO'
			SET count=TONUMBER(count) + 1
			RETURNING RAW count`;

			const options = {
				headers : {'Accept': 'application/json', 'Cookie': sessionId},
				url     : config.public.n1ql_url,
				method  : 'POST',
				body    : {statement: query}
			};

			request(options, (err, res) => {
				try	{
					if (err) throw err;
					else if (res.statusCode >= 300) throw res;
					else {
						let result = res.body.results;
						if (result.length <= 0) callback({ statusCode: 400, message: 'No document' }, null);
						else {
							let base = 'BA00000000', count = result[0].toString();
							let SOno = base.substring(0, base.length - count.length) + count;

							callback(null, SOno);
						}
					}
				} catch (err) {
					logErrors({ func: 'createBackorders', subfunc: 'update BACKORDER counter' }, {}, err);
					return callback(err, null);
				}
			});
		},
		// create backorder doc
		(SOno, callback) => {
			async.forEachOf(backorders, (order, id, callback) => {
				const key = `BACKORDER::${SOno}::${order.salesOrderNo}::${order.salesOrderItemNo}::${order.customerCode}`;

				order.id = key;
				order.channels = ['ADMIN', 'BACKORDER', order.customerCode];
				order.docType = 'BACKORDER';
				order.backOrderNo = SOno;

				const query = `
				INSERT INTO ${couchbucket} (KEY, VALUE)
				VALUES ('${key}', ${JSON.stringify(order)})
				RETURNING META(${couchbucket}).id as id`;

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
						logErrors({ func: 'createBackorders', subfunc: 'create BACKORDER doc' }, {}, err);
						return callback(err, null);
					}
				});
			}, (err) => {
				if (err) callback(err, null);
				else callback(null, { statusCode: 200, result: SOno });
			});
		}
	],

	(err, res) => {
		if (err) return callback(err, null);
		else callback(null, res);
	});
}

// normalsales, specialsales, creditoverdue
orderModel.updateOrders = (orders, sessionId, callback) => {
	async.forEachOf(orders, (order, id, callback) => {
		let SETquery = [];
		for (let i in order) SETquery.push(`\`${i}\`='${order[i]}'`);

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
				logErrors({ func: 'updateOrders', subfunc: 'update ORDER doc' }, {}, err);
				return callback(err, null);
			}
		});
	}, (err, res) => {
		if (err) callback(err, null);
		else callback(null, { statusCode: 200, result: 'All updated' });
	});
}

// normalsales
orderModel.loadAllNormalOrder = (data, sessionId, callback) => {
	const query = `
	SELECT META(o).id as id, o.salesOrderNo, o.salesOrderNoSAP, o.customerCode, o.orderType, o.dateCreated||' '||o.timeCreated AS dateCreated, o.usedMaterialCode,
	o.salesOrderItemNo, o.price, o.backOrder, o.quantity, o.requestedDate||' '||o.requestedTime AS requestedDate, o.requestDeliveryMethod, o.carPlateNo,
	o.orderItemStatus, o.salesperson[0] AS salesperson, o.shipToParty, o.soldToUserId, o.createdBy, o.customerId, o.materialId, o.shipToId,
	c.name1||' '||c.name2 as customerName, u.firstName||' '||u.lastName as orderedBy, u.status, u2.distributionChannel, u2.email,
	m.materialCode, m.materialGroup, m.size, m.oldMaterialNumber, m.country, m.storageLocation,
	c2.street AS shipToAddress, c2.customerCode AS shipToCustomerCode, c2.name1||' '||c2.name2 AS shipToName
	FROM ${couchbucket} AS o
	JOIN ${couchbucket} AS m ON KEYS o.materialId
	JOIN ${couchbucket} AS c ON KEYS o.customerId
	JOIN ${couchbucket} AS c2 ON KEYS o.shipToId
	JOIN ${couchbucket} AS u ON KEYS o.createdBy
	JOIN ${couchbucket} AS u2 ON KEYS o.soldToUserId
	WHERE o.docType='ORDER' AND m.docType='MATERIAL' AND c.docType='CUSTOMER' AND c2.docType='CUSTOMER' AND u.docType='USER' AND u2.docType='USER'
	AND o.orderItemStatus='saved' AND o.orderType='Normal Order' AND o.isDeleted IS MISSING
	AND o.salesOrderNo IS NOT MISSING AND o.customerCode IS NOT MISSING`;

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
				console.log('\nloadAllNormalOrder', res.body);
				return callback(res, null);
			} else {
				let result = res.body.results;
				callback(null, { statusCode: 200, result });
			}
		} catch (err) {
			console.log('\nloadAllNormalOrder', err);
			callback(err, null);
		}
	});
}

// normalsales
orderModel.loadAllBackorder = (sessionId, callback) => {
	const query = `
	SELECT META(o).id as id, o.salesOrderNo, o.backOrderNo, o.customerCode, o.orderType, o.dateCreated||' '||o.timeCreated AS dateCreated, o.usedMaterialCode,
	o.salesOrderItemNo, o.price, o.quantity, o.requestedDate||' '||o.requestedTime AS requestedDate, o.requestDeliveryMethod, o.carPlateNo,
	o.orderItemStatus, o.salesperson[0] AS salesperson, o.shipToParty, o.soldToUserId, o.createdBy, o.customerId, o.materialId, o.shipToId,
	c.name1||' '||c.name2 as customerName, u.firstName||' '||u.lastName as orderedBy, u.status, u2.distributionChannel, u2.email,
	m.materialCode, m.materialGroup, m.size, m.oldMaterialNumber, m.country, m.storageLocation,
	c2.street AS shipToAddress, c2.customerCode AS shipToCustomerCode, c2.name1||' '||c2.name2 AS shipToName
	FROM ${couchbucket} AS o
	JOIN ${couchbucket} AS m ON KEYS o.materialId
	JOIN ${couchbucket} AS c ON KEYS o.customerId
	JOIN ${couchbucket} AS c2 ON KEYS o.shipToId
	JOIN ${couchbucket} AS u ON KEYS o.createdBy
	JOIN ${couchbucket} AS u2 ON KEYS o.soldToUserId
	WHERE o.docType='BACKORDER' AND m.docType='MATERIAL' AND c.docType='CUSTOMER' AND c2.docType='CUSTOMER' AND u.docType='USER' AND u2.docType='USER'
	AND o.orderItemStatus='pending order approval' AND o.isDeleted IS MISSING
	AND o.salesOrderNo IS NOT MISSING AND o.customerCode IS NOT MISSING`;

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
			logErrors({ func: 'loadAllBackorder', subfunc: 'get BACKORDER doc' }, {}, err);
			callback(err, null);
		}
	});
}

// specialsales
orderModel.loadAllSpecialOrder = (data, sessionId, callback) => {
	const query = `
	SELECT META(o).id as id, o.salesOrderNo,  o.salesOrderNoSAP, o.customerCode, o.orderType, o.dateCreated||' '||o.timeCreated AS dateCreated, o.usedMaterialCode,
	o.salesOrderItemNo, o.price, o.backOrder, o.quantity, o.discount, o.indentDiscount, o.amount, o.netAmount, o.requestedDate||' '||o.requestedTime AS requestedDate, o.requestDeliveryMethod, o.carPlateNo, o.paymentTerms,
	o.orderItemStatus, o.salesperson[0] AS salesperson, o.shipToParty, o.soldToUserId, o.createdBy, o.customerId, o.materialId, o.shipToId,
	c.name1||' '||c.name2 as customerName, u.firstName||' '||u.lastName as orderedBy, u.status, u2.distributionChannel, u2.email,
	m.materialCode, m.materialGroup, m.size, m.oldMaterialNumber, m.country, m.storageLocation,
	c2.street AS shipToAddress, c2.customerCode AS shipToCustomerCode, c2.name1||' '||c2.name2 AS shipToName
	FROM ${couchbucket} AS o
	JOIN ${couchbucket} AS m ON KEYS o.materialId
	JOIN ${couchbucket} AS c ON KEYS o.customerId
	JOIN ${couchbucket} AS c2 ON KEYS o.shipToId
	JOIN ${couchbucket} AS u ON KEYS o.createdBy
	JOIN ${couchbucket} AS u2 ON KEYS o.soldToUserId
	WHERE o.docType='ORDER' AND m.docType='MATERIAL' AND c.docType='CUSTOMER' AND c2.docType='CUSTOMER' AND u.docType='USER' AND u2.docType='USER'
	AND o.orderItemStatus='pending order approval' AND o.orderType='Special Order' AND o.isDeleted IS MISSING
	AND o.salesOrderNo IS NOT MISSING AND o.customerCode IS NOT MISSING`;

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
			logErrors({ func: 'loadAllSpecialOrder', subfunc: 'get ORDER doc' }, {}, err);
			callback(err, null);
		}
	});
}

// creditoverdue
orderModel.loadAllCreditOverduOrder = (data, sessionId, callback) => {
	const query = `
	SELECT META(o).id as id, o.backorder, o.salesOrderNo, o.customerCode, o.orderType, o.dateCreated||' '||o.timeCreated AS dateCreated, o.usedMaterialCode,
	o.salesOrderItemNo, o.price, o.quantity, o.discount, o.indentDiscount, o.amount, o.netAmount, o.requestedDate||' '||o.requestedTime AS requestedDate, o.requestDeliveryMethod, o.carPlateNo, o.paymentTerms,
	o.orderItemStatus, o.salesperson[0] AS salesperson, o.shipToParty, o.soldToUserId, o.createdBy, o.customerId, o.materialId, o.shipToId, o.approver, o.salesOrderApprover, o.creditLimit, o.creditExceed, o.overduePayment,
	c.name1||' '||c.name2 as customerName, u.firstName||' '||u.lastName as orderedBy, u.status, u2.distributionChannel, u2.email,
	m.materialCode, m.materialGroup, m.size, m.oldMaterialNumber, m.country, m.storageLocation,
	c2.street AS shipToAddress, c2.customerCode AS shipToCustomerCode, c2.name1||' '||c2.name2 AS shipToName
	FROM ${couchbucket} AS o
	JOIN ${couchbucket} AS m ON KEYS o.materialId
	JOIN ${couchbucket} AS c ON KEYS o.customerId
	JOIN ${couchbucket} AS c2 ON KEYS o.shipToId
	JOIN ${couchbucket} AS u ON KEYS o.createdBy
	JOIN ${couchbucket} AS u2 ON KEYS o.soldToUserId
	WHERE o.docType='ORDER' AND m.docType='MATERIAL' AND c.docType='CUSTOMER' AND c2.docType='CUSTOMER' AND u.docType='USER' AND u2.docType='USER'
	AND o.orderItemStatus='submitted' AND o.isDeleted IS MISSING
	AND o.salesOrderNo IS NOT MISSING AND o.customerCode IS NOT MISSING`;

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
			logErrors({ func: 'loadAllCreditOverduOrder', subfunc: 'get ORDER doc' }, {}, err);
			callback(err, null);
		}
	});
}

// psrtbrchannel
orderModel.psrtbrChannelReport = ({ startDate, endDate, materialGroup, salesperson, orderStatus }, sessionId, callback) => {
	let channelsDoc = [], dealerDoc = [], orderDoc = [];
	async.waterfall([
		// get channels
		(callback) => {
			let channelChar = materialGroup.map(item => `'${item.charAt(0)}'`)

			const query = `
			SELECT channel, description
			FROM ${couchbucket}
			WHERE docType='CHANNEL::DISCOUNT' AND SUBSTR(channel, 0, 1) IN [${channelChar.toString()}]
			AND description IS NOT MISSING AND discount IS NOT MISSING`;

			const options = {
				headers : {'Accept': 'application/json', 'Cookie': sessionId},
				url     : config.public.n1ql_url,
				method  : 'POST',
				body    : {statement: query}
			};

			request(options, (err, res) => {
				try	{
					if (err) throw err;
					else if (res.statusCode >= 300) throw res;
					else {
						channelsDoc = res.body.results;
						callback(null, 'ok');
					}
				} catch (err) {
					logErrors({ func: 'psrtbrChannelReport', subfunc: 'get CHANNEL::DISCOUNT doc' }, {}, err);
					return callback(err, null);
				}
			});
		},

		// get dealer group
		(result, callback) => {
			const query = `
			SELECT customerCode, customerName, psrChannel, tbrChannel
			FROM ${couchbucket}
			WHERE docType='DEALER::GROUP'
			AND customerCode IS NOT MISSING AND customerName IS NOT MISSING`;

			const options = {
				headers : {'Accept': 'application/json', 'Cookie': sessionId},
				url     : config.public.n1ql_url,
				method  : 'POST',
				body    : {statement: query}
			};

			request(options, (err, res) => {
				try	{
					if (err) throw err;
					else if (res.statusCode >= 300) throw res;
					else {
						dealerDoc = res.body.results;
						callback(null, 'ok');
					}
				} catch (err) {
					logErrors({ func: 'psrtbrChannelReport', subfunc: 'get DEALER::GROUP doc' }, {}, err);
					return callback(err, null);
				}
			});
		},

		// get orders
		(result, callback) => {
			let materialGroups = materialGroup.map(item => `'${item}'`);
			let salespersons = salesperson.map(item => `'${item}'`);

			// quantity, customerCode, dateCreated, SUBSTR(materialCode, 0, 3), salesperson, orderItemStatus
			const query = `
			SELECT quantity, customerCode, SUBSTR(materialCode, 0, 3) AS materialGroup
			FROM ${couchbucket}
			WHERE docType='ORDER'
			AND dateCreated BETWEEN '${startDate}' AND '${endDate}'
			AND SUBSTR(materialCode, 0, 3) IN [${materialGroups.toString()}]
			AND salesperson[0] IN [${salespersons.toString()}]
			AND orderItemStatus='${orderStatus}' AND o.isDeleted IS MISSING
			AND salesOrderNo IS NOT MISSING AND customerCode IS NOT MISSING`;

			const options = {
				headers : {'Accept': 'application/json', 'Cookie': sessionId},
				url     : config.public.n1ql_url,
				method  : 'POST',
				body    : {statement: query}
			};

			request(options, (err, res) => {
				try	{
					if (err) throw err;
					else if (res.statusCode >= 300) throw res;
					else {
						orderDoc = res.body.results;
						callback(null, 'ok');
					}
				} catch (err) {
					logErrors({ func: 'psrtbrChannelReport', subfunc: 'get ORDER doc' }, {}, err);
					return callback(err, null);
				}
			});
		},

		// combine orderDoc and deaelerDoc
		(result, callback) => {
			try {
				let dealerDoc2 = [];
				for (let i in materialGroup) {
					dealerDoc = JSON.parse(JSON.stringify(dealerDoc)); // deep copy
					dealerDoc = dealerDoc.map(item => {
						item.materialGroup = materialGroup[i];
						item.channelSort = item[`${materialGroup[i].toLowerCase()}Channel`];
						return item;
					});

					dealerDoc2 = dealerDoc2.concat(dealerDoc);
				}

				for (let i in dealerDoc2) {
					let materialGroupChannel = `${dealerDoc2[i].materialGroup.toLowerCase()}Channel`; // key used for sorting [psr/tbr]Channel

					let channel = channelsDoc.find(item => item.channel == dealerDoc2[i][materialGroupChannel]);
					let order = orderDoc.filter(item => item.customerCode == dealerDoc2[i].customerCode  && item.materialGroup == dealerDoc2[i].materialGroup);
					let total = order.reduce((sum, order) => (!order.quantity) ? sum + 0 : sum + parseInt(order.quantity), 0);

					dealerDoc2[i].channel = channel.description;
					dealerDoc2[i].total = total;
				}

				dealerDoc2.sort((a, b) => {
					if (a.channelSort < b.channelSort) return -1;
					else if (a.channelSort > b.channelSort) return 1;
					else if (a['customerCode'] < b['customerCode']) return -1;
					else if (a['customerCode'] > b['customerCode']) return 1;
					else return 0;
				});

				callback(null, { statusCode : 200, result: dealerDoc2 });
			} catch (err) {
				logErrors({ func: 'psrtbrChannelReport', subfunc: 'combine doc' }, {}, err);
				return callback(err, null);
			}
		}
	],

	(err, res) => {
		if (err) return callback(err, null);
		else callback(null, res);
	});
}

// mtpgroupbysalesman
orderModel.mtpSalesmanReport= ({ salespersonRoleId, orderStatus, startDate, endDate }, sessionId, callback) => {
	let userDoc = [], orderDoc = [];

	async.waterfall([
		// get salespersons
		(callback) => {
			let query = `
			SELECT firstName || " " || lastName AS fullName, customerCode
			FROM ${couchbucket}
			WHERE roleId='${salespersonRoleId}' AND docType = 'USER'
			AND firstName IS NOT MISSING AND lastName IS NOT MISSING`;

			const options = {
				headers : {'Accept': 'application/json', 'Cookie': sessionId},
				url     : config.public.n1ql_url,
				method  : 'POST',
				body    : {statement: query}
			};

			request(options, (err, res) => {
				try	{
					if (err) throw err;
					else if (res.statusCode >= 300) throw res;
					else {
						userDoc = res.body.results;
						callback(null, 'ok');
					}
				} catch (err) {
					logErrors({ func: 'mtpSalesmanReport', subfunc: 'get USER doc' }, {}, err);
					return callback(err, null);
				}
			});
		},

		// get order
		(result, callback) => {
			let query = `
			SELECT salesperson, orderItemStatus, SUBSTR(materialCode,0, 3) AS materialCode, dateCreated, amount, quantity, customerCode
			FROM ${couchbucket}
			WHERE orderItemStatus = '${orderStatus}'
			AND dateCreated BETWEEN '${startDate}' AND '${endDate}'
			AND docType='ORDER' AND o.isDeleted IS MISSING
			AND salesOrderNo IS NOT MISSING AND customerCode IS NOT MISSING`;

			const options = {
				headers : {'Accept': 'application/json', 'Cookie': sessionId},
				url     : config.public.n1ql_url,
				method  : 'POST',
				body    : {statement: query}
			};

			request(options, (err, res) => {
				try	{
					if (err) throw err;
					else if (res.statusCode >= 300) throw res;
					else {
						orderDoc = res.body.results;
						callback(null, 'ok');
					}
				} catch (err) {
					logErrors({ func: 'mtpSalesmanReport', subfunc: 'get ORDER doc' }, {}, err);
					return callback(err, null);
				}
			});
		},

		// combine
		(result, callback) => {
			try	{
				let orders, psrOrder, tbrOrder, othersOrder;
				let salespersonDoc = []

				for (let i in userDoc) {
					orders = orderDoc.filter(item => item.salesperson[0] == userDoc[i].customerCode); // get saleseperson order
					psrOrder = orders.filter(item => item.materialCode == 'PSR'); // get PSR on order
					tbrOrder = orders.filter(item => item.materialCode == 'TBR'); // get TBR on order
					othersOrder = orders.filter(item => item.materialCode != 'PSR' && item.materialCode != 'TBR'); // get Others on order

					userDoc[i].psrTotal = psrOrder.reduce((total, item) => !isNaN(item.quantity) ? parseInt(total) + parseInt(item.quantity ): parseInt(total), 0);
					userDoc[i].tbrTotal = tbrOrder.reduce((total, item) => !isNaN(item.quantity) ? parseInt(total) + parseInt(item.quantity ): parseInt(total), 0);
					userDoc[i].othersTotal = othersOrder.reduce((total, item) => !isNaN(item.quantity) ? parseInt(total) + parseInt(item.quantity ): parseInt(total), 0);

					salespersonDoc.push({
						'customerCode'    : userDoc[i].customerCode,
						'salespersonName' : userDoc[i].fullName,
						'PSR'             : userDoc[i].psrTotal,
						'TBR'             : userDoc[i].tbrTotal,
						'Others'          : userDoc[i].othersTotal
					});
				}

				callback(null, { statusCode : 200, result: salespersonDoc });
			} catch (err) {
				logErrors({ func: 'mtpSalesmanReport', subfunc: 'combine doc' }, {}, err);
				return callback(err, null);
			}
		}
	],

	(err, res) => {
		if (err) return callback(err, null);
		else callback(null, res);
	});
}

// customerorder
orderModel.customerOrderReport= ({ startDate, endDate, soldToCustomers, orderTypes }, sessionId, callback) => {
	let customers = soldToCustomers.map(item => `'${item}'`);
    let ordertypes = orderTypes.map(item => `'${item}'`);

	let query = `
	SELECT meta(o).id, o.dateCreated||' '||o.timeCreated AS dateCreated, o.salesOrderNo, o.salesOrderNoSAP, o.deliveredNo, o.invoicedNo, o.customerCode, o.orderType, o.requestedDate||' '||o.requestedTime AS requestedDate,
	o.shipToId, o.materialCode, o.usedMaterialCode, m.oldMaterialNumber, o.quantity, o.price, c.name1||' '||c.name2 AS soldToCustomer, o.discount, o.amount, o.netAmount,
	s.customerCode AS shipToCustomerCode, s.name1||' '||s.name2 AS shipToCustomer
	FROM ${couchbucket} AS o
	JOIN ${couchbucket} AS c ON KEYS o.customerId
	JOIN ${couchbucket} AS s ON KEYS o.shipToId
	JOIN ${couchbucket} AS m ON KEYS o.materialId
	WHERE o.docType='ORDER' AND c.docType='CUSTOMER' AND s.docType='CUSTOMER' AND m.docType='MATERIAL'
	AND o.dateCreated BETWEEN '${startDate}' AND '${endDate}'
	AND o.customerCode IN [${customers.toString()}]
	AND o.orderType IN [${ordertypes.toString()}] AND o.isDeleted IS MISSING
	AND o.salesOrderNo IS NOT MISSING AND o.customerId IS NOT MISSING`;

	const options = {
		headers : {'Accept': 'application/json', 'Cookie': sessionId},
		url     : config.public.n1ql_url,
		method  : 'POST',
		body    : {statement: query}
	};

	request(options, (err, res) => {
		try	{
			if (err) throw err;
			else if (res.statusCode >= 300) throw res;
			else {
				const result = res.body.results;
				callback(null, { statusCode: 200, result });
			}
		} catch (err) {
			logErrors({ func: 'customerOrderReport', subfunc: 'load ORDER doc' }, {}, err);
			return callback(err, null);
		}
	});
}

// backorder
orderModel.backOrderReport= ({ startDate, endDate, soldToCustomers, orderTypes, reportType }, sessionId, callback) => {
	let customers = soldToCustomers.map(item => `'${item}'`);
    let ordertypes = orderTypes.map(item => `'${item}'`);

	let query;

	if (reportType=='Backorder converted to order') {
		query = `
		SELECT meta(o).id, o.dateCreated||' '||o.timeCreated AS dateCreated, o.backOrderNo, o.salesOrderNo, o.salesOrderNoSAP, o.referenceSalesOrderNo, o.requestedDate||' '||o.requestedTime AS shipDate, o.customerCode, o.orderType,
		o.shipToId, o.materialCode, o.usedMaterialCode, m.oldMaterialNumber, o.quantity, o.orderQuantity, c.name1||' '||c.name2 AS soldToCustomer,
		s.customerCode AS shipToCustomerCode, s.name1||' '||s.name2 AS shipToCustomer
		FROM ${couchbucket} AS o
		JOIN ${couchbucket} AS c ON KEYS o.customerId
		JOIN ${couchbucket} AS s ON KEYS o.shipToId
		JOIN ${couchbucket} AS m ON KEYS o.materialId
		WHERE o.docType='ORDER' AND c.docType='CUSTOMER' AND s.docType='CUSTOMER' AND m.docType='MATERIAL'
		AND o.dateCreated BETWEEN '${startDate}' AND '${endDate}'
		AND o.customerCode IN [${customers.toString()}]
		AND o.orderType IN [${ordertypes.toString()}] AND o.isDeleted IS MISSING
		AND o.salesOrderNo IS NOT MISSING AND o.customerId IS NOT MISSING
		AND o.referenceSalesOrderNo IS NOT MISSING`
	} else {
		query = `
		SELECT meta(o).id, o.dateCreated||' '||o.timeCreated AS dateCreated, o.backOrderNo, o.salesOrderNo, o.customerCode, o.orderType,
		o.shipToId, o.materialCode, o.usedMaterialCode, m.oldMaterialNumber, o.quantity, o.orderQuantity, c.name1||' '||c.name2 AS soldToCustomer,
		s.customerCode AS shipToCustomerCode, s.name1||' '||s.name2 AS shipToCustomer
		FROM ${couchbucket} AS o
		JOIN ${couchbucket} AS c ON KEYS o.customerId
		JOIN ${couchbucket} AS s ON KEYS o.shipToId
		JOIN ${couchbucket} AS m ON KEYS o.materialId
		WHERE o.docType='BACKORDER' AND c.docType='CUSTOMER' AND s.docType='CUSTOMER' AND m.docType='MATERIAL'
		AND o.dateCreated BETWEEN '${startDate}' AND '${endDate}'
		AND o.customerCode IN [${customers.toString()}]
		AND o.orderType IN [${ordertypes.toString()}] AND o.isDeleted IS MISSING
		AND o.salesOrderNo IS NOT MISSING AND o.customerId IS NOT MISSING`
	}

	const options = {
		headers : {'Accept': 'application/json', 'Cookie': sessionId},
		url     : config.public.n1ql_url,
		method  : 'POST',
		body    : {statement: query}
	};

	request(options, (err, res) => {
		try	{
			if (err) throw err;
			else if (res.statusCode >= 300) throw res;
			else {
				const result = res.body.results;
				callback(null, { statusCode: 200, result });
			}
		} catch (err) {
			logErrors({ func: 'backOrderReport', subfunc: 'load BACKORDER doc' }, {}, err);
			return callback(err, null);
		}
	});
}

// orderTransaction
orderModel.loadAllOrderBackorder = ({ startDate, endDate }, sessionId, callback) => {
	console.log('here')
	const query = `
	SELECT META(o).id as id, o.salesOrderNo, o.salesOrderNoSAP, o.backOrderNo, o.customerCode, o.orderType, o.dateCreated||' '||o.timeCreated AS dateCreated, o.amount, o.discount, o.docType,
	o.usedMaterialCode, o.salesOrderItemNo, o.price, o.quantity, o.netAmount, o.requestedDate||' '||o.requestedTime AS requestedDate, o.requestDeliveryMethod, o.carPlateNo, o.salesOrderApprover, o.dateApproved, o.invoiceBlocked,
	o.orderItemStatus, o.salesperson[0] AS salesperson, o.shipToParty, o.soldToUserId, o.createdBy, o.customerId, o.materialId, o.shipToId, o.reasonCancel,
	c.name1||' '||c.name2 as customerName, u.firstName||' '||u.lastName as orderedBy, u2.distributionChannel, u2.email,
	m.materialCode, m.materialGroup, m.size, m.oldMaterialNumber, m.storageLocation,
	c2.street AS shipToAddress, c2.customerCode AS shipToCustomerCode, c2.name1||' '||c2.name2 AS shipToName
	FROM ${couchbucket} AS o
	JOIN ${couchbucket} AS m ON KEYS o.materialId
	JOIN ${couchbucket} AS c ON KEYS o.customerId
	JOIN ${couchbucket} AS c2 ON KEYS o.shipToId
	JOIN ${couchbucket} AS u ON KEYS o.createdBy
	JOIN ${couchbucket} AS u2 ON KEYS o.soldToUserId
	WHERE (o.docType='BACKORDER' OR o.docType='ORDER') AND m.docType='MATERIAL' AND c.docType='CUSTOMER' AND c2.docType='CUSTOMER' AND u.docType='USER'
	AND o.dateCreated BETWEEN '${startDate}' AND '${endDate}' AND o.isDeleted IS MISSING
	AND o.salesOrderNo IS NOT MISSING AND o.customerCode IS NOT MISSING`;

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
			logErrors({ func: 'loadAllOrderBackorder', subfunc: 'get ORDER & BACKORDER doc' }, {}, err);
			callback(err, null);
		}
	});
}

// orderTransaction
orderModel.loadOrderBackorderByCustomerCode = (customerCode, { startDate, endDate }, sessionId, callback) => {
	console.log(customerCode)
	const query = `
	SELECT META(o).id as id, o.salesOrderNo, o.salesOrderNoSAP, o.backOrderNo, o.customerCode, o.orderType, o.dateCreated||' '||o.timeCreated AS dateCreated, o.amount, o.discount, o.docType,
	o.usedMaterialCode, o.salesOrderItemNo, o.price, o.quantity, o.requestedDate||' '||o.requestedTime AS requestedDate, o.requestDeliveryMethod, o.carPlateNo, o.salesOrderApprover, o.dateApproved, o.invoiceBlocked,
	o.orderItemStatus, o.salesperson[0] AS salesperson, o.shipToParty, o.soldToUserId, o.createdBy, o.customerId, o.materialId, o.shipToId, o.reasonCancel,
	c.name1||' '||c.name2 as customerName, u.firstName||' '||u.lastName as orderedBy, u2.distributionChannel, u2.email,
	m.materialCode, m.materialGroup, m.size, m.oldMaterialNumber, m.storageLocation,
	c2.street AS shipToAddress, c2.customerCode AS shipToCustomerCode
	FROM ${couchbucket} AS o
	JOIN ${couchbucket} AS m ON KEYS o.materialId
	JOIN ${couchbucket} AS c ON KEYS o.customerId
	JOIN ${couchbucket} AS c2 ON KEYS o.shipToId
	JOIN ${couchbucket} AS u ON KEYS o.createdBy
	JOIN ${couchbucket} AS u2 ON KEYS o.soldToUserId
	WHERE (o.docType='BACKORDER' OR o.docType='ORDER') AND m.docType='MATERIAL' AND c.docType='CUSTOMER' AND c2.docType='CUSTOMER' AND u.docType='USER'
	AND o.dateCreated BETWEEN '${startDate}' AND '${endDate}' AND o.customerCode='${customerCode}' AND o.isDeleted IS MISSING
	AND o.salesOrderNo IS NOT MISSING AND o.customerCode IS NOT MISSING`;

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
			logErrors({ func: 'loadOrderBackorderByCustomerCode', subfunc: 'get BACKORDER doc' }, {}, err);
			callback(err, null);
		}
	});
}

// mtpgroupbycustomer
orderModel.mtpCustomerReport= ({ startDate, endDate, materialGroups, orderTypes, salesperson }, sessionId, callback) => {
  	let orderDoc = [], customerDoc = [];

  	async.waterfall([
  		// get order
  		(callback) => {
  			let salespersons = salesperson.map(item => `'${item}'`);
  			let matGroups = materialGroups.map(item => `'${item}'`);
  			let ordertypes = orderTypes.map(item => `'${item}'`);

  			let query = `
  			SELECT amount, customerCode
  			FROM ${couchbucket}
  			WHERE docType = 'ORDER'
  			AND salesperson[0] IN [${salespersons.toString()}]
  			AND materialGroup IN [${matGroups.toString()}]
  			AND orderType IN [${ordertypes.toString()}] 
  			AND dateCreated BETWEEN '${startDate}' AND '${endDate}'`;


  			const options = {
  				headers : {'Accept': 'application/json', 'Cookie': sessionId},
  				url     : config.public.n1ql_url,
  				method  : 'POST',
  				body    : {statement: query}
  			};

  			request(options, (err, res) => {
  				if (err) return callback(err, null);
  				else if (res.statusCode >= 300) return callback(res, null);
  				else {
  					orderDoc = res.body.results;
  					callback(null, 'ok');
  				}
  			});
  		},

  		// get customer
  		(result, callback) => {
  			let query = `
  			SELECT name1, customerCode
  			FROM ${couchbucket}
  			WHERE docType = 'CUSTOMER'`;

  			const options = {
  				headers : {'Accept': 'application/json', 'Cookie': sessionId},
  				url     : config.public.n1ql_url,
  				method  : 'POST',
  				body    : {statement: query}
  			};

  			request(options, (err, res) => {
  				if (err) return callback(err, null);
  				else if (res.statusCode >= 300) return callback(res, null);
  				else {
  					customerDoc = res.body.results;
  					callback(null, 'ok');
  				}
  			});
  		},

  		// // combine
  		(result, callback) => {
  			for(var i in orderDoc){          
  				let customer = customerDoc.find(item => orderDoc[i].customerCode == item.customerCode);
  				orderDoc[i].customerName = customer.name1;
  			}

  			callback(null, 'ok combined')
  		},

  		// // remove duplicate, get total
  		(result, callback) => {
  			let data = removeDuplicate(orderDoc, 'customerCode');

  			let totalBill, customerOrder;
  			for (let i in data) { 
  				customerOrder = orderDoc.filter(item => data[i].customerCode == item.customerCode);
  				data[i].amount = customerOrder.reduce((total, item) => total + parseFloat(item.amount), 0);
  			}

  			callback(null, data);
  		}
  	],

  	(err, res) => {
  		if (err) callback(err, null);
  		else callback(null, res);
  	});
}

// creditapproval report
orderModel.loadCreditApprovalReport = ({ startDate, endDate, soldToCustomers }, sessionId, callback) => {
	let customers = soldToCustomers.map(item => `'${item}'`);

	const query = `
	SELECT o.dateCreated, o.salesOrderNo, o.salesOrderNoSAP, o.creditLimit, o.creditExceed, o.overduePayment,
	c.customerCode, c.name1||' '||c.name2 AS customerName, u.firstName||' '||u.lastName AS creditApprover
	FROM ${couchbucket} AS o
	JOIN ${couchbucket} AS c ON KEYS o.customerId
	JOIN ${couchbucket} AS u ON KEYs o.creditOrderApprover
	WHERE o.dateCreated BETWEEN '${startDate}' AND '${endDate}'
	AND c.customerCode IN [${customers.toString()}]
	AND o.docType='ORDER' AND c.docType='CUSTOMER' AND u.docType='USER'
	AND o.salesOrderNo IS NOT MISSING AND o.customerCode IS NOT MISSING`;

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
			logErrors({ func: 'loadCreditApprovalReport', subfunc: 'get ORDER,CUSTOMER,USER doc' }, {}, err);
			callback(err, null);
		}
	});
}

function removeDuplicate(data, key) {
	var uniqueData = [], newData = [];

	for(i in data){    
		if(uniqueData.indexOf(data[i][key]) === -1){
			uniqueData.push(data[i][key]);
			newData.push(data[i]);
		}
	}

	return newData;
}

module.exports.orderModel = orderModel;