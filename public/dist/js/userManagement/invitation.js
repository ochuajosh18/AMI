checkSession();
setUserData();

$(document).ready(function() {
	let LCLDB_CUSTOMER, LCLDB_SALESPERSON, ROLE_IDS = role_localdata;
	let DT_CUSTOMER, DT_SALESPERSON, DT_CHECK_INVITE_CUSTOMER, DT_CHECK_INVITE_SALESPERSON;
	const salesRoleId = ROLE_IDS['SALESPERSON'], customerRoleId = ROLE_IDS['CUSTOMER'];

	const config = {
	    // db : 'offline'
	    db : 'couchbase'
	};

	enableHelpFunction();
	$("[data-toggle=popover]").popover();

	loadCustomerTable();

	// load customer table
	function loadCustomerTable() {

		let data;

		if (config.db == 'couchbase') {
			loadCustomers_WithoutAccount({ customerRoleId }, (err, res) => {
				if (err || res.statusCode >= 300) { end = true; return }
				else if (res.statusCode <= 299) { LCLDB_CUSTOMER = res.result; data = LCLDB_CUSTOMER; }
			});
		} else if (config.db == 'local') {
			data = LCLDB_CUSTOMER;
			console.log(data)
		} else {
			LCLDB_CUSTOMER = offlineDB;
			data = offlineDB;
		}

		DT_CUSTOMER = $('#customer-table').DataTable({
			destroy        : true,
			data           : LCLDB_CUSTOMER,
			autoWidth      : false,
			scrollX        : true,
			scrollY        : 350,
			scrollCollapse : true,
			paging         : false,
			dom            : 'rti',

			columns: [
				{ data : null, defaultContent : '', width : 5 },
				{ data: 'customerCode', title: 'Customer Code' },
				{ data: 'customerName', title: 'Name', defaultContent: '' },
				{ data: 'smtpAddr', title: 'Email' }
			],
			columnDefs: [
				{
					targets   : 1,
					className : 'dt-center',
					render    : (data, type, row) => `<b> ${data} </b>`
				},
				{
					targets   : 0,
					className : 'select-checkbox',
					orderable : false
				}
			],
			select: { style: 'multi' },
			rowCallback: (row, data, iDataIndex) => $(row).attr('id', data['id']),
			initComplete: (settings, json) => $(this).find('tbody tr').css('cursor', 'pointer')
		});

		$('#customer-table-filter').keyup(function(){
		    DT_USER.search($(this).val()).draw() ;
		});

		$('.loading-state').fadeOut('slow');
	}

	// load salesperson table
	function loadSalespersonTable() {

		let data;

		if (config.db == 'couchbase') {
			loadSalespersons_WithoutAccount({ salesRoleId }, (err, res) => {
				if (err || res.statusCode >= 300) { end = true; return }
				else if (res.statusCode <= 299) { LCLDB_SALESPERSON = res.result; data = LCLDB_SALESPERSON; }
			});
		} else if (config.db == 'local') {
			data = LCLDB_SALESPERSON;
			console.log(data)
		} else {
			LCLDB_SALESPERSON = offlineDB;
			data = offlineDB;
		}

		DT_SALESPERSON = $('#salesperson-table').DataTable({
			destroy        : true,
			data           : LCLDB_SALESPERSON,
			autoWidth      : false,
			scrollX        : true,
			scrollY        : 350,
			scrollCollapse : true,
			paging         : false,
			dom            : 'rti',

			columns: [
				{ data : null, defaultContent : '', width : 5 },
				{ data: 'customerCode', title: 'Salesperson Code' },
				{ data: 'customerName', title: 'Name', defaultContent: '' },
				{ data: 'smtpAddr', title: 'Email' }
			],
			columnDefs: [
				{
					targets   : 1,
					className : 'dt-center',
					render    : (data, type, row) => `<b> ${data} </b>`
				},
				{
					targets   : 0,
					className : 'select-checkbox',
					orderable : false

				}
			],
			select: { style: 'multi' },
			rowCallback: (row, data, iDataIndex) => $(row).attr('id', data['id']),
			initComplete: (settings, json) => $(this).find('tbody tr').css('cursor', 'pointer')
		});

		$('#salesperson-table-filter').keyup(function(){
		    DT_CUSTOMER.search($(this).val()).draw() ;
		});

		$('.loading-state').fadeOut('slow');
	}

	// delete customer on local array
	function deleteCustomerLocal(userId) {
		let index = LCLDB_CUSTOMER.findIndex(item => item.id == userId);
		LCLDB_CUSTOMER.splice(index, 1);
		console.log(userId)
	}

	// delete customer on local array
	function deleteSalespersonLocal(userId) {
		let index = LCLDB_SALESPERSON.findIndex(item => item.id == userId);
		LCLDB_SALESPERSON.splice(index, 1);
		console.log(userId)
	}

	$('#btn-help-multiple').attr('data-content', 
		`<a><h6 id="btn-invite-customers" data-toggle="modal" data-target="#modal-default" data-help="invitation" style="cursor: pointer;">How to send invite to customers</h6></a>
		<a><h6 id="btn-invite-salespersons" data-toggle="modal" data-target="#modal-default" data-help="invitation" style="cursor: pointer;">How to send invite to salesperson</h6></a></a>`
	);

	$(document).on("click", "#btn-invite-customers", function(event) {
		let helptype = $('#btn-invite-customers').attr('data-help');
		helpCarouselMultiple(helptype, 'customer')
    });

    $(document).on("click", "#btn-invite-salespersons", function(event) {
		let helptype = $('#btn-invite-salespersons').attr('data-help');
		helpCarouselMultiple(helptype, 'salesperson')
    });

	$('#check-invite-customer-btn').click(function(){
		inviteData = [], isValid = true;

		$('#send-invite-customerbtn').show();
		inviteData = DT_CUSTOMER.rows('.selected').data().toArray();

		for (let i in inviteData) {
			inviteData[i].isSent = null;
			if (!inviteData[i].smtpAddr) { // if customer dont have email
				isValid = false;
			}
		}

		if (inviteData.length != 0 && isValid) {
			$('span#invite-counter-customer').html(inviteData.length);

			DT_CHECK_INVITE_CUSTOMER = $('#invite-customer-table').DataTable({
				destroy      : true,
				data         : inviteData,
				searching    : false,
				paging       : false,
				lengthChange : false,
				info         : false,
				autoWidth    : false,

				columns: [
					{ data : 'customerCode', width: 100},
					{ data : 'customerName'},
					{ data : 'smtpAddr'},
					{ data : 'isSent', defaultContent : '', width: 10}
				],
				columnDefs: [
					{
						targets   : [0, 3],
						className : 'dt-center'
					},
					{
						targets   : 0,
						render    : (data, type, row) => `<b> ${data}</b>`
					},
					{
						targets   : 3,
						orderable : false
					}
				],
				rowCallback : (row, data, iDataIndex) => $(row).attr('id', data['id'])
			});

			$('#invite-customer-modal').modal();
		} else if (inviteData.length == 0) {
			resultNotify('fa-exclamation-circle', 'INVALID', 'Select a customer to be invited', 'warning');
		} else if (!isValid) {
			resultNotify('fa-exclamation-circle', 'INVALID', 'Customer withouth email cannot be invited', 'warning');
		}
	});

	$('#check-invite-salesperson-btn').click(function(){
		inviteData = [], isValid = true;

		$('#send-invite-btn').show();
		inviteData = DT_SALESPERSON.rows('.selected').data().toArray();

		for (let i in inviteData) {
			inviteData[i].isSent = null;
			if (!inviteData[i].smtpAddr) { // if salesperson dont have email
				isValid = false;
			}
		}

		if (inviteData.length != 0 && isValid) {
			$('span#invite-counter-salesperson').html(inviteData.length);

			DT_CHECK_INVITE_SALESPERSON = $('#invite-salesperson-table').DataTable({
				destroy      : true,
				data         : inviteData,
				searching    : false,
				paging       : false,
				lengthChange : false,
				info         : false,
				autoWidth    : false,

				columns: [
					{ data : 'customerCode', width: 100},
					{ data : 'customerName'},
					{ data : 'smtpAddr'},
					{ data : 'isSent', defaultContent : '', width: 10}
				],
				columnDefs: [
					{
						targets   : [0, 3],
						className : 'dt-center'
					},
					{
						targets   : 0,
						render    : (data, type, row) => `<b> ${data}</b>`
					},
					{
						targets   : 3,
						orderable : false
					}
				],
				rowCallback : (row, data, iDataIndex) => $(row).attr('id', data['id'])
			});

			$('#invite-salesperson-modal').modal();
		} else if (inviteData.length == 0) {
			resultNotify('fa-exclamation-circle', 'INVALID', 'Select a customer to be invited', 'warning');
		} else if (!isValid) {
			resultNotify('fa-exclamation-circle', 'INVALID', 'Customer withouth email cannot be invited', 'warning');
		}
	});

	$('#send-invite-customer-btn').click(function(){
		$('.loading-state').fadeIn('slow');
		disableButton('#send-invite-customer-btn');

		// $('#invite-customer-modal').modal('hide');
		setTimeout(function(){
			var data = DT_CHECK_INVITE_CUSTOMER.data().toArray();

			let customersArray = [];
			let doc, customers;

			for (let i in data) {
				doc = {
					customerCode : data[i].customerCode,
					customerId   : data[i].id,
					email        : data[i].smtpAddr,
				}
				customersArray.push(doc);

				customers = {
					customers: customersArray,
					customerRoleId
				}
			}

			createCustomerUser(customers, (err, res) => {
				$('#invite-customer-modal').modal('hide');
				setTimeout(() => { enableBtn($(this)); }, 1000);

				if (err || res.statusCode >= 300) {
					console.log(res);
					$('.loading-state').fadeOut('slow');
					resultNotify('fa fa-times', 'ERROR', 'Customers not invited.<br>Something went wrong. Please try again later', 'danger');
					return;
				}

				if (res.statusCode <= 299) {
					$('.loading-state').fadeOut('slow');
					resultNotify('fa-check-circle', 'SUCCESS', 'Customers successfully invited', 'success');
					for (let i in customers.customers) {
						config.db = 'local';
						deleteCustomerLocal(customers.customers[i].customerId);
					}
					setTimeout(function(){ loadCustomerTable(); }, 1000);
				}
			});

			/*for (let i in customers.customers) {
				config.db = 'local';
				deleteCustomerLocal(customers.customers[i].customerId);
			}
			setTimeout(function(){ loadCustomerTable(); }, 1000);*/
		}, 1000);
	});

	$('#send-invite-salesperson-btn').click(function(){
		$('.loading-state').fadeIn('slow');
		disableButton('#send-invite-salesperson-btn');

		setTimeout(function(){
			var data = DT_CHECK_INVITE_SALESPERSON.data().toArray();

			let salespersonArray = [];
			let doc, salespersons;

			for (let i in data) {
				doc = {
					customerCode : data[i].customerCode,
					customerId   : data[i].id,
					email        : data[i].smtpAddr,
				}
				salespersonArray.push(doc);

				salespersons = {
					salespersons: salespersonArray,
					salesRoleId
				}
			}

			console.log(salespersons)

			createSalespersonUser(salespersons, (err, res) => {
				$('#invite-salesperson-modal').modal('hide');
				setTimeout(() => { enableBtn($(this)); }, 1000);

				if (err || res.statusCode >= 300) {
					console.log(res);
					$('.loading-state').fadeOut('slow');
					resultNotify('fa fa-times', 'ERROR', 'Customers not invited.<br>Something went wrong. Please try again later', 'danger');
					return;
				}

				if (res.statusCode <= 299) {
					$('.loading-state').fadeOut('slow');
					resultNotify('fa-check-circle', 'SUCCESS', 'Customers successfully invited', 'success');
					for (let i in salespersons.salespersons) {
						config.db = 'local';
						deleteSalespersonLocal(salespersons.salespersons[i].customerId);
					}
					setTimeout(function(){ loadSalespersonTable(); }, 1000);
				}
			});

			/*for (let i in salespersons.salespersons) {
				config.db = 'local';
				deleteSalespersonLocal(salespersons.salespersons[i].customerId);
			}
			setTimeout(function(){ loadSalespersonTable(); }, 1000);*/
		}, 1000);
	});


	// tabs navigate
	$('.nav-tabs > li a[data-toggle="tab"]').click(function() {
		const action = $(this).attr('data-action');
		switch(action) {
			case 'customer':
				$('.loading-state:eq(0)').fadeIn('slow');
				setTimeout(() => { loadCustomerTable(); }, 1000);
			break;
			case 'salesperson':
				$('.loading-state:eq(1)').fadeIn('slow');
				setTimeout(() => { loadSalespersonTable(); }, 1000);
			break;
		}
	});

});