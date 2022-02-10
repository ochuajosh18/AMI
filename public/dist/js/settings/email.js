$(document).ready(function() {
	let LCLDB_EMAILS, DT_EMAILS;
	const config = {
		// db : 'offline'
		db : 'couchbase'
	};

	$("#email-content").wysihtml5();
	$("#terms-condition-content").wysihtml5();
	$('#nav-terms-condition').hide();
	// $('#nav-terms-condition').css('display', 'none');
	
	enableHelpFunction();
	loadEmailList();

	function loadEmailList() {

		let data;

		if (config.db == 'couchbase') {
			loadAllEmails( (err, res) => {
				if (err || res.statusCode >= 300) { end = true; return }
				else if (res.statusCode <= 299) { LCLDB_EMAILS = res.result; data = LCLDB_EMAILS; console.log(data)}
			});
		} else if (config.db == 'local') {
			data = LCLDB_EMAILS;
			console.log(data)
		} else {
			LCLDB_EMAILS = offlineDB;
			data = offlineDB;
		}

		DT_EMAILS = $('#order-list').DataTable({
			destroy   : true,
			data      : LCLDB_EMAILS,
			autoWidth : false,
			paging    : false,
			dom       : 'rt',
			language  : {  emptyTable: '<h4><b>No order</b></h4>' },

			columns: [
				{ data: 'type' }
			],

			rowCallback: function (row, data, iDataIndex) {
				$(row)
				.css('cursor', 'pointer')
				.attr('id', data.id)
				.off('click').click(function() {
					$('#nav-content a').trigger('click');

					DT_EMAILS.rows('.selected').nodes().to$().removeClass('selected');
					$(this).addClass('selected');
					emailData = DT_EMAILS.rows('.selected').data().toArray();

					if (emailData[0].termsAndCondition) {
						$('#nav-terms-condition').show();
					} else {
						$('#nav-terms-condition').hide();
					}

					$('#email-notif-form input[name=id]').val(emailData[0].id);
					$('#email-notif-form input[name=subject]').val(emailData[0].subject);
					$('iframe:eq(0)').contents().find("body").html(emailData[0].content);
					$('iframe:eq(1)').contents().find("body").html(emailData[0].termsAndCondition);

					});
			}
		});

		$('#order-list thead').hide();
		$('.loading-state').fadeOut('slow');
	}

	// update email template on local array
	function updateEmailTemplateLocal(emailId, { subject, content, termsAndCondition }) {
		let index = LCLDB_EMAILS.findIndex(item => item.id == emailId);
		LCLDB_EMAILS[index]['subject'] = subject;
		LCLDB_EMAILS[index]['content'] = content;
		LCLDB_EMAILS[index]['termsAndCondition'] = termsAndCondition;
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

	$('#btn-help').click(function(event){
		let helptype = $(this).attr('data-help');
		helpCarousel(helptype)
	});

	$('#edit-email-notif-btn').click(function(){
		var doc = $('#email-notif-form').serializeObject();

		displayError('email-notif-form');
		if (!doc.subject.trim() || !doc.content.trim()) { // check if blank
			resultNotify('fa-exclamation-circle', 'INVALID', `All fields are <b>required</b>`, 'warning');
			return;
		}

		$('.loading-state').fadeIn('slow');
		disableBtn($(this));

		setTimeout(() => {
			let id = doc.id;
			let email = {
				subject : doc.subject,
				content : doc.content,
				termsAndCondition : doc.termsAndCondition,
			}

			updateEmailTemplate(id, email, (err, res) => {
				setTimeout(() => { enableBtn($(this)); }, 1000);

				if (err || res.statusCode >= 300) {
					console.log(res);
					$('.loading-state').fadeOut('slow');
					resultNotify('fa fa-times', 'ERROR', 'Cannot Apply Changes.<br>Something went wrong. Please try again later', 'danger');
					return;
				}

				if (res.statusCode <= 299) {
					resultNotify('fa-check-circle', 'SUCCESS', 'Changes successfully saved', 'success');
					let emailType = LCLDB_EMAILS.find(item => item.id == id);

					if (LOG_FUNCTION) {	
						createLog(`LOG::${LOCAL_STORAGE.referenceId}`, {
							dateCreated : moment().toISOString(),
							action : `Set email template configuration for ${emailType.type}`,
							module : "Settings/Email",
							app : "AMI"
						}, moment().toISOString());
					}

					config.db = 'local';
					updateEmailTemplateLocal(id, email);
					setTimeout(function(){ loadEmailList(); }, 2000);
				}
			});

			/*config.db = 'local';
			updateEmailTemplateLocal(id, email);
			setTimeout(function(){ loadEmailList(); }, 2000);*/
		}, 1000);
	});

});