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
const emailnotifModel = require('../models/emailnotif').emailnotifModel;

function userModel(){}

function logErrors({ func, subfunc }, { user, timestamp }, err) {
	if (err.hasOwnProperty('body')) err = err.body;
	console.log(`\n\n${func} - ${subfunc}\n`, JSON.stringify(err));
	winston.error(`${func} ${subfunc}`, err)
}

// user
userModel.loadOtherUser = ({ salesRoleId, customerRoleId }, callback) => {
	let query = `
	SELECT META(u).id AS id, u.email, u.firstName, u.middleName, u.lastName, u.department, u.roleId, r.\`role\`
	FROM ${couchbucket} AS u JOIN ${couchbucket} AS r ON KEYS u.roleId
	WHERE u.docType='USER' AND r.docType='ROLE'
	AND u.roleId NOT IN ['${salesRoleId}', '${customerRoleId}']
	AND u.firstName IS NOT MISSING AND u.lastName IS NOT MISSING
	AND u.documentStatus='ACTIVE'
	AND r.\`role\` IS NOT MISSING AND r.access IS NOT MISSING`;

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
  		} else {
			const result = res.body.results;
			callback(null, { statusCode : 200, result: result });
		}
	});
}

// customerorder
userModel.loadCustomerUser = ({ customerRoleId }, callback) => {
	let query = `
	SELECT META(u).id AS id, c.customerCode, c.name1 || ' ' || c.name2 AS customerName,
	u.firstName || ' ' || u.lastName AS accountName, u.email, u.status, u.distributionChannel
	FROM ${couchbucket} AS u JOIN ${couchbucket} AS c ON KEYS u.customerId
	WHERE u.docType='USER' AND c.docType='CUSTOMER'
	AND u.roleId='${customerRoleId}'
	AND u.firstName IS NOT MISSING AND u.lastName IS NOT MISSING`;

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
  		} else {
			const result = res.body.results;
			callback(null, { statusCode : 200, result: result });
		}
	});
}

// invitation
userModel.loadCustomers_WithoutAccount= ({ customerRoleId }, callback) => {
	try {
		let customerDoc = [], userDoc = [];

		async.waterfall([
	        // get customer by partnerType
	        (callback) => {
	        	let query = `
	        	SELECT META(${couchbucket}).id AS id, customerCode, name1 || ' ' || name2 AS customerName, smtpAddr
	        	FROM ${couchbucket}
	        	WHERE docType='CUSTOMER' AND partnerType=''
	        	AND customerCode IS NOT MISSING AND mainCustomerCode IS NOT MISSING`;

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
	        		} else {
	        			customerDoc = res.body.results;
	        			callback(null, 'ok');
	        		}
	        	});
	        },

	        // get user by roleId
	        (result, callback) => {
	        	let query = `
	        	SELECT customerCode
	        	FROM ${couchbucket}
	        	WHERE docType='USER' AND roleId='${customerRoleId}'
	        	AND firstName IS NOT MISSING AND lastName IS NOT MISSING`;

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
	        		} else {
	        			userDoc = res.body.results;
	        			callback(null, 'ok');
	        		}
	        	});
	        },

	        // remove duplicate/filter customer without account
	        (result, callback) => {
	        	let index;

	        	for (let i in userDoc) {
	        		index = customerDoc.findIndex(item => item.customerCode == userDoc[i].customerCode);
	        		customerDoc.splice(index, 1)
	        	}

	        	callback(null, 'ok');
	        }
	    ],

	    (err, res) => {
	    	if (err) callback(err, null);
	    	else callback(null, { statusCode : 200, result: customerDoc });
	    });
	} catch (err) {
		callback(err, null);
		console.log(error)
	}
}

// user, psrtbrchannel
userModel.loadSalespersonUser = ({ salesRoleId }, callback) => {
	let query = `
	SELECT META(u).id AS id, c.customerCode, c.name1 || ' ' || c.name2 AS salespersonName,
	u.firstName || ' ' || u.lastName AS accountName, u.email, u.status, u.customers
	FROM ${couchbucket} AS u JOIN ${couchbucket} AS c ON KEYS u.customerId
	WHERE u.docType='USER' AND c.docType='CUSTOMER'
	AND u.roleId='${salesRoleId}'
	AND u.firstName IS NOT MISSING AND u.lastName IS NOT MISSING`;

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
  		} else {
			const result = res.body.results;
			callback(null, { statusCode : 200, result: result });
		}
	});
}

