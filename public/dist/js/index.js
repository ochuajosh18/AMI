checkSession();
setUserData();

$('.bg-green .small-box-footer').height($('.bg-yellow .small-box-footer').height());
$('.bg-red .small-box-footer').height($('.bg-yellow .small-box-footer').height());

$(document).ready(function() {
	let LCLDB_DEALERS, LCLDB_SALESPERSONS, LCLDB_USER, LCLDB_NORMALORDER, LCLDB_SPECIALORDER, LCLDB_CREDITORDER, 
	LCLDB_RECENTORDER, LCLDB_BESTSELLERMATERIAL, LCLDB_TOPCUSTOMERS, DT_ORDERLIST, DT_BESTSELLER, DT_TOPCUSTOMER, 
	LCLDB_ORDERSTODAY, LCLDB_SALESTODAY, ROLE_IDS = role_localdata;
	const salespersonRoleId = ROLE_IDS['SALESPERSON'], customerRoleId = ROLE_IDS['CUSTOMER'];

	loadUser(LOCAL_STORAGE.userid, (err, res) => { LCLDB_USER = res.result; });

	let passExpireDate = moment(LCLDB_USER.lastPassUpdate).add(3, 'months').add(1, 'days').format('MMM-DD-YYYY');
	let today = moment().format('MMM-DD-YYYY');

    if (today == passExpireDate) $('#update-credential-modal').modal();

    function checkPreviousPassword(newPassword, oldPasswords) {
		let isOldPass;

		comparePassword({ newPassword, oldPasswords }, (err,res) => { isOldPass = res; });
		return isOldPass;
	}

	function getEncryption(passwordString) {
		let encryptedPass;

		encryptPassword({ passwordString }, (err,res) => { encryptedPass = res; });
		return encryptedPass;
	}

	function updatePassHistory(password) {
		let passwordHistory;

		if (LCLDB_USER.hasOwnProperty('passwordHistory')) {
			passwordHistory = LCLDB_USER.passwordHistory;
			passwordHistory.push(password)

			if (passwordHistory.length > 3) passwordHistory.shift(); // remove last password
		} else {
			passwordHistory = [password];
		}

		LCLDB_USER.passwordHistory = passwordHistory;
		return passwordHistory;
	}

	function checkPassrequirement(password) {
		var uppercase = password.length - password.replace(/[A-Z]/g, '').length;  
		var lowercase = password.length - password.replace(/[a-z]/g, '').length;  
		var number = password.length - password.replace(/[0-9]/g, '').length;  

		if (uppercase && lowercase && number && password.length >= 8) {
			return true;
		} else {
			return false;
		}
	}

	// save credential changes
	$('#update-credential-btn').click(function(){
		// password check
		let sync = $('#update-credential2-form').serializeObject();
		if (!sync.oldPassword || !sync.newPassword || !sync.confirmPassword) {
			resultNotify('fa-exclamation-circle', 'INVALID', `<b>All fields</b> required`, 'warning');
			return;
		} else if (sync.oldPassword != LOCAL_STORAGE.password) {
			resultNotify('fa fa-times', 'ERROR', 'Incorrect <b>password</b>', 'danger');
			return;
		} else if (sync.newPassword != sync.confirmPassword) {
			resultNotify('fa fa-times', 'ERROR', 'New <b>password</b> did not match', 'danger');
			return;
		} else if (!checkPassrequirement(sync.newPassword)) {
			alert(`Password must contain at least 8 characters: at least 1 UPPERCASE letter, 1 lowercase letter, and 1 number`)
			return;
		}

		let user = { lastPassUpdate : moment().toISOString() }

		let encryptedPass;
		if (checkPreviousPassword(sync.newPassword, LCLDB_USER.passwordHistory)) {
			alert('You cannot use your previous 3 passwords');
			return;
		} else {
			encryptedPass = getEncryption(sync.newPassword);
			user.passwordHistory = updatePassHistory(encryptedPass);				
		}

		disableButton('#update-credential-btn');
		setTimeout(() => {
			async.waterfall([
				// save username
				(callback) => {
					updateUser2(LOCAL_STORAGE.userid, user, (err, res) => {
						$('.loading-state').fadeOut('slow');
						$('#update-credential-modal').modal('hide');

						if (res.statusCode <= 299) {
							callback(null, 'ok');
						} else {
							console.log(res);
							resultNotify('fa fa-times', 'ERROR', 'Credential changes not saved.<br>Something went wrong. Please try again later', 'danger');
						}
					});
				},

				// change password
				(usre, callback) => {
					updatePassword(LOCAL_STORAGE.referenceId, { password: sync.oldPassword, newPassword: sync.newPassword }, (err, res) => {
						if (res.statusCode <= 299) {
							const newuser = res.result;
							const oldStorage = JSON.parse(localStorage.getItem('userData'));
							oldStorage.password = newuser.password;
							oldStorage.sessionId = newuser.sessionId;
							oldStorage.expire = newuser.expire;
							localStorage.setItem('userData', JSON.stringify(oldStorage));

							callback(null, 'ok');
						} else {
							console.log(res);
							resultNotify('fa fa-times', 'ERROR', 'Credential changes not saved.<br>Something went wrong. Please try again later', 'danger');
						}
					});
				}
			],

			(err, res) => {
				if (err) {
					console.log(err);
					return;
				}

				$('#update-credential-modal').modal('hide');
				resultNotify('fa-check-circle', 'SUCCESS', 'Credential changes successfully saved', 'success');
				setTimeout(() => { location.reload(); }, 1000)
			});
		}, 1000);
	});

	let datetoday = moment().format('YYYY-MM-DD');
	// let datetoday = '2019-01-10'

	// COMMENTED to disable dashboard - pending by client
	/* loadDealers({ customerRoleId }, (err, res) => {
		LCLDB_DEALERS = res.result;
	});

	loadSalespersons({ salespersonRoleId }, (err, res) => {
		LCLDB_SALESPERSONS = res.result;
	});

	loadNormalOrderCount((err, res) => {
		LCLDB_NORMALORDER = res.result;
	});

	loadSpecialOrderCount((err, res) => {
		LCLDB_SPECIALORDER = res.result;
	});

	loadCreditOrderCount((err, res) => {
		LCLDB_CREDITORDER = res.result;
	});

	loadRecentOrders((err, res) => {
		LCLDB_RECENTORDER = res.result;
	});

	loadBestSellerMaterial((err, res) => {
		LCLDB_BESTSELLERMATERIAL = res.result;
	});

	loadTopCustomers((err, res) => {
		LCLDB_TOPCUSTOMERS = res.result;
	});

	loadOrdersToday({ datetoday }, (err, res) => {
		LCLDB_ORDERSTODAY = res.result[0].totalSalesOrderNo;
	});

	loadSalesToday({ datetoday }, (err, res) => {
		if(res.result[0].totalAmount){
			LCLDB_SALESTODAY = res.result[0].totalAmount;
		} else {
			LCLDB_SALESTODAY = 0;
		}
	});


	$('#orders-count').text(LCLDB_ORDERSTODAY);
	$('#sales-count').text(LCLDB_SALESTODAY);
	$('#dealers-count').text(LCLDB_DEALERS);
	$('#salespersons-count').text(LCLDB_SALESPERSONS);

	$('#approval-div [count-value="normalOrder"]').text(LCLDB_NORMALORDER);
	$('#approval-div [count-value="specialOrder"]').text(LCLDB_SPECIALORDER);
	$('#approval-div [count-value="creditLimit"]').text(LCLDB_CREDITORDER);


	DT_ORDERLIST = $('#order-list').DataTable({
		destroy   : true,
		data      : LCLDB_RECENTORDER,
		order     : [[0, 'desc']],
		autoWidth : false,
		paging    : false,
		ordering  : false,
		dom       : 'rt',
		language  : {  emptyTable: '<h4><b>No orders</b></h4>' },

		columns: [
			{ data: 'salesOrderNo', title: 'Order No' },
			{ data: 'customerCode', title: 'Customer Code' },
			{ data: 'customerName', title: 'Customer Name' },
			{ data: 'quantity', title: 'Quantity' }
		],
		columnDefs: [
		{ targets: 0, render: (data, type, row) => `<b> ${data} </b>` },
		{
			targets: 3, className: 'dt-center',
			render: (data, type, row) => `<b class="text-blue">${data}</b>`
		}
		]
	});

	DT_BESTSELLER = $('#bestseller-materials').DataTable({
		destroy   : true,
		data      : LCLDB_BESTSELLERMATERIAL,
		order     : [[1, 'desc']],
		autoWidth : false,
		paging    : false,
		ordering  : false,
		dom       : 'rt',
		language  : {  emptyTable: '<h4><b>No data</b></h4>' },

		columns: [
			{ data: 'materialCode'},
			{ data: 'totalQuantity'}
		],
		columnDefs: [
		{
			targets: 1, className: 'dt-center',
			render: (data, type, row) => `<b class="text-blue">${data}</b>`
		}
		]
	});

	DT_TOPCUSTOMER = $('#customer-list').DataTable({
		destroy   : true,
		data      : LCLDB_TOPCUSTOMERS,
		order     : [[1, 'desc']],
		autoWidth : false,
		paging    : false,
		ordering  : false,
		dom       : 'rt',
		language  : {  emptyTable: '<h4><b>No data</b></h4>' },

		columns: [
			{ data: 'customerCode', title: 'Customer Code' },
			{ data: 'name1', title: 'Customer Name' },
			{ data: 'totalAmount', title: 'Total Amount' },
		],
		columnDefs: [
		{ 
			targets: 0, 
			render: (data, type, row) => `<b>${data}</b>`
		},
		{
			targets: 2, className: 'dt-right',
			render: (data, type, row) => `<b class="text-blue"> SGD ${convertToNumber(data, '2-decimal')}</b>`
		}
		]
	});

	$('#bestseller-materials thead').hide(); */

	$('.loading-state-index').fadeOut();
});