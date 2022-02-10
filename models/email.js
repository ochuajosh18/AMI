var async = require('async'),
	request = require('request').defaults({json: true}),
	uuid = require("uuid"),
	nodemailer = require('nodemailer'),
	loadModel = require("../models/load").loadModel,
	config = require('../config/config'),
	moment = require('moment'),
	/*smtpTransport = nodemailer.createTransport('SMTP', {
		host: "email-smtp.us-east-1.amazonaws.com",
		secureConnection: true, // use SSL
		port: 443, // port for secure SMTP
		auth: {
			user: 'AKIAI5JYFUVVIWGL4P3A',
			pass: 'AuCnhtZKhT4lRbQ0QKTZW7j6mu+cjFHC1w+u48iFkhG/'
		}
	}),
	SMTP_FROM = 'SuitesAmi@suites.digital';*/

	smtpTransport = nodemailer.createTransport('SMTP', {
		host: "192.168.255.227",
		secureConnection: false, 
	  port: 25 // port forSMTP
	}),
	SMTP_FROM = 'bstsg.web.order@bridgestone.com';

function emailModel() {}

emailModel.sendCustomerInvite = function (doc, callback) {
	const emailTemplate = doc.emailTemplate;
	const credential = {
		email    : doc.email,
		password : doc.password
	};
	let code = "";

	// header
	code += "<div style='padding: 7px; padding-left: 35px; background-color: #212C32; color: #ffffff; font-family: Century Gothic,sans-serif;'>";
	// code += "  <h1>BRIDGESTONE</h1>";
	code += "  <img src='https://wos.bridgestone.com.sg/img/bridgestone_wos_all_white.png' height='70'>"; 
	code += "</div>";

	// content 
	code += "<div style='border: 1px solid #cccccc;'>";
	// terms and condition
	code += "  <div style='padding: 25px; border-bottom: 1px solid #cccccc; background: #edf0f5; font-family: Century Gothic,sans-serif;'>";
	code += "    <h3>Terms and Condition</h3>";
	code += "    <hr>";
	code +=      emailTemplate.termsAndCondition;
	code += "  </div>";
	// message to customer
	code += "  <div style='padding: 25px; font-family: Century Gothic,sans-serif;'>";
	code +=      emailTemplate.content; // message body
	code += "    <h3>Credentials</h3>";
	code += "    <b>Email : </b>" + credential.email + "<br>";
	code += "    <b>Password : </b>" + credential.password + "<br><br><br>";
	code += "    <a href='"+config.wos.url+"' style='background: #204d74; color: #ffffff; padding: 10px; text-decoration: none;'>Login now</a>";
	code += "    <p style='font-size: 12px; color: gray;'>By logging in your account, you agree to our Terms and Conditions</p>";
	code += "  </div>";
	code += "</div>";

	const mailOptions = {
		from    : SMTP_FROM,
		to      : credential.email,
		subject : emailTemplate.subject,
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
};


emailModel.sendSalespersonInvite = function (doc, callback) {
	console.log('emailModel sendSalespersonInvite');
	const emailTemplate = doc.emailTemplate;
	const credential = {
		email    : doc.email,
		password : doc.password
	};
	let code = "";

	// header
	code += "<div style='padding: 7px; padding-left: 35px; background-color: #212C32; color: #ffffff; font-family: Century Gothic,sans-serif;'>";
	// code += "  <h1>BRIDGESTONE</h1>";
	code += "  <img src='https://wos.bridgestone.com.sg/img/bridgestone_wos_all_white.png' height='70'>"; 
	code += "</div>";

	// content 
	code += "<div style='border: 1px solid #cccccc;'>";
	// terms and condition
	code += "  <div style='padding: 25px; border-bottom: 1px solid #cccccc; background: #edf0f5; font-family: Century Gothic,sans-serif;'>";
	code += "    <h3>Terms and Condition</h3>";
	code += "    <hr>";
	code +=      emailTemplate.termsAndCondition;
	code += "  </div>";
	// message to customer
	code += "  <div style='padding: 25px; font-family: Century Gothic,sans-serif;'>";
	code +=      emailTemplate.content; // message body
	code += "    <h3>Credentials</h3>";
	code += "    <b>Email : </b>" + credential.email + "<br>";
	code += "    <b>Password : </b>" + credential.password + "<br><br><br>";
	code += "    <a href='"+config.wos.url+"' style='background: #204d74; color: #ffffff; padding: 10px; text-decoration: none;'>Login now</a>";
	code += "    <p style='font-size: 12px; color: gray;'>By logging in your account, you agree to our Terms and Conditions</p>";
	code += "  </div>";
	code += "</div>";

	const mailOptions = {
		from    : SMTP_FROM,
		to      : credential.email,
		subject : emailTemplate.subject,
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
};


emailModel.sendEmail = function(doc, callback) {
	var recepient      = doc.recepient,
		sessionId      = doc.sessionId,
		subject        = doc.subject,
		content        = doc.content,
		dynamicContent = doc.dynamicContent;

	var code = "";

	code += "<div style='padding: 7px; padding-left: 35px; background-color: #3f7ea7; color: #ffffff; font-family: Century Gothic,sans-serif;'>";
	code += "  <h1>BRIDGESTONE</h1>";
	code += "</div>";

	code += "<div style='padding: 25px; border: 1px solid #cccccc;'>";
	code += content; // message body
	code += "</div>";

	if (dynamicContent) {
		code += "<div style='padding: 25px; border: 1px solid #cccccc;'>";
		code += dynamicContent; // message body
		code += "</div>";
	}

	mailOptions = {
		from    : SMTP_FROM,
		to      : recepient,
		subject : subject,
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
};


emailModel.sendOrder = function(doc, callback){
	async.waterfall([
		function(callback) {
			var code = "";
			var headers = ['Item #', 'Material code', 'Price', 'Quantity', 'Amount', 'Discount', 'Net Amount'];

			code += "<div style='padding: 7px; padding-left: 35px; background-color: #3f7ea7; color: #ffffff; font-family: Century Gothic,sans-serif;'>";
			code += "  <h1>BRIDGESTONE</h1>";
			// code += "  <img src='http://153.254.114.57/img/bridgestone_wos_all_white.png' height='70'>"; 
			code += "</div>";

			code += "<div style='padding: 25px; border: 1px solid #cccccc;'>"; // You have a new order.
			code += "    <p style='font-family: Trebuchet MS, Arial, Helvetica, sans-serif;'>"+doc.messageHead+"</p><br>";
			code += "    <div style='font-family: Trebuchet MS, Arial, Helvetica, sans-serif;'>";
			code += "        <label style='font-weight:bold;'>Reference no : </label> <span>" + doc.orders[0].salesOrderNo + "<span><br>";
			code += "        <label style='font-weight:bold;'>Sold to : </label> <span>" + doc.customerCode + "<span><br>";
			code += "        <label style='font-weight:bold;'>Customer name : </label> <span>" + doc.soldToName + "<span><br>";
			code += "        <label style='font-weight:bold;'>Order type : </label> <span>" + doc.orders[0].orderType + "<span><br>";
			code += "        <label style='font-weight:bold;'>Date ordered : </label> <span>" + moment(doc.dateCreated).format('MM/DD/YYYY') + "<span><br>";
			code += "        <label style='font-weight:bold;'>Ship to : </label> <span>" + doc.shipToParty + "<span><br>";
			code += "        <label style='font-weight:bold;'>Ship to name : </label> <span>" + doc.shipToName + "<span><br>";
			code += "        <label style='font-weight:bold;'>Delivery address : </label> <span>" + doc.shipToPartyAddress + "<span><br>";
			code += "        <label style='font-weight:bold;'>Requested delivery date : </label> <span>" + moment(doc.requestedDate).format('MM/DD/YYYY') + "<span><br>";
			code += "        <label style='font-weight:bold;'>Requested delivery time : </label> <span>" + doc.requestedTime + "<span><br><br>";
			code += "    </div>";



			code += "    <table style='font-family: Trebuchet MS, Arial, Helvetica, sans-serif; border-collapse: collapse; width: 100%;'>"; 

			// table header
			code += "      <tr>";
			for (var i in headers) {
				code += "        <th style='border: 1px solid #ddd; padding: 8px; padding-top: 12px; padding-bottom: 12px; text-align: left; background-color: #4CAF50; color: white; text-align: center;'>"+headers[i]+"</th>";
			}

			// table body
			var total = 0;
			code += "      </tr>";
			for (var i in doc.orders) {
				// total += parseFloat(doc.orders[i].amount);
				if(i%2==0){
					var rowColor = 'background-color: #f2f2f2;';
				} else {
					var rowColor = 'background-color: #ffffff;';
				}
				code += "      <tr style='"+rowColor+"'>";
				code += "        <td style='border: 1px solid #ddd; padding: 8px; text-align: center;'>"+doc.orders[i].salesOrderItemNo+"</td>";
				code += "        <td style='border: 1px solid #ddd; padding: 8px;'>"+doc.orders[i].usedMaterialCode+"</td>";
				code += "        <td style='border: 1px solid #ddd; padding: 8px; text-align: right;'>"+doc.orders[i].price+"</td>";
				code += "        <td style='border: 1px solid #ddd; padding: 8px; text-align: center;'>"+doc.orders[i].quantity+"</td>";
				code += "        <td style='border: 1px solid #ddd; padding: 8px; text-align: right;'>"+doc.orders[i].amount+"</td>";
				code += "        <td style='border: 1px solid #ddd; padding: 8px; text-align: right;'>"+doc.orders[i].discount+"</td>";
				var discountedAmount = parseFloat(doc.orders[i].amount) - parseFloat(doc.orders[i].discount);
				total += discountedAmount;
				code += "        <td style='border: 1px solid #ddd; padding: 8px; text-align: right;'>"+discountedAmount.toFixed(2)+"</td>";
				code += "      </tr>";
			}


			// tfoot
			code += "      <tr>";
			code += "        <th style='border: 1px solid #ddd; padding: 8px; padding-top: 12px; padding-bottom: 12px; text-align: left; background-color: #4CAF50; color: white; text-align: right;' colspan='7'>TOTAL : "+total.toFixed(2)+"</th>";
			code += "      </tr>";

			code += "    </table>"; 

			if (doc.accessLink) {
				code += "    <br><br><br>";
				var link = (doc.accessLink == 'WOS') ? config.wos.url : config.ami.url;
				var btn = (doc.accessLink == 'WOS') ? 'Access to WOS' : 'Access to WOS AMI';
				code += "    <a href='"+ link +"' style='font-family: Trebuchet MS, Arial, Helvetica, sans-serif; text-decoration: none;'>"+btn+"</a>";
			}

			code += "</div>";

			var mailOptions = {
				from    : SMTP_FROM,
				to      : doc.to,
				cc      : doc.cc,
				subject : "Bridgestone WOS Order : " + doc.orders[0].salesOrderNo + ' - ' + doc.messageHead,
				html    : code
			};

			smtpTransport.sendMail(mailOptions, function (err, res) {
				if (err) {
					console.log(err);
					return callback(err, null);
				}

				else {
					callback(null, res);
				}
			});
		}
	],
	function (err, res) {
		if (err) {
			callback(err, null);;
		} else {
			callback(null, res);
		}
	});
};


emailModel.sendBackOrder = function(doc, callback){
	async.waterfall([
		function(callback) {
			var code = "";
			var headers = ['Item #', 'Material code', 'Price', 'Quantity', 'Amount', 'Discount', 'Net Amount'];

			code += "<div style='padding: 7px; padding-left: 35px; background-color: #3f7ea7; color: #ffffff; font-family: Century Gothic,sans-serif;'>";
			code += "  <h1>BRIDGESTONE</h1>";
			// code += "  <img src='http://153.254.114.57/img/bridgestone_wos_all_white.png' height='70'>"; 
			code += "</div>";

			code += "<div style='padding: 25px; border: 1px solid #cccccc;'>"; // You have a new order.
			code += "    <p style='font-family: Trebuchet MS, Arial, Helvetica, sans-serif;'>"+doc.messageHead+"</p><br>";
			code += "    <div style='font-family: Trebuchet MS, Arial, Helvetica, sans-serif;'>";
			code += "        <label style='font-weight:bold;'>Backorder no : </label> <span>" + doc.orders[0].backOrderNo + "<span><br>";
			code += "        <label style='font-weight:bold;'>Reference no : </label> <span>" + doc.orders[0].salesOrderNo + "<span><br>";
			code += "        <label style='font-weight:bold;'>Sold to : </label> <span>" + doc.customerCode + "<span><br>";
			code += "        <label style='font-weight:bold;'>Order type : </label> <span>" + doc.orders[0].orderType + "<span><br>";
			code += "        <label style='font-weight:bold;'>Date ordered : </label> <span>" + moment(doc.dateCreated).format('MM/DD/YYYY') + "<span><br>";
			code += "        <label style='font-weight:bold;'>Ship to : </label> <span>" + doc.shipToParty + "<span><br>";
			code += "        <label style='font-weight:bold;'>Delivery address : </label> <span>" + doc.shipToPartyAddress + "<span><br>";
			code += "        <label style='font-weight:bold;'>Requested delivery date : </label> <span>" + moment(doc.requestedDate).format('MM/DD/YYYY') + "<span><br>";
			code += "        <label style='font-weight:bold;'>Requested delivery time : </label> <span>" + doc.requestedTime + "<span><br><br>";
			code += "    </div>";



			code += "    <table style='font-family: Trebuchet MS, Arial, Helvetica, sans-serif; border-collapse: collapse; width: 100%;'>"; 

			// table header
			code += "      <tr>";
			for (var i in headers) {
				code += "        <th style='border: 1px solid #ddd; padding: 8px; padding-top: 12px; padding-bottom: 12px; text-align: left; background-color: #4CAF50; color: white; text-align: center;'>"+headers[i]+"</th>";
			}

			// table body
			var total = 0;
			code += "      </tr>";
			for (var i in doc.orders) {
				// total += parseFloat(doc.orders[i].amount);
				if(i%2==0){
					var rowColor = 'background-color: #f2f2f2;';
				} else {
					var rowColor = 'background-color: #ffffff;';
				}
				code += "      <tr style='"+rowColor+"'>";
				code += "        <td style='border: 1px solid #ddd; padding: 8px; text-align: center;'>"+doc.orders[i].salesOrderItemNo+"</td>";
				code += "        <td style='border: 1px solid #ddd; padding: 8px;'>"+doc.orders[i].usedMaterialCode+"</td>";
				code += "        <td style='border: 1px solid #ddd; padding: 8px; text-align: right;'>"+doc.orders[i].price+"</td>";
				code += "        <td style='border: 1px solid #ddd; padding: 8px; text-align: center;'>"+doc.orders[i].backorder+"</td>";
				code += "        <td style='border: 1px solid #ddd; padding: 8px; text-align: right;'>"+doc.orders[i].amount+"</td>";
				code += "        <td style='border: 1px solid #ddd; padding: 8px; text-align: right;'>"+doc.orders[i].discount+"</td>";
				var discountedAmount = parseFloat(doc.orders[i].amount) - parseFloat(doc.orders[i].discount);
				total += discountedAmount;
				code += "        <td style='border: 1px solid #ddd; padding: 8px; text-align: right;'>"+discountedAmount.toFixed(2)+"</td>";
				code += "      </tr>";
			}


			// tfoot
			code += "      <tr>";
			code += "        <th style='border: 1px solid #ddd; padding: 8px; padding-top: 12px; padding-bottom: 12px; text-align: left; background-color: #4CAF50; color: white; text-align: right;' colspan='7'>TOTAL : "+total.toFixed(2)+"</th>";
			code += "      </tr>";

			code += "    </table>"; 


			code += "</div>";

			var mailOptions = {
				from    : SMTP_FROM,
				to:      doc.to,
				cc      : doc.cc,
				subject : "Bridgestone WOS Order : " + doc.orders[0].salesOrderNo,
				html    : code
			};

			smtpTransport.sendMail(mailOptions, function (err, res) {
				if (err) {
					console.log(err);
					return callback(err, null);
				}

				else {
					callback(null, res);
				}
			});
		}
	], 
	function (err, res) {
		if (err) {
			callback(err, null);;
		} else {
			callback(null, res);
		}
	});
};


emailModel.sendRejectOrder = function(doc, callback){
	async.waterfall([
		function(callback) {
			var code = "";
			var headers = ['Material code', 'Reason'];

			code += "<div style='padding: 7px; padding-left: 35px; background-color: #3f7ea7; color: #ffffff; font-family: Century Gothic,sans-serif;'>";
			code += "  <h1>BRIDGESTONE</h1>";
			// code += "  <img src='http://153.254.114.57/img/bridgestone_wos_all_white.png' height='70'>"; 
			code += "</div>";

			code += "<div style='padding: 25px; border: 1px solid #cccccc;'>"; // You have a new order.
			code += "    <p style='font-family: Trebuchet MS, Arial, Helvetica, sans-serif;'>"+doc.messageHead+"</p><br>";
			code += "    <div style='font-family: Trebuchet MS, Arial, Helvetica, sans-serif;'>";
			code += "        <label style='font-weight:bold;'>Reference no : </label> <span>" + doc.orders[0].salesOrderNo + "<span><br>";
			code += "        <label style='font-weight:bold;'>Sold to : </label> <span>" + doc.customerCode + "<span><br>";
			code += "        <label style='font-weight:bold;'>Order type : </label> <span>" + doc.orders[0].orderType + "<span><br>";
			code += "        <label style='font-weight:bold;'>Date ordered : </label> <span>" + moment(doc.dateCreated).format('MM/DD/YYYY') + "<span><br>";
			code += "        <label style='font-weight:bold;'>Ship to : </label> <span>" + doc.shipToParty + "<span><br>";
			code += "        <label style='font-weight:bold;'>Delivery address : </label> <span>" + doc.shipToPartyAddress + "<span><br>";
			code += "        <label style='font-weight:bold;'>Requested delivery date : </label> <span>" + moment(doc.requestedDate).format('MM/DD/YYYY') + "<span><br>";
			code += "        <label style='font-weight:bold;'>Requested delivery time : </label> <span>" + doc.requestedTime + "<span><br><br>";
			code += "    </div>";



			code += "    <table style='font-family: Trebuchet MS, Arial, Helvetica, sans-serif; border-collapse: collapse; width: 100%;'>"; 

			// table header
			code += "      <tr>";
			for (var i in headers) {
				code += "        <th style='border: 1px solid #ddd; padding: 8px; padding-top: 12px; padding-bottom: 12px; text-align: left; background-color: #4CAF50; color: white; text-align: center;'>"+headers[i]+"</th>";
			}

			// table body
			var total = 0;
			code += "      </tr>";
			for (var i in doc.orders) {
				// total += parseFloat(doc.orders[i].amount);
				if(i%2==0){
					var rowColor = 'background-color: #f2f2f2;';
				} else {
					var rowColor = 'background-color: #ffffff;';
				}
				code += "      <tr style='"+rowColor+"'>";
				code += "        <td style='border: 1px solid #ddd; padding: 8px;'>"+doc.orders[i].usedMaterialCode+"</td>";
				code += "        <td style='border: 1px solid #ddd; padding: 8px;'>"+doc.orders[i].reasonCancel+"</td>";
				code += "      </tr>";
			}

			code += "</div>";

			var mailOptions = {
				from    : SMTP_FROM,
				to      : doc.to,
				cc      : doc.cc,
				subject : "Bridgestone WOS Order : " + doc.orders[0].salesOrderNo,
				html    : code
			};

			smtpTransport.sendMail(mailOptions, function (err, res) {
				if (err) {
					console.log(err);
					return callback(err, null);
				}

				else {
					callback(null, res);
				}
			});
		}
	],         
	function (err, res) {
		if (err) {
			callback(err, null);;
		} else {
			callback(null, res);
		}
	});
};


emailModel.sendRejectBackOrder = function(doc, callback){
	async.waterfall([
		function(callback) {
			var code = "";
			var headers = ['Material code', 'Reason'];

			code += "<div style='padding: 7px; padding-left: 35px; background-color: #3f7ea7; color: #ffffff; font-family: Century Gothic,sans-serif;'>";
			code += "  <h1>BRIDGESTONE</h1>";
			// code += "  <img src='http://153.254.114.57/img/bridgestone_wos_all_white.png' height='70'>"; 
			code += "</div>";

			code += "<div style='padding: 25px; border: 1px solid #cccccc;'>"; // You have a new order.
			code += "    <p style='font-family: Trebuchet MS, Arial, Helvetica, sans-serif;'>"+doc.messageHead+"</p><br>";
			code += "    <div style='font-family: Trebuchet MS, Arial, Helvetica, sans-serif;'>";
			code += "        <label style='font-weight:bold;'>Backorder no : </label> <span>" + doc.orders[0].backOrderNo + "<span><br>";
			code += "        <label style='font-weight:bold;'>Reference no : </label> <span>" + doc.orders[0].salesOrderNo + "<span><br>";
			code += "        <label style='font-weight:bold;'>Sold to : </label> <span>" + doc.customerCode + "<span><br>";
			code += "        <label style='font-weight:bold;'>Order type : </label> <span>" + doc.orders[0].orderType + "<span><br>";
			code += "        <label style='font-weight:bold;'>Date ordered : </label> <span>" + moment(doc.dateCreated).format('MM/DD/YYYY') + "<span><br>";
			code += "        <label style='font-weight:bold;'>Ship to : </label> <span>" + doc.shipToParty + "<span><br>";
			code += "        <label style='font-weight:bold;'>Delivery address : </label> <span>" + doc.shipToPartyAddress + "<span><br>";
			code += "        <label style='font-weight:bold;'>Requested delivery date : </label> <span>" + moment(doc.requestedDate).format('MM/DD/YYYY') + "<span><br>";
			code += "        <label style='font-weight:bold;'>Requested delivery time : </label> <span>" + doc.requestedTime + "<span><br><br>";
			code += "    </div>";



			code += "    <table style='font-family: Trebuchet MS, Arial, Helvetica, sans-serif; border-collapse: collapse; width: 100%;'>"; 

			// table header
			code += "      <tr>";
			for (var i in headers) {
				code += "        <th style='border: 1px solid #ddd; padding: 8px; padding-top: 12px; padding-bottom: 12px; text-align: left; background-color: #4CAF50; color: white; text-align: center;'>"+headers[i]+"</th>";
			}

			// table body
			var total = 0;
			code += "      </tr>";
			for (var i in doc.orders) {
				// total += parseFloat(doc.orders[i].amount);
				if(i%2==0){
					var rowColor = 'background-color: #f2f2f2;';
				} else {
					var rowColor = 'background-color: #ffffff;';
				}
				code += "      <tr style='"+rowColor+"'>";
				code += "        <td style='border: 1px solid #ddd; padding: 8px;'>"+doc.orders[i].usedMaterialCode+"</td>";
				code += "        <td style='border: 1px solid #ddd; padding: 8px;'>"+doc.orders[i].reasonCancel+"</td>";
				code += "      </tr>";
			}

			code += "</div>";

			var mailOptions = {
				from    : SMTP_FROM,
				to      : doc.to,
				cc      : doc.cc,
				subject : "Bridgestone WOS Order : " + doc.orders[0].salesOrderNo,
				html    : code
			};

			smtpTransport.sendMail(mailOptions, function (err, res) {
				if (err) {
					console.log(err);
					return callback(err, null);
				}

				else {
					callback(null, res);
				}
			});
		}
	], 
	function (err, res) {
		if (err) {
			callback(err, null);;
		} else {
			callback(null, res);
		}
	});
}


emailModel.emailOrders = function(data, callback){
	var orderDetails = data.orderDetails,
		tableData    = data.tableData,
		orderData    = data.orderData,
		emailData    = data.emailData;
		var code = "";

		code += "<div style='padding: 7px; padding-left: 35px; background-color: #212C32; color: #ffffff; font-family: Century Gothic,sans-serif;'>";
		// code += "  <h1>BRIDGESTONE</h1>";
		code += "  <img src='https://wos.bridgestone.com.sg/img/bridgestone_wos_all_white.png' height='70'>"; 
		code += "</div>";

		// order details
		code += "<div style='padding: 25px; border: 1px solid #cccccc; font-family: Trebuchet MS, Arial, Helvetica, sans-serif;'>";
		code += "  <p>"+emailData.subject+"</p><br>";
		code += "  <table style='border-collapse: collapse; width: 50%;' border='0'>";

		Object.keys(orderDetails).forEach(function(key) {
			code += "    <tr>";
			var divider = (data.orderDetails[key].label) ? ':' : '';
			code += "      <td style='padding: 2px; text-align: right; font-weight:bold; width: 25%;'>"+ data.orderDetails[key].label + " " + divider + " </td>"
			code += "      <td style='padding: 2px;'>" + data.orderDetails[key].value + "</td>"
			code += "    </tr>";      
		})
		code += "  </table><br><br><br>";


		// orders
		code += "  <table style='border-collapse: collapse; width: 100%;'>"; 

		// table header
		code += "    <tr>";
		Object.keys(tableData).forEach(function(key) {
			code += "      <th style='border: 1px solid #ddd; padding: 8px; padding-top: 12px; padding-bottom: 12px; text-align: left; background-color: #767676; color: white; text-align: center;'>"+tableData[key]+"</th>"
		})
		code += "    </tr>";


		// table body
		var overallTotal = 0, rowColor;
		for (var i in orderData) {
			overallTotal += parseFloat(orderData[i].netAmount);
			rowColor = (i%2==0) ? 'background-color: #f2f2f2;' : 'background-color: #ffffff;';

			code += "    <tr style='"+rowColor+"'>";
			Object.keys(tableData).forEach(function(key) {
				code += "      <td style='border: 1px solid #ddd; padding: 8px; text-align: center;'>"+orderData[i][key]+"</td>";
			})
			code += "    </tr>";
		}


		// tfoot
		code += "    <tr>";
		var footerLabel = parseInt(Object.keys(tableData).length) - 1;
		code += "      <th style='border: 1px solid #ddd; padding: 8px; padding-top: 12px; padding-bottom: 12px; text-align: right; background-color: #767676; color: white;' colspan='"+footerLabel+"'>TOTAL : </th>";
		code += "      <th style='border: 1px solid #ddd; padding: 8px; padding-top: 12px; padding-bottom: 12px; text-align: center; background-color: #767676; color: white;'>"+parseFloat(overallTotal).toFixed(2)+"</th>"; 
		code += "    </tr>";
		code += "    </table>"; 

		// link
		if (emailData.accessLink) {
			code += "  <br><br><br>";
			var link = (emailData.accessLink == 'WOS') ? config.wos.url : config.ami.url;
			var btn = (emailData.accessLink == 'WOS') ? 'Access to WOS' : 'Access to WOS AMI';
			code += "  <a href='"+ link +"' style='font-family: Trebuchet MS, Arial, Helvetica, sans-serif; text-decoration: none;'>"+btn+"</a>";
		}

		code += "</div>";


		var mailOptions = { 
			from    : SMTP_FROM,
			to      : emailData.to,
			cc      : emailData.cc,
			subject : "Bridgestone WOS Order : " + orderData[0].salesOrderNo + ' - ' + emailData.subject,
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
};


emailModel.emailRejectedOrders = function(data, callback){
	var orderDetails = data.orderDetails,
		tableData    = data.tableData,
		orderData    = data.orderData,
		emailData    = data.emailData;

	var code = "";

	code += "<div style='padding: 7px; padding-left: 35px; background-color: #212C32; color: #ffffff; font-family: Century Gothic,sans-serif;'>";
	// code += "  <h1>BRIDGESTONE</h1>";
	code += "  <img src='https://wos.bridgestone.com.sg/img/bridgestone_wos_all_white.png' height='70'>"; 
	code += "</div>";

	// order details
	code += "<div style='padding: 25px; border: 1px solid #cccccc; font-family: Trebuchet MS, Arial, Helvetica, sans-serif;'>"; // You have a new order.
	code += "  <p>"+emailData.subject+"</p><br>";
	code += "  <table style='border-collapse: collapse; width: 50%;' border='0'>";

	Object.keys(orderDetails).forEach(function(key) {
		code += "    <tr>";
		var divider = (data.orderDetails[key].label) ? ':' : '';
		code += "      <td style='padding: 2px; text-align: right; font-weight:bold; width: 25%;'>"+ data.orderDetails[key].label + " " + divider + " </td>"
		code += "      <td style='padding: 2px;'>" + data.orderDetails[key].value + "</td>"
		code += "    </tr>";      
	})
	code += "  </table><br><br><br>";


	// orders
	code += "  <table style='border-collapse: collapse; width: 100%;'>"; 

	// table header
	code += "    <tr>";
	Object.keys(tableData).forEach(function(key) {
		code += "      <th style='border: 1px solid #ddd; padding: 8px; padding-top: 12px; padding-bottom: 12px; text-align: left; background-color: #767676; color: white; text-align: center;'>"+tableData[key]+"</th>"
	})
	code += "    </tr>";


	// table body
	var overallTotal = 0, rowColor;
	for (var i in orderData) {
		overallTotal += parseFloat(orderData[i].netAmount);
		rowColor = (i%2==0) ? 'background-color: #f2f2f2;' : 'background-color: #ffffff;';

		code += "    <tr style='"+rowColor+"'>";
		Object.keys(tableData).forEach(function(key) {
			code += "      <td style='border: 1px solid #ddd; padding: 8px; text-align: center;'>"+orderData[i][key]+"</td>";
		})
		code += "    </tr>";
	}

	code += "    </table>"; 

	// link
	if (emailData.accessLink) {
		code += "  <br><br><br>";
		var link = (emailData.accessLink == 'WOS') ? config.wos.url : config.ami.url;
		var btn = (emailData.accessLink == 'WOS') ? 'Access to WOS' : 'Access to WOS AMI';
		code += "  <a href='"+ link +"' style='font-family: Trebuchet MS, Arial, Helvetica, sans-serif; text-decoration: none;'>"+btn+"</a>";
	}

	code += "</div>";


	var mailOptions = { 
		from    : SMTP_FROM,
		to      : emailData.to,
		cc      : emailData.cc,
		subject : "Bridgestone WOS Order : " + orderData[0].salesOrderNo + ' - ' + emailData.subject,
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
};

module.exports.emailModel = emailModel;