// invitation
userModel.loadSalespersons_WithoutAccount= ({ salesRoleId }, callback) => {
	try {
		let salespersonDoc = [], userDoc = [];

		async.waterfall([
	        // get salesperson by partnerType
	        (callback) => {
	        	let query = `
	        	SELECT META(${couchbucket}).id AS id, customerCode, name1 || ' ' || name2 AS customerName, smtpAddr
	        	FROM ${couchbucket}
	        	WHERE docType='CUSTOMER' AND partnerType='PE'`;

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
	        			return callback(res, null);
	        		} else {
	        			salespersonDoc = res.body.results;
	        			callback(null, 'ok');
	        		}
	        	});
	        },

	        // get user by roleId
	        (result, callback) => {
	        	let query = `
	        	SELECT customerCode, firstName || ' ' || lastName AS salespersonName
	        	FROM ${couchbucket} WHERE docType='USER'
	        	AND roleId='${salesRoleId}'`;

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
	        		} else {
	        			userDoc = res.body.results;
	        			callback(null, 'ok');
	        		}
	        	});
	        },

	        // remove duplicate/filter salesperson without account
	        (result, callback) => {
	        	let index;
	        	salespersonDoc = removeduplicate_1(salespersonDoc, 'customerCode');

	        	for (let i in userDoc) {
	        		index = salespersonDoc.findIndex(item => item.customerCode == userDoc[i].customerCode);
	        		if (index != -1) salespersonDoc.splice(index, 1)
	        	}

	        	callback(null, 'ok');
	        }
	    ],

	    (err, res) => {
	    	if (err) callback(err, null);
	    	else callback(null, { statusCode : 200, result: salespersonDoc });
	    });
	} catch (err) {
		callback(err, null);
		console.log(error)
	}
}

// creditoverdue
userModel.loadCustomerSalesperson = ({ salespersonRoleId, customerCode }, { sessionId }, callback) => {
	let query = `
	SELECT u.customerCode, u.email, customer
	FROM ${couchbucket} u
	UNNEST customers AS customer
	WHERE u.docType='USER' AND u.roleId='${salespersonRoleId}' AND customer='${customerCode}'
	AND u.firstName IS NOT MISSING AND u.lastName IS NOT MISSING`;

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
				if (result.length > 0) callback(null, { statusCode: 200, result: result[0] });
				else throw { statusCode: 400, message: 'No document' };
			}
		} catch (err) {
			logErrors({ func: 'loadCustomerSalesperson', subfunc: 'get USER doc' }, {}, err);
			callback(err, null);
		}
	});
}

// normal sales, special sales
userModel.loadCustomerSalespersonDoc = ({ customerCode }, { sessionId }, callback) => {
	let query = `
	SELECT ${config.db.bucket}.* FROM ${config.db.bucket}
	WHERE docType='USER' AND customerCode='${customerCode}'`;

	console.log(query)

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
				if (result.length > 0) callback(null, { statusCode: 200, result: result[0] });
				else throw { statusCode: 400, message: 'No document' };
			}
		} catch (err) {
			logErrors({ func: 'loadCustomerSalesperson', subfunc: 'get USER doc' }, {}, err);
			callback(err, null);
		}
	});
}

// profile, user
userModel.loadUser = (id, callback) => {
	let query = `SELECT RAW ${couchbucket} FROM ${couchbucket} USE KEYS '${id}'`;

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
  		} else {
			const result = res.body.results;
			if (result.length > 0) callback(null, { statusCode : 200, result: result[0] });
			else callback({ statusCode: 400 }, null); // no user
		}
	});
}

// role
userModel.countUserByRole = (roleId, callback) => {
	try {
		const query = `
		SELECT COUNT(*) AS \`users\`
		FROM ${couchbucket}
		WHERE docType='USER' AND roleId='${roleId}'
		AND firstName IS NOT MISSING AND lastName IS NOT MISSING`

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
	  		} else {
				const result = res.body.results;

				if (result[0].hasOwnProperty('users')) callback(null, { statusCode : 200, result: result[0].users });
				else callback({ statusCode: 400 }, null); // no document
			}
		});
	} catch (err) {
		console.log(err);
		callback(err, null);
	}
}

