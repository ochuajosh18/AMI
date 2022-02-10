$(document).ready(function() {
	let LCLDB_USER;

	loadAccountTable(LOCAL_STORAGE.userid);
	$('div.isChangePassword').hide();

	// load user information table
	function loadAccountTable(userId) {
		loadUser(userId, (err, res) => {
			if (err || res.statusCode >= 300) alert('Unable to load profile');
			else if (res.statusCode <= 299) {
				LCLDB_USER = res.result;
				$('#user-info-table [data-info="fname"]').text(LCLDB_USER.firstName);
				$('#user-info-table [data-info="lname"]').text(LCLDB_USER.lastName);
				$('#user-info-table [data-info="role"]').text(LOCAL_STORAGE.role);
				$('#user-info-table [data-info="username"]').text(LCLDB_USER.userName);
				$('#user-info-table [data-info="email"]').text(LCLDB_USER.email);

				$('.loading-state').fadeOut('slow');
			}
		});
	}

	// show update account modal
	$('#update-account-modal-btn').click(function() {
		$('#update-account-modal').modal();
		$('#update-account-form [name="firstName"]').val(LCLDB_USER.firstName);
		$('#update-account-form [name="lastName"]').val(LCLDB_USER.lastName);
	});

	// save account changes
	$('#update-account-btn').click(function(){
		let user = $('#update-account-form').serializeObject();

		if (!user.firstName.trim() || !user.lastName.trim()) {
			resultNotify('fa-exclamation-circle', 'INVALID', `<b>All fields</b> required`, 'warning');
			return;
		}

		disableButton('#update-account-btn');
		$('.loading-state').fadeIn();
		setTimeout(() => {
			let id = LOCAL_STORAGE.userid;
			user.firstName = user.firstName.toUpperCase();
			user.lastName = user.lastName.toUpperCase();

			updateUser2(id, user, (err, res) => {
				$('.loading-state').fadeOut('slow');
				$('#update-account-modal').modal('hide');

				if (res.statusCode <= 299) {
					const oldStorage = JSON.parse(localStorage.getItem('userData'));
					oldStorage.firstName = user.firstName;
					oldStorage.lastName = user.lastName;
					localStorage.setItem('userData', JSON.stringify(oldStorage));

					loadAccountTable(id);
					setUserInfo(JSON.parse(localStorage.getItem('userData')));
					resultNotify('fa-check-circle', 'SUCCESS', 'Account successfully saved', 'success');
				} else {
					console.log(res);
					resultNotify('fa fa-times', 'ERROR', 'Account not saved.<br>Something went wrong. Please try again later', 'danger');
				}
			});
		}, 1000);
	});

	// show update credential modal
	$('#update-credential-modal-btn').click(function(){
		if ($('#isChangePassword').is(':checked')) $('#isChangePassword').click();
		$('#update-credential-modal').modal();
		$('#update-credential-form [name="userName"]').val(LCLDB_USER.userName);
		$('#update-credential-form [name="email"]').val(LCLDB_USER.email);
	});

	// hide show password section
	$('#isChangePassword').change(function(){
		if ($(this).is(':checked')) $('div.isChangePassword').fadeIn();
		else $('div.isChangePassword').fadeOut();
	});

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
			passwordHistory =  [password];
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
		let user = $('#update-credential-form').serializeObject();
		if ($('#isChangePassword').is(':checked')) {
			user.lastPassUpdate = moment().toISOString();
		}

		// username check
		if (!user.userName.trim()) {
			resultNotify('fa-exclamation-circle', 'INVALID', `<b>All fields</b> required`, 'warning');
			return;
		}

		// password check
		let sync = $('#update-credential2-form').serializeObject();
		if ($('#isChangePassword').is(':checked')) {
			if (!sync.oldPassword || !sync.newPassword || !sync.confirmPassword) {
				resultNotify('fa-exclamation-circle', 'INVALID', `<b>All fields</b> required`, 'warning');
				return;
			} else if (sync.oldPassword != LOCAL_STORAGE.password) {
				resultNotify('fa fa-times', 'ERROR', 'Incorrect <b>password</b>', 'danger');
				return;
			} else if (sync.newPassword != sync.confirmPassword) {
				resultNotify('fa fa-times', 'ERROR', 'New <b>password</b> did not match', 'danger');
				return;
			} else if(sync.newPassword.match(new RegExp(LCLDB_USER.firstName, "gi"))){
				alert('Password must not contain your last name, first name, and/or username.')
				return;
			} else if(sync.newPassword.match(new RegExp(LCLDB_USER.lastName, "gi"))){
				alert('Password must not contain your last name, first name, and/or username.')
				return;
			} else if(sync.newPassword.match(new RegExp(LCLDB_USER.userName, "gi"))){
				alert('Password must not contain your last name, first name, and/or username.')
				return;
			} else if (!checkPassrequirement(sync.newPassword)) {
				alert(`Password must contain at least 8 characters: at least 1 UPPERCASE letter, 1 lowercase letter, and 1 number`)
				return;
			}
			

			let encryptedPass;
			if (checkPreviousPassword(sync.newPassword, LCLDB_USER.passwordHistory)) {
				alert('You cannot use your previous 3 passwords');
				return;
			} else {
				encryptedPass = getEncryption(sync.newPassword);
				user.passwordHistory = updatePassHistory(encryptedPass);				
			}
		}

		disableButton('#update-credential-btn');
		setTimeout(() => {  
			let id = LOCAL_STORAGE.userid;
			async.waterfall([
				// save username
				(callback) => {
					updateUser2(id, user, (err, res) => {
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
				(user, callback) => {
					if ($('#isChangePassword').is(':checked')) {
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
					} else callback(null, 'ok');
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
})

