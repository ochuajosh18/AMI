const request = require('request').defaults({json: true});
const async = require('async');
const config = require('../config/config');
const moment = require('moment');
const winston = require('winston');
const bcryptjs = require('bcryptjs');
const couchbucket = config.db.bucket;

function authModel(){}

function logErrors({ func, subfunc }, { user, timestamp }, err) {
	if (err.hasOwnProperty('body')) err = err.body;
	console.log(`\n\n${func} - ${subfunc}\n`, JSON.stringify(err));
	winston.error(`${func} ${subfunc}`, err)
}

// login
authModel.authenticateUser = ({ username, password }, callback) => {
	async.waterfall([
		// get user doc
		(callback) => {
			let query = `
			SELECT meta(u).id AS userid, u.referenceId, u.firstName, u.lastName, u.middleName, u.email, u.roleId, u.passThreshold, u.lastWrongLogin, u.lastPassUpdate,
			r.\`role\`, r.amiModules, r.wosModules
			FROM ${couchbucket} AS u JOIN ${couchbucket} AS r ON KEYS u.roleId
			WHERE u.docType='USER' AND r.docType='ROLE'
			AND (u.userName='${username}' OR u.email='${username}')  AND r.access!='WOS'
			AND u.firstName IS NOT MISSING AND u.lastName IS NOT MISSING
			AND u.documentStatus='ACTIVE'
			AND r.\`role\` IS NOT MISSING AND r.access IS NOT MISSING`;

			// AND u.isLocked=false

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
						if (result.length <= 0) callback({ statusCode: 400, error: res }, null);
						else callback(null, result[0])
					}
				} catch (err) {
					logErrors({ func: 'authenticateUser', subfunc: 'get USER doc' }, {}, err);
					return callback(err, null);
				}
			});
		},

		// get seesion
		(user, callback) => {
			const options = {
				headers : {'Accept': 'application/json'},
				url     : `${config.public.url}_session`,
				method  : 'POST',
				body    : { name: user.referenceId, password }
			};

			request(options, (err, res) => {
				try	{
				 	if (err) throw err;
					else if (res.statusCode >= 300) throw res;
				 	else {
				 		const sync_gateway = res.headers['set-cookie'][0].split(';');
				 		user.sessionId = sync_gateway[0];
				 		user.expire = sync_gateway[2].replace(' Expires=','');
				 		user.password = password;

				 		callback(null, { statusCode: 200, result: user });
				 	}
			 	} catch (err) {
					logErrors({ func: 'authenticateUser', subfunc: 'get seesion SYNC GATEWAY' }, {}, err);
					return callback(err, null);
				}
			});
		}
	],

	(err, res) => {
		if (err) return callback(err, null);
		else callback(null, res);
	});
}

authModel.deleteSession = (sessionId, callback) => {
	const options = {
		headers : { 'Accept': 'application/json',  'cookie': sessionId  },
		url     : `${config.public.url}_session`,
		method  : 'DELETE'
	};

	request(options, (err, res) => {
		try {
		 	if (err) throw err;
			else if (res.statusCode >= 300) throw res;
		 	else callback(null, res);
		} catch (err) {
			logErrors({ func: 'deleteSession', subfunc: 'delete seesion SYNC GATEWAY' }, {}, err);
			return callback(err, null);
		}
	});
}

// login
authModel.loadUserdocByUsername = ({ username }, callback) => {
	async.waterfall([
		// get user doc
		(callback) => {
			let query = `
			SELECT meta().id AS userid, referenceId, firstName, lastName, middleName, email, roleId, isLocked, passThreshold, lastWrongLogin
			FROM ${couchbucket} WHERE docType='USER'
			AND (userName='${username}' OR email='${username}')
			AND documentStatus='ACTIVE'
			AND firstName IS NOT MISSING AND lastName IS NOT MISSING`;

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
						callback(null, result[0]);
					}
				} catch (err) {
					logErrors({ func: 'loadUserdocByUsername', subfunc: 'get USER doc' }, {}, err);
					return callback(err, null);
				}
			});
		}
	],

	(err, res) => {
		if (err) return callback(err, null);
		else callback(null, res);
	});
}

// login
authModel.registerWrongLogin = ({ userId, currentTime }, callback) => {
	let query = `
	UPDATE ${couchbucket} USE KEYS '${userId}'
	SET passThreshold=TONUMBER(passThreshold) - 1,
	lastWrongLogin='${currentTime}'
	RETURNING RAW passThreshold`;

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
				callback(null, res);
			}
		} catch (err) {
			logErrors({ func: 'update passThreshold', subfunc: 'update USER doc' }, {}, err);
			return callback(err, null);
		}
	});
}

// login
authModel.updateThreshold = (id, user, callback) => {
	try {
		let SETquery = [];
		for (let i in user) {
			// string
			SETquery.push(`${i}='${user[i]}'`);
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
	  		if (err) return callback(err, null);
	  		else if (res.statusCode >= 300) return callback(res, null);
	  		else if (res.statusCode <= 299) callback(null, res);
	  		else return callback(res, null);
	  	});
	} catch (err) {
		callback(err, null);
	}
}

// login
authModel.encryptPassword = ({ passwordString }, callback) => {
	passwordString = bcryptjs.hashSync(passwordString, 10);
	callback(null, passwordString)
}

// login
authModel.comparePassword = (newPassword, oldPasswords, callback) => {
	let isExisting = false;
	oldPasswords = oldPasswords ? oldPasswords : [];

	oldPasswords.forEach(oldPassword => {
		if (bcryptjs.compareSync(newPassword, oldPassword)) isExisting = true;
	});
	
	callback(null, isExisting);
}

module.exports.authModel = authModel;