const request = require('request').defaults({json: true});
const async = require('async');
const config = require('../config/config');
const moment = require('moment');
const nodemailer = require('nodemailer');
const smtpTransport = nodemailer.createTransport('SMTP', config.email.setting);
const emailSender = config.email.sender;

function emailnotifModel(){}

// email
emailnotifModel.loadAllEmails = (sessionId, callback) => {
	
	const query = `
	SELECT META(${config.db.bucket}).id AS id, content, subject, type, termsAndCondition 
	FROM ${config.db.bucket} WHERE docType='EMAIL'`;

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
}

// email
emailnotifModel.updateEmailTemplate = (id, email, callback) => {
	try {
		let SETquery = [];
		for (let i in email) {
			SETquery.push(`${i}='${email[i]}'`);
		}

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
	  		if (err) return callback(err, null);
	  		else if (res.statusCode >= 300) return callback(res, null);
	  		else if (res.statusCode <= 299) callback(null, res);
	  		else return callback(res, null);
	  	});
	} catch (err) {
		callback(err, null);
	}
}

// normalsales, specialsales, creditoverdue
emailnotifModel.orderNotif = ({ detailSection, orderSection, accessLink, emailSetting }, callback) => {
	try {
		let code = `
			<div style='padding: 7px; padding-left: 35px; background-color: #212C32; color: #ffffff; font-family: Century Gothic,sans-serif;'>
				<img src='https://wos.bridgestone.com.sg/img/bridgestone_wos_all_white.png' height='70'>
			</div>

			<div style='padding: 25px; border: 1px solid #cccccc;'>
				<p style='font-family: Trebuchet MS, Arial, Helvetica, sans-serif;'>${emailSetting.subject}</p><br>

				<table style='border-collapse: collapse; width: 60%;' border='0'>
				${Object.keys(detailSection).map(key => {
			        return `<tr>
				        <td style='padding: 2px; text-align: right; font-weight:bold; width: 25%;'>${key} : </td>
				        <td style='padding: 2px;'>${detailSection[key]}</td>
			        </tr>`
			    }).join('')}
				</table><br><br>

				<table style='border-collapse: collapse; width: 100%;'>
					<thead>
						<tr>
							${Object.keys(orderSection.coulmns).map(key => {
						        return `<th style='border: 1px solid #ddd; padding: 8px; padding-top: 12px; padding-bottom: 12px; text-align: left; background-color: #767676; color: white; text-align: center;'>${orderSection.coulmns[key]}</th>`
						    }).join('')}
						</tr>
					</thead>

					<tbody>
						${orderSection.data.map(item => {
					        return `<tr>
				                ${Object.keys(orderSection.coulmns).map(key => {
				        	        return `<td style='border: 1px solid #ddd; padding: 8px; text-align: center;'>${item[key]}</td>`
				        	    }).join('')}
					        </tr>`
					    }).join('')}
					</tbody>

					<tfoot>
						<tr>
							<th style='border: 1px solid #ddd; padding: 8px; padding-top: 12px; padding-bottom: 12px; text-align: right; background-color: #767676; color: white;' colspan='${Object.keys(orderSection.coulmns).length - 1}'>TOTAL : </th>
							<th style='border: 1px solid #ddd; padding: 8px; padding-top: 12px; padding-bottom: 12px; text-align: center; background-color: #767676; color: white;'>${orderSection.data.map(item => item.netAmount).reduce((total, item) => total + parseFloat(item), 0).toFixed(2)}</th>
						</tr>
					</tfoot>
				</table><br>

				<a href='${(accessLink=='WOS') ? config.wos.url : config.ami.url }' style='font-family: Trebuchet MS, Arial, Helvetica, sans-serif; text-decoration: none;'>Access to ${accessLink}</a>
			</div>
		`;
		// return callback(null, 'oks');

		const mailOptions = {
			from    : emailSender,
			to      : emailSetting.to,
			cc      : emailSetting.cc,
			// subject : `Bridgestone WOS Order ${detailSection['Reference no']} - ${emailSetting.subject}`,
			subject : `${detailSection['Sold to Customer name']} - ${detailSection['Reference no']} - ${emailSetting.subject}`,
			html    : code
		};

		smtpTransport.sendMail(mailOptions, (err, res) => {
			if (err) return callback({ statusCode: 400, message: 'Unable to send email' }, null);
			else {
				if (res.hasOwnProperty('message') && parseInt(res.message.substring(0, 3)) == 250) callback(null, { statusCode : 200, result: res });
				else callback({ statusCode: 400, message: 'Unable to send email' }, null);
			}
		});
	} catch (err) {
		console.log(err);
		callback(err, null);
	}
}

