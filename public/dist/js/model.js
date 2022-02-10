var DEPLOYED_ON = 'LOCAL';
var EMAIL_SENDING = false;
var HELP_FUNCTION = true;
var LOG_FUNCTION = true;
var LOCAL_STORAGE = JSON.parse(localStorage.getItem('userData'));

if (LOCAL_STORAGE != null) {
	var sessionId = LOCAL_STORAGE.sessionId;
	generateSidebar(localdata_MODULES.AMI);
	setSidebarPermission(LOCAL_STORAGE.amiModules);
	setUserInfo(LOCAL_STORAGE);
}

var COUNTRY_CODE = {
	'JP' : ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
	'TH' : ['L', 'J'],
	'IN' : ['N'],
	'EU' : ['R', 'S', 'Y', 'P', 'G'],
	'SF' : ['X'],
	'TA' : ['F'],
	'CH' : ['H']
}


var BSTSG_EMAILS = {
	logisticTeam   : ['avon.pang@bridgestone.com', 'jean.cheong@bridgestone.com', 'vivienne.tang@bridgestone.com'],
	accountTeam    : ['weejein.tan@bridgestone.com', 'ruth.yip@bridgestone.com', 'jessica.liaw@bridgestone.com'],
	managementTeam : [], // 'shirley.lee@bridgestone.com'
	salesManager   : ['dennis.lee@bridgestone.com', 'jeffrey.boey@bridgestone.com']
}

var DEV_EMAILS = {
	OPS_BST : ['patrick.caringal.ops@gmail.com'] // 'avon.pang@bridgestone.com',
}

function enableHelpFunction() {
	if(HELP_FUNCTION == true){
		$('#btn-help').show();
		$('#btn-help-multiple').show();
	}
}

function generateSidebar(modules) {
	$('#sidebar-append').empty().append(`<li class="treeview"><a href="/ami/index/ROLE::1599912f-7b4e-4211-acd1-ee9fa84f6e64"><i class="fa fa-dashboard"></i> <span>Dashboard</span><span class="pull-right-container"></span></a></li>`);

	for (let i in modules) {
		let moduleName = modules[i].label;
		$('#sidebar-append').append(`
			<li class="treeview" data-sidebar-module="${i}">
				<a href="#">
					<i class="${modules[i].icon}"></i>
					<span>${moduleName}</span>
					<span class="pull-right-container"><i class="fa fa-angle-left pull-right"></i></span>
				</a>
			<ul class="treeview-menu"></ul>
			</li>`); // class="treeview-menu menu-open" style="display: block;"

		let submodules = modules[i].modules;
		for (let j in submodules) {
			let submoduleName = submodules[j].label;
			$(`#sidebar-append li[data-sidebar-module="${i}"] ul`).append(`<li data-sidebar-treeview-module="${i}" data-sidebar-treeview-submodule="${j}"><a style="font-size: 12px !important;" class="small-font" href="/ami/${i}/${j}/ROLE::8937522f-951d-40d2-907d-626573d1766d"><i class="fa fa-circle-o"></i> ${submoduleName}</a></li>`);
		}
	}
}

function setSidebarPermission(rolePermission) {
	for (let i in rolePermission) {
		let moduleName = i, submodules = rolePermission[i], allFalse = true;
		for (let j in submodules) {
			submoduleName = j;
			if (submodules[j] == true) allFalse = false;
			else {
				$(`#sidebar-append [data-sidebar-treeview-module="${moduleName}"][data-sidebar-treeview-submodule="${submoduleName}"]`).remove();
				// console.log(`${moduleName} ${submoduleName}`);
			}
		}

		if (allFalse) $(`#sidebar-append [data-sidebar-module="${moduleName}"]`).remove();
	}
}

function setUserInfo({ firstName, lastName, role}) {
	$('[data-logged-in="fullname"]').text(`${firstName} ${lastName}`);
	$('[data-logged-in="role"]').text(`${role}`);
}

function resetLocalStorage(key, value) {
	localStorage.removeItem(key);
	localStorage.setItem(key, JSON.stringify(value));
}


function emailOrders(orderDetails, tableData, orderData, emailData, type, callback) {
	var data = {
		orderDetails : orderDetails,
		tableData : tableData,
		orderData : orderData,
		emailData : emailData
	}

	var controllerPath = '';

	switch (type) {
		case 'processOrder':
		controllerPath = 'emailOrders';
		break;

		case 'processBackorder':
		controllerPath = 'emailBackorders';
		break;

		case 'rejectOrder': //
		controllerPath = 'emailRejectedOrders';
		break;

		case 'rejectBackorder':
		controllerPath = 'emailRejectedBackorders';
		break;
	}

	if (EMAIL_SENDING) {
		$.ajax({
			url   : '/email/'+controllerPath+'/',
			type  : 'POST',
			data  : data,
			async : false,
			success : function(data){
				callback(null, data);
			}
		});
	} else {
		callback(null, 'ok');
	}
}





function createOrder_SAP(info, callback) {
	$.ajax({
		url   : '/SAP/createOrder',
		type  : 'POST',
		data  : info,
		async : false,
		success : function(data){
			callback(null, data);
		}
	});
}