// user
userModel.createUser = ({ dateCreated, department, email, firstName, lastName, roleId, userName, lastPassUpdate, lastWrongLogin, documentStatus }, sessionId, callback) => {
	try {

		async.waterfall([

			(callback) => {
				const reference = uuid.v4();
				const key = `USER::${reference}`
				const values = {
					channels     : ['USER', 'NON::CUSTOMER::USER'],
					id           : key,
					dateCreated,
					department,
					docType      : 'USER',
					email,
					firstName,
					lastName,
					referenceId  : reference,
					roleId,
					// password     : `BST${reference.substring(0,5)}`,
					supervisor   : 'N/A',
					isActive     : 'true',
					userName,
					lastPassUpdate,
					lastWrongLogin,
					passThreshold : 3,
					passwordHistory: [],
					documentStatus
				}

				const query = `
				INSERT INTO ${couchbucket} (KEY, VALUE)
				VALUES ('${key}', ${JSON.stringify(values)})
				RETURNING META(${couchbucket}).id as id`;

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
					} else {
						callback(null, values);
					}
				});
			},

			 // create user on sync gateway
			(user, callback) => {
			 	var channels = {
			 		name     : user.referenceId, // user.re
			        password : `BST${user.referenceId.substring(0,5)}`, // 'brdg' + id.substring(6, 14) 'password'
			        admin_channels : [
	              		"ADMIN",
	              		"CHANNEL::DISCOUNT",
	              		"CREDIT::LIMIT",
	              		"CUSTOMER",
	              		"DEALER::GROUP",
	              		"EMAIL",
	              		"FACTORY::DISCOUNT",
	              		"MATERIAL",
	              		"MATERIALGROUP::CONVERSION",
	              		"MOQ::DISCOUNT",
	              		"PRICE",
	              		"ROLE",
	              		"STOCK::LIMIT",
	              		"STORING::REPORT",
	              		"TIMELIMITED::DISCOUNT",
	              		"USER",
	              		user.id, // "USER::e3b60fb2-bafb-4343-93e2-82a6ae3b6d1f",
	              		"VISIBLE::STOCK"
	              	]
	            }

	            const options = {
					url    : `${config.admin.url}_user/${channels.name}`,
					method : 'PUT',
					body   : channels
				};

	            request(options, (err, res) => {
	            	if (err) {
	            		return callback(err, null);
	            	} else if (res.statusCode >= 300) {
	            		console.log(res.body);
	            		return callback(res, null);
	            	} else {
	            		const result = res;
	            		callback(null, { statusCode : 200, result });
	            	}
				});
	        }
		],

		(err, res) => {
			if(err) {
				callback(err, null);
			} else {
				callback(null, res)
			}
		});
	} catch (err) {
		console.log(err);
		callback(err, null);
	}
}

