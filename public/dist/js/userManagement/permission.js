$(document).ready(function() {
	let LCLDB_ROLE;

	enableHelpFunction();

	loadRoles((err, res) => { LCLDB_ROLE = res.result; console.log(LCLDB_ROLE) });
	// load interface
	createPermissionManagement(localdata_MODULES.AMI);
	loadRolesDropdown('AMI');

	// create roles dropdown
	function loadRolesDropdown(app) {
		let roles = LCLDB_ROLE.filter(item => item.access == app || item.access == 'BOTH');
		$('#role-select').html(`<option value="">-- SELECT ROLE --</option>`)
		for (let i in roles) $('#role-select').append(`<option value="${roles[i].id}">${roles[i].role}</option>`)

		$('.loading-state').fadeOut('slow');
	}

	// create permission panels
	function createPermissionManagement(modules) {
		$('#permission-panels').empty();
		let rowCount = 0;
		for (let i in modules) {
			rowCount++;
			if (rowCount%3 == 1) $('#permission-panels').append(`<div class="row"></div>`);

			// create panel per module
			$('#permission-panels').append(
				`<div class="col-lg-4">
					<div class="panel panel-default ${i}-permission-panel">
						<div class="panel-heading"><i class="${modules[i].icon}" aria-hidden="true"></i> <b>${modules[i].label}</b></div>
						<div class="panel-body" style="padding: 0;">
							<ul class="nav nav-stacked">
			              	</ul>
						</div>
					</div>
				</div>`
			);

			let submodules = modules[i].modules;
			for (let j in submodules) {
				// create switch per submodule
				$(`.${i}-permission-panel ul.nav-stacked`).append(
					`<li><a href="#">${submodules[j].label}
						<span class="pull-right">
							<label class="switch">
								<input type="checkbox" data-module="${i}" data-submodule="${j}">
								<span class="slider round"></span>
							</label>
						</span>
					</a></li>`
				);
			}
		}
	}

	// toggle switch upon role permission load
	function setPermissions(rolePermission) {
		$('#permission-panels input[type="checkbox"]').prop('checked', false);

		for (let i in rolePermission) {
			let moduleName = i;
			let submodules = rolePermission[i];
			for (let j in submodules) {
				submoduleName = j;
				if (submodules[j] == true) $(`input[data-module="${`${moduleName}`}"][data-submodule="${submoduleName}"]`).prop('checked', true);
			}
		}
	}

	$('#btn-help').click(function(event){
		let helptype = $(this).attr('data-help');
		helpCarousel(helptype)
	});

	// switch tabs
	$('ul.nav-tabs a[href="#permission-tab"]').click(function() {
		if(!$(this).parent().hasClass('active')) { // prevent load if already loaded
			let app = $(this).text();
			createPermissionManagement(localdata_MODULES[app]);
			loadRolesDropdown(app);
		}
	});

	// role dropdown change
	$('#role-select').change(function() {
		let roleId = $(this).val();

		if (roleId) {
			let app = $('.nav-tabs li.active').find('a').text();
			let role = LCLDB_ROLE.find(item => item.id == roleId);

			if (app == 'AMI') {
				setPermissions(role.amiModules);
				// generateSidebar(localdata_MODULES.AMI);
				// setSidebarPermission(role.amiModules);
			} else {
				setPermissions(role.wosModules);
				// generateSidebar(localdata_MODULES.WOS);
				// setSidebarPermission(role.wosModules);
			}
			
		} else setPermissions({});
	});

	// save permission
	$('#save-btn').click(function() {
		if (!$('#role-select option:selected').val()) {
			resultNotify('fa-exclamation-circle', 'INVALID', `Select a <b>Role</b> first`, 'warning');
			return;
		}

		let permissionChange = {};
		$('.loading-state').fadeIn();

		// generate permission object
		$('#permission-panels input[type="checkbox"]').each(function() {
			let modulesKey = $(this).attr('data-module');
			let submodulesKey = $(this).attr('data-submodule');

			if (!permissionChange[modulesKey]) permissionChange[modulesKey] = {}; // key not yet defined
			permissionChange[modulesKey][submodulesKey] = $(this).prop('checked');
		});

		// save changes
		let app = $('.nav-tabs li.active').find('a').text().toLowerCase();
		let roleId = $('#role-select option:selected').val();
		let roleName = LCLDB_ROLE.find(item => item.id == roleId);

		savePermission(roleId, app, permissionChange, (err, res) => {
			$('.loading-state').fadeOut('slow');

			if (res.statusCode <= 299) {
				savePermissionLocal(roleId, app, permissionChange);
				if (LOG_FUNCTION) {
					createLog(`LOG::${LOCAL_STORAGE.referenceId}`, {
						dateCreated : moment().toISOString(),
						action : `Updated permission for ${roleName.role} user`,
						module : "User Management/Permission",
						app : "AMI"
					}, moment().toISOString());
				}
				resultNotify('fa-check-circle', 'SUCCESS', 'Permission successfully saved', 'success');
			} else {
				console.log(res);
				resultNotify('fa fa-times', 'ERROR', 'Permission not saved.<br>Something went wrong. Please try again later', 'danger');
			}
		});
	});

	function savePermissionLocal(roleId, app, permission) {
		let index = LCLDB_ROLE.findIndex(item => item.id == roleId);
		LCLDB_ROLE[index][`${app}Modules`] = permission;
	}
});