function releaseSalesOrder_SAP(salesOrderNo, callback) {
	$.ajax({
		url: '/SAP/releaseSalesOrder/' + salesOrderNo,
		type: 'POST',
		async: false,
		success: function(data){
			callback(null, data);
		}
	});
}



function getStockAvailable_SAP(materialCode, storageLocation, callback) {
	$.ajax({
		url: '/SAP/stockStatus/' + materialCode + '/' + storageLocation,
		type: 'POST',
		async: false,
		success: function(data){
			callback(null, data);
		}
	});
}



function getCreditLimit_SAP(customerCode, callback) {
	$.ajax({
		url: '/SAP/creditLimit/' + customerCode,
		type: 'POST',
		async: false,
		success: function(data){
			callback(null, data);
		}
	});
}



function getOverduePayment_SAP(customerCode, callback) {
	$.ajax({
		url: '/SAP/overduePayment/' + customerCode,
		type: 'POST',
		async: false,
		success: function(data){
			callback(null, data);
		}
	});
}

var GLOBAL_PERMISSION = {
	amiPermission : {
		'userManagement' : ['role', 'permission', 'user', 'invitation', 'distributionChannel'],
		'approval' : ['creditLimit', 'creditNote', 'normalSales', 'specialSales', 'controlledItemsRequest'],
		'discount' : ['channel', 'moq', 'factorySupport', 'timeLimited', 'dealer'],
		'masterData' : ['customer', 'material', 'price'],
		'settings' : ['limit', 'stock', 'email', 'application', 'forceSync'] // force sync
	},
	wosPermission : {
		'order': ['normalOrder', 'specialOrder', 'consignmentOrder', 'backorder', 'orderTransaction'],
		'user' : ['profile'] // can be removed
	}
}



function loginUser(info, callback) {
	Pace.restart();

	$.ajax({
		url: '/credential/loginUser/',
		type: 'POST',
		data: info,
		async: false,
		success: function(data){
			callback(null, data);
		}
	});
}



function loadAll(viewType, viewName, callback) {

	$.ajax({
		url: '/load/document/' + viewType + '/' + viewName + '/' + sessionId,
		type: 'GET',
		async: false,
		success: function(data){
			callback(null, data);
		}
	});
}



function createDocument2(id, info, callback) {
	$.ajax({
		url: '/create/createDocument2/' + id,
		type: 'POST',
		data: info,
		async: false,
		success: function(data){
			callback(null, data);
		}
	});
}



function updateDocument(docId, newDoc, callback) {
	$.ajax({
		url: '/update/updateDocument/' + docId,
		type: 'PUT',
		data: newDoc,
		async: false,
		success: function(data){
			callback(null, data);
		}
	});
}



function deleteChannel(id, callback) {
	$.ajax({
		url: '/delete/deleteChannel/' + id,
		type: 'DELETE',
		async: false,
		success: function(data){
			callback(null, data);
		}
	});
}



function updatePermission(docId, newDoc, callback) {
	$.ajax({
		url: '/update/permission/' + docId,
		type: 'PUT',
		data: newDoc,
		async: false,
		success: function(data){
			Pace.restart();
			callback(null, data);
		}
	});
}



function createUser(info, callback) {
	$.ajax({
		url: '/credential/createUser/',
		type: 'POST',
		data: info,
		async: false,
		success: function(data){
			callback(null, data);
		}
	});
}



function createCustomerUserAccount(info, callback) {
	$.ajax({
		url: '/credential/createCustomerUserAccount/',
		type: 'POST',
		data: info,
		async: false,
		success: function(data){
			callback(null, data);
		}
	});
}



function createSalespersonUserAccount(info, callback) {
	$.ajax({
		url: '/credential/createSalespersonUserAccount/',
		type: 'POST',
		data: info,
		async: false,
		success: function(data){
			callback(null, data);
		}
	});
}



function updateSalesperson_CustomerMap(info, referenceId, callback) {
	$.ajax({
		url: '/credential/updateSalesperson_CustomerMap/' + referenceId,
		type: 'POST',
		data: info,
		async: false,
		success: function(data){
			callback(null, data);
		}
	});
}






function sendCustomerInvite(info, callback) {
	$.ajax({
		url: '/email/sendCustomerInvite/',
		type: 'POST',
		data: info,
		async: false,
		success: function(data){
			callback(null, data);
		}
	});
}


function sendSalespersonInvite(info, callback) {
	$.ajax({
		url: '/email/sendSalespersonInvite/',
		type: 'POST',
		data: info,
		async: false,
		success: function(data){
			callback(null, data);
		}
	});
}


function sendEmail(info, callback) {
	$.ajax({
		url: '/email/sendEmail/',
		type: 'POST',
		data: info,
		async: false,
		success: function(data){
			callback(null, data);
		}
	});
}



function loadByKey(viewType, viewName, key, callback) {
	$.ajax({
		url: '/load/document/'+viewType+'/'+viewName+'/'+key+'/'+sessionId,
		type: 'GET',
		async: false,
		success: function(data){
			callback(null, data);
		}
	});
}


function loadBy2Key(viewType, viewName, key1, key2, callback) {

	$.ajax({
		url: '/load/document/'+viewType+'/'+viewName+'/'+key1+'/'+key2+'/'+sessionId,
		type: 'GET',
		async: false,
		success: function(data){
			callback(null, data);
		}
	});
}