// invitation
userModel.createCustomerUser = ({ customers, customerRoleId }, sessionId, callback) => {

	async.forEach(customers, (item, callback) =>{

	    async.waterfall([

			(callback) => {
				const reference = uuid.v4();
				const key = `USER::${reference}`
				const values = {
					customerCode        : item.customerCode,
					channels            : ["USER", item.customerCode],
					customerId          : item.customerId,
					dateCreated         : moment().toISOString(),
					distributionChannel : '01',
					docType             : 'USER',
					email               : item.email,
					firstName           : 'Jhon'.toUpperCase(),
					lastName            : 'Doe'.toUpperCase(),
					referenceId			: reference,
					roleId              : customerRoleId,
					status              : 'changeInformation',
					userName            : item.email
				}

				const query = `
				INSERT INTO ${couchbucket} (KEY, VALUE)
				VALUES ('${key}', ${JSON.stringify(values)})
				RETURNING META(${couchbucket}).id as id`;

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
					} else {
						callback(null, values);
					}
				});
			},

			// create customer user on sync gateway
			(customer, callback) => {
			 	var channels = {
			 		name     : customer.referenceId, // user.re
			        password : `BST${customer.referenceId.substring(0,5)}`, // 'brdg' + id.substring(6, 14) 'password'
			        admin_channels : [
				        "CHANNEL::DISCOUNT",
				        "CREDIT::LIMIT",
				        "CUSTOMER",
				        "EMAIL",
				        "FACTORY::SUPPORT::DISCOUNT",
				        "MATERIAL",
				        "MOQ::DISCOUNT",
				        "NON::CUSTOMER::USER",
				        "PRICE",
				        "ROLE",
				        "STOCK::LIMIT",
				        "STORING::REPORT",
				        "TIME::LIMITED::DISCOUNT",
				        customer.customerCode,
				        "VISIBLE::STOCK"
	              	]
	            }

	            const options = {
					url    : `${config.admin.url}_user/${channels.name}`,
					method : 'PUT',
					body   : channels
				};

	            request(options, (err, res) => {
	            	if (err) {
	            		return callback(err, null);
	            	} else if (res.statusCode >= 300) {
	            		console.log(res.body);
	            		return callback(res, null);
	            	} else {
	            		callback(null, channels);
	            	}
				});
	        },

			// Commented to disable email sending when inviting customer -Invitation module
	        /* (channels, callback) => {
	        	let email = item.email;
	        	let password = channels.password;
	        	let emailid = 'EMAIL::CUSTOMER::INVITATION';

	    		emailnotifModel.resendInvite({ email, password, emailid }, (err, res) => {
	    			if (err) {
	        			console.log(err);
	        			return callback(err, null);
	        		} else {
	        			console.log(res)
	        			callback(null, res);
	        		}
	    		});
	    	}, */
		],

		(err, res) => {
			if(err) {
				callback(err, null);
			} else {
				callback(null, res)
			}
		});

	}, (err, res) => {
		if (err) callback(err, null);
		else callback(null, { statusCode: 200, result: 'All Invited' });
	});
}

// invitation
userModel.createSalespersonUser = ({ salespersons, salesRoleId }, sessionId, callback) => {

	let customersArray = [];

	async.forEach(salespersons, (item, callback) =>{

	    async.waterfall([

	    	(callback) => {
				const query = `
				SELECT RAW mainCustomerCode
				FROM ${couchbucket}
				WHERE docType='CUSTOMER' AND partnerType='PE' AND customerCode='${item.customerCode}'
				AND customerCode IS NOT MISSING AND mainCustomerCode IS NOT MISSING`;

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
					} else {
						customersArray = res.body.results;
						callback(null, customersArray);
					}
				});
			},

			(customers, callback) => {
				const reference = uuid.v4();
				const key = `USER::${reference}`
				const values = {
					customerCode : item.customerCode,
					channels     : ["USER", item.customerCode, "NON::CUSTOMER::USER"],
					customerId   : item.customerId,
					customers,
					dateCreated  : moment().toISOString(),
					docType      : 'USER',
					email        : item.email,
					firstName    : 'Jhon'.toUpperCase(),
					lastName     : 'Doe'.toUpperCase(),
					referenceId	 : reference,
					roleId       : salesRoleId,
					status       : 'changePassword',
					userName     : item.email
				}

				const query = `
				INSERT INTO ${couchbucket} (KEY, VALUE)
				VALUES ('${key}', ${JSON.stringify(values)})
				RETURNING META(${couchbucket}).id as id`;

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
					} else {
						callback(null, values);
					}
				});
			},

			// create salesperson user on sync gateway
			(salesperson, callback) => {
				let arrayChannels = [
				        "CHANNEL::DISCOUNT",
				        "CREDIT::LIMIT",
				        "CUSTOMER",
				        "EMAIL",
				        "FACTORY::SUPPORT::DISCOUNT",
				        "MATERIAL",
				        "MOQ::DISCOUNT",
				        "NON::CUSTOMER::USER",
				        "PRICE",
				        "ROLE",
				        "STOCK::LIMIT",
				        "STORING::REPORT",
				        "TIME::LIMITED::DISCOUNT",
				        salesperson.customerCode,
				        "VISIBLE::STOCK"
	              	]

	            let arrayCustomers = salesperson.customers;
	            arrayChannels = arrayChannels.concat(arrayCustomers);

			 	var channels = {
			 		name     : salesperson.referenceId, // user.re
			        password : `BST${salesperson.referenceId.substring(0,5)}`, // 'brdg' + id.substring(6, 14) 'password'
			        admin_channels : arrayChannels
	            }

	            const options = {
					url    : `${config.admin.url}_user/${channels.name}`,
					method : 'PUT',
					body   : channels
				};

	            request(options, (err, res) => {
	            	if (err) {
	            		return callback(err, null);
	            	} else if (res.statusCode >= 300) {
	            		console.log(res.body);
	            		return callback(res, null);
	            	} else {
	            		callback(null, channels);
	            	}
				});
	        },

	        (channels, callback) => {
	        	let email = item.email;
	        	let password = channels.password;
	        	let emailid = 'EMAIL::SALESPERSON::INVITATION';

	    		emailnotifModel.resendInvite({ email, password, emailid }, (err, res) => {
	    			if (err) {
	        			console.log(err);
	        			return callback(err, null);
	        		} else {
	        			console.log(res)
	        			callback(null, res);
	        		}
	    		});
	    	},
		],

		(err, res) => {
			if(err) {
				callback(err, null);
			} else {
				callback(null, res)
			}
		});

	}, (err, res) => {
		if (err) callback(err, null);
		else callback(null, { statusCode: 200, result: 'All Invited' });
	});
}

// user
userModel.updateUser = (id, user, callback) => {
	try {
		let SETquery = [];
		for (let i in user) {
			if (user[i] instanceof Object){
				SETquery.push(`${i}=[${user[i].map(item => `'${item}'`)}]`);
			} else { // string
				SETquery.push(`${i}='${user[i]}'`);
			}
		}

	  	const query = `
	  	UPDATE ${couchbucket} USE KEYS '${id}'
	  	SET ${SETquery.toString()}`;

	  	// callback(null, query)

	  	const options = {
	  		headers : {'Accept': 'application/json'},
	  		url     : config.public.n1ql_url,
	  		method  : 'POST',
	  		body    : {statement: query}
	  	};

	  	request(options, (err, res) => {
	  		if (err) return callback(err, null);
	  		else if (res.statusCode >= 300) return callback(res, null);
	  		else if (res.statusCode <= 299) callback(null, res);
	  		else return callback(res, null);
	  	});
	} catch (err) {
		callback(err, null);
	}
}

// user
userModel.deleteUser = (id, sessionId, callback) => {
	try {
		/* const query = `
		DELETE FROM ${couchbucket}
		USE KEYS ('${id}')
		RETURNING META(${couchbucket}).id as id`; */

		const query = `
		UPDATE ${couchbucket}
		USE KEYS ('${id}')
		SET documentStatus='DELETED'
		RETURNING META(${couchbucket}).id as id`;

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
			} else {
				const result = res.body.results;
				callback(null,  { statusCode : 200, result: result[0].id });
			}
		});
	} catch (err) {
		console.log(err);
		callback(err, null);
	}
}

// profile.js ---
userModel.updatePassword = ({ name, password, newPassword }, callback) => {
	try {
		async.waterfall([
			// get user on sync gateway
			(callback) => {
				const options = {
					url    : `${config.admin.url}_user/${name}`,
					method : 'GET',
				};

				request(options, (err, res) => {
					if (err) return callback(err, null);
					else if (res.statusCode >= 300) return callback(res, null);
					else if (res.statusCode <= 299) callback(null, res.body);
					else return callback(res, null);
				});
			},

			// update user on sync gateway
			(user, callback) => {
				user.password = newPassword;

				const options = {
					url    : `${config.admin.url}_user/${name}`,
					method : 'PUT',
					body   : user
				};

				request(options, (err, res) => {
					if (err) return callback(err, null);
					else if (res.statusCode >= 300) return callback(res, null);
					else if (res.statusCode <= 299) callback(null, res);
					else return callback(res, null);
				});
			},

			// relogin user | get new sessionId
			(result, callback) => {
				const options = {
					headers : {'Accept': 'application/json'},
					url     : `${config.public.url}_session`,
					method  : 'POST',
					body    : { name, password: newPassword }
				};

				request(options, (err, res) => {
				 	if (err) return callback(err, null);
				 	else if (res.statusCode >= 300) return callback(res, null);
				 	else {
				 		let user = {};
				 		const sync_gateway = res.headers['set-cookie'][0].split(';');
				 		user.sessionId = sync_gateway[0];
				 		user.expire = sync_gateway[2].replace(' Expires=','');
				 		user.password = newPassword;

				 		callback(null, { statusCode: 200, result: user });
				 	}
				});
			}
		],

		(err, res) => {
			if (err) return callback(err, null);
			else callback(null, res);
		});
	} catch (err) {
		callback(err, null);
	}
}

// login
userModel.resetPassword = ({ email }, callback) => {
	async.waterfall([
		// get referenceId
		(callback) => {
			const query = `
			SELECT referenceId
			FROM ${couchbucket}
			WHERE docType='USER' AND email='${email}'
			AND firstName IS NOT MISSING AND lastName IS NOT MISSING`

			const options = {
				headers : {'Accept': 'application/json'},
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
						if (result.length <= 0) callback({ statusCode: 404, message: 'Invalid email' }, null);
						else callback(null, result[0].referenceId);
					}
				} catch (err) {
					logErrors({ func: 'resetPassword', subfunc: 'get referenceId USER doc' }, {}, err);
					return callback(err, null);
				}
			});
		},

		// get user sync gateway
		(name, callback) => {
			const options = {
				url    : `${config.admin.url}_user/${name}`,
				method : 'GET'
			};

			request(options, (err, res) => {
				try	{
					if (err) throw err;
					else if (res.statusCode >= 300) throw res;
					else callback(null, res.body);
				} catch (err) {
					logErrors({ func: 'resetPassword', subfunc: 'get user SYNC GATEWAY' }, {}, err);
					return callback(err, null);
				}
			});
		},

		 // update user sync gateway
		(user, callback) => {
			const randomChar = uuid.v4();
			user.password = `BST${randomChar.substring(0, 5)}`;

			const options = {
			  url    : `${config.admin.url}_user/${user.name}`,
			  method : 'PUT',
			  body   : user
			};

			request(options, (err, res) => {
				try	{
					if (err) throw err;
					else if (res.statusCode >= 300) throw res;
					else callback(null, user);
				} catch (err) {
					logErrors({ func: 'resetPassword', subfunc: 'update user SYNC GATEWAY' }, {}, err);
					return callback(err, null);
				}
			});
		},

		// email new password
		({ name, password }, callback) => {
			let code = `
				<div style='padding: 7px; padding-left: 35px; background-color: #212C32; color: #ffffff; font-family: Century Gothic,sans-serif;'>
					<img src='https://wos.bridgestone.com.sg/img/bridgestone_wos_all_white.png' height='70'>
				</div>

				<div style='padding: 25px; border: 1px solid #cccccc; font-family: Trebuchet MS, Arial, Helvetica, sans-serif;'>
					<p>Reset password</p><br>
					Username     : <b>${email}</b><br>
					New password : <b>${password}</b>
				</div>
			`;

			const mailOptions = {
				from    : emailSender,
				to      : email,
				subject : 'Bridgestone WOS - Reset password',
				html    : code
			};

			smtpTransport.sendMail(mailOptions, (err, res) => {
				try	{
					if (err) throw err;
					else {
						if (res.hasOwnProperty('message') && parseInt(res.message.substring(0, 3)) == 250) callback(null, { statusCode : 200, result: res });
						else throw err;
					}
				} catch (err) {
					logErrors({ func: 'resetPassword', subfunc: 'send EMAIL' }, {}, err);
					return callback(err, null);
				}
			});
		}
	],

	(err, res) => {
		if (err) callback(err, null);
		else callback(null, res);
	});
}

// normalsales, creditoverdue
function removeduplicate_1(data, key1) {
  let unqObj = {}, unqArr = [];

  for (let i in data) {
    if (!unqObj[`${data[i][key1]}`]) {
      unqObj[`${data[i][key1]}`] = data[i];
      unqArr.push(data[i]);
    }
  }

  return unqArr;
}

module.exports.userModel = userModel;