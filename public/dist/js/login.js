$(document).ready(function() {
	let LCLDB_USER;

	$('#loginButton').click(function(){
		let credentials = $('#loginForm').serializeObject();

		if (!credentials.username.trim() || !credentials.password.trim()) {
			resultNotify('fa-exclamation-circle', 'INVALID', `<b>Username</b> and <b>Password</b> is required`, 'warning');
			return;
		}

		disableBtn($(this));
		setTimeout(() => {
			// get user doc
			loadUserdocByUsername(credentials, (err, res) => {
				if (res) LCLDB_USER = res;
			});

			if (LCLDB_USER) {
				// console.log(moment(LCLDB_USER.lastWrongLogin).format('MMM-DD hh:mm'));
				// console.log(moment().format('MMM-DD hh:mm'));
				let start = moment(LCLDB_USER.lastWrongLogin), end = moment();
				// let duration = Math.round(moment.duration(end.diff(start)).asMinutes());
				let duration = moment.duration(end.diff(start)).asMinutes()
				console.log(Math.round(moment.duration(end.diff(start)).asMinutes()))
				console.log(duration)

				if (duration < 1 && LCLDB_USER.passThreshold == 0) { // account is locked
					enableBtn($(this));
					resultNotify('fa fa-times', 'ERROR', 'Your account is locked for 1 minute, please try again later', 'danger');
				} else if (duration >= 1 && LCLDB_USER.passThreshold != 10) { // account release lock
					resetPassThreshold();
					proceedLogin(credentials, false);
				} else {
					proceedLogin(credentials, true);
				}
			}
		}, 1000);
	});

	function resetPassThreshold() {
		updateThreshold(LCLDB_USER.userid, { passThreshold : 10 }, (err, res) => {
			if (res.statusCode <= 299) console.log('passThreshold updated');
		});
	}

	function proceedLogin(credentials, resetPass) {
		authenticateUser(credentials, (err, res) => {
			if (err || res.statusCode >= 300) {
				enableBtn('#loginButton');

				registerWrongLogin({ currentTime: moment().toISOString(), userId: LCLDB_USER.userid }, (err,res) => {
					if (err || res.statusCode >= 300) console.log(err)
				});

				resultNotify('fa fa-times', 'ERROR', 'Invalid username or password', 'danger');
			} else if (res.statusCode <= 299) {
				if (resetPass) resetPassThreshold();
				res.result.expire = moment(new Date(res.result.expire)).toISOString();
				localStorage.setItem('userData', JSON.stringify(res.result));
				resultNotify('fa-check-circle', 'SUCCESS', 'Logging in to AMI...', 'success');
				setTimeout(() => { window.location = '/ami/index/' + res.roleId; }, 1000);
			}
		});
	}

	$('#open-forgot-password-modal').click(function() {
		$('#forgot-password-modal').modal();
		$('#forgot-password-input').val('');
	});

	$('#forgot-password-btn').click(function() {
		const email = $('#forgot-password-input').val().trim();
		if (!email) {
			alert('Email is required');
			return;
		}

		disableBtn($(this));
		setTimeout((err, res) => {
			resetPassword({ email }, (err, res) => {
				enableBtn($(this));

				if (err) {
					if (err.statusCode == 404 && err.message == 'Invalid email') {
						alert(err.message);
						return;
					}

					alert('Something went wrong while reseting password.');
					return;
				}

				if (res.statusCode <= 200) {
					alert(`New password sent to ${email}`);
					$('#forgot-password-modal').modal('hide');
					resultNotify('fa-check-circle', 'SUCCESS', 'Password successfully reset', 'success');
				}
			});
		}, 1000);
	});
});