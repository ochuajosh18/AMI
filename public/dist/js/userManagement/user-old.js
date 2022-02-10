checkSession();
setUserData();

$(document).ready(function() {
	var LCLDB_ROLE, LCLDB_USER, LCLDB_CUSTOMER_USER, LCLDB_CUSTOMER,
	DT_CUSTOMER_USER, DT_USER, DT_SALESPERSON_CUSTOMERS,
	datatable_AllSalespersonCustomers, datatable_CurrentSalespersonCustomers,

	EMAIL_TEMPLATE_CUSTOMER_INVITE = loadCustomerInvitation_EmailTemplate(),
	EMAIL_TEMPLATE_SALESPERSON_INVITE = loadSalespersonInvitation_EmailTemplate(),

	customerRoleId = JSON.parse(localStorage.getItem("otherData")).ROLE_CUSTOMER,
	salespersonRoleId = JSON.parse(localStorage.getItem("otherData")).ROLE_SALESPERSON;

	loadRole();
	loadCustomer();
	// loadUserTable();
	loadCustomerUserTable();
	// loadSalespersonTable();

	function loadUserTable() {
		loadUser_NotCustomer_NotSaleperson(customerRoleId, salespersonRoleId, function(err, res){
			LCLDB_USER = res;
		});


		DT_USER = $('#user-table').DataTable({
			destroy   : true,
			data      : LCLDB_USER,
			autoWidth : false,
			// scrollY        : '350px',
			// scrollCollapse : true,
			lengthMenu     : [[10, 25, 50, -1], [10, 25, 50, "All"]],
			pageLength     : 25,

			columns :
			[
			{'data': 'lastName', 'defaultContent': 'none'},
			{'data': 'middleName', 'defaultContent': 'none'},
			{'data': 'firstName', 'defaultContent': 'none'},
			{'data': 'email', 'defaultContent': 'none'},
			{'data': 'role', 'defaultContent': 'none'},
			{'data': 'supervisorName', 'defaultContent': 'none'},
			{'data': 'department', 'defaultContent': 'none'},
			{'data': 'action', 'defaultContent': 'none', 'orderable': false}
			],

			rowCallback : function (row, data, iDataIndex) {
				$(row).attr('id', data['id']);
				editItem($(row).find('a.edit-trigger'), data);
				deleteItem($(row).find('a.delete-trigger'), data['id']);
			}
		});

		$('.loading-state').fadeOut('slow');
	}


	function loadCustomerUserTable() {
		let data;

		loadUser_ByRole(customerRoleId, 'CUSTOMER', function(err, res){
			try {
				if (res instanceof Array) {
					data = res;
				} else {
					throw 'Unable to get customer user account list';
				}
			} catch (err) {
				alert('Something went wrong\n' + err);
				console.log(err);
			}
		});

		if (data) {
			DT_CUSTOMER_USER = $('#customer-user-table').DataTable({
				destroy   : true,
				data      : data,
				autoWidth : false,

				columns:
				[
					{data : 'customerCode', width : 100},
					{data : 'customerName'},
					{data : 'firstName', width : 150},
					{data : 'email', defaultContent : '<b class="text-red">none</b>'},
					{data : 'status', width : 70},
					{data : null, width : 50}
				],

				columnDefs:
				[
					{ // customerCode, status
						className : 'dt-center',
						targets   : [0, 4, 5]
					},
					{ // customerCode
						render    : function (data, type, row) { return '<b>'+data+'</b>'; },
						targets   : 0
					},
					{ // firstName
						render    : function (data, type, row) { return data + ' ' + row.lastName; },
						targets   : 2
					},
					{ // status
						render    : function (data, type, row) {
							if (data == 'active') {
								return '<b class="text-green">'+data+'</b>';
							} else {
								return '<b class="text-red">not active</b>';
							}
						},
						targets   : 4
					},
					{ // action
						render    : function (data, type, row) {
							let btn = '';
							if (row.status != 'active') {
								btn += '<button class="btn btn-primary btn-xs resend-invite-btn" data-user-type="customer" data-toggle="tooltip" data-placement="left" title="Resend invite"><i class="fa fa-envelope" aria-hidden="true"></i></button>';
							}
							return btn;
						},
						orderable : false,
						targets   : 5
					}
				],

				rowCallback : function (row, data, iDataIndex) {
					$(row).attr('id', data['id']);
					resendInvite($(row).find('button.resend-invite-btn'), data); // resend button event
				}
			});
		}

		$('.loading-state').fadeOut('slow');
	}


	function loadSalespersonTable() {
		let data;

		loadUser_ByRole(salespersonRoleId, 'SALESPERSON', function(err, res){
			try {
				if (res instanceof Array) {
					data = res;
				} else {
					throw 'Unable to get salesperson user account list';
				}
			} catch (err) {
				alert('Something went wrong\n' + err);
				console.log(err);
			}
		});

		if (data) {
			DT_CUSTOMER_USER = $('#salesperson-table').DataTable({
				destroy   : true,
				data      : data,
				autoWidth : false,

				columns:
				[
					{data : 'customerCode', width : 100},
					{data : 'firstName', width : 150},
					{data : 'email', defaultContent : '<b class="text-red">none</b>'},
					{data : 'status', width : 70},
					{data : null, width : 70}
				],

				columnDefs:
				[
					{
						className : 'dt-center',
						targets   : [0, 3, 4]
					},
					{ // customerCode
						render    : function (data, type, row) { return '<b>'+data+'</b>'; },
						targets   : 0
					},
					{ // firstName
						render  : function (data, type, row) { return data + ' ' + row.lastName; },
						targets : 1
					},
					{ // status
						render    : function (data, type, row) {
							if (data == 'active') {
								return '<b class="text-green">'+data+'</b>';
							} else {
								return '<b class="text-red">not active</b>';
							}
						},
						targets   : 3
					},
					{ // action
						render    : function (data, type, row) {
							let btn = '<div class="btn-group">'
								btn += '<button class="btn btn-primary btn-xs salesperson-customers-modal" data-toggle="tooltip" data-placement="left" data-toggle="tooltip" title="Salesperson\'s customers"><i class="fa fa-users" aria-hidden="true"></i></button>';
							if (row.status != 'active') {
								btn += '<button class="btn btn-primary btn-xs resend-invite-btn" data-user-type="salesperson" data-toggle="tooltip" data-placement="left" data-toggle="tooltip" title="Resend invite"><i class="fa fa-envelope" aria-hidden="true"></i></button>';
							}
							btn += '</div>';

							return btn;
						},
						orderable : false,
						targets   : 4
					}
				],

				rowCallback : function (row, data, iDataIndex) {
					$(row).attr('id', data['id']);
					resendInvite($(row).find('button.resend-invite-btn'), data); // resend button event
					$(row).find('.salesperson-customers-modal').click(function(){
						loadSalespersonCustomers(data);
						$('#map-customer-btn').attr('data-referenceId', data['id'].replace('USER::',''));
					});
				}
			});
		}

		$('.loading-state').fadeOut('slow');
	}


	function resendInvite(resendBtn, data) {
		resendBtn.off('click');
		resendBtn.click(function(){
			$('[data-toggle="tooltip"]').tooltip('hide');
			$('.loading-state').fadeIn('slow');
			let userType = resendBtn.attr('data-user-type');

			setTimeout(function() {
				if (userType == 'customer') {
					let password = data.id;
						password = 'BST' + password.replace('USER::','').substring(0,5);

					let doc = {
						email         : data.email,
						password      : password,
						emailTemplate : EMAIL_TEMPLATE_CUSTOMER_INVITE
					}

					sendCustomerInvite(doc, function(err, res){ // resend invite
						console.log('\n----- send email');
						console.log(res);

						$('.loading-state').fadeOut('slow');

						if (res.hasOwnProperty('message')) {
							resultNotify('fa-check-circle', 'SUCCESS', 'Customer invitation sent', 'success');
						} else {
							resultNotify('fa-times-circle', 'ERROR', 'Something went wrong. Customer invitation not sent.<br>Please try again later', 'danger');
						}
					});
				} else if (userType == 'salesperson') {
					let password = data.id;
						password = 'BST' + password.replace('USER::','').substring(0,5);

					let doc = {
						email         : data.email,
						password      : password,
						emailTemplate : EMAIL_TEMPLATE_SALESPERSON_INVITE
					}

					sendSalespersonInvite(doc, function(err, res){ // resend invite
						console.log('\n----- send email');
						console.log(res);

						$('.loading-state').fadeOut('slow');

						if (res.hasOwnProperty('message')) {
							resultNotify('fa-check-circle', 'SUCCESS', 'Salesperson invitation sent', 'success');
						} else {
							resultNotify('fa-times-circle', 'ERROR', 'Something went wrong. Salesperson invitation not sent.<br>Please try again later', 'danger');
						}
					});
				}
			}, 1000);
		});
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



	function loadSalespersonCustomers(data) {
		$('[data-toggle="tooltip"]').tooltip('hide');
		$('.loading-salesperson-customers-table').fadeIn();
		$('#salesperson-customers-modal').modal();

		setTimeout(function(){
			var customerCodes, customers = [];

			loadById(data.id, function(err, res) {
				customerCodes = res.body.customers;
			});

			for (var i in customerCodes) {
				customers.push(customArrayFilter(LCLDB_CUSTOMER, 'customerCode', customerCodes[i])[0]);
			}

			DT_SALESPERSON_CUSTOMERS = $('#salesperson-customers-table').DataTable({
				destroy      : true,
				data         : customers,
				searching    : false,
				paging       : false,
				lengthChange : false,
				info         : false,
				autoWidth    : false,
				scrollY      : '350px',
				scrollCollapse : true,

				columns:
				[
				{'data': 'customerCode', 'defaultContent': 'none', 'width' : '40%'},
				{'data': 'name1', 'defaultContent': 'none', 'width' : '60%'},
				],

				columnDefs:
				[
				{
					className : 'dt-center',
					targets   : [0]
				}
				],

				rowCallback : function (row, data, iDataIndex) {
					$(row).attr('id', data['id']);
				}
			});

			$('.loading-salesperson-customers-table').fadeOut();
		}, 500);
	}



	function loadTable_CurrentSalespersonCustomers(data) {
		datatable_CurrentSalespersonCustomers =$('#current-salesperson-customers-table').DataTable({
			destroy      : true,
			data         : data,
			searching    : false,
			paging       : false,
			lengthChange : false,
			info         : false,
			autoWidth    : false,
			scrollY      : '350px',
			scrollCollapse : true,

			columns:
			[
			{'data': 'customerCode', 'defaultContent': 'none', 'width' : '40%'},
			{'data': 'name1', 'defaultContent': 'none', 'width' : '50%'},
			{'data': null, 'orderable': false, 'width': '10%', render: function (data, type, row) { return '<button class="btn btn-danger btn-xs remove-customer-map"><i class="fa fa-close" aria-hidden="true"></i></button>'; }}
			],

			columnDefs:
			[
			{
				className : 'dt-center',
				targets   : [0, 2]
			}
			],

			rowCallback : function (row, data, iDataIndex) {
				$(row).attr('data-id', data['id']);
				$(row).find('.remove-customer-map').click(function(){
					datatable_CurrentSalespersonCustomers.row('tr[data-id="' + data.id + '"]').remove().draw();
					setSelectedRows_AllSalespersonCustomers();
				});
			}
		});
	}


	function loadTable_AllSalespersonCustomers(data) {
		datatable_AllSalespersonCustomers = $('#all-salesperson-customers-table').DataTable({
			destroy      : true,
			data         : data,
			order        : [ 1, "asc" ],
			searching    : false,
			paging       : false,
			lengthChange : false,
			info         : false,
			autoWidth    : false,
			scrollY      : '350px',
			scrollCollapse : true,

			columns:
			[
			{'data': null, 'defaultContent': '', 'width' : '10%', 'orderable': false},
			{'data': 'customerCode', 'defaultContent': 'none', 'width' : '40%'},
			{'data': 'name1', 'defaultContent': 'none', 'width' : '50%'},
			],

			columnDefs:
			[
			{
				className : 'select-checkbox',
				targets   : [0]
			},
			{
				className : 'dt-center',
				targets   : [1]
			}
			],
			select : { 'style' : 'multi' },

			rowCallback : function (row, data, iDataIndex) {
				$(row).attr('data-id', data['id']);
			}
		});
	}


	function setSelectedRows_AllSalespersonCustomers() {
		var selectRows = [];

		datatable_CurrentSalespersonCustomers.rows().every(function(){
			var data = this.data();
			selectRows.push('tr[data-id="' + data.id + '"]');
		});

		datatable_AllSalespersonCustomers.rows().deselect();
		datatable_AllSalespersonCustomers.rows(selectRows).select();
	}



	$('#map-customer-modal-btn').click(function(){
		$('#salesperson-customers-modal').modal('hide');
		$('.loading-current-salesperson-customers-table, .loading-all-salesperson-customers-table').fadeIn();

		setTimeout(function(){
			loadTable_CurrentSalespersonCustomers(DT_SALESPERSON_CUSTOMERS.rows().data());
			loadTable_AllSalespersonCustomers(LCLDB_CUSTOMER);

			// set selected rows from CURRENT to ALL
			setSelectedRows_AllSalespersonCustomers();

			// reflect table from ALL to CURRENT
			$('#all-salesperson-customers-table tbody').on('click', 'tr', function () {
				var data = datatable_AllSalespersonCustomers.row( this ).data();

				setTimeout(function() {
					loadTable_CurrentSalespersonCustomers(datatable_AllSalespersonCustomers.rows('.selected').data());
				}, 500);
			});

			$('.loading-current-salesperson-customers-table, .loading-all-salesperson-customers-table').fadeOut();
		}, 1000);

		setTimeout(function(){
			$('#edit-salesperson-customers-modal').modal()
		}, 500);
	});



	$('#map-customer-btn').click(function(){
		var customers = datatable_CurrentSalespersonCustomers.column(0).data().toArray(),
		referenceId = $(this).attr('data-referenceId');
		doc = { 'customers' : customers };

		console.log(referenceId)
		$('.loading-state').fadeIn('slow');

		/*updateSalesperson_CustomerMap(doc, referenceId, function(err, res){
			$('#edit-salesperson-customers-modal').modal('hide');

			if (res.statusCode <= 299) {
				resultNotify('fa-check-circle', 'SUCCESS', 'Customers successfully assigned to salesperson', 'success');
				setTimeout(function(){ loadSalespersonTable() }, 2000);
			}

			else {
				console.log(res);
				resultNotify('fa fa-times', 'ERROR', 'Customers not assigned.<br>Something went wrong. Please try again later', 'danger');
			}
		});*/
	});




	function loadRole() {
		var data = [];

		loadAll('AMI2_ROLE', 'all', function(err, res) {
			if (res.statusCode <= 299) {
				for (var i = 0; i < res.body.total_rows; i++) {
					data.push(res.body.rows[i].value);
					data[i].id = res.body.rows[i].id;
				}
			} else {
				console.log(res);
			}
		});

		LCLDB_ROLE = data;
		customerRoleId = customArrayFilter(LCLDB_ROLE, 'role', 'CUSTOMER')[0].id;
	}



	function loadCustomer() {
		var data = [];

		loadCustomer_ByPartnerType('AMI2_CUSTOMER', 'byPartnerType', 'blank',function(err, res) {
			if (res.statusCode <= 299) {
				for (var i = 0; i < res.body.total_rows; i++) {
					data.push(res.body.rows[i].value);
					data[i].id = res.body.rows[i].id;
				}
			} else {
				console.log(res);
			}
		});

		LCLDB_CUSTOMER = data;
	}

	function editItem(element , data) {
		element.off('click');
		element.click(function(){
			refreshModal('#edit-user-modal');

				// dropdown bind
				var role = reverse_customArrayFilter(LCLDB_ROLE, 'role', 'CUSTOMER');
				role = reverse_customArrayFilter(role, 'role', 'SALESPERSON');
				$('#edit-user-form select[name=roleId]').html(createRoleDropdown(role));
				$('#edit-user-form select[name=roleId]').off('change');
				$('#edit-user-form select[name=roleId]').change(function(){
					$('#edit-user-form select[name=supervisor]').attr('disabled', ($(this).val() == salespersonRoleId) ? false : true);
					$('#edit-user-form select[name=supervisor]').val(($(this).val() == salespersonRoleId) ? 'blank' : 'N/A');
				});

				// dropdown bind
				var customerRoleId = customArrayFilter(LCLDB_ROLE, 'role', 'CUSTOMER')[0].id;
				var user = reverse_customArrayFilter(LCLDB_USER, 'roleId', customerRoleId);
				user = reverse_customArrayFilter(user, 'id', data.id);
				$('#edit-user-form select[name=supervisor]').html(createSupervisorDropdown(user));
				$('#edit-user-form select[name=supervisor]').attr('disabled', (data.roleId == salespersonRoleId) ? false : true);

				$('#edit-user-form input[name=id]').val(data.id);
				$('#edit-user-form input[name=firstName]').val(data.firstName);
				$('#edit-user-form input[name=middleName]').val(data.middleName);
				$('#edit-user-form input[name=lastName]').val(data.lastName);
				$('#edit-user-form input[name=email]').val(data.email);
				$('#edit-user-form select[name=roleId]').val(data.roleId);
				$('#edit-user-form select[name=supervisor]').val((data.roleId == salespersonRoleId) ? data.supervisor : 'N/A');
				$('#edit-user-form input[name=department]').val(data.department);

				$('#edit-user-modal').modal();
			});
	}



	function deleteItem(element, id) {
		element.off('click');
		element.click(function(){
			$('#delete-user-modal').modal();
			$('#delete-user-form input[name=id]').val(id);
		});
	}



	function createRoleDropdown(data) {
		var code = '<option value="blank">-- SELECT ROLES --</option>';

		for (var i in data) {
			code += '<option value="'+data[i].id+'">'+data[i].role+'</option>';
		}

		return code;
	}



	function createSupervisorDropdown(data) {
		var code = '<option value="blank">-- SELECT ROLES --</option>';

		for (var i in data) {
			code += '<option value="'+data[i].id+'">'+ data[i].firstName + ' ' + data[i].lastName +'</option>';
		}

		code += '<option value="N/A">N/A</option>';

		return code;
	}



	function defaultValidation(id) {
		var error;
		var isValid = true;


		$(id+' input').each(function() {
				// null value
				if ($(this).val().trim() == '') {
					isValid = false;
					error = $(this).parent().parent().find('label').text()+' is required';
					$(this).parent().parent().addClass('has-error');
					$(this).parent().find('span').html(error).fadeIn('slow');
				} else {
					$(this).parent().parent().removeClass('has-error');
					$(this).parent().find('span').fadeOut('slow');
				}
			});

		$(id+' select').each(function() {
				// null value
				if ($(this).val() == 'blank') {
					isValid = false;
					error = $(this).parent().parent().find('label').text()+' is required';
					$(this).parent().parent().addClass('has-error');
					$(this).parent().find('span').html(error).fadeIn('slow');
				} else {
					$(this).parent().parent().removeClass('has-error');
					$(this).parent().find('span').fadeOut('slow');
				}
			});

		return isValid;
	}



	function refreshModal(id) {
		$(id+' .form-group').each(function() {
			$(this).removeClass('has-error');
			$(this).find('input').val('');
			$(this).find('span').hide();
		});
	}



	$('#open-add-user-modal').click(function(){
		refreshModal('#add-user-modal');

		// dropdown bind
		var role = reverse_customArrayFilter(LCLDB_ROLE, 'role', 'CUSTOMER');
		role = reverse_customArrayFilter(role, 'role', 'SALESPERSON');
		$('#add-user-form select[name=roleId]').html(createRoleDropdown(role));
		$('#add-user-form select[name=roleId]').off('change');
		$('#add-user-form select[name=roleId]').change(function(){
			$('#add-user-form select[name=supervisor]').attr('disabled', ($(this).val() == salespersonRoleId) ? false : true);
			$('#add-user-form select[name=supervisor]').val(($(this).val() == salespersonRoleId) ? 'blank' : 'N/A');
		});

		// dropdown bind
		var customerRoleId = customArrayFilter(LCLDB_ROLE, 'role', 'CUSTOMER')[0].id;
		var user = reverse_customArrayFilter(LCLDB_USER, 'roleId', customerRoleId);
		$('#add-user-form select[name=supervisor]').html(createSupervisorDropdown(user));
		$('#add-user-form select[name=supervisor]').val('N/A').attr('disabled', true);


		$('#add-user-modal').modal();
	});



	$('#add-user-btn').click(function(){
		var isValid = defaultValidation('#add-user-modal'), doc;

		if (isValid) {
			$('.loading-state').fadeIn('slow');
			$('#add-user-form select[name=supervisor]').attr('disabled', false);


			var doc = $('#add-user-form').serializeObject();
			doc.lastName = doc.lastName.toUpperCase().trim(),
			doc.middleName = doc.middleName.toUpperCase().trim(),
			doc.firstName = doc.firstName.toUpperCase().trim(),
			doc.department = doc.department.toUpperCase().trim(),
			doc.isActive = 'true',
			doc.docType = 'USER',
			doc.channels = ['USER', 'NON::CUSTOMER::USER'];


			createUser(doc, function(err, res){
				$('#add-user-modal').modal('hide');
				console.log(res);

				if (res.statusCode <= 299) {
					resultNotify('fa-check-circle', 'SUCCESS', 'User successfully created', 'success');
					setTimeout(function(){ loadIntervalFinish(loadUserTable); }, 2000);
				}

				else {
					console.log(res);
					resultNotify('fa fa-times', 'ERROR', 'User not created.<br>Something went wrong. Please try again later', 'danger');
				}
			});
		}
	});



	$('#edit-user-btn').click(function() {
		var isValid = defaultValidation('#edit-user-modal');

		if (isValid) {
			$('.loading-state').fadeIn('slow');
			$('#edit-user-form select[name=supervisor]').attr('disabled', false);


			var doc = $('#edit-user-form').serializeObject();
			doc.lastName = doc.lastName.toUpperCase().trim(),
			doc.middleName = doc.middleName.toUpperCase().trim(),
			doc.firstName = doc.firstName.toUpperCase().trim(),
			doc.department = doc.department.toUpperCase().trim();


			updateDocument(doc.id, doc, function(err, res){
				$('#edit-user-modal').modal('hide');

				if (res.statusCode <= 299) {
					resultNotify('fa-check-circle', 'SUCCESS', 'User successfully updated', 'success');
					setTimeout(function(){ loadIntervalFinish(loadUserTable); }, 2000);
				}

				else {
					console.log(res);
					resultNotify('fa fa-times', 'ERROR', 'User not created.<br>Something went wrong. Please try again later', 'danger');
				}
			});
		}
	});



	$('#delete-user-btn').click(function(){
		var doc = $('#delete-user-form').serializeObject();
		$('.loading-state').fadeIn('slow');


		deleteChannel(doc.id, function(err, res){
			$('#delete-user-modal').modal('hide');

			if (res.statusCode <= 299) {
				resultNotify('fa-check-circle', 'SUCCESS', 'User successfully deleted', 'success');
				setTimeout(function(){ loadIntervalFinish(loadUserTable); }, 2000);
			}

			else {
				console.log(res);
				resultNotify('fa fa-times', 'ERROR', 'User not created.<br>Something went wrong. Please try again later', 'danger');
			}
		});
	});



	$('ul.accountTypeTab li').click(function(){
		var accountType = $(this).attr('data-account-type')

		if (accountType == 'user') {
			$('.loading-state').fadeIn('slow');
			$('#open-add-user-modal').show();
			setTimeout(function(){ loadUserTable() }, 1000);
		}

		else if (accountType == 'customer') {
			$('.loading-state').fadeIn('slow');
			$('#open-add-user-modal').hide();
			setTimeout(function(){ loadCustomerUserTable() }, 1000);
		}

		else if (accountType == 'salesperson') {
			$('.loading-state').fadeIn('slow');
			$('#open-add-user-modal').hide('hide');
			setTimeout(function(){ loadSalespersonTable() }, 1000);
		}
	});
});