// normalsales, specialsales, creditoverdue
emailnotifModel.rejectOrderNotif = ({ detailSection, orderSection, accessLink, emailSetting }, callback) => {
	try {
		let code = `
			<div style='padding: 7px; padding-left: 35px; background-color: #212C32; color: #ffffff; font-family: Century Gothic,sans-serif;'>
				<img src='https://wos.bridgestone.com.sg/img/bridgestone_wos_all_white.png' height='70'>
			</div>

			<div style='padding: 25px; border: 1px solid #cccccc;'>
				<p style='font-family: Trebuchet MS, Arial, Helvetica, sans-serif;'>${emailSetting.subject}</p><br>

				<table style='border-collapse: collapse; width: 60%;' border='0'>
				${Object.keys(detailSection).map(key => {
			        return `<tr>
				        <td style='padding: 2px; text-align: right; font-weight:bold; width: 25%;'>${key} : </td>
				        <td style='padding: 2px;'>${detailSection[key]}</td>
			        </tr>`
			    }).join('')}
				</table><br><br>

				<table style='border-collapse: collapse; width: 100%;'>
					<thead>
						<tr>
							${Object.keys(orderSection.coulmns).map(key => {
						        return `<th style='border: 1px solid #ddd; padding: 8px; padding-top: 12px; padding-bottom: 12px; text-align: left; background-color: #767676; color: white; text-align: center;'>${orderSection.coulmns[key]}</th>`
						    }).join('')}
						</tr>
					</thead>

					<tbody>
						${orderSection.data.map(item => {
					        return `<tr>
				                ${Object.keys(orderSection.coulmns).map(key => {
				        	        return `<td style='border: 1px solid #ddd; padding: 8px; text-align: center;'>${item[key]}</td>`
				        	    }).join('')}
					        </tr>`
					    }).join('')}
					</tbody>
				</table><br>

				<a href='${(accessLink=='WOS') ? config.wos.url : config.ami.url }' style='font-family: Trebuchet MS, Arial, Helvetica, sans-serif; text-decoration: none;'>Access to ${accessLink}</a>
			</div>
		`;
		// return callback(null, 'oks');

		const mailOptions = {
			from    : emailSender,
			to      : emailSetting.to,
			cc      : emailSetting.cc,
			// subject : `Bridgestone WOS Order ${detailSection['Reference no']} - ${emailSetting.subject}`,
			subject : `${detailSection['Sold to Customer name']} - ${detailSection['Reference no']} - ${emailSetting.subject}`,
			html    : code
		};

		smtpTransport.sendMail(mailOptions, (err, res) => {
			if (err) return callback({ statusCode: 400, message: 'Unable to send email' }, null);
			else {
				if (res.hasOwnProperty('message') && parseInt(res.message.substring(0, 3)) == 250) callback(null, { statusCode : 200, result: res });
				else callback({ statusCode: 400, message: 'Unable to send email' }, null);
			}
		});
	} catch (err) {
		console.log(err);
		callback(err, null);
	}
}

// user
emailnotifModel.resendInvite= ({ userId, email, password, emailid, lastPassUpdate, lastWrongLogin }, callback) => {
	try {

		async.waterfall([
			// update password history
	        (callback) => {
	        	let query = `
	        	UPDATE ${config.db.bucket} USE KEYS '${userId}'
	        	SET passThreshold=3, passwordHistory=[], lastPassUpdate='${lastPassUpdate}',
	        	lastWrongLogin='${lastWrongLogin}'
	        	RETURNING RAW lastPassUpdate`;

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
	        			let result = res.body.results[0];
	        			callback(null, result);
	        		}
	        	});
	        },

	        // get email by type
	        (user, callback) => {
	        	let query = `
	        	SELECT META(${config.db.bucket}).id AS id, content, subject, termsAndCondition
	        	FROM ${config.db.bucket} USE KEYS '${emailid}'`;

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
	        			let result = res.body.results[0];
	        			callback(null, result);
	        		}
	        	});
	        },

	        // send email
	        (emailDoc, callback) => {

	        	let termsAndConditionDiv = `<div style='padding: 25px; border: 1px solid #cccccc;'>
					${emailDoc.termsAndCondition}
				</div>`;

	        	let code = `
					<div style='padding: 7px; padding-left: 35px; background-color: #212C32; color: #ffffff; font-family: Century Gothic,sans-serif;'>
						<img src='https://wos.bridgestone.com.sg/img/bridgestone_wos_all_white.png' height='70'>
					</div>

					${(emailDoc.termsAndCondition) ? termsAndConditionDiv : '' }

					<div style='padding: 25px; border: 1px solid #cccccc;'>
						${emailDoc.content}
						Username : <b>${email}</b><br>
						Password : <b>${password}</b><br><br>

						<div class='col-lg-12'>
						<span><a href='${config.wos.url}' style='background: #204d74; color: #ffffff; padding: 10px; text-decoration: none;'>Login now</a></span> <span><a href='${config.ami.url}files/WOS Manual - First Login.pdf' style='background: #f39c12; color: #ffffff; padding: 10px; text-decoration: none; margin-left: 15px;'>Login Manual</a></span>
							<p style='font-size: 12px; color: gray;'>By logging in your account, you agree to our Terms and Conditions</p>
						</div>
					</div>
				`;

				const mailOptions = {
					from    : emailSender,
	        		to      : email,
	        		subject : emailDoc.subject,
					html    : code
				};

	        	smtpTransport.sendMail(mailOptions, function (err, res) {
	        		if (err) {
	        			console.log(err);
	        			return callback(err, null);
	        		} else {
	        			callback(null, res);
	        		}
	        	});
	        }
	    ],

	    (err, res) => {
	    	if (err) callback(err, null);
	    	else callback(null, res);
	    });
	} catch (err) {
		callback(err, null);
	}
}

module.exports.emailnotifModel = emailnotifModel;