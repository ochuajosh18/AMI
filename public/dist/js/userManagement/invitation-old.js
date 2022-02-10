checkSession();
setUserData();

$(document).ready(function() {
	let LCLDB_CUSTOMER,
	DT_CUSTOMER, DT_SALESPERSON, DT_CHECK_INVITE,
	EMAIL_TEMPLATE_CUSTOMER_INVITE = loadCustomerInvitation_EmailTemplate(),
	EMAIL_TEMPLATE_SALESPERSON_INVITE = loadSalespersonInvitation_EmailTemplate();

	const customerRoleId = JSON.parse(localStorage.getItem("otherData")).ROLE_CUSTOMER,
	salespersonRoleId    = JSON.parse(localStorage.getItem("otherData")).ROLE_SALESPERSON;

	if (EMAIL_TEMPLATE_CUSTOMER_INVITE && EMAIL_TEMPLATE_SALESPERSON_INVITE) {
		loadCustomerTable('couchbase');
	}
	

	function loadCustomerTable(database) {
		let data;

		if (database == 'couchbase') {
			loadCustomerUser_WithoutAccount('blank', customerRoleId, function(err, res){
				try {
					if (res instanceof Array) {
						LCLDB_CUSTOMER = res;
						data = res;
					} else {
						throw 'Unable to get customer list';
					}
				} catch (err) {
					alert('Something went wrong\n' + err);
					console.log(err);
				}
			});
		} else {
			data = LCLDB_CUSTOMER;
		}

		if (data) {
			DT_CUSTOMER = $('#customer-table').DataTable({
				destroy        : true,
				data           : data,
				order          : [ 1, "asc" ],
				autoWidth      : false,
				scrollY        : 300,
				scrollCollapse : true,
				lengthMenu     : [[10, 25, 50, -1], [10, 25, 50, "All"]],
				pageLength     : 25,

				columns : [
					{data : null, defaultContent : '', width : 5},
					{data : 'customerCode', width : 100},
					{data : 'name1'},
					{data : 'smtpAddr', defaultContent : '<b class="text-red">none</b>'},
				],

				columnDefs:
				[
					{
						className : 'dt-center',
						render    : function (data, type, row) { return '<b>'+data+'</b>'; },
						targets   : 1
					},
					{
						className : 'select-checkbox',
						orderable : false,
						targets   : 0
					}
				],
				select: { style: 'multi' },
				rowCallback : function (row, data, iDataIndex) { $(row).attr('id', data['id']); },
				initComplete : function(settings, json) { $(this).find('tbody tr').css('cursor', 'pointer'); }
			});
		}

		$('.loading-state').fadeOut('slow');
	}


	function loadSalespersonTable(database) {
		let data;

		if (database == 'couchbase') {
			loadCustomerUser_WithoutAccount('PE', salespersonRoleId, function(err, res){
				try {
					if (res instanceof Array) {
						LCLDB_CUSTOMER = res;
						data = res;
					} else {
						throw 'Unable to get salesperson list';
					}
				} catch (err) {
					alert('Something went wrong\n' + err);
					console.log(err);
				}
			});
		} else {
			data = LCLDB_CUSTOMER;
		}

		if (data) {
			DT_SALESPERSON = $('#salesperson-table').DataTable({
				destroy        : true,
				data           : data,
				order          : [ 1, "asc" ],
				autoWidth      : false,
				scrollY        : 300,
				scrollCollapse : true,
				lengthMenu     : [[10, 25, 50, -1], [10, 25, 50, "All"]],
				pageLength     : 25,

				columns : [
					{data : null, defaultContent : '', width : 5},
					{data : 'customerCode', width : 100},
					{data : 'name1'},
					{data : 'smtpAddr', defaultContent : '<b class="text-red">none</b>'},
				],

				columnDefs:
				[
					{
						className : 'dt-center',
						render    : function (data, type, row) { return '<b>'+data+'</b>'; },
						targets   : 1
					},
					{
						className : 'select-checkbox',
						orderable : false,
						targets   : 0
					}
				],
				select : { style: 'multi' },
				rowCallback : function (row, data, iDataIndex) { $(row).attr('id', data['id']); },
				initComplete : function(settings, json) { $(this).find('tbody tr').css('cursor', 'pointer'); }
			});
		}

		$('.loading-state').fadeOut('slow');
	}


	function loadCustomers(salesperson) {
		var data = []

		loadByKey('AMI2_CUSTOMER', 'byCustomerCode', salesperson, function(err, res) {
			if (res.statusCode <= 299) {
				for (var i = 0; i < res.body.total_rows; i++) {
					data.push(res.body.rows[i].value);
					data[i].id = res.body.rows[i].id;
				}
			} else {
				console.log(res);
			}
		});

		return data;
	}


	function loadCustomerInvitation_EmailTemplate() {
		let data;

		loadById('EMAIL::CUSTOMER::INVITATION', function(err, res){
			try {
				if (res.statusCode <= 299) {
					data = res.body;
				} else {
					throw 'Unable to get email template for customer invite';
				}
			} catch (err) {
				alert('Something went wrong\n' + err);
				console.log(err);
				console.log(res);
			}
		});

		return data;
	}


	function loadSalespersonInvitation_EmailTemplate() {
		let data;

		loadById('EMAIL::SALESPERSON::INVITATION', function(err, res){
			try {
				if (res.statusCode <= 299) {
					data = res.body;
				} else {
					throw 'Unable to get email template for salesperson invite';
				}
			} catch (err) {
				alert('Something went wrong\n' + err);
				console.log(err);
				console.log(res);
			}
		});

		return data;
	}


	$('#check-invite-btn').click(function(){
		let accountType = $(this).attr('data-account-type'),
		inviteData = [], isValid = true;

		switch(accountType) {
			case 'customer' :
				$('#send-invite-btn').show();
				inviteData = DT_CUSTOMER.rows('.selected').data().toArray();

				for (let i in inviteData) {
					inviteData[i].isSent = null;
					if (!inviteData[i].smtpAddr) { // if customer dont have email
						isValid = false;
					}
				}

				if (inviteData.length != 0 && isValid) {
					$('span#invite-counter').html(inviteData.length);

					DT_CHECK_INVITE = $('#invite-customer-table').DataTable({
						destroy      : true,
						data         : inviteData,
						searching    : false,
						paging       : false,
						lengthChange : false,
						info         : false,
						autoWidth    : false,

						columns :
						[
							{data : 'customerCode', width: 100},
							{data : 'name1'},
							{data : 'smtpAddr'},
							{data : 'isSent', defaultContent : '', width: 10}
						],

						columnDefs:
						[
							{ // customerCode, isSent
								className : 'dt-center',
								targets   : [0, 3]
							},
							{ // customerCode
								render    : function (data, type, row) { return '<b>'+data+'</b>'; },
								targets   : 0
							},
							{ // isSent
								orderable : false,
								targets   : 3
							}
						],
						rowCallback : function (row, data, iDataIndex) { $(row).attr('id', data['id']); }
					});

					$('#invite-customer-modal').modal();
				} else if (inviteData.length == 0) {
					resultNotify('fa-exclamation-circle', 'INVALID', 'Select a customer to be invited', 'warning');
				} else if (!isValid) {
					resultNotify('fa-exclamation-circle', 'INVALID', 'Customer withouth email cannot be invited', 'warning');
				}
			break;

			case 'salesperson' :
				$('#send-invite-salesperson-btn').show();
				inviteData = DT_SALESPERSON.rows('.selected').data().toArray();

				for (let i in inviteData) {
					inviteData[i].isSent = null;
					if (!inviteData[i].smtpAddr) { // if customer dont have email
						isValid = false;
					}
				}

				if (inviteData.length != 0 && isValid) {
					$('span#invite-salesperson-counter').html(inviteData.length);

					DT_CHECK_INVITE = $('#invite-salesperson-table').DataTable({
						destroy      : true,
						data         : inviteData,
						searching    : false,
						paging       : false,
						lengthChange : false,
						info         : false,
						autoWidth    : false,

						columns :
						[
							{data : 'customerCode', width: 100},
							{data : 'name1'},
							{data : 'smtpAddr'},
							{data : 'isSent', defaultContent : '', width: 10}
						],

						columnDefs:
						[
							{ // customerCode, isSent
								className : 'dt-center',
								targets   : [0, 3]
							},
							{ // customerCode
								render    : function (data, type, row) { return '<b>'+data+'</b>'; },
								targets   : 0
							},
							{ // isSent
								orderable : false,
								targets   : 3
							}
						],
						rowCallback : function (row, data, iDataIndex) { $(row).attr('id', data['id']); }
					});

					$('#invite-salesperson-modal').modal();
				} else if (inviteData.length == 0) {
					resultNotify('fa-exclamation-circle', 'INVALID', 'Select a salesperson to be invited', 'warning');
				} else if (!isValid) {
					resultNotify('fa-exclamation-circle', 'INVALID', 'Salesperson withouth email cannot be invited', 'warning');
				}
			break;
		}
	});


	$('#send-invite-btn').click(function(){
		$('.loading-state').fadeIn('slow');
		disableButton('#send-invite-btn');
		setTimeout(function(){
			try {
				DT_CHECK_INVITE.rows().every(function(){
					let data = this.data();
					let doc = {
						controlledItemPermission : {
							endDate    : "",
							permission : "false",
							startDate  : ""
						},
						customerCode        : data.customerCode,
						channels            : ["USER", data.customerCode],
						customerId          : data.id,
						dateCreated         : moment().format('YYYY-MM-DD'),
						distributionChannel : '01',
						docType             : 'USER',
						email               : data.smtpAddr,
						firstName           : 'Jhon'.toUpperCase(),
						lastName            : 'Doe'.toUpperCase(),
						roleId              : customerRoleId,
						status              : 'changeInformation',
						timeCreated         : moment().format('LT'),
						userName            : data.smtpAddr
					}

					createCustomerUserAccount(doc, function(err, res){
						console.log('\n----- create user');
						console.log(res);

						if (res.statusCode <= 299) {
							deleteOnLocalArray(LCLDB_CUSTOMER, 'id', data.id);

							let doc = {
								email         : res.email,
								password      : res.password,
								emailTemplate : EMAIL_TEMPLATE_CUSTOMER_INVITE
							}

							sendCustomerInvite(doc, function(err2, res2) {
								console.log('\n----- send email');
								console.log(res2);

								if (res2.hasOwnProperty('message')) {
									data.isSent = '<i style="font-size: 16px;" class="fa fa-check-circle text-success" aria-hidden="true"></i>';
								} else {
									data.isSent = '<i style="font-size: 16px;" class="fa fa-times-circle text-danger" aria-hidden="true"></i>';
								}
							});
						} else {
							data.isSent = '<i style="font-size: 16px;" class="fa fa-times-circle text-danger" aria-hidden="true"></i>';
						}
					});

					this.invalidate(); // to read isSent when redrawn
				});

				DT_CHECK_INVITE.draw(); // redraw table
				setTimeout(function(){ loadCustomerTable('localdb'); }, 1000);
				$('#send-invite-btn').hide();
			} catch (err) {
				alert('Something went wrong\n' + err);
				console.log(err);
			}
		}, 1000);
	});


	$('#send-invite-salesperson-btn').click(function(){
		$('.loading-state').fadeIn('slow');
		disableButton('#send-invite-salesperson-btn');
		setTimeout(function(){
			try {
				DT_CHECK_INVITE.rows().every(function(){
					let data = this.data(), customerChannels = [];
					customers = loadCustomers(data.customerCode);

					for (var i in customers) {
						customerChannels.push(customers[i].mainCustomerCode);
					}

					let doc = {
						controlledItemPermission : {
							endDate    : "",
							permission : "false",
							startDate  : ""
						},
						customerCode : data.customerCode,
						customers    : customerChannels,
						channels     : ["USER", data.customerCode, "NON::CUSTOMER::USER"],
						customerId   : data.id,
						dateCreated  : moment().format('YYYY-MM-DD'),
						docType      : 'USER',
						email        : data.smtpAddr,
						firstName    : data.name1.toUpperCase(),
						lastName     : data.name2.toUpperCase(),
						roleId       : salespersonRoleId,
						status       : 'changePassword',
						timeCreated  : moment().format('LT'),
						userName     : data.smtpAddr
					}

					createSalespersonUserAccount(doc, function(err, res){
						console.log('\n----- create user');
						console.log(res);

						if (res.statusCode <= 299) {
							deleteOnLocalArray(LCLDB_CUSTOMER, 'id', data.id);

							let doc = {
								email         : res.email,
								password      : res.password,
								emailTemplate : EMAIL_TEMPLATE_SALESPERSON_INVITE
							}

							console.log(doc);
							sendSalespersonInvite(doc, function(err2, res2) {
								console.log('\n----- send email');
								console.log(res2);

								if (res2.hasOwnProperty('message')) {
									data.isSent = '<i style="font-size: 16px;" class="fa fa-check-circle text-success" aria-hidden="true"></i>';
								} else {
									data.isSent = '<i style="font-size: 16px;" class="fa fa-times-circle text-danger" aria-hidden="true"></i>';
								}
							});
						} else {
							data.isSent = '<i style="font-size: 16px;" class="fa fa-times-circle text-danger" aria-hidden="true"></i>';
						}
					});

					this.invalidate(); // to read isSent when redrawn
				});

				DT_CHECK_INVITE.draw(); // redraw table
				setTimeout(function(){ loadSalespersonTable('localdb'); }, 1000);
				$('#send-invite-salesperson-btn').hide();
			} catch (err) {
				alert('Something went wrong\n' + err);
				console.log(err);
			}
		}, 1000);
		/*var isSuccess = true;
		DT_CHECK_INVITE.rows().every(function(){
			var data = this.data(),
			customerChannels = [];
			customers = loadCustomers(data.customerCode);

			for (var i in customers) {
				customerChannels.push(customers[i].mainCustomerCode);
			}

			var doc = {
				controlledItemPermission : {
					"endDate"    : "",
					"permission" : "false",
					"startDate"  : ""
				},
				customerCode : data.customerCode,
				customers    : customerChannels,
				channels     : ["USER", data.customerCode, "NON::CUSTOMER::USER"],
				customerId   : data.id,
				dateCreated  : moment().format('YYYY-MM-DD'),
				docType      : 'USER',
				email        : data.smtpAddr,
				firstName    : data.name1.toUpperCase(),
				lastName     : data.name2.toUpperCase(),
				roleId       : salespersonRoleId,
				status       : 'active',
				timeCreated  : moment().format('LT'),
				userName     : data.smtpAddr
			}

			async.waterfall([
				// create user
				function(callback) {
					createUserForInvite_Salesperson(doc, function(err, res){
						console.log(res);

						if (res.statusCode <= 299) {
							var emailParameter = {
								name              : res.name,
								email             : res.email,
								password          : res.password,
								siteUrl           : res.siteUrl
							}

							callback(null, emailParameter);
						}

						else if (res.statusCode >= 300) {
							isSuccess = false;
							callback('error creating user', null);
						}
					});
				},

				// send email
				function(emailParameter, callback) {
					var code = '';
					code += '<p>Welcome to BRIDGESTONE! We are inviting you to use the newly Web Ordering System</p>';
					code += '<h3>Credentials</h3>';
					code += '<b>Email : </b>';
					code += emailParameter.email + '<br>';
					code += '<b>Password : </b>';
					code += emailParameter.password + '<br><br><br>';
					code += '<a href="http://153.254.114.57/" style="background:#204d74;color:#ffffff;padding:10px;text-decoration:none">Login now</a>';
					code += '<p style="font-size:12px;color:gray">By logging in your account, you agree to our Terms and Conditions</p>';

					emailParameter.recepient = emailParameter.email;
					emailParameter.content = code;
					emailParameter.subject = 'SALESPERSON INVITATION';

					sendEmail(emailParameter, function(err, res){
						callback(null, res);
					});
				}
				],

				function (err, res) {
					if (err) {
						alert(err);
					} else {
						console.log(res);
						deleteOnLocalArray(LCLDB_CUSTOMER, 'id', data.id);
					}
				});
		});*/


		/*if (isSuccess) {
			$('#invite-salesperson-modal').modal('hide');
			resultNotify('fa-check-circle', 'SUCCESS', 'Salesperson succecssfully invited', 'success');
			setTimeout(function(){ loadSalespersonTable('localdb'); }, 1000);
		} else {
			resultNotify('fa fa-times', 'ERROR', 'Salesperson not invited.<br>Something went wrong. Please try again later', 'danger');
		}*/
	});


	$('ul.accountTypeTab li').click(function(){
		var accountType = $(this).attr('data-account-type')

		if (accountType == 'customer') {
			$('.loading-state').fadeIn('slow');
			setTimeout(function(){ loadCustomerTable('couchbase') }, 1000);
		} else if (accountType == 'salesperson') {
			$('.loading-state').fadeIn('slow');
			setTimeout(function(){ loadSalespersonTable('couchbase') }, 1000);
		}

		$('#check-invite-btn').attr('data-account-type', accountType);
	});
});