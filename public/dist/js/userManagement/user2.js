checkSession();
setUserData();

$(document).ready(function() {
	let LCLDB_USER, DT_USER, LCLDB_CUSTOMER, DT_CUSTOMER, LCLDB_SALESPERSON, DT_SALESPERSON, 
	LCLDB_ROLES, DT_SALESPERSON_CUSTOMERS, LCLDB_MAINCUSTOMERS, DT_CURRENTSALESPERSON_CUSTOMERS, DT_ALLSALESPERSON_CUSTOMERS;
	const salesRoleId = JSON.parse(localStorage.getItem('otherData')).ROLE_SALESPERSON;
	const customerRoleId = JSON.parse(localStorage.getItem('otherData')).ROLE_CUSTOMER;

	const config = {
	    // db : 'offline'
	    db : 'couchbase'
	};


	loadUserTable();

	loadRoles((err, res) => {
		LCLDB_ROLES = res.result;
	});

	loadMainCustomers((err, res) => {
		LCLDB_MAINCUSTOMERS = res.result;
	});

	// load user table
	function loadUserTable() {

		let data;

		if (config.db == 'couchbase') {
			loadOtherUser({ salesRoleId, customerRoleId }, (err, res) => {
				if (err || res.statusCode >= 300) { end = true; return };

				if (res.statusCode <= 299) { LCLDB_USER = res.result; data = res.result; }
			});
		} else if (config.db == 'local') {
			data = LCLDB_USER;
			console.log(data)
		} else {
			LCLDB_USER = offlineDB;
			data = offlineDB;
		}

		DT_USER = $('#user-table').DataTable({
			destroy        : true,
			data           : LCLDB_USER,
			autoWidth      : false,
			scrollX        : true,
			scrollY        : 350,
			scrollCollapse : true,
			paging		   : false,
			dom            : 'rti',

			columns: [
				{ data: 'lastName', title: 'Last Name' },
				{ data: 'firstName', title: 'First Name', defaultContent: '' },
				{ data: 'email', title: 'Email' },
				{ data: 'role', title: 'Role' },
				{ data: 'department', title: 'Department' },
				{ data: null, title: 'Action' },
			],
			columnDefs: [
				{
					targets: 5, className: 'dt-center',
					render: (data, type, row) => 
						`<div class="btn-group" role="group" aria-label="action">
							<button type="button" class="btn btn-primary btn-xs edit-trigger" data-toggle="tooltip" title="Edit Customer" data-placement="left"><i class="fa fa-pencil-square-o"></i></button>
							<button type="button" class="btn btn-danger btn-xs delete-trigger" data-toggle="tooltip" title="Delete Customer" data-placement="left"><i class="fa fa-trash"></i></button>
						</div>`
				}
			],
			rowCallback: (row, data, iDataIndex) => {
				editItemUser($(row).find('button.edit-trigger'), data);
				deleteItemUser($(row).find('button.delete-trigger'), data['id']);
				$(row).attr('id', data.id);
			}
		});

		$('#user-table-filter').keyup(function(){
		    DT_USER.search($(this).val()).draw() ;
		});

		$('.loading-state').fadeOut('slow');
	}

	// load customer table
	function loadCustomerTable() {

		let data;

		if (config.db == 'couchbase') {
			loadCustomerUser({ customerRoleId }, (err, res) => {
				if (err || res.statusCode >= 300) { end = true; return };

				if (res.statusCode <= 299) { LCLDB_CUSTOMER = res.result; data = res.result; }
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
			paging		   : false,
			dom            : 'rti',

			columns: [
				{ data: 'customerCode', title: 'Customer Code', defaultContent: '' },
				{ data: 'customerName', title: 'Customer Name' },
				{ data: 'accountName', title: 'Wos Account Name', defaultContent: '' },
				{ data: 'email', title: 'Email', defaultContent: '' },
				{ data: 'distributionChannel', title: 'Distribution Channel', defaultContent: '' },
				{ data: 'status', title: 'Status', defaultContent: '' },
				{ data: null, title: 'Action', defaultContent: '' }
			],
			columnDefs: [
				{
					targets: 0, className: 'dt-center', 
					render: (data, type, row) => `<b>${data}</b>` 
				},
				{
					targets: 4, className: 'dt-center'
				},
				{
					targets: 5, className: 'dt-center',
					render: (data, type, row) => (data == 'active') ? `<b class="text-green"> ${data} </b>` : `<b class="text-red"> not active </b>` 
				},
				{
					targets: 6, className: 'dt-center',
					render: (data, type, row) => {
						let resendInviteBtn = `<button class="btn btn-primary btn-xs resend-invite-btn" data-user-type="customer" data-toggle="tooltip" data-placement="left" title="Resend invite"><i class="fa fa-envelope" aria-hidden="true"></i></button>`
						return `<div class="btn-group" role="group" aria-label="action">
									<button type="button" class="btn btn-primary btn-xs edit-trigger" data-toggle="tooltip" title="Edit Distribution Channel" data-placement="left"><i class="fa fa-pencil-square-o"></i></button>
									${(row.status != 'active') ? resendInviteBtn : '' }
								</div>`;
					}
				}
			],
			rowCallback: (row, data, iDataIndex) => {
				$(row).attr('id', data['id']);
				editDistributionChannel($(row).find('button.edit-trigger'), data);
				resendInviteBtn($(row).find('button.resend-invite-btn'), data); // resend button event
			}
		});

		$('#customer-table-filter').keyup(function(){
		    DT_CUSTOMER.search($(this).val()).draw() ;
		});

		$('.loading-state').fadeOut('slow');
	}

	// load salesperson table
	function loadSalespersonTable() {

		let data;

		if (config.db == 'couchbase') {
			loadSalespersonUser({ salesRoleId }, (err, res) => {
				if (err || res.statusCode >= 300) { end = true; return };

				if (res.statusCode <= 299) { LCLDB_SALESPERSON = res.result; data = res.result; }
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
			paging		   : false,
			dom            : 'rti',

			columns: [
				{ data: 'customerCode', title: 'Salesperson code' },
				{ data: 'accountName', title: 'Salesperson name', defaultContent: '' },
				{ data: 'email', title: 'Email', defaultContent: '' },
				{ data: 'status', title: 'Status', defaultContent: '' },
				{ data: 'action', title: 'Action', defaultContent: '' }
			],
			columnDefs: [
				{
					targets: 0, className: 'dt-center', 
					render: (data, type, row) => `<b>${data}</b>` 
				},
				{
					targets: 3, className: 'dt-center',
					render: (data, type, row) => (data == 'active') ? `<b class="text-green"> ${data} </b>` : `<b class="text-red"> not active </b>` 
				},
				{
					targets   : 4, 
					render: (data, type, row) => {
						let resendinviteBtn = `<button class="btn btn-primary btn-xs resend-invite-btn" data-user-type="salesperson" data-toggle="tooltip" data-placement="left" data-toggle="tooltip" title="Resend invite"><i class="fa fa-envelope" aria-hidden="true"></i></button>`
						let btn = `<div class="btn-group">
							<button class="btn btn-primary btn-xs salesperson-customers-modal" data-toggle="tooltip" data-placement="left" data-toggle="tooltip" title="Salesperson\'s customers"><i class="fa fa-users" aria-hidden="true"></i></button>
							${(row.status != 'active') ? resendinviteBtn : ''}
							</div>`;
						return btn;
					},
				}
			],
			rowCallback : function (row, data, iDataIndex) {
				$(row).attr('id', data['id']);
				resendInviteBtn($(row).find('button.resend-invite-btn'), data); // resend button event
				$(row).find('.salesperson-customers-modal').click(function(){
					loadSalespersonCustomers(data);
					$('#map-customer-btn').attr('data-referenceId', data['id']);
				});
			}
		});

		$('#salesperon-table-filter').keyup(function(){
		    DT_SALESPERSON.search($(this).val()).draw() ;
		});

		$('.loading-state').fadeOut('slow');
	}

	function loadSalespersonCustomers(customer) {
		$('[data-toggle="tooltip"]').tooltip('hide');
		$('.loading-salesperson-customers-table').fadeIn();
		$('#salesperson-customers-modal').modal();

		setTimeout(function(){

			let customers = customer.customers.map(item => {
				return {
					customerCode: item
				}
			});

			DT_SALESPERSON_CUSTOMERS = $('#salesperson-customers-table').DataTable({
				destroy        : true,
				data           : customers,
				searching      : false,
				paging         : false,
				lengthChange   : false,
				info           : false,
				autoWidth      : false,
				scrollY        : '350px',
				scrollCollapse : true,

				columns: [
					{ data: 'customerCode', 'defaultContent': 'none', 'width' : '40%'},
					{ data: null, 'defaultContent': 'none', 'width' : '60%'},
				],
				columnDefs: [
					{ targets: 0, className : 'dt-center' },
					{ targets: 1, 
						render: (data, type, row) => {
							let custName = LCLDB_MAINCUSTOMERS.find(item => item.customerCode == row.customerCode);
							row.id = custName.id
							return custName ? custName.customerName : '---';
						}
					}
				]
			});

			$('.loading-salesperson-customers-table').fadeOut();
		}, 500);
	}

	function loadTable_CurrentSalespersonCustomers(data) {
		DT_CURRENTSALESPERSON_CUSTOMERS =$('#current-salesperson-customers-table').DataTable({
			destroy        : true,
			data           : data,
			searching      : false,
			paging         : false,
			lengthChange   : false,
			info           : false,
			autoWidth      : false,
			scrollY        : '350px',
			scrollCollapse : true,

			columns: [
				{ data: 'customerCode', 'defaultContent': 'none', 'width' : '40%'},
				{ data: 'custName', 'defaultContent': 'none', 'width' : '50%'},
				{ data: null, 'orderable': false, 'width': '10%', render: (data, type, row) => `<button class="btn btn-danger btn-xs remove-customer-map"><i class="fa fa-close" aria-hidden="true"></i></button>` }
			],
			columnDefs: [
				{
					targets   : [0, 2],
					className : 'dt-center'
				},
				{ targets: 1, 
					render: (data, type, row) => {
						let custName = LCLDB_MAINCUSTOMERS.find(item => item.customerCode == row.customerCode);
						return custName ? custName.customerName : '---';;
					}
				}
			],

			rowCallback : (row, data, iDataIndex) => {
				$(row).attr('data-id', data['id']);
				$(row).find('.remove-customer-map').click(function(){
					console.log(data['id'])
					DT_CURRENTSALESPERSON_CUSTOMERS.row('tr[data-id="' + data.id + '"]').remove().draw();
					setSelectedRows_AllSalespersonCustomers();
				});
			}
		});
	}

	function loadTable_AllSalespersonCustomers(data) {
		DT_ALLSALESPERSON_CUSTOMERS = $('#all-salesperson-customers-table').DataTable({
			destroy        : true,
			data           : data,
			order          : [ 1, "asc" ],
			searching      : false,
			paging         : false,
			lengthChange   : false,
			info           : false,
			autoWidth      : false,
			scrollY        : '350px',
			scrollCollapse : true,

			columns: [
				{ data: null, 'defaultContent': '', 'width' : '10%', 'orderable': false},
				{ data: 'customerCode', 'defaultContent': 'none', 'width' : '40%'},
				{ data: 'name1', 'defaultContent': 'none', 'width' : '50%'},
			],
			columnDefs: [
				{
					targets   : 0,
					className : 'select-checkbox'
				},
				{ 	targets: 2,
					render: (data, type, row) => {
						let custName = LCLDB_MAINCUSTOMERS.find(item => item.customerCode == row.customerCode);
						return custName ? custName.customerName : '---';;
					}
				}
			],
			select : { 'style' : 'multi' },

			rowCallback : (row, data, iDataIndex) => {
				$(row).attr('data-id', data['id']);
			}
		});
	}

	function setSelectedRows_AllSalespersonCustomers() {
		var selectRows = [];

		DT_CURRENTSALESPERSON_CUSTOMERS.rows().every(function(){
			var data = this.data();

			let cust = LCLDB_MAINCUSTOMERS.find(item => item.customerCode == data.customerCode);
			console.log(cust)

			selectRows.push('tr[data-id="' + cust.id + '"]');
		});

		DT_ALLSALESPERSON_CUSTOMERS.rows().deselect();
		DT_ALLSALESPERSON_CUSTOMERS.rows(selectRows).select();
	}

	// column edit btn action
	function editDistributionChannel(element, { id, distributionChannel }) {
		element.off('click').click(() => {
			refreshForm('edit-distribution-channel-form');
			$('[data-toggle="tooltip"]').tooltip('hide');
			$('#edit-distribution-channel-form input[name=id]').val(id);
			$(`#edit-distribution-channel-form input[name=distributionChannel][value=${distributionChannel}]`).prop('checked', true);
			$('#edit-distribution-channel-modal').modal();
		});
	}

	// column edit btn action
	function editItemUser(element, { id, firstName, middleName, lastName, email, department, roleId }) {
		element.off('click').click(() => {
			refreshForm('edit-user-form');

			// dropdown bind
			var role = reverse_customArrayFilter(LCLDB_ROLES, 'role', 'CUSTOMER');
			role = reverse_customArrayFilter(role, 'role', 'SALESPERSON');
			$('#edit-user-form select[name=roleId]').html(createRoleDropdown(role));
			$('#edit-user-form select[name=roleId]').off('change');

			$('[data-toggle="tooltip"]').tooltip('hide');
			$('#edit-user-form input[name=id]').val(id);
			$('#edit-user-form input[name=lastName]').val(lastName);
			$('#edit-user-form input[name=middleName]').val(middleName);
			$('#edit-user-form input[name=firstName]').val(firstName);
			$('#edit-user-form input[name=email]').val(email);
			$('#edit-user-form input[name=department]').val(department);
			$('#edit-user-form select[name=roleId]').val(roleId);
			$('#edit-user-modal').modal();
		});
	}

	// column delete btn action
	function deleteItemUser(element, id) {
		element.off('click');
		element.click(function(){
			$('#delete-user-modal').modal();
			$('#delete-user-form input[name=id]').val(id);
		});
	}

	// highlight error on form
	function displayError(formId) {
		$(`#${formId} input[type=text]`).each(function() {
			if ($(this).val().trim() == '') $(this).closest('.form-group').addClass('has-error');
			else $(this).closest('.form-group').removeClass('has-error');
		});

		$(`#${formId} input[type=radio]`).each(function() {
			if ($(`#${formId} input[name="${$(this).attr('name')}"]:checked`).length <= 0) $(this).closest('.form-group').addClass('has-error');
			else $(this).closest('.form-group').removeClass('has-error');
		});
	}

	// set form to default
	function refreshForm(formId) {
		$(`#${formId} input[type=text]`).each(function() {
			$(this).closest('.form-group').removeClass('has-error');
			$(this).val('');
		});
	}

	function createRoleDropdown(data) {
		var code = '<option value="blank">-- SELECT ROLES --</option>';

		for (var i in data) {
			code += '<option value="'+data[i].id+'">'+data[i].role+'</option>';
		}

		return code;
	}

	// add role on local array
	function createUserLocal(user) {
		let index = LCLDB_ROLES.findIndex(item => item.id == user.roleId);
		user.role = LCLDB_ROLES[index].role;
		LCLDB_USER.push(user)
	}

	// update role on local array
	function updateUserLocal(userId, { firstName, lastName, department, roleId }) {
		let index = LCLDB_USER.findIndex(item => item.id == userId);
		LCLDB_USER[index]['firstName']  = firstName;
		LCLDB_USER[index]['lastName']   = lastName;
		LCLDB_USER[index]['department'] = department;
		LCLDB_USER[index]['roleId']     = roleId;
	}

	// update salesperson on local array
	function updateSalespersonsCustomerLocal(userId, { customers }) {
		let index = LCLDB_SALESPERSON.findIndex(item => item.id == userId);
		LCLDB_SALESPERSON[index]['customers']  = customers;
	}

	// update role on local array
	function updateDistChannelLocal(userId, { distributionChannel }) {
		let index = LCLDB_CUSTOMER.findIndex(item => item.id == userId);
		LCLDB_CUSTOMER[index]['distributionChannel']  = distributionChannel;
		console.log(LCLDB_CUSTOMER[index]['distributionChannel'])
	}

	// delete role on local array
	function deleteUserLocal(userId) {
		let index = LCLDB_USER.findIndex(item => item.id == userId);
		LCLDB_USER.splice(index, 1);
	}

	function resendInviteBtn(resendBtn, data) {
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
						email    : data.email,
						password : password,
						emailid    : 'EMAIL::CUSTOMER::INVITATION'
					}
					console.log(doc)

					resendInvite(doc, function(err, res){ // resend invite
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
					console.log(data)
					let password = data.id;
						password = 'BST' + password.replace('USER::','').substring(0,5);

					let doc = {
						email    : data.email,
						password : password,
						emailid  : 'EMAIL::SALESPERSON::INVITATION'
					}

					console.log(doc)

					resendInvite(doc, function(err, res){ // resend invite
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

	// open add user modal
	$('#open-add-user-modal').click(function(){
		refreshForm('add-user-modal')
		$('#add-user-modal').modal();

		// dropdown bind
		var role = reverse_customArrayFilter(LCLDB_ROLES, 'role', 'CUSTOMER');
		role = reverse_customArrayFilter(role, 'role', 'SALESPERSON');
		$('#add-user-form select[name=roleId]').html(createRoleDropdown(role));
		$('#add-user-form select[name=roleId]').off('change');

	});

	$('#add-user-btn').click(function(){
		let doc = $('#add-user-form').serializeObject();

		displayError('add-user-form');
		if (!doc.lastName.trim() || !doc.firstName.trim() || !doc.userName.trim() || !doc.email.trim() || !doc.department.trim() || !doc.roleId.trim()) { // check if blank
			resultNotify('fa-exclamation-circle', 'INVALID', `All fields are <b>required</b>`, 'warning');
			return;
		}

		$('.loading-state').fadeIn();
		disableBtn($(this));

		setTimeout(() => {

			doc.lastName = doc.lastName.toUpperCase(),
			doc.firstName = doc.firstName.toUpperCase(),
			doc.userName = doc.userName,
			doc.email = doc.email,
			doc.department = doc.department.toUpperCase(),
			doc.roleId = doc.roleId,
			doc.dateCreated = moment().format('YYYY-MM-DD'),
			doc.role = ''

			createUser2(doc, (err, res) => {
				$('#add-user-modal').modal('hide');
				setTimeout(() => { enableBtn($(this)); }, 1000);

				if (err || res.statusCode >= 300) {
					console.log(res);
					$('.loading-state').fadeOut('slow');
					resultNotify('fa fa-times', 'ERROR', 'User not created.<br>Something went wrong. Please try again later', 'danger');
					return;
				}

				if (res.statusCode <= 299) {
					console.log(res);
					resultNotify('fa-check-circle', 'SUCCESS', 'User successfully updated', 'success');
					config.db = 'local';
					createUserLocal(doc);
					setTimeout(() => { loadUserTable() }, 1000);
				}
			});

			/*config.db = 'local';
			createUserLocal(doc);
			setTimeout(() => { loadUserTable() }, 1000);*/
		}, 1000);
	});

	$('#edit-user-btn').click(function(){
		let user = $('#edit-user-form').serializeObject();
		console.log(user)
		console.log(user.id)
		displayError('edit-user-form');
		if (!user.firstName.trim() || !user.lastName.trim() || !user.department.trim() || !user.roleId.trim()) { // check if blank
			resultNotify('fa-exclamation-circle', 'INVALID', `All fields are <b>required</b>`, 'warning');
			return;
		}

		$('.loading-state').fadeIn();
		disableBtn($(this));

		setTimeout(() => {
			const changes = { 	
								firstName  : user.firstName,
								lastName   : user.lastName,
								department : user.department,
								roleId     : user.roleId  
							};

			console.log(changes)

			updateUser2(user.id, changes, (err, res) => {
				$('#edit-user-modal').modal('hide');
				setTimeout(() => { enableBtn($(this)); }, 1000);

				if (err || res.statusCode >= 300) {
					console.log(res);
					$('.loading-state').fadeOut('slow');
					resultNotify('fa fa-times', 'ERROR', 'User not updated.<br>Something went wrong. Please try again later', 'danger');
					return;
				}

				if (res.statusCode <= 299) {
					resultNotify('fa-check-circle', 'SUCCESS', 'User successfully updated', 'success');
					config.db = 'local';
					updateUserLocal(user.id, changes);
					setTimeout(() => { loadUserTable() }, 1000);
				}
			});

			/*config.db = 'local';
			updateUserLocal(user.id, changes);
			setTimeout(function(){ loadUserTable(); }, 2000);*/
		}, 1000);
	});

	$('#delete-user-btn').click(function(){
		var user = $('#delete-user-form').serializeObject();

		$('.loading-state').fadeIn();
		setTimeout(() => {
			deleteUser(user.id, (err, res) => {
				$('#delete-user-modal').modal('hide');

				if (err || res.statusCode >= 300) {
					console.log(res);
					$('.loading-state').fadeOut('slow');
					resultNotify('fa fa-times', 'ERROR', 'User not deleted.<br>Something went wrong. Please try again later', 'danger');
					return;
				}

				if (res.statusCode <= 299) {
					resultNotify('fa-check-circle', 'SUCCESS', 'User successfully deleted', 'success');
					config.db = 'local';
					deleteItemUser(user.id);
					setTimeout(() => { loadUserTable() }, 1000);
				}
			});

			/*config.db = 'local';
			deleteUserLocal(user.id);
			setTimeout(function(){ loadUserTable(); }, 1000);*/
		}, 1000);
	});

	$('#map-customer-modal-btn').click(function(){
		$('#salesperson-customers-modal').modal('hide');
		$('.loading-current-salesperson-customers-table, .loading-all-salesperson-customers-table').fadeIn();

		setTimeout(function(){
			loadTable_CurrentSalespersonCustomers(DT_SALESPERSON_CUSTOMERS.rows().data());
			loadTable_AllSalespersonCustomers(LCLDB_MAINCUSTOMERS);

			// set selected rows from CURRENT to ALL
			setSelectedRows_AllSalespersonCustomers();

			// reflect table from ALL to CURRENT
			$('#all-salesperson-customers-table tbody').on('click', 'tr', function () {
				var data = DT_ALLSALESPERSON_CUSTOMERS.row( this ).data();

				setTimeout(function() {
					loadTable_CurrentSalespersonCustomers(DT_ALLSALESPERSON_CUSTOMERS.rows('.selected').data());
				}, 500);
			});

			$('.loading-current-salesperson-customers-table, .loading-all-salesperson-customers-table').fadeOut();
		}, 1000);

		setTimeout(function(){
			$('#edit-salesperson-customers-modal').modal()
		}, 500);
	});

	$('#map-customer-btn').click(function(){
		var customer = DT_CURRENTSALESPERSON_CUSTOMERS.column(0).data().toArray(),
		referenceId = $(this).attr('data-referenceId');
		
		$('.loading-state').fadeIn('slow');
		disableBtn($(this));

		setTimeout(() => {
			let doc = {
				customers : customer
			}

			updateUser2(referenceId, doc, (err, res) => {
				$('#edit-salesperson-customers-modal').modal('hide');
				setTimeout(() => { enableBtn($(this)); }, 1000);

				if (err || res.statusCode >= 300) {
					console.log(res);
					$('.loading-state').fadeOut('slow');
					resultNotify('fa fa-times', 'ERROR', 'Customers not assigned.<br>Something went wrong. Please try again later', 'danger');
					return;
				}

				if (res.statusCode <= 299) {
					resultNotify('fa-check-circle', 'SUCCESS', 'Customers successfully assigned to salesperson', 'success');
					config.db = 'local';
					updateSalespersonsCustomerLocal(referenceId, doc);
					setTimeout(function(){ loadSalespersonTable(); }, 2000);
				}
			});

			/*config.db = 'local';
			updateSalespersonsCustomerLocal(referenceId, doc);
			setTimeout(function(){ loadSalespersonTable(); }, 2000);*/
		}, 1000);
	});

	$('#edit-distribution-channel-btn').click(function(){
		let customer = $('#edit-distribution-channel-form').serializeObject();
		
		$('.loading-state').fadeIn('slow');
		disableBtn($(this));

		setTimeout(() => {
			let id = customer.id;
			const doc = { distributionChannel : customer.distributionChannel };

			console.log(id)
			console.log(doc)

			updateUser2(id, doc, (err, res) => {
				$('#edit-distribution-channel-modal').modal('hide');
				setTimeout(() => { enableBtn($(this)); }, 1000);

				if (err || res.statusCode >= 300) {
					console.log(res);
					$('.loading-state').fadeOut('slow');
					resultNotify('fa fa-times', 'ERROR', 'Distribution Channel not updated.<br>Something went wrong. Please try again later', 'danger');
					return;
				}

				if (res.statusCode <= 299) {
					resultNotify('fa-check-circle', 'SUCCESS', 'Distribution Channel successfully updated', 'success');
					config.db = 'local';
					updateDistChannelLocal(id, doc);
					setTimeout(function(){ loadCustomerTable(); }, 2000);
				}
			});
		}, 1000);
	});

	// tabs navigate
	$('.nav-tabs > li a[data-toggle="tab"]').click(function() {
		const action = $(this).attr('data-action');
		switch(action) {
			case 'user':
				$('.loading-state:eq(0)').fadeIn('slow');
				setTimeout(() => { loadUserTable(); }, 1000);
			break;
			case 'customer':
				$('.loading-state:eq(1)').fadeIn('slow');
				setTimeout(() => { loadCustomerTable(); }, 1000);
			break;
			case 'salesperson':
				$('.loading-state:eq(2)').fadeIn('slow');
				setTimeout(() => { loadSalespersonTable(); }, 1000);
			break;
		}
	});

});