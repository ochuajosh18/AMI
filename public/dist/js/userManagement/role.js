$(document).ready(function() {
	let LCLDB_ROLE, DT_ROLE;
	const config = {
	    // db : 'offline'
	    db : 'couchbase'
	};

	enableHelpFunction();
	$("[data-toggle=popover]").popover();

	loadRoleTable();

	// load roles table
	function loadRoleTable() {
		let data;

		if (config.db == 'couchbase') {
			loadRoles((err, res) => {
				if (err || res.statusCode >= 300) { end = true; return };

				if (res.statusCode <= 299) { LCLDB_ROLE = res.result; data = res.result; }
			});
		} else if (config.db == 'local') {
			data = LCLDB_ROLE;
		} else {
			LCLDB_ROLE = offlineDB;
			data = offlineDB;
		}

		DT_ROLE = $('#role-table').DataTable({
			destroy        : true,
			data           : data,
			autoWidth      : false,
			paging         : false,
			scrollY        : 350,
			scrollCollapse : true,
			// deferRender    : true,
			// scroller       : true,
			dom            : 'rti',

			columns: [
				{ data: 'role', title: 'Role' },
				{ data: 'access', title: 'Access', width: 100 },
				{ data: null, title: 'Action', defaultContent: '', width: 100, orderable: false }
			],
			columnDefs: [
				{ targets: [1, 2], className: 'dt-center' },
				{
					targets: 2,
					render: (data, type, row) => {
						return  `<div class="btn-group" role="group" aria-label="action">
							<button type="button" class="btn btn-primary btn-xs edit-trigger" data-toggle="tooltip" title="Edit Role" data-placement="left"><i class="fa fa-pencil-square-o"></i></button>
							<button type="button" class="btn btn-danger btn-xs delete-trigger" data-toggle="tooltip" title="Delete Role" data-placement="right"><i class="fa fa-trash"></i></button>
						</div>`;
					},
				}
			],
			rowCallback: (row, data, iDataIndex) => {
				editItem($(row).find('button.edit-trigger'), data);
				deleteItem($(row).find('button.delete-trigger'), data);
				$(row).attr('id', data.id);
			}
		});

		$('#role-table-filter').off('keyup').keyup(function() { DT_ROLE.search($(this).val()).draw(); });
		$('.loading-state').fadeOut('slow');
	}

	// column edit btn action
	function editItem(element, { id, role, access }) {
		element.off('click').click(() => {
			refreshForm('edit-role-form');
			$('[data-toggle="tooltip"]').tooltip('hide');
			$('#edit-role-form input[name=id]').val(id);
			$('#edit-role-form input[name=role]').val(role);
			$(`#edit-role-form input[name=access][value=${access}]`).prop('checked', true);
			$('#edit-role-modal').modal();
		});
	}

	// column delete btn action
	function deleteItem(element, { id, role }) {
		element.off('click').click(() => {
			$('.loading-state').fadeIn();
			setTimeout(() => {
				// count if there are users within the role
				countUserByRole(id, (err, res) => {
					$('.loading-state').fadeOut('slow');

					if (err || res.statusCode >= 300) {
						alert('Failed to load users within the selected role.');
						return;
					}

					if (res.statusCode <= 299) {
						if (res.result > 0) { // prevent delete role if there is user
							resultNotify('fa-exclamation-circle', 'INVALID', `Cannot delete role <b>${role}</b>. There are users with <b>${role}</b> role.`, 'warning');
						} else {
							$('[data-toggle="tooltip"]').tooltip('hide');
							$('#delete-role-modal').modal();
							$('#delete-role-form input[name=id]').val(id);
							$('#delete-role-form input[name=role]').val(role);
						}
					}
				});
			}, 1000);
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

		$(`#${formId} input[type=radio]`).each(function() {
			$(this).closest('.form-group').removeClass('has-error');
			$(this).prop('checked', false);
		});
	}

	$('#btn-help-multiple').attr('data-content', 
		`<a><h6 id="btn-add-role" data-toggle="modal" data-target="#modal-default" data-help="role" style="cursor: pointer;">How to add role</h6></a>
		<a><h6 id="btn-edit-role" data-toggle="modal" data-target="#modal-default" data-help="role" style="cursor: pointer;">How to edit role</h6></a>
		<a><h6 id="btn-delete-role" data-toggle="modal" data-target="#modal-default" data-help="role" style="cursor: pointer;">How to delete role</h6></a>`
	);

	$(document).on("click", "#btn-add-role", function(event) {
		let helptype = $('#btn-add-role').attr('data-help');
		helpCarouselMultiple(helptype, 'add')
    });

    $(document).on("click", "#btn-edit-role", function(event) {
		let helptype = $('#btn-edit-role').attr('data-help');
		helpCarouselMultiple(helptype, 'edit')
    });

    $(document).on("click", "#btn-delete-role", function(event) {
		let helptype = $('#btn-delete-role').attr('data-help');
		helpCarouselMultiple(helptype, 'delete')
    });

	// open add role modal
	$('#open-add-role-modal').click(function(){
		refreshForm('add-role-modal')
		$('#add-role-modal').modal();
	});

	// create role button
	$('#add-role-btn').click(function() {
		let role = $('#add-role-form').serializeObject();

		displayError('add-role-form');
		if (!role.role.trim() || !role.access) { // check if blank
			resultNotify('fa-exclamation-circle', 'INVALID', `All fields are <b>required</b>`, 'warning');
			return;
		}

		role.role = role.role.toUpperCase().trim();
		let isNotExist = LCLDB_ROLE.findIndex(item => item.role == role.role);
		if (isNotExist != -1) { // check if role exist
			$('#add-role-modal').modal('hide');
			resultNotify('fa-exclamation-circle', 'INVALID', `<b>${role.role}</b> role already exist`, 'warning');
			return;
		}

		disableButton('#add-role-btn');
		$('.loading-state').fadeIn();
		setTimeout(() => {
			createRole(role, (err, res) => {
				$('#add-role-modal').modal('hide');

				if (err || res.statusCode >= 300) {
					console.log(res);
					$('.loading-state').fadeOut('slow');
					resultNotify('fa fa-times', 'ERROR', 'Role not created.<br>Something went wrong. Please try again later', 'danger');
					return;
				}

				if (res.statusCode <= 299) {
					resultNotify('fa-check-circle', 'SUCCESS', 'Role successfully created', 'success');
					config.db = 'local';
					role.id = res.result;
					createRoleLocal(role);

					if (LOG_FUNCTION) {
						createLog(`LOG::${LOCAL_STORAGE.referenceId}`, {
							dateCreated : moment().toISOString(),
							action : `Added role ${role.role}`,
							module : "User Management/Role",
							app : "AMI"
						}, moment().toISOString());
					}
					setTimeout(function(){ loadRoleTable(); }, 2000);
				}
			});
		}, 1000);
	});

	// updated role button
	$('#edit-role-btn').click(function(){
		let role = $('#edit-role-form').serializeObject();
		let oldRole = LCLDB_ROLE.find(item => item.id == role.id);

		displayError('edit-role-form');
		if (!role.role.trim() || !role.access) { // check if blank
			resultNotify('fa-exclamation-circle', 'INVALID', `All fields are <b>required</b>`, 'warning');
			return;
		}

		role.role = role.role.toUpperCase().trim();
		let isNotExist = LCLDB_ROLE.findIndex(item => item.role == role.role);
		/* if (isNotExist != -1) { // check if role exist
			$('#edit-role-modal').modal('hide');
			resultNotify('fa-exclamation-circle', 'INVALID', `<b>${role.role}</b> role already exist`, 'warning');
			return;
		} */

		disableButton('#edit-role-btn');
		$('.loading-state').fadeIn();
		setTimeout(() => {
			const changes = { role: role.role, access: role.access };

			updateRole(role.id, changes, (err, res) => {
				$('#edit-role-modal').modal('hide');

				if (err || res.statusCode >= 300) {
					console.log(res);
					$('.loading-state').fadeOut('slow');
					resultNotify('fa fa-times', 'ERROR', 'Role not updated.<br>Something went wrong. Please try again later', 'danger');
					return;
				}

				if (res.statusCode <= 299) {
					resultNotify('fa-check-circle', 'SUCCESS', 'Role successfully updated', 'success');
					config.db = 'local';
					updateRoleLocal(role.id, changes);

					if (LOG_FUNCTION) {
						createLog(`LOG::${LOCAL_STORAGE.referenceId}`, {
							dateCreated : moment().toISOString(),
							action : `Edited role ${oldRole.role} as ${role.role}, changed its access from ${oldRole.access} to ${role.access}`,
							module : "User Management/Role",
							app : "AMI"
						}, moment().toISOString());
					}
					setTimeout(function(){ loadRoleTable(); }, 2000);
				}
			});
		}, 1000);
	});

	// delete role button
	$('#delete-role-btn').click(function(){
		let role = $('#delete-role-form').serializeObject();

		disableButton('#delete-role-btn');
		$('.loading-state').fadeIn();
		setTimeout(() => {
			deleteRole(role.id, (err, res) => {
				$('#delete-role-modal').modal('hide');

				if (err || res.statusCode >= 300) {
					console.log(res);
					$('.loading-state').fadeOut('slow');
					resultNotify('fa fa-times', 'ERROR', 'Role not deleted.<br>Something went wrong. Please try again later', 'danger');
					return;
				}

				if (res.statusCode <= 299) {
					resultNotify('fa-check-circle', 'SUCCESS', 'Role successfully deleted', 'success');
					config.db = 'local';
					deleteRoleLocal(role.id);

					if (LOG_FUNCTION) {
						createLog(`LOG::${LOCAL_STORAGE.referenceId}`, {
							dateCreated : moment().toISOString(),
							action : `Deleted role ${role.role}`,
							module : "User Management/Role",
							app : "AMI"
						}, moment().toISOString());
					}
					setTimeout(function(){ loadRoleTable(); }, 2000);
				}
			});
		}, 1000);
	});

	// add role on local array
	function createRoleLocal(role) {
		console.log(role);
		LCLDB_ROLE.push(role)
	}

	// update role on local array
	function updateRoleLocal(roleId, { role, access }) {
		let index = LCLDB_ROLE.findIndex(item => item.id == roleId);
		LCLDB_ROLE[index]['role'] = role;
		LCLDB_ROLE[index]['access'] = access;
	}

	// delete role on local array
	function deleteRoleLocal(roleId) {
		let index = LCLDB_ROLE.findIndex(item => item.id == roleId);
		LCLDB_ROLE.splice(index, 1);
	}
});