$(document).ready(function() {
	let LCLDB_ORDER, DT_ORDER_LIST, DT_ORDER, DT_BACKORDER;
	let ROLE_IDS = role_localdata;
	const cancelDisable = [ 'confirmed', 'scheduled', 'delivered', 'invoiced', 'cancelled', 'rejected'];
	const config = {
		// db : 'offline'
		db : 'couchbase'
	};

	$('#print-invoice-btn, #print-sales-form-btn').hide();
	$('#daterange-btn span').html(moment().format('MMM D, YYYY'))
	loadOrderList(moment().format('YYYY-MM-DD'), moment().format('YYYY-MM-DD'));
	$('#daterange-btn').attr('startDate', moment().format('YYYY-MM-DD')).attr('endDate', moment().format('YYYY-MM-DD'));
	// $('#daterange-btn').attr('startDate', moment().startOf('month').format('YYYY-MM-DD')).attr('endDate', moment().endOf('month').format('YYYY-MM-DD'));
	// loadOrderList(moment().startOf('month').format('YYYY-MM-DD'), moment().endOf('month').format('YYYY-MM-DD'));


	function loadOrderList(startDate, endDate) {
		let data;

		if (config.db == 'couchbase') {
			if (LOCAL_STORAGE.role != 'CUSTOMER') {
				loadAllOrderBackorder({startDate, endDate}, (err, res) => {
					if (err || res.statusCode >= 300) { alert('Unable to get order'); }
					else if (res.statusCode <= 299) { LCLDB_ORDER = res.result; data = LCLDB_ORDER; }
				});
			} else {
				loadOrderBackorderByCustomerCode(LOCAL_STORAGE.customerCode, {startDate, endDate}, (err, res) => {
					if (err || res.statusCode >= 300) { alert('Unable to get order'); }
					else if (res.statusCode <= 299) { LCLDB_ORDER = res.result; data = LCLDB_ORDER; }
				});
			}
		} else if (config.db == 'local') {
			data = LCLDB_ORDER;
		}

		if (data) {
			data = removeduplicate_1(data, 'salesOrderNo');
			DT_ORDER_LIST = $('#order-list').DataTable({
				destroy   : true,
				data      : data,
				order     : [[0, 'desc']],
				autoWidth : false,
				paging    : false,
				dom       : 'rt',
				language  : {  emptyTable: '<h4><b>No order</b></h4>' },

				columns: [
					{ data: 'salesOrderNo' },
					{ data: 'dateCreated' },
					{ data: 'customerName' }
				],
				columnDefs: [
					{
						targets: 2,
						render : (data, type, row) => `<div style="width: 150px; white-space:normal;">${data}</div>`
					},
					{
						targets: 0,
						render: (data, type, row) => `<b>${data}</b>`
					},
					{
						targets: 1,
						render: (data, type, row) => `<div style="width: 65px; white-space:normal;">${moment(data, 'YYYY-MM-DD hh:mm A').format('MMM DD, YYYY')}</div>`
					}
				],
				rowCallback: function (row, data, iDataIndex) {
					$(row)
						.css('cursor', 'pointer')
						.attr('id', data.id)
						.attr('data-salesOrderNo', data.salesOrderNo)
						.off('click').click(function() {
							$('#order-tab .btn-group button, #backorder-tab .btn-group button').removeClass('btn-primary').addClass('btn-default')
							$('#order-tab .btn-group button[data-action="details"], #backorder-tab .btn-group button[data-action="details"]').removeClass('btn-default').addClass('btn-primary');

							$('.loading-state-order, .loading-state-backorder').fadeIn();
							DT_ORDER_LIST.rows('.selected').nodes().to$().removeClass('selected');
							$(this).addClass('selected');

							setTimeout(() => {
								let tab = $('.nav-tabs > li.active > a').attr('data-action');
								if (tab == 'load-order') loadOrderDetailsTable(data.salesOrderNo, 'details')
								else if (tab == 'load-backorder') loadBackorderDetailsTable(data.salesOrderNo, 'details')
							}, 500);
						});
				}
			});

			$('#total-order-count').html(data.length)
			$('#order-list thead').hide();
			$('#order-filter').off('keyup').keyup(function(){ DT_ORDER_LIST.search($(this).val()).draw(); });
			$('.loading-state-order-list').fadeOut('slow');
		}
	}

	function showPrintInvoice(orderStatus) {
		if(orderStatus == 'invoiced') $('#print-invoice-btn').show();
	}
	
	function showPrintSalesForm(orderStatus) {
		let status = [ 'confirmed', 'scheduled', 'delivered', 'invoiced'];
		if (status.indexOf(orderStatus) != -1) $('#print-sales-form-btn').show();
	}

	function loadOrderDetailsTable(salesOrderNo, mode) {
		$('#print-invoice-btn, #print-sales-form-btn').hide();

		let orders = LCLDB_ORDER.filter(item => item.salesOrderNo == salesOrderNo && item.docType == 'ORDER');
		let orderStatus = orders[0].orderItemStatus;

		showPrintSalesForm(orderStatus);

		if (DEPLOYED_ON != 'LOCAL') {
			if(orderStatus == 'confirmed' || orderStatus == 'scheduled' || orderStatus == 'delivered') {
				let orderInfo = getOrderStatusSAP(orders[0].salesOrderNo);
				if ((orderInfo.orderStatus == 'Scheduled' && orderStatus != 'scheduled') || orderInfo.orderStatus == 'Delivered') {
					updateOrderStatusCouch(orders, orderInfo)
					// showPrintInvoice((orderInfo.orderStatus == 'Scheduled') ? 'scheduled' : 'invoiced');
					if (orderInfo.orderStatus == 'Delivered') {
						showPrintInvoice('invoiced');
					}
				}
			} else if (orderStatus == 'invoiced') {
				showPrintInvoice('invoiced');
			}
		} else {
			showPrintInvoice(orderStatus);
		}

		setTimeout(() => {
			DT_ORDER = $('#order-table').DataTable({
				destroy        : true,
				data           : orders,
				autoWidth      : false,
				scrollX        : true,
				scrollY        : 300,
				scrollCollapse : true,
				paging         : false,
				dom            : 'rti',

				columns: [
					{'data': 'salesOrderItemNo'},
					{'data': 'usedMaterialCode'},
					{'data': 'size'},
					{'data': 'oldMaterialNumber'},
					{'data': 'orderItemStatus'},
					{'data': 'price'},
					{'data': 'quantity'},
					{'data': 'amount'},
					{'data': 'discount'},
					{'data': 'netAmount', 'defaultContent' : ''},
					{'data': 'orderItemStatus'},
					{'data': 'reasonCancel', 'defaultContent' : ''}
				],
				columnDefs: [
					{ targets: [0, 4, 6, 10], className: 'dt-center' },
					{ targets: [5, 7, 8, 9], className: 'dt-right' },
					{ // order status
						targets: 4,
						render: (data, type, row) => adjustOrderStatus(data)
					},
					{ // price, amount, discount
						targets: [5, 7, 8],
						render: (data, type, row) => convertToNumber(data, '2-decimal')
					},
					{ // price, amount, discount
						targets: 9,
						render: (data, type, row) => `<b>${convertToNumber(data, '2-decimal')}</b>`
					},
					{ // progress
						targets: 10,
						render: (data, type, row) => generateProgressTrack(data)
					}
				],
				rowCallback: (row, data, iDataIndex) => { $(row).attr('id', data.id); }
			});

			if (mode == 'details') DT_ORDER.columns( [10, 11] ).visible( false );
			else {
				DT_ORDER.columns().visible( false ).columns( [0, 1, 10] ).visible( true );
				if (orders[0].reasonCancel) DT_ORDER.columns( [11] ).visible( true );
			}

			if (orders.length > 0) {
				if (cancelDisable.indexOf(orders[0].orderItemStatus) != -1) $('#order-tab .btn-group button[data-action="cancel"]').attr('disabled', true)
				else $('#order-tab .btn-group button[data-action="cancel"]').attr('disabled', false)

				$('.order-details-panel [data-type="details"]').each(function(index, el) {
					let key = $(el).attr('data-key');
					$(el).text((orders[0][key]) ? orders[0][key] : '');
				});

				// date created display
				let dateCreated = $('.order-details-panel [data-key="dateCreated"]').text();
				$('.order-details-panel [data-key="dateCreated"]').text(moment(dateCreated, 'YYYY-MM-DD hh:mm A').format('MMM DD, YYYY hh:mm A'));

				// requested date display
				let requestedDate = $('.order-details-panel [data-key="requestedDate"]').text();
				$('.order-details-panel [data-key="requestedDate"]').text(`${moment(requestedDate.slice(0, -3), 'YYYY-MM-DD').format('MMM DD, YYYY')} ${requestedDate.slice(-2)}`);

				// delivery details display
				if (orders[0].requestDeliveryMethod == 'delivery') {
					$('.order-details-panel [data-key="shipToAddress"]').parent().show();
					$('.order-details-panel [data-key="carPlateNo"]').parent().hide();
				} else {
					$('.order-details-panel [data-key="shipToAddress"]').parent().hide();
					$('.order-details-panel [data-key="carPlateNo"]').parent().show();
				}
			}

			$('.loading-state-order').fadeOut('slow');
		}, 1000)
	}

	function getOrderStatusSAP(salesOrderNo) {
		if (!salesOrderNo) {
			alert('No sales order no');
			return;
		}

		let invoice = [{ salesOrderNo, salesOrderItemNo: 1 }], orderStatus;

		DI_orderStatus({ invoice }, (err, res) => {
			if (err || res.statusCode >= 300) {
				alert('Unable to get order status from SAP.');
				console.log('err', err, 'res', res);
			} else if (res.result.hasOwnProperty('message')){
				alert(res.result.message);
			} else if (res.statusCode <= 299) {
				orderStatus = res.result[0];
			}
		});

		return orderStatus;
	}

	function updateOrderStatusCouch(orders, orderInfo) {
		let isSuccess = true;


		let changesObj = {};
		for (let i in orders) {
			let order = orders[i];
			changesObj[order.id] = {
				orderItemStatus : (orderInfo.orderStatus == 'Scheduled') ? 'scheduled' : 'invoiced',
				deliveredDate   : orderInfo.deliveryDate,
				deliveredNo     : orderInfo.deliveryNo,
				invoicedDate    : orderInfo.invoiceDate,
				invoicedNo      : orderInfo.invoiceNo,
				materialDate    : orderInfo.materialDate,
				materialNo      : orderInfo.materialNo
			}

			// if (orderInfo.orderStatus == 'Scheduled') {
			// 	changesObj[order.id].orderItemStatus = 'scheduled';
			// } else if (orderInfo.orderStatus == 'Delivered') {
			// 	changesObj[order.id].orderItemStatus = 'invoiced';
			// }
		}

		updateOrders(changesObj, (err, res) => {
			console.log(res);
			if (err || res.statusCode >= 300) { isSuccess = false; }
			else if (res.statusCode <= 299) { updateOrderStatusLocal(changesObj, LCLDB_ORDER); }
		});

		return isSuccess;
	}

	function updateOrderStatusLocal(order, localdb) {
		for (let i in order) {
			let id = i;
			let index = localdb.findIndex(item => item.id == id);
			localdb[index].orderItemStatus = order[i].orderItemStatus;
		}
	}

	function loadBackorderDetailsTable(salesOrderNo, mode) {
		let orders = LCLDB_ORDER.filter(item => item.salesOrderNo == salesOrderNo && item.docType == 'BACKORDER');

		DT_BACKORDER = $('#backorder-table').DataTable({
			destroy        : true,
			data           : orders,
			autoWidth      : false,
			scrollX        : true,
			scrollY        : 300,
			scrollCollapse : true,
			paging         : false,
			dom            : 'rti',

			columns: [
				{'data': 'salesOrderItemNo'},
				{'data': 'usedMaterialCode'},
				{'data': 'size'},
				{'data': 'oldMaterialNumber'},
				{'data': 'orderItemStatus'},
				{'data': 'price'},
				{'data': 'quantity'},
				{'data': 'amount'},
				{'data': 'discount'},
				{'data': null, 'defaultContent' : ''},
				{'data': 'orderItemStatus'},
				{'data': 'reasonCancel', 'defaultContent' : ''}
			],
			columnDefs: [
				{ targets: [0, 4, 6], className: 'dt-center' },
				{ targets: [5, 7, 8, 9], className: 'dt-right' },
				{
					targets: 4,
					render: (data, type, row) => adjustOrderStatus(data)
				},
				{
					targets: 6,
					render: (data, type, row) => `<b>${data}</b>`
				},
				{
					targets: [5, 7, 8],
					render: (data, type, row) => convertToNumber(data, '2-decimal')
				},
				{
					targets: 9,
					render: (data, type, row) => {
						let total = (row.quantity * row.price) - row.discount;
						return `<b>${convertToNumber(total, '2-decimal')}</b>`;
					}
				},
				{
					targets: 10,
					render: (data, type, row) => generateProgressTrack(data)
				}
			],
			rowCallback: (row, data, iDataIndex) => { $(row).attr('id', data.id); }
		});

		if (mode == 'details') DT_BACKORDER.columns( [10] ).visible( false );
		else {
			DT_BACKORDER.columns().visible( false ).columns( [0, 1, 10] ).visible( true );
			if (orders[0].reasonCancel) DT_BACKORDER.columns( [11] ).visible( true );
		}

		if (orders.length > 0) {
			if (cancelDisable.indexOf(orders[0].orderItemStatus) != -1) $('#backorder-tab .btn-group button[data-action="cancel"]').attr('disabled', true)
			else $('#backorder-tab .btn-group button[data-action="cancel"]').attr('disabled', false)

			$('.backorder-details-panel [data-type="details"]').each(function(index, el) {
				let key = $(el).attr('data-key');
				$(el).text((orders[0][key]) ? orders[0][key] : '');
			});

			// date created display
			let dateCreated = $('.backorder-details-panel [data-key="dateCreated"]').text();
			$('.backorder-details-panel [data-key="dateCreated"]').text(moment(dateCreated, 'YYYY-MM-DD hh:mm A').format('MMM DD, YYYY hh:mm A'));

			// requested date display
			let requestedDate = $('.backorder-details-panel [data-key="requestedDate"]').text();
			$('.backorder-details-panel [data-key="requestedDate"]').text(`${moment(requestedDate.slice(0, -3), 'YYYY-MM-DD').format('MMM DD, YYYY')} ${requestedDate.slice(-2)}`);

			// delivery details display
			if (orders[0].requestDeliveryMethod == 'delivery') {
				$('.backorder-details-panel [data-key="shipToAddress"]').parent().show();
				$('.backorder-details-panel [data-key="carPlateNo"]').parent().hide();
			} else {
				$('.backorder-details-panel [data-key="shipToAddress"]').parent().hide();
				$('.backorder-details-panel [data-key="carPlateNo"]').parent().show();
			}
		}

		$('.loading-state-backorder').fadeOut('slow');
	}

	function loadCancelOrderModal(salesOrderNo) {
		$('#cancel-order-salesno').html(`<b>${salesOrderNo}</b>`);
		$('#cancel-order-item').html(`<b>${DT_ORDER.rows().count()}</b>`);
		$('#cancel-order-reason').val('').parent().removeClass('has-error');
		$('#cancel-order-modal').modal();
	}

	function loadCancelBackrderModal(salesOrderNo) {
		$('#cancel-backorder-salesno').html(`<b>${salesOrderNo}</b>`);
		$('#cancel-backorder-item').html(`<b>${DT_BACKORDER.rows().count()}</b>`);
		$('#cancel-backorder-reason').val('').parent().removeClass('has-error');
		$('#cancel-backorder-modal').modal();
	}

	// get salesperson assigned to customer
	function getSalesperson(customerCode) {
		const salespersonRoleId = ROLE_IDS['SALESPERSON'];
		let isSuccess = true;
		loadCustomerSalesperson({ salespersonRoleId, customerCode }, (err, res) => {
			if (err || res.statusCode >= 300) {
				alert(`No salesperson assigned to customer ${customerCode}`);
				isSuccess = false;
			} else if (res.statusCode <= 299) {
				SALESPERSON = res.result;
			}
		});

		return isSuccess;
	}

	function rejectOrderCouch(orders, reason) {
		let isSuccess = true;

		let changesObj = {};
		for (let i in orders) {
			let order = orders[i];
			changesObj[order.id] = {
				orderItemStatus : 'cancelled',
				reasonCancel    : reason
			}
		}

		updateOrders(changesObj, (err, res) => {
			// console.log(res);
			if (err || res.statusCode >= 300) { isSuccess = false; }
			else if (res.statusCode <= 299) { updateOrderLocal(changesObj, LCLDB_ORDER); }
		});

		return isSuccess;
	}

	// email reject order
	function emailRejectOrderNotif(order, reason) {
		const customerEmail = order[0].email;
		let { salesOrderNo, customerCode, customerName, orderType, dateCreated, requestedDate,
			requestDeliveryMethod, shipToCustomerCode, shipToAddress, carPlateNo } = order[0];

		// details section
		let detailSection = {};
		detailSection[`Reference no`] = salesOrderNo;
		detailSection[`Sold to Customer code`] = customerCode;
		detailSection[`Sold to Customer name`] = customerName;
		detailSection[`Order type`] = orderType;
		detailSection[`Date ordered`] = moment(dateCreated, 'YYYY-MM-DD hh:mm A').format('MMM DD, YYYY (ddd)');
		detailSection[`Request claim date`] = moment(requestedDate, 'YYYY-MM-DD A').format('MMM DD, YYYY (ddd)');

		if (requestDeliveryMethod == 'delivery') {
			detailSection[`Ship to Customer code`] = shipToCustomerCode;
			detailSection[`Ship to Address`] = shipToAddress;
		} else {
			detailSection[`Self collect<br>Car plate no.`] = carPlateNo;
		}

		// order section
		let orderSection = {
			coulmns: {
				salesOrderItemNo : 'Item #',
				usedMaterialCode : 'Material code',
				quantity : 'Quantity',
				reasonCancel : 'Reason'
			}
		};

		orderSection.data = order.map(item => {
			let { salesOrderItemNo, usedMaterialCode, price } = item;
			return {
				salesOrderItemNo, usedMaterialCode,
				reasonCancel: reason, quantity: item.quantity
			}
		});

		// access link & email setting
		let accessLink = 'WOS';
		let emailSetting = {
			subject : 'The order has been canceled by following reason.'
		};

		if (DEPLOYED_ON != 'SAP') {
			emailSetting.to = DEV_EMAILS.OPS_BST;
			emailSetting.cc = [];
		} else {
			// to customer
			// cc logistic, management, salesman
			emailSetting.to = customerEmail;
			emailSetting.cc = [].concat(BSTSG_EMAILS.logisticTeam).concat(BSTSG_EMAILS.managementTeam).concat(SALESPERSON.email);
		}

		const emailNotif = { detailSection, orderSection, accessLink, emailSetting };
		sendRejectOrderNotif(emailNotif, (err, res) => {
			console.log(res);
			if (err) {
				if (err.statusCode == 400 && err.message == 'Unable to send email') {
					alert(err.message);
					return;
				}

				alert('Something went wrong while sending email');
			}
		});
	}

	function generateProgressTrack(status) {
		var code = '';
		code += '<div class="orderStatus">';
		code += '  <ul class="row">';

		switch(status) {
			case 'saved' :
			case 'pending order approval' :
			case 'backorderPending' :
				code += '    <li class="col done">Saved</li>';
				code += '    <li class="col ">Submitted</li>';
				code += '    <li class="col ">Sent</li>';
				code += '    <li class="col ">Scheduled</li>';
				code += '    <li class="col ">Delivered</li>';
				code += '    <li class="col ">Invoiced</li>';
			break;

			case 'submitted' :
			case 'pending credit note creation' :
				code += '    <li class="col done">Saved</li>';
				code += '    <li class="col done">Submitted</li>';
				code += '    <li class="col ">Sent</li>';
				code += '    <li class="col ">Scheduled</li>';
				code += '    <li class="col ">Delivered</li>';
				code += '    <li class="col ">Invoiced</li>';
			break;

			case 'confirmed' :
				code += '    <li class="col done">Saved</li>';
				code += '    <li class="col done">Submitted</li>';
				code += '    <li class="col done">Sent</li>';
				code += '    <li class="col ">Scheduled</li>';
				code += '    <li class="col ">Delivered</li>';
				code += '    <li class="col ">Invoiced</li>';
			break;

			case 'scheduled' :
				code += '    <li class="col done">Saved</li>';
				code += '    <li class="col done">Submitted</li>';
				code += '    <li class="col done">Sent</li>';
				code += '    <li class="col done">Scheduled</li>';
				code += '    <li class="col ">Delivered</li>';
				code += '    <li class="col ">Invoiced</li>';
			break;

			case 'delivered' :
				code += '    <li class="col done">Saved</li>';
				code += '    <li class="col done">Submitted</li>';
				code += '    <li class="col done">Sent</li>';
				code += '    <li class="col done">Scheduled</li>';
				code += '    <li class="col done">Delivered</li>';
				code += '    <li class="col ">Invoiced</li>';
			break;

			case 'invoiced' :
				code += '    <li class="col done">Saved</li>';
				code += '    <li class="col done">Submitted</li>';
				code += '    <li class="col done">Sent</li>';
				code += '    <li class="col done">Scheduled</li>';
				code += '    <li class="col done">Delivered</li>';
				code += '    <li class="col done">Invoiced</li>';
			break;

			case 'cancelled' :
				code = '<span><b class="text-danger"><i class="fa fa-times" aria-hidden="true"></i> Cancelled</b></span>';
			break;

			case 'rejected' :
				code = '<span><b class="text-danger"><i class="fa fa-times" aria-hidden="true"></i> Rejected</b></h4>';
			break;

			// default : data[i].status = '<span class="text-red"><b>'+data[i].orderItemStatus+'</b></span>';
	 	}


	  	code += '  </ul>';
	  	code += '</div>';


	  	return code;
	}

	function adjustOrderStatus(orderItemStatus) {
		var code;

		switch(orderItemStatus) {
			case 'confirmed' :
			code = '<span class="text-green"><b>sent</b></span>';
			break;

			case 'saved' :
			case 'submitted' :
			code = '<span class="text-yellow"><b>'+orderItemStatus+'</b></span>';
			break;

			case 'scheduled' :
			code = '<span class="text-yellow"><b>'+orderItemStatus+'</b></span>';
			break;

			case 'delivered' :
			code = '<span class="text-yellow"><b>'+orderItemStatus+'</b></span>';
			break;

			case 'invoiced' :
			code = '<span class="text-yellow"><b>'+orderItemStatus+'</b></span>';
			break;

			case 'pending order approval' :
			case 'backorderPending' :
			code = '<span class="text-yellow"><b>saved</b></span>';
			break;

			case 'rejected' :
			code = '<span class="text-red"><b>'+orderItemStatus+'</b></span>';
			break;

			default : code = '<span class="text-red"><b>'+orderItemStatus+'</b></span>';
		}

		return code;
	}

	$('#daterange-btn').daterangepicker(
		{
			ranges: {
				'Today': [moment(), moment()],
				'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
				'This Week': [moment().startOf('week'), moment().endOf('week')],
				'This Month': [moment().startOf('month'), moment().endOf('month')]
			},
			opens     : 'right',
			startDate : moment(),
			endDate   : moment()
		},

		function (start, end) {
			if (start.format('MMM D, YYYY') == end.format('MMM D, YYYY')) $('#daterange-btn span').html(start.format('MMM D, YYYY'))
			else $('#daterange-btn span').html(start.format('MMM D, YYYY') + ' - ' + end.format('MMM D, YYYY'));

			$('#daterange-btn').attr('startDate', start.format('YYYY-MM-DD')).attr('endDate', end.format('YYYY-MM-DD'));
			$('.loading-state-order-list, .loading-state-order, .loading-state-backorder').fadeIn();
			setTimeout(() => { loadOrderList(start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD')); }, 1000);
		}
	);

	$('.nav-tabs > li a[data-toggle="tab"]').click(function() {
		const action = $(this).attr('data-action');
		const salesOrderNo = DT_ORDER_LIST.row('.selected').nodes().to$().attr('data-salesorderno');
		$('.loading-state-order, .loading-state-backorder').fadeIn();
		$('#order-tab .btn-group button, #backorder-tab .btn-group button').removeClass('btn-primary').addClass('btn-default')
		$('#order-tab .btn-group button[data-action="details"], #backorder-tab .btn-group button[data-action="details"]').removeClass('btn-default').addClass('btn-primary');

		setTimeout(() => {
			switch(action) {
				case 'load-order': loadOrderDetailsTable(salesOrderNo, 'details'); break;
				case 'load-backorder': loadBackorderDetailsTable(salesOrderNo, 'details'); break;
			}
		}, 1000)
	});

	$('#order-tab .btn-group button').click(function() {
		$('#order-tab .btn-group button').removeClass('btn-primary').addClass('btn-default')
		$(this).removeClass('btn-default').addClass('btn-primary')

		const action = $(this).attr('data-action');
		const salesOrderNo = DT_ORDER_LIST.row('.selected').nodes().to$().attr('data-salesorderno');
		if (action == 'details') loadOrderDetailsTable(salesOrderNo, 'details')
		else if (action == 'progress') loadOrderDetailsTable(salesOrderNo, 'progress')
		else if (action == 'cancel') {
			if (DT_ORDER.rows().count()) loadCancelOrderModal(salesOrderNo)
			else alert('There is no order.');
		}
	});

	$('#backorder-tab .btn-group button').click(function() {
		$('#backorder-tab .btn-group button').removeClass('btn-primary').addClass('btn-default')
		$(this).removeClass('btn-default').addClass('btn-primary')

		const action = $(this).attr('data-action');
		const salesOrderNo = DT_ORDER_LIST.row('.selected').nodes().to$().attr('data-salesorderno');
		if (action == 'details') loadBackorderDetailsTable(salesOrderNo, 'details')
		else if (action == 'progress') loadBackorderDetailsTable(salesOrderNo, 'progress')
		else if (action == 'cancel') {
			if (DT_BACKORDER.rows().count()) loadCancelBackrderModal(salesOrderNo)
			else alert('There is no backorder.');
		}
	});

	$('#cancel-order-btn').click(function() {
		const reason = $('#cancel-order-reason').val().trim();

		if (!reason) {
			$('#cancel-order-reason').parent().addClass('has-error');
			return;
		}

		$('.loading-state-order').fadeIn();
		disableBtn($(this));
		setTimeout(() => {
			let orders = DT_ORDER.rows().data().toArray();
			let successUpdate, isSalespersonSuccess;

			isSalespersonSuccess = getSalesperson(orders[0].customerCode);
			if (isSalespersonSuccess) {
				successUpdate = rejectOrderCouch(orders, reason);
				if (successUpdate) emailRejectOrderNotif(orders, reason);
			}

			$('#cancel-order-modal').modal('hide');

			setTimeout(() => {
				if (successUpdate) resultNotify('fa-check-circle', 'SUCCESS', '<b>Order successfully cancelled</b>', 'success');
				else alert('Order not cancelled.\nSomething went wrong. Please try again later');

				enableBtn($(this));
				setTimeout(() => {
					config.db = 'local';
					loadOrderList($('#daterange-btn').attr('startDate'), $('#daterange-btn').attr('endDate'));
				}, 1000);
			}, 1000);
		}, 1000);
	});

	$('#print-sales-form-btn').click(function() {
		let orders = DT_ORDER.rows().data().toArray();
		resetLocalStorage('salesorderform', orders);
		window.open('../../invoice/salesorderform/ROLE::a0ad3978-cb83-4e94-b1ee-619c7de46d3b');
	});

	$('#print-invoice-btn').click(function(){
		let orders = DT_ORDER.rows().data().toArray();
		resetLocalStorage('invoice', orders);
		window.open('../../print/invoice/ROLE::a0ad3978-cb83-4e94-b1ee-619c7de46d3b');
	});

	// update local db copy
	function updateOrderLocal(order, localdb) {
		for (let i in order) {
			let id = i;
			let index = localdb.findIndex(item => item.id == id);
			localdb[index].orderItemStatus = order[i].orderItemStatus;
			localdb[index].reasonCancel = order[i].reasonCancel;
		}
	}
});