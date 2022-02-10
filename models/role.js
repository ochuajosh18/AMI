const request = require('request').defaults({json: true});
const async = require('async');
const config = require('../config/config');
const appMPermission = require('../public/localdata/modulesModel');
const moment = require('moment');
const uuid = require('uuid');

function roleModel(){}

// permission, role, user
roleModel.loadAllRoles = (sessionId, callback) => {
	try {
		const query = `
		SELECT META(${config.db.bucket}).id AS id, \`role\`, access, amiModules, wosModules
		FROM ${config.db.bucket}
		WHERE docType="ROLE"
		AND \`role\` IS NOT MISSING AND access IS NOT MISSING`;

		const options = {
			headers : {'Accept': 'application/json', 'Cookie': sessionId},
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
				callback(null, { statusCode : 200, result });
			}
		});
	} catch (err) {
		console.log(err);
		callback(err, null);
	}
}

// role
roleModel.createRole = ({ role, access }, sessionId, callback) => {
	try {
		const key = `ROLE::${uuid.v4()}`
		const values = {
			id         : key,
			channels   : ['ROLE'],
			docType    : 'ROLE',
			role,
			access,
			amiModules : appMPermission.AMI,
			wosModules : appMPermission.WOS
		}

		const query = `
		INSERT INTO ${config.db.bucket} (KEY, VALUE)
		VALUES ('${key}', ${JSON.stringify(values)})
		RETURNING META(${config.db.bucket}).id as id`;

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

// role
roleModel.updateRole = (id, role, sessionId, callback) => {
	try {
		let SETquery = [];
		for (let i in role) SETquery.push(`\`${i}\`='${role[i]}'`);

	  	const query = `
	  	UPDATE ${config.db.bucket} USE KEYS '${id}'
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

// role
roleModel.deleteRole = (id, sessionId, callback) => {
	try {
	  	const query = `
	  	DELETE FROM ${config.db.bucket} USE KEYS '${id}'`;

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

// permission
roleModel.updatePermission = (id, app, permission, sessionId, callback) => {
	try {
	  	// convert to boolean
	  	for (let i in permission) {
	  		let modules = permission[i];
	  		for (let j in modules) modules[j] = (modules[j] == 'true');
	  	}

	  const query = `
	  UPDATE ${config.db.bucket} USE KEYS '${id}'
	  SET ${app}Modules=${JSON.stringify(permission)}`;

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
		callback(err, null);
	}
}

module.exports.roleModel = roleModel;