function loadById(id, callback) {
	$.ajax({
		url: '/load/document/'+id,
		type: 'GET',
		async: false,
		success: function(data){
			callback(null, data);
		}
	});
}


// function createRole(idPrefix, info, callback) {
//   $.ajax({
//     url: '/create/role/'+idPrefix, // create model, document method
//     type: 'POST',
//     data: info,
//     async: false,
//     success: function(data){
//       callback(null, data);
//     }
//   });
// }



// function updateRole(id, rev, info, callback) {
//   $.ajax({
//     url: '/update/role/' + id + '/' + rev, // create model, document method
//     type: 'POST',
//     data: info,
//     async: false,
//     success: function(data){
//       callback(null, data);
//     }
//   });
// }


// function updatePermission(id, rev, info, callback) {
//   $.ajax({
//     url: '/update/permission/' + id + '/' + rev, // create model, document method
//     type: 'POST',
//     data: info,
//     async: false,
//     success: function(data){
//       callback(null, data);
//     }
//   });
// }

function updateUser(id, rev, info, callback) {
	$.ajax({
		url: '/credential/updateUser/' + id + '/' + rev, // create model, document method
		type: 'POST',
		data: info,
		async: false,
		success: function(data){
			Pace.restart();
			callback(null, data);
		}
	});
}






function setUserData() {
	var name = JSON.parse(localStorage.getItem("userData")).firstName + ' ' +JSON.parse(localStorage.getItem("userData")).lastName
	var role = JSON.parse(localStorage.getItem("userData")).roleDesc;
	var dateCreated = convertToLongDate(JSON.parse(localStorage.getItem("userData")).dateCreated);

	$('.user-name').text(name);
	$('.user-dateCreated').text(dateCreated);
	$('.user-role').text(role);
}



function convertToLongDate(date) {
	date = new Date(date);
	var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
	return monthNames[date.getMonth()] + " " + date.getDate() + ", " + date.getFullYear();
}

function convertToSemiShortDate(date) {
	date = new Date(date);
	var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
	return monthNames[date.getMonth()].slice(0, 3) + " " + date.getDate() + ", " + date.getFullYear();
}



$('#sign-out').click(() => {
	deleteSession((err, res) => {
		console.log(err, res);
		if (err || res.statusCode >= 300) alert('error loggin out')
		else if (res.statusCode <= 299) {
			localStorage.clear();
			window.location.href = '/';
		}
	});
});


function checkSession() {
	if (sessionId == null) { window.location.href = '/'; }
}

function convertToNumber(data, form) {
	if (form == 'whole') {
		return data.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
	} else if (form == '2-decimal') {
		return round2Dec(data).toFixed(2).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
	}
}

function round2Dec(num) {
	return Math.round(Number(num) * 100) / 100
}


function loadInterval(callback) {
	var counter = 1;
	var setIntervalId = setInterval(function(){
		if(counter != 3){
			callback();
		}
		else{
			clearInterval(setIntervalId);
		}
		counter++;
	}, 1000);
}



function loadIntervalFinish(callback) {
	Pace.restart();
	var counter = 1;
	var setIntervalId = setInterval(function(){
		if(counter != 3){
			callback();
		}
		else{
			$('.loading-state').fadeOut('slow');
			clearInterval(setIntervalId);
		}
		counter++;
	}, 1000);
}



$.fn.serializeObject = function() {
	var o = {};
	var a = this.serializeArray();
	$.each(a, function() {
		if (o[this.name]) {
			if (!o[this.name].push) {
				o[this.name] = [o[this.name]];
			}
			o[this.name].push(this.value || '');
		} else {
			o[this.name] = this.value || '';
		}
	});
	return o;
}


function createOrder(doc, callback) {
	$.ajax({
		url: '/create/createOrder/',
		type: 'POST',
		data: doc,
		async: false,
		success: function(data) {
			callback(null, data);
		}
	});
}


function loadItemCode(orderType, callback){
	$.ajax({
		url: '/load/itemCode/' + orderType,
		type: 'GET',
		async: false,
		success: function(data){
			callback(null, data);
		}
	});
}



function deleteDocument(id, callback) {
	$.ajax({
		url: '/delete/document/' + id,
		type: 'DELETE',
		async: false,
		success: function(data){
			callback(null, data);
		}
	});
}



function channelDeleteDocument(id, callback) {
	$.ajax({
		url: '/delete/channelDeleteDocument/' + id,
		type: 'DELETE',
		async: false,
		success: function(data){
			callback(null, data);
		}
	});
}


function sendDynamicEmail(doc, callback) {
	$.ajax({
		url: '/email/sendEmail/',
		type: 'POST',
		data: doc,
		async: false,
		success: function(data){
			callback(null, data);
		}
	});
}







// function newUpdateDocument(docId, newDoc, callback) {
//   $.ajax({
//     url: '/update/' + docId,
//     type: 'PUT',
//     data: newDoc,
//     async: false,
//     success: function(data){
//       Pace.restart();
//       callback(null, data);
//     }
//   });
// }



function updateReduceNumber(docId, deductQuantity, callback) {
	$.ajax({
		url: '/update/reduce/' + docId + '/' + deductQuantity,
		type: 'PUT',
		async: false,
		success: function(data){
			Pace.restart();
			callback(null, data);
		}
	});
}



function updateIncreaseNumber(docId, increaseQuantity, callback) {
	$.ajax({
		url: '/update/increase/' + docId + '/' + increaseQuantity,
		type: 'PUT',
		async: false,
		success: function(data){
			Pace.restart();
			callback(null, data);
		}
	});
}










function orderDocument(callback) {
	$.ajax({
		url: '/load/orderDocument/' + sessionId,
		type: 'GET',
		async: false,
		success: function(data){
			callback(null, data);
		}
	});
}



// function loadNormalOrder(callback) {
// 	$.ajax({
// 		url: '/load/loadNormalOrder/' + sessionId,
// 		type: 'GET',
// 		async: false,
// 		success: function(data){
// 			callback(null, data);
// 		}
// 	});
// }


function loadNormalOrder2(callback) {
	$.ajax({
		url: '/load/loadNormalOrder2/' + sessionId,
		type: 'GET',
		async: false,
		success: function(data){
			callback(null, data);
		}
	});
}


function loadSpecialOrder2(callback) {
	$.ajax({
		url: '/load/loadSpecialOrder/' + sessionId,
		type: 'GET',
		async: false,
		success: function(data){
			callback(null, data);
		}
	});
}


function loadCreditExceedOverdueOrder(callback) {
	$.ajax({
		url: '/load/loadCreditExceedOverdueOrder/' + sessionId,
		type: 'GET',
		async: false,
		success: function(data){
			callback(null, data);
		}
	});
}



function orderDocument2(callback) {
	$.ajax({
		url: '/load/orderDocument2/' + sessionId,
		type: 'GET',
		async: false,
		success: function(data){
			callback(null, data);
		}
	});
}



function orderDocument3(callback) {
	$.ajax({
		url: '/load/orderDocument3/' + sessionId,
		type: 'GET',
		async: false,
		success: function(data){
			callback(null, data);
		}
	});
}



function backorderDocument(callback) {
	$.ajax({
		url: '/load/backorderDocument/' + sessionId,
		type: 'GET',
		async: false,
		success: function(data){
			callback(null, data);
		}
	});
}



function backorderDocument2(callback) {
	$.ajax({
		url: '/load/backorderDocument2/' + sessionId,
		type: 'GET',
		async: false,
		success: function(data){
			callback(null, data);
		}
	});
}


function materialDocument(callback) {
	$.ajax({
		url: '/load/materialDocument/' + sessionId,
		type: 'GET',
		async: false,
		success: function(data){
			callback(null, data);
		}
	});
}


/*
invitation.js
*/
function loadCustomerUser_WithoutAccount(partnerType, role, callback) {
	$.ajax({
		url: '/load/loadCustomerUser_WithoutAccount/' + partnerType + '/' + role + '/' + sessionId,
		type: 'GET',
		async: false,
		success: function(data){
			callback(null, data);
		}
	});
}


/*
user.js
*/
function loadUser_NotCustomer_NotSaleperson(role1, role2, callback) {
	$.ajax({
		url: '/load/loadUser_NotCustomer_NotSaleperson/' + role1 + '/' + role2 + '/' + sessionId,
		type: 'GET',
		async: false,
		success: function(data){
			callback(null, data);
		}
	});
}


// customer
function loadUser_ByRole(role, roleDesc, callback) {
	$.ajax({
		url: '/load/loadUser_ByRole/' + role + '/' + roleDesc + '/' + sessionId,
		type: 'GET',
		async: false,
		success: function(data){
			callback(null, data);
		}
	});
}

/*
kael salesperson.js
*/
function loadOrder_BySalesPerson(roleId, orderItemStatus, startDate, endDate,  callback) {
	$.ajax({
		url: '/load/loadOrder_BySalesPerson/'+roleId+'/'+orderItemStatus+'/'+startDate+'/'+endDate +'/'+sessionId,
		type: 'GET',
		async: false,
		success: function(res){
			callback(null, res);
		}
	});
}


/*
user.js
*/
function loadCustomer_ByPartnerType(viewType, viewName, partnerType, callback) {
	$.ajax({
		url: '/load/loadCustomer_ByPartnerType/'+viewType+'/'+viewName+'/'+partnerType+'/'+sessionId,
		type: 'GET',
		async: false,
		success: function(data){
			callback(null, data);
		}
	});
}



function loadCustomer_ByCustomerCode_ByPartnerType(customerCode, partnerType, callback) {
	$.ajax({
		url   : '/load/loadCustomer_ByCustomerCode_ByPartnerType/'+customerCode+'/'+partnerType+'/'+sessionId,
		type  : 'GET',
		async : false,
		success : function(data){
			callback(null, data);
		}
	});
}







function disableButton(button) {
	$(button).prop('disabled', true).prepend('<i class="fa fa-spinner fa-spin"></i> ');

	setTimeout(function(){
		$(button).prop('disabled', false);
		$(button + ' i.fa-spinner').remove();
	}, 2000);
}


function disableButtonTemp(button) {
	$(button).prop('disabled', true).prepend('<i class="fa fa-spinner fa-spin"></i> ');
}



function enableButton(button) {
	$(button).prop('disabled', false);
	$(button).find('i.fa-spinner').remove();
}



// Cedrix --- 'reports/pendingOrder.js'
function loadPendingOrder_ExceedCreditLimit(callback) {
	$.ajax({
		url: '/load/loadPendingOrder_ExceedCreditLimit/' + sessionId,
		type: 'GET',
		async: false,
		success: function(data){
			callback(null, data);
		}
	});
}



// Cedrix --- 'reports/pendingOrder.js'
function loadPendingOrder_ExceedOverduePayment(callback) {
	$.ajax({
		url: '/load/loadPendingOrder_ExceedOverduePayment/' + sessionId,
		type: 'GET',
		async: false,
		success: function(data){
			callback(null, data);
		}
	});
}



// Cedrix --- 'reports/deliverySchedule.js'
function loadDelivery_Report(callback) {
	$.ajax({
		url: '/load/loadDelivery_Report/' + sessionId,
		type: 'GET',
		async: false,
		success: function(data){
			callback(null, data);
		}
	});
}



// Cedrix --- 'reports/selfCollection.js'
function loadSelfCollection_Report(callback) {
	$.ajax({
		url: '/load/loadSelfCollection_Report/' + sessionId,
		type: 'GET',
		async: false,
		success: function(data){
			callback(null, data);
		}
	});
}


// Cedrix --- 'extra/logs.js'
function updateDocumentArray(docId, newDoc, callback) {
	$.ajax({
		url: '/update/updateDocumentArray/' + docId,
		type: 'PUT',
		data: newDoc,
		async: false,
		success: function(data){
			callback(null, data);
		}
	});
}


function loadMaterialMasterData(callback) {
	$.ajax({ url: `/load/loadMaterialMasterData/${sessionId}` , type: 'GET', async: false })
	.done(data => { callback(null, data); });
}

// ~~~ NOTE
function loadMaterialNote(callback) {
	$.get({ url: `/load/loadMaterialNote/${sessionId}`, async: false })
	.done((data) => { callback(null, data); });
}

function manageMaterialNote(obj, action, callback) {
	$.ajax({ url: `/update/manageMaterialNote/${action}`, type: 'PUT', data: obj, async: false })
	.done(data => { callback(null, data); });
}

// ~~~ BLOCK
function loadMaterialBlock(callback) {
	$.get({ url: `/load/loadMaterialBlock/${sessionId}`, async: false })
	.done((data) => { callback(null, data); });
}

// materialblock
function manageMaterialBlock(obj, action, callback) {
	$.ajax({ url: '/update/manageMaterialBlock/'+action, type: 'PUT', data: obj, async: false })
	.done(data => { callback(null, data); });
}

  // Cedrix --- 'extra/logs.js'
  function loadLog_ByDate(date, callback) {
    $.ajax({
      url: '/load/loadLog_ByDate/' + date +'/'+ sessionId,
      type: 'GET',
      async: false,
      success: function(data){
        callback(null, data);
      }
    });
  }


  // customer
  function loadCustomerSalesValue_ByDate(data, callback) {
    $.post({ url: `/load/loadCustomerSalesValue_ByDate/${sessionId}`, data, async: false })
    .done((data) => { callback(null, data); });
  }


function disableBtn(button) {
	$(button).prop('disabled', true).prepend('<i class="fa fa-spinner fa-spin"></i> ');
}

function enableBtn(button) {
	$(button).prop('disabled', false).find('i.fa-spinner').remove();
}

// ~~~ AUTHENTICATION

// login
function authenticateUser(data, callback) {
	$.post({ url: `/authentication/`, data, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}

// all
function deleteSession(callback) {
	$.ajax({ url: `/authentication/${sessionId}`, type: 'DELETE', async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}

// login
function loadUserdocByUsername(data, callback) {
	$.post({ url: `/authentication/loaduserdocbyusername`, data, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}

// login
function registerWrongLogin(data, callback) {
	$.post({ url: `/authentication/registerWrongLogin`, data, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}

// login
function updateThreshold(id, data, callback) {
	$.ajax({ url: `/authentication/passthreshold/${id}`, type: 'PUT', data, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(error, null); });
}

// login
function encryptPassword(data, callback) {
	$.post({ url: `/authentication/encrypt/newpassword`, data, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}

// login
function comparePassword(data, callback) {
	$.post({ url: `/authentication/compare/oldpassword`, data, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}

// ~~~ ROLES

// permission, role, user
function loadRoles(callback) {
	$.get({ url: `/role/`, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(error, null); });
}

// role
function createRole(data, callback) {
	$.post({ url: `/role/`, data, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(error, null); });
}

// role
function updateRole(id, data, callback) {
	$.ajax({ url: `/role/${id}`, type: 'PUT', data, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(error, null); });
}

// role
function deleteRole(id, callback) {
	$.ajax({ url: `/role/${id}`, type: 'DELETE', headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(error, null); });
}

// permission
function savePermission(id, app, permission, callback) {
	let data = { app, permission };
	$.ajax({ url: `/role/permission/${id}`, type: 'PUT', data, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); });
}


// ~~~ USERS

// profile
function loadUser(id, callback) {
	$.get({ url: `/user/${id}`, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}

// user
function loadOtherUser(data, callback) {
	$.post({ url: `/user/other/`, headers: { 'x-sessionId': sessionId }, data, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}

// customerorder
function loadCustomerUser(data, callback) {
	$.post({ url: `/user/customer/`, headers: { 'x-sessionId': sessionId }, data, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}

// invitation
function loadCustomers_WithoutAccount(data, callback) {
	$.post({ url: `/user/customers_WithoutAccount/`, headers: { 'x-sessionId': sessionId }, data, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}

// user, psrtbrchannel
function loadSalespersonUser(data, callback) {
	$.post({ url: `/user/salesperson/`, headers: { 'x-sessionId': sessionId }, data, async: false })
	.done(data => { callback(null, data); });
}

// invitation
function loadSalespersons_WithoutAccount(data, callback) {
	$.post({ url: `/user/salespersons_WithoutAccount/`, headers: { 'x-sessionId': sessionId }, data, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}

// creditoverdue
function loadCustomerSalesperson(data, callback) {
	$.post({ url: `/user/customer/salesperson`, headers: { 'x-sessionId': sessionId }, data, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}

// creditoverdue
function loadCustomerSalespersonDoc(data, callback) {
	$.post({ url: `/user/customer/customersalesperson`, headers: { 'x-sessionId': sessionId }, data, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}

// role
function countUserByRole(id, callback) {
	$.get({ url: `/user/count/byRole/${id}`, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(error, null); });
}

// user
function createUser2(data, callback) {
	$.post({ url: `/user/createUser/`, data, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(error, null); });
}

// invitation
function createCustomerUser(data, callback) {
	$.post({ url: `/user/createCustomerUser/`, data, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(error, null); });
}

// invitation
function createSalespersonUser(data, callback) {
	$.post({ url: `/user/createSalespersonUser/`, data, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(error, null); });
}

// user
function updateUser2(id, data, callback) {
	$.ajax({ url: `/user/id/${id}`, type: 'PUT', data, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(error, null); });
}

// profile, user
function saveUser(id, data, callback) {
	$.ajax({ url: `/user/${id}`, type: 'PUT', data, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); });
}

// user
function deleteUser(id, callback) {
	$.ajax({ url: `/user/${id}`, type: 'DELETE', headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(error, null); });
}

// profile.js
function updatePassword(id, data, callback) {
	$.ajax({ url: `/user/password/${id}`, type: 'PUT', data, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); });
}

// login
function resetPassword(data, callback) {
	$.post({ url: `/user/password/reset`, data, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}


// ~~~ DISCOUNT

// discount
function channelDiscount(callback) {
	$.get({ url: `/discount/channel`, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}

// discount
function factoryDiscount(callback) {
	$.get({ url: `/discount/factory`, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}

// discount
function moqDiscount(callback) {
	$.get({ url: `/discount/moq`, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}

// discount
function timeLimitedDiscount(callback) {
	$.get({ url: `/discount/timeLimited`, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}


// ~~~ MATERIAL

// normalsales, specialsales, creditoverdue
function loadMaterial(id, callback) {
	$.get({ url: `/material/id/${id}`, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}

// material, limit
function loadAllMaterial(callback) {
	$.post({ url: `/material/loadAllMaterial`, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}

// materialnote
function loadAllMaterialNote(callback) {
	$.post({ url: `/material/loadAllMaterialNote`, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}

// materialblock
function loadAllMaterialBlock(callback) {
	$.post({ url: `/material/loadAllMaterialBlock`, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}

// materialblock
function updateMaterialLevel2(id, data, callback) {
	$.ajax({ url: `/material/udpate/2ndlevel/${id}`, type: 'PUT', data, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(error, null); });
}

// materialblock
function updateMaterialBlock(id, data, callback) {
	$.ajax({ url: `/material/udpate/${id}`, type: 'PUT', data, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(error, null); });
}

function updateMaterialNote(id, data, callback) {
	$.ajax({ url: `/material/udpate/${id}`, type: 'PUT', data, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(error, null); });
}

// materialblock
function updateUnsetMaterial(id, data, callback) {
	$.ajax({ url: `/material/udpate/unset/${id}`, type: 'PUT', data, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(error, null); });
}

// settings/materialblock
function updateUnsetMaterialLevel2(id, data, callback) {
	$.ajax({ url: `/material/udpate/unset/2ndlevel/${id}`, type: 'PUT', data, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(error, null); });
}

// ~~~ CUSTOMER

// user, customer
function loadMainCustomers(callback) {
	$.get({ url: `/customer/loadMainCustomers/`, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}

// customer
function loadAllCustomerShipTo(callback) {
	$.get({ url: `/customer/loadAllCustomerShipTo/`, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}


// ~~~ STOCK

// normalsales, specialsales, creditoverdue
function loadStock(id, callback) {
	$.get({ url: `/stock/id/${id}`, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}

// normalsales, specialsales, creditoverdue
function loadAllStock(callback) {
	$.get({ url: `/stock/all`, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}

// limit(visible stock)
function updateStock(id, data, callback) {
	$.ajax({ url: `/stock/updateStock/${id}`, type: 'PUT', data, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(error, null); });
}


// ~~~ EMAIL

// email
function loadAllEmails(callback) {
	$.post({ url: `/emailnotif/loadAllEmails`, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}

// email
function updateEmailTemplate(id, data, callback) {
	$.ajax({ url: `/emailnotif/updateEmailTemplate/${id}`, type: 'PUT', data, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(error, null); });
}

// normalsales, specialsales, creditoverdue
function sendOrderNotif(data, callback) {
	if (EMAIL_SENDING) {
		$.post({ url: `/emailnotif/order`, data, headers: { 'x-sessionId': sessionId }, async: false })
		.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
	} else callback(null, 'oks');
}

// normalsales, specialsales, creditoverdue
function sendRejectOrderNotif(data, callback) {
	if (EMAIL_SENDING) {
		$.post({ url: `/emailnotif/rejectorder`, data, headers: { 'x-sessionId': sessionId }, async: false })
		.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
	} else callback(null, 'oks');
}

// user
function resendInvite(data, callback) {
	if (EMAIL_SENDING) {
		$.post({ url: `/emailnotif/resendInvite/`, data, headers: { 'x-sessionId': sessionId }, async: false })
		.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
	} else callback(null, 'oks');
}



// ~~~~ MAX ORDER QUANTITY

function loadMaxOrderQuantity(id, callback) {
	$.get({ url: `/maxorderquantity/id/${id}`, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}

// contact, all max order quantity, max order quantity per sku
function updateMaxOrderQuantity(id, data, callback) {
	$.ajax({ url: `/maxorderquantity/updateMaxOrderQuantity/${id}`, type: 'PUT', data, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(error, null); });
}

function updateAllMaxOrderQuantity(data, callback) {
	$.ajax({ url: `/maxorderquantity/update/multi`, type: 'PUT', data, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
} 

// material
function loadAllMaterialWithMaxOrderQuantity(callback) {
	$.post({ url: `/maxorderquantity/loadAllMaterial`, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}



// ~~~ DI

// normalsales, specialsales, creditoverdue
function DI_stockStatus(data, callback) {
	$.post({ url: `/DI/stockStatus`, data, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}

// normalsales, specialsales, creditoverdue
function DI_creditStatus(data, callback) {
	$.post({ url: `/DI/creditStatus`, data, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}

// normalsales, specialsales, creditoverdue
function DI_overduePaymentStatus(data, callback) {
	$.post({ url: `/DI/overduePaymentStatus`, data, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}

// normalsales, specialsales, creditoverdue
function DI_createreleaseOrder(data, callback) {
	$.post({ url: `/DI/createreleaseOrder`, data, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}

// normalsales, specialsales, creditoverdue
function DI_releaseDeliveryBlock(data, callback) {
	$.post({ url: `/DI/releaseDeliveryBlock`, data, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}

// creditoverdue
function DI_releaseCreditBlock(data, callback) {
	$.post({ url: `/DI/releaseCreditBlock`, data, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}

function DI_rejectCreditStatus(data, callback) {
	$.post({ url: `/DI/rejectCreditStatus`, data, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}

function DI_rejectOrderSO(data, callback) {
	$.post({ url: `/DI/rejectOrderSO`, data, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}

function DI_calculateDisocunt(data, callback) {
	$.post({ url: `/DI/calculateDisocunt`, data, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}


function DI_orderStatus(data, callback) {
	$.post({ url: `/DI/orderStatus`, data, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}

// ~~~ ORDER

// normalsales
function createBackorders(data, callback) {
	$.post({ url: `/order/backorder/multi`, data, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(error, null); });
}

// normalsales, specialsales, creditoverdue
function updateOrders(data, callback) {
	$.ajax({ url: `/order/update/multi`, type: 'PUT', data, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}

// normalsales
function loadNormalOrder(callback) {
	$.post({ url: `/order/normal`, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}

// normalsales
function loadAllBackorder(callback) {
	$.get({ url: `/order/normal/backorder`, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}

// specialsales
function loadSpecialOrder(callback) {
	$.post({ url: `/order/special`, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}

// creditoverdue
function loadAllCreditOverduOrder(callback) {
	$.post({ url: `/order/creditoverdue`, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}

// psrtbrchannel
function psrtbrChannelReport(data, callback) {
	$.post({ url: `/order/report/psrtbrchannel`, headers: { 'x-sessionId': sessionId }, data, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(error, null); });
}

// mtpgroupbysalesman
function mtpSalesmanReport(data, callback) {
	$.post({ url: `/order/report/mtpsalesman`, headers: { 'x-sessionId': sessionId }, data, async: false })
	.done((data) => { callback(null, data); }).fail((xhr, status, error) => { callback(error, null); });
}

 // customer
 function mtpCustomerReport(data, callback) {
 	$.post({ url: `/order/report/mtpgroupbycustomer`, headers: { 'x-sessionId': sessionId }, data, async: false })
 	.done((data) => { callback(null, data); });
 }

// customerorder
function customerOrderReport(data, callback) {
	$.post({ url: `/order/report/customerorder`, headers: { 'x-sessionId': sessionId }, data, async: false })
	.done((data) => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}

// backorder
function backOrderReport(data, callback) {
	$.post({ url: `/order/report/backorder`, headers: { 'x-sessionId': sessionId }, data, async: false })
	.done((data) => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}

// orderTransaction
function loadAllOrderBackorder(data, callback) {
	$.post({ url: `/order/all`, data, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}

// orderTransaction
function loadOrderBackorderByCustomerCode(customercode, data, callback) {
	$.post({ url: `/order/bycustomercode/${customercode}`, data, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}

// creditapproval report
function loadCreditApprovalReport(data, callback) {
	$.post({ url: `/order/report/creditapproval`, data, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}

// ~~~ LOGS

// logs
function loadLogs(data, callback) {
	$.post({ url: `/log/loadLog_ByDate/`, headers: { 'x-sessionId': sessionId }, data, async: false })
	.done(data => { callback(null, data); });
}

// logs
function updateLogs(id, data, callback) {
	$.ajax({ url: `/log/updateLogs/${id}`, type: 'PUT', data, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(error, null); });
}

// ~~~ CREDIT EXCEED APPROVAL LOGS

// Credit Exceed Approval Logs
function loadCreditExceedApprovalLogs(data, callback) {
	$.post({ url: `/creditExceedApprovalLogs/loadCreditExceedApprovalLogs_ByDate/`, headers: { 'x-sessionId': sessionId }, data, async: false })
	.done(data => { callback(null, data); });
}


// ~~~ DASHBOARD

// index
function loadDealers(data, callback) {
	$.post({ url: `/dashboard/dealers`, headers: { 'x-sessionId': sessionId }, data, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}

// index
function loadSalespersons(data, callback) {
	$.post({ url: `/dashboard/salespersons`, headers: { 'x-sessionId': sessionId }, data, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}

// index
function loadUsers(data, callback) {
	$.post({ url: `/dashboard/users`, headers: { 'x-sessionId': sessionId }, data, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}

// index
function loadNormalOrderCount(callback) {
	$.post({ url: `/dashboard/normal`, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}

// index
function loadSpecialOrderCount(callback) {
	$.post({ url: `/dashboard/special`, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}

// index
function loadCreditOrderCount(callback) {
	$.post({ url: `/dashboard/credit`, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}

// index
function loadRecentOrders(callback) {
	$.post({ url: `/dashboard/recentorders`, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}

// index
function loadBestSellerMaterial(callback) {
	$.post({ url: `/dashboard/bestsellermaterials`, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}

// index
function loadTopCustomers(callback) {
	$.post({ url: `/dashboard/topcustomers`, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}

// index
function loadOrdersToday(data, callback) {
	$.post({ url: `/dashboard/orderstoday`, data, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}

// index
function loadSalesToday(data, callback) {
	$.post({ url: `/dashboard/salestoday`, data, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}

// ~~~~ REPORT AUTOMATION

// report automation
function loadYtdSalesAndOrder(data, callback) {
	$.post({ url: `/report/ytdsalesandorder`, data, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}

// report automation
function loadTopBuyers(data, callback) {
	$.post({ url: `/report/topbuyers`, data, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}

// report automation
function loadOrderDetails(data, callback) {
	$.post({ url: `/report/loadorderdetails`, data, headers: { 'x-sessionId': sessionId }, async: false })
	.done(data => { callback(null, data); }).fail((xhr, status, error) => { callback(xhr.responseJSON, null); });
}


// ~~~ HELP MODULE

function helpCarousel(helptype) {
	// create dynamic
	let imgSource = helpList[helptype];
	let carouselInner = '', carouselIndicators = '';

	$('.carousel-control').hide()

	for(let i in imgSource) {
		carouselInner += `<div class="item"><img src="${imgSource[i]}"><div class="carousel-caption"></div> </div>`;
		carouselIndicators += `<li data-target="#carousel-example-generic" data-slide-to="${i}"></li>`;
	}

	$('#carousel-example-generic .carousel-indicators').html(carouselIndicators);
	$('#carousel-example-generic .carousel-inner').html(carouselInner);

	$('#carousel-example-generic .item').first().addClass('active');
	$('#carousel-example-generic .carousel-indicators > li').first().addClass('active');
	$('#carousel-example-generic').carousel('pause');
}

function helpCarouselMultiple(helptype, list) {
	// create dynamic
	let img;
	let imgSource = helpList[helptype];
	for(let i in imgSource) {
		img = imgSource[i][list]
	}

	let carouselInner = '', carouselIndicators = '';

	for(let i in img) {
		carouselInner += `<div class="item"><img src="${img[i]}"><div class="carousel-caption"></div> </div>`;
		// (imgSource == 1) ? 
		carouselIndicators += `<li data-target="#carousel-example-generic" data-slide-to="${i}"></li>`;
	}

	$('#carousel-example-generic .carousel-indicators').html(carouselIndicators);
	$('#carousel-example-generic .carousel-inner').html(carouselInner);

	$('#carousel-example-generic .item').first().addClass('active');
	$('#carousel-example-generic .carousel-indicators > li').first().addClass('active');
	$('#carousel-example-generic').carousel('pause');
}


// create log
function createLog(logId, log, dateUpdated) {
	let doc = {
		timestamp : dateUpdated,
		log
	};

	updateLogs(logId, doc, (err, res) => {
		// console.log(res)
	});
}