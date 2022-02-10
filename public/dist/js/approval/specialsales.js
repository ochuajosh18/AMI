$(document).ready(function() {
	let LCLDB_NORMAL_ORDER, LCLDB_STOCK, VISIBLE_STOCK, NOTES, ROLE_IDS = role_localdata, SALESPERSON, CUSTOMERSALESPERSON;
	let DT_NORMAL_ORDER, DT_NORMAL_ORDER_DETAILS, DT_CHECK_NORMAL_ORDER;
	const config = {
		// db : 'offline'
		db : 'couchbase'
	};

	enableHelpFunction();
	$("[data-toggle=popover]").popover();

	// load visible stock
	loadStock('VISIBLE::STOCK::e1c40730-4cc6-4061-a23a-4dbe96fdc418', (err, res) => {
		if (err || res.statusCode >= 300) { alert('Unable to get stock'); }
		else if (res.statusCode <= 299) { VISIBLE_STOCK = parseInt(res.result.stock); }
	});

	// load notes
	loadMaterial('NOTE::MATERIAL', (err, res) => {
		if (err || res.statusCode >= 300) { alert('Unable to get notes'); }
		else if (res.statusCode <= 299) {
			NOTES = (res.result) ? res.result : {};
		}
	});

	// load stoacks
	loadAllStock((err, res) => {
		if (err || res.statusCode >= 300) { alert('Unable to get stock'); }
		else if (res.statusCode <= 299) { LCLDB_STOCK = res.result; }
	});


	loadNormalOrderTable();

	// load normal order table
	function loadNormalOrderTable() {
		let data;

		if (config.db == 'couchbase') {
			loadSpecialOrder((err, res) => {
				if (err || res.statusCode >= 300) alert('Unable to get order');
				else if (res.statusCode <= 299) { LCLDB_NORMAL_ORDER = res.result; data = res.result; }
			});
		} else if (config.db == 'local') {
			data = LCLDB_NORMAL_ORDER;
		}

		data = removeduplicate_1(data, 'salesOrderNo');
		$.fn.dataTable.moment('MMM DD, YYYY hh:mm A'); // table date column sort
		DT_NORMAL_ORDER = $('#normal-order-table').DataTable({
			destroy        : true,
			data           : data,
			autoWidth      : false,
			scrollX        : true,
			scrollY        : 350,
			scrollCollapse : true,
			paging         : false,
			dom            : 'rti',

			columns: [
				{ data: 'salesOrderNo', title: 'Reference no', width: 80 },
				{ data: 'customerCode', title: 'Customer code', width: 80 },
				{ data: 'customerName', title: 'Customer name' },
				{ data: 'orderedBy', title: 'Ordered by' },
				// { data: 'orderType', title: 'Order type', width: '70' },
				{ data: 'dateCreated', title: 'Order date', width: 100 },
				{ data: 'salesOrderNo', title: 'Items', defaultContent: '', width: 40 },
				{ data: null, title: 'Action', width: 40 }
			],
			columnDefs: [
				{ targets: [0, 1, 4, 5, 6], className: 'dt-center' }, // salesNo, customerCode, dateOrdered, items, btn
				{ targets: 6, orderable: false },  // btn
				{
					targets: [0, 1], // salesNo, customerCode
					render: (data, type, row) => `<b>${data}</b>`,
				},
				{
					targets: 4, // dateOrdered
					render: (data, type, row) => moment(data, 'YYYY-MM-DD hh:mm A').format('MMM DD, YYYY hh:mm A'),
				},
				{
					targets: 5, // items
					render: (data, type, row) => {
						const count = LCLDB_NORMAL_ORDER.filter(item => item.salesOrderNo == data).length;
						return `<span class="badge bg-light-blue">${count}</span>`
					},
				},
				{
					targets: 6, // action
					render: (data, type, row) => '<a href="#" class="btn btn-primary btn-xs view-details" data-toggle="tooltip" data-placement="left" data-original-title="Order details" data-target="#normal-order-carousel" data-slide-to="1"><i class="fa fa-tasks" aria-hidden="true"></i></a>'
				}
			],
			rowCallback: (row, data, iDataIndex) => {
				$(row).attr('id', data['id']);
				let btn = $(row).find('a.view-details');

				btn.off('click').click(() => {
					$('[data-toggle="tooltip"]').tooltip('hide');
					$('.loading-state-normal-order').fadeIn();

					const order = LCLDB_NORMAL_ORDER.filter(item => item.salesOrderNo == data.salesOrderNo);
					setTimeout(()=> {
						loadNormalOrderDetailsTable(order);
						$('.loading-state-normal-order').fadeOut('slow');
					}, 1000);
				});
			}
		});

		$('#normal-order-table-filter').off('keyup').keyup(function(){ DT_NORMAL_ORDER.search($(this).val()).draw(); });
		$('.loading-state-normal-order').fadeOut('slow');
	}

	// load normal order details
	function loadNormalOrderDetailsTable(data) {
		console.log(data)
		/* let isSalespersonSuccess = getSalesperson(data[0].customerCode);
		if (!isSalespersonSuccess) return; */
		let isSalespersonSuccess = getCustomerSalesperson(data[0].salesperson);
		if (!isSalespersonSuccess) return;
		data = getStock(DEPLOYED_ON, data); // get stock per item
		if (data == 'SAPerror') return;
		data = getCreditLimit(DEPLOYED_ON, data); // get credit, overdue, note
		if (data == 'SAPerror') return;

		DT_NORMAL_ORDER_DETAILS = $('#normal-order-details-table').DataTable({
			destroy        : true,
			data           : data,
			autoWidth      : false,
			scrollX        : true,
			scrollY        : 350,
			scrollCollapse : true,
			paging         : false,
			dom            : 'rti',

			columns  : [
				{ data: 'salesOrderItemNo', title: '#', width: 20 },
				{ data: 'usedMaterialCode', title: 'Material code' },
				{ data: 'materialCode', title: 'BCP', width: 50 },
				{ data: 'price', title: 'Price', width: 50 },
				{ data: 'quantity', title: 'Order<br>quantity', width: 50 },
				{ data: 'visibleStock', title: 'Visible<br>stock', width: 50 },
				{ data: 'totalStock', title: 'Actual<br>stock', width: 50 },
				{ data: null, title: 'Amount', width: 50 },
				{ data: 'note', title: '<i class="fa fa-commenting" aria-hidden="true"></i> Note' }
			],
			columnDefs: [
				{ targets: [0, 4, 5, 6], className: 'dt-center'},  // #, quantity, visibleStock, actualStock
				{ // price
					targets: 3, className: 'dt-right',
					render: (data, type, row) => convertToNumber(data, '2-decimal')
				},
				{ // quantity
					targets: [4],
					render: (data, type, row) => convertToNumber(data, 'whole')
				},
				{ // visibleStock
					targets: 5,
					render: (data, type, row) => {
						let totalStock = row.totalStock;
						if(totalStock < 0) totalStock = 0;
						data = (totalStock >= row.visibleStock) ? row.visibleStock : totalStock;
						return convertToNumber(data, 'whole');
					}
				},
				{ // actualStock
					targets: [6],
					render: (data, type, row) => {
						let stock = data;
						if(stock < 0) stock = 0;
						return convertToNumber(stock, 'whole');
					}
				},
				{ // note
					targets: 7, className: 'dt-right',
					render: (data, type, row) => {
						let orderAmount = parseFloat(parseInt(row.quantity) * parseFloat(row.price)).toFixed(2);
						row.orderAmount = orderAmount;
						return orderAmount;
					}
				},
				{ // note
					targets: 8, className: 'note-column', orderable: false,
					render: (data, type, row) => (data) ? `<b>${data}</b>` : ''
				}
			],
			rowCallback : (row, data, iDataIndex) => {
				$(row)
					.attr('id', data['id'])
					.find('.note-column').addClass('mark');
			}
		});

		$('.normal-order-details-panel [data-type="details"]').each(function(index, el) {
			let key = $(el).attr('data-key'), split = key.split('.');
			if (split.length == 1) $(el).text(data[0][key]);
		});

		// payment term display
		let paymentTerms = $('.normal-order-details-panel [data-key="paymentTerms"]').text(), paymentTermsDisp;
		if (paymentTerms == 'TS00') paymentTermsDisp = 'Cash';
		else if (paymentTerms == 'TS30') paymentTermsDisp = 'Within 30 days';
		else if (paymentTerms == 'TS00') paymentTermsDisp = 'Within 60 days';
		$('.normal-order-details-panel [data-key="paymentTerms"]').text(paymentTermsDisp);

		// credit display
		let credit = $('.normal-order-details-panel [data-key="creditLimit"]').text();
		$('.normal-order-details-panel [data-key="creditLimit"]').text(convertToNumber(credit, '2-decimal'));

		// overdue display
		let overdue = $('.normal-order-details-panel [data-key="overduePayment"]').text();
		$('.normal-order-details-panel [data-key="overduePayment"]').text(convertToNumber(overdue, '2-decimal'));

		// date created display
		let dateCreated = $('.normal-order-details-panel [data-key="dateCreated"]').text();
		$('.normal-order-details-panel [data-key="dateCreated"]').text(moment(dateCreated, 'YYYY-MM-DD hh:mm A').format('MMM DD, YYYY hh:mm A'));

		// requested date display
		let requestedDate = $('.normal-order-details-panel [data-key="requestedDate"]').text();
		$('.normal-order-details-panel [data-key="requestedDate"]').text(`${moment(requestedDate.slice(0, -3), 'YYYY-MM-DD').format('MMM DD, YYYY')} ${requestedDate.slice(-2)}`);

		// delivery details display
		if (data[0].requestDeliveryMethod == 'delivery') {
			$('.normal-order-details-panel [data-key="shipToAddress"]').parent().show();
			$('.normal-order-details-panel [data-key="carPlateNo"]').parent().hide();
		} else {
			$('.normal-order-details-panel [data-key="shipToAddress"]').parent().hide();
			$('.normal-order-details-panel [data-key="carPlateNo"]').parent().show();
		}

		$('.normal-order-details-panel .order-info, .normal-order-details-panel .delivery-info').height($('.normal-order-details-panel .customer-info').height());
		$('.loading-state-normal-order').fadeOut('slow');
	}

	// load check normal order
	function loadCheckNormalOrderTable(data) {
		data = data.map(item => { 
			return {
				...item, netAmount : parseFloat(item.amount) - (parseFloat(item.discount) * parseInt(item.quantity))
			}
		});

		console.log(data)
		DT_CHECK_NORMAL_ORDER = $('#approve-order-table').DataTable({
			destroy        : true,
			data           : data,
			autoWidth      : false,
			paging         : false,
			ordering       : false,
			scrollX        : true,
			scrollY        : 350,
			scrollCollapse : true,
			dom            : 'rt',

			columns: [
				{ data: 'salesOrderItemNo', title: '#', width: 20 },
				{ data: 'usedMaterialCode', title: 'Material code' },
				{ data: 'materialCode', title: 'BCP' },
				{ data: 'price', title: 'Price', width: 50 },
				{ data: 'quantity', title: 'Quantity', width: 50 },
				{ data: 'discount', title: 'Discount / pc', defaultContent: '0.00', width: 50 },
				{ data: 'netAmount', title: 'Net Amount', defaultContent: '0.00', width: 50 }
			],
			columnDefs: [
				{ targets: [0, 4], className: 'dt-center' }, // item no, quantity
				{ // price, disocunt, netAmount
					targets: [3, 5, 6], className: 'dt-right',
					render: (data, type, row) => convertToNumber((data) ? data : 0, '2-decimal'),
				},
				{ // quantity
					targets: 4,
					render: (data, type, row) => convertToNumber(data, 'whole'),
				}
			],
			rowCallback: (row, data, iDataIndex) => {  $(row).attr('id', data['id']); },
			footerCallback: function (row, data, start, end, display) {
				let api = this.api();
				let intVal = (i) => typeof i === 'string' ? i.replace(/[\$,]/g, '')*1 : typeof i === 'number' ? i : 0;// Remove the formatting to get integer data for summation
				let total = api.column(6).data().reduce((a, b) => intVal(a) + intVal(b), 0); // Total over all pages

				// Update footer
				$(api.column(6).footer())
				.html(convertToNumber(total, '2-decimal'))
				.attr('data-salestotal', total);
			}
		});

		if (data.length > 0) { // display if there is normal order
			$('#credit-warn, #overdue-warn').text('0.00');
			const overduePayment = data[0].overduePayment;
			const creditExceed = data[0].creditExceed;

			if (overduePayment > 0) {
				$('#overdue-warn').text(convertToNumber(overduePayment, '2-decimal'));
				$('#overdue-warn').addClass('text-red').css('font-weight', 'bold');
			} else {
				$('#overdue-warn').removeClass('text-red').removeAttr('style');
			}

			if (creditExceed > 0) {
				$('#credit-warn').text(convertToNumber(creditExceed, '2-decimal'));
				$('#credit-warn').addClass('text-red').css('font-weight', 'bold');
			} else {
				$('#credit-warn').removeClass('text-red').removeAttr( 'style' );
			}
		}

		$('.loading-state-check-normal-order').fadeOut('hide');
	}

	// get stock per item
	function getStock(environment, order) {

		if(order[0].totalStock){
			delete order[0].totalStock;
		}

		if (!order[0].totalStock) {
			if (environment == 'LOCAL') {
				for (let i in order) {
					let stock;
					let combination = `${order[i].size} ${order[i].oldMaterialNumber} ${order[i].country}`;
					stock = LCLDB_STOCK.filter(item => item.combination == combination);

					order[i].totalStock = stock.reduce((sum, item) => sum + parseInt(item.stock), 0);
					order[i].visibleStock = parseInt(VISIBLE_STOCK);
				}
			}

			else {
				let stocks = [];
				// get same items
				for (let i in order) {
					let stock;
					let combination = `${order[i].size} ${order[i].oldMaterialNumber} ${order[i].country}`;
					stock = LCLDB_STOCK.filter(item => item.combination == combination);

					stocks = stocks.concat(
						stock.map(item => {
							return {
								materialNo: item.materialCode,
								storageLocation: item.storageLocation
							}
						})
					);

					order[i].items = stock;
				}

				// get stock on SAP
				DI_stockStatus({ stocks }, (err, res) => {
					if (err || res.statusCode >= 300) {
						alert('Unable to load stock from SAP.');
						console.log('err', err, 'res', res);
						order = 'SAPerror';
					}

					else if (res.statusCode <= 299) {
						let stockStatus = res.result;
						for (let i in order) {
							let totalStock = 0, sameitem = order[i].items;

							for (let j in sameitem) {
								let stock = stockStatus.find(item => item.materialCode == sameitem[j].materialCode).totalStock;
								totalStock += parseInt(stock);
							}

							order[i].totalStock = totalStock;
							order[i].visibleStock = parseInt(VISIBLE_STOCK);
						}
					}
				});
			}
		}

		return order
	}

	// get credit, overdue, note
	function getCreditLimit(environment, order) {
		if (!order[0].creditLimit && !order[0].overduePayment) {
			if (environment == 'LOCAL') {
				// const creditFixed = 0, overdueFixed = 22;
				const creditFixed = 500, overdueFixed = 1023, creditExceedFixed = 72;

				for (let i in order) {
					order[i].creditLimit = creditFixed;
					order[i].overduePayment = overdueFixed;
					order[i].creditExceed = creditExceedFixed;

					if (!order[i].note) { // note note yet embeded
						order[i].note = NOTES[`${order[i].size} ${order[i].oldMaterialNumber} ${order[i].country}`];
					}
				}
			}

			else {
				let creditStatus, overduePaymentStatus;
				let customer = [order[0].customerCode];

				DI_creditStatus({ customer }, (err, res) => {
					if (err || res.statusCode >= 300) {
						alert('Unable to load credit from SAP.');
						console.log('err', err, 'res', res);
						order = 'SAPerror';
					}

					else if (res.statusCode <= 299) { creditStatus = res.result[0]; }
				});

				DI_overduePaymentStatus({ customer }, (err, res) => {
					if (err || res.statusCode >= 300) {
						alert('Unable to load overue payment from SAP.');
						console.log('err', err, 'res', res);
						order = 'SAPerror';
					}

					else if (res.statusCode <= 299) { overduePaymentStatus = res.result[0]; }
				});

				if (creditStatus && overduePaymentStatus) {
					for (let i in order) {
						order[i].creditLimit = creditStatus.creditLimit;
						order[i].creditExceed = Number(creditStatus.creditExposure) - Number(creditStatus.creditLimit);
						order[i].overduePayment = overduePaymentStatus.overdueAmount;

						if (!order[i].note) { // note note yet embeded
							order[i].note = NOTES[`${order[i].size} ${order[i].oldMaterialNumber} ${order[i].country}`];
						}
					}
				}
			}
		}

		return order;
	}

	$('#btn-help-multiple').attr('data-content', 
		`<a><h6 id="btn-approve" data-toggle="modal" data-target="#modal-default" data-help="specialSales" style="cursor: pointer;">How to approve order</h6></a>
		<a><h6 id="btn-reject" data-toggle="modal" data-target="#modal-default" data-help="specialSales" style="cursor: pointer;">How to reject order</h6></a>`
	);

	$(document).on("click", "#btn-approve", function(event) {
		let helptype = $('#btn-approve').attr('data-help');
		helpCarouselMultiple(helptype, 'approve')
    });

    $(document).on("click", "#btn-reject", function(event) {
		let helptype = $('#btn-reject').attr('data-help');
		helpCarouselMultiple(helptype, 'reject')
    });

	// check order to proceed
	$('#check-allocate-normal-order-btn').click(function() {
		if (DT_CHECK_NORMAL_ORDER) DT_CHECK_NORMAL_ORDER.clear().draw(); // clear table if already initialized

		let order = DT_NORMAL_ORDER_DETAILS.rows().data().toArray();

		for (let i in order) {
			let data = order[i];

			data.amount = parseInt(data.quantity) * parseFloat(data.price);
			data.netAmount = parseInt(data.quantity) * parseFloat(data.price);

			data.orderAmount = parseInt(data.quantity) * parseFloat(data.price);
			data.orderNetAmount = parseInt(data.quantity) * parseFloat(data.price);

			data.backorder = parseInt(data.backOrder);
			data.backorderAmount  = parseInt(data.backOrder) * parseFloat(data.price);
			data.backorderNetAmount  = parseInt(data.backOrder) * parseFloat(data.price);
		}

		$('#allocate-order-modal').modal();
		$('.loading-state-check-normal-order').fadeIn();
		setTimeout(() => {
			$('span#normal-order-counter').html(order.length);

			loadCheckNormalOrderTable(order);
		}, 1000);
	});

	// approve order
	$('#approve-normal-order-btn').click(function() {
		$('.loading-state-normal-order').fadeIn();
		disableBtn($(this));
		setTimeout(() => {
			let order = DT_CHECK_NORMAL_ORDER.rows().data().toArray();
			let successUpdate, successSAP = true;
			let creditLimit = order[0].creditLimit;

			// there is normal order
			const overduePayment = order[0].overduePayment;
			const creditExceed = order[0].creditExceed;
			let proceedtoSAP = true;
			console.log('order : ', order)
			if (overduePayment <= 0 && creditExceed <= 0) { // order okay
				if (DEPLOYED_ON != 'LOCAL') { // Dev or Prod
					orderStatus = releaseDeliveryBlockSAP(order);
					successSAP = (orderStatus === "0") ? true : false;
				}
				
				if (successSAP) successUpdate = updateOrderCouch(order, proceedtoSAP, '');
				if (successUpdate) {
					emailOrderNotif(order, proceedtoSAP, creditExceed, overduePayment);
					printSalesForm(order, order[0].salesOrderNoSAP);

					if (LOG_FUNCTION) {
						createLog(`LOG::${LOCAL_STORAGE.referenceId}`, {
							dateCreated : moment().toISOString(),
							action : `Approved order ${order[0].salesOrderNo}`,
							module : "Approval/Special Sales",
							app : "AMI"
						}, moment().toISOString());
					}
				}
			} else { // order for credit/overdue approval
				proceedtoSAP = false;
				if (creditExceed > 0) alert('Credit limit exceeded. This order will go to credit/overdue approval.');
				else if (overduePayment > 0) alert('Customer have overdue payment. This order will go to credit/overdue approval.');
				let approver = (overduePayment >= 20000 || creditExceed >= 20000) ? 'MANAGEMENT' : 'SALES MANAGER';
				// let approver = 'SALES MANAGER';

				successUpdate = updateOrderCouch(order, proceedtoSAP, approver);
				if (successUpdate) {
					emailOrderNotif(order, proceedtoSAP, creditExceed, overduePayment);

					if (LOG_FUNCTION) {
						createLog(`LOG::${LOCAL_STORAGE.referenceId}`, {
							dateCreated : moment().toISOString(),
							action : `Approved order ${order[0].salesOrderNo} -> credit exceed/overdue payment`,
							module : "Approval/Special Sales",
							app : "AMI"
						}, moment().toISOString());
					}
				}
			}

			$('#allocate-order-modal').modal('hide');

			if (successUpdate && successSAP) { // all success
				resultNotify('fa-check-circle', 'SUCCESS', '<b>Order successfully allocated</b>', 'success');
			} else {
				alert('Order not allocated.\nSomething went wrong. Please try again later');
			}

			setTimeout(() => {
				enableBtn($(this));
				$('#back-normal-order-btn').click();
				setTimeout(() => {
					config.db = 'local';
					loadNormalOrderTable();
				}, 1000);
			}, 1000);
		}, 1000);
	});

	// input reject reason
	$('#check-reject-normal-order-btn').click(function() {
		$('#reject-order-modal').modal();
	 	$('#reject-normal-order-form textarea').val('');
	 	$('#reject-normal-order-form textarea').parent().removeClass('has-error');
	});

	// reject order
	$('#reject-normal-order-btn').click(function() {
		const textarea = $('#reject-normal-order-form textarea');

		if (!textarea.val().trim()) {
			textarea.parent().addClass('has-error');
			return;
		}

		$('.loading-state-normal-order').fadeIn();
		disableBtn($(this));
		setTimeout(() => {
			let order = DT_NORMAL_ORDER_DETAILS.rows().data().toArray();
			let reason = textarea.val().trim();
			let successUpdate;
			let successSAP = true;

			if 	(DEPLOYED_ON != 'LOCAL') { // Dev or Prod
				const rejectStatus = rejectSOWOS(order);
				successSAP = (rejectStatus === "0") ? true : false;
			}

			if	(successSAP) successUpdate = rejectOrderCouch(order, reason);
			if 	(successUpdate) 
				emailRejectOrderNotif(order, reason);

				if (LOG_FUNCTION) {
					createLog(`LOG::${LOCAL_STORAGE.referenceId}`, {
						dateCreated : moment().toISOString(),
						action : `Rejected order ${order[0].salesOrderNo}`,
						module : "Approval/Special Sales",
						app : "AMI"
					}, moment().toISOString());
				} 

			$('#reject-order-modal').modal('hide');

			if (successUpdate) {
				resultNotify('fa-check-circle', 'SUCCESS', '<b>Order successfully rejected</b>', 'success');
			} else {
				alert('Order not rejected.\nSomething went wrong. Please try again later');
			}

			setTimeout(() => {
				enableBtn($(this));
				$('#back-normal-order-btn').click();
				setTimeout(() => {
					config.db = 'local';
					order = getStock(DEPLOYED_ON, order); // get stock per item
					if (order == 'SAPerror') return;
					loadNormalOrderTable();
				}, 1000);
			}, 1000);
		}, 1000);
	});

	// clear order details
	$('#back-normal-order-btn').click(function() {
		if (DT_NORMAL_ORDER_DETAILS) DT_NORMAL_ORDER_DETAILS.clear().draw(); // clear table if already initialized
		$('.normal-order-details-panel [data-type="details"]').each(function(index, el) { $(el).text(''); });
	});

	const rejectSOWOS = (order) => {
		let rejectStatus = "0";

		let RejectSOWSOsModels = order.map(item => {
			return {
				salesOrderNo: item.salesOrderNo
			}
		});

		console.log('orders: ', RejectSOWSOsModels)
		DI_rejectOrderSO({ RejectSOWSOsModels }, (err, res) => {
			if (err || res.statusCode >= 300) {
				rejectStatus = "1";
				alert('Unable to release order from SAP.');
				console.log('err', err, 'res', res);
			} else if (res.result.hasOwnProperty('message')){
				rejectStatus = "1";
				alert(res.result.message);
			} else if (res.statusCode <= 299) {
				let result = res.result;
				console.log('result : ', result);
				rejectStatus = result[0].recode;
				console.log(rejectStatus);
			}
		});

		return rejectStatus;
	}

	const releaseDeliveryBlockSAP = (order) => {
		let releaseStatus = "0";

		let ReleaseDeliveryBlockModels = order.map(item => {
			return {
				salesOrderNo: item.salesOrderNo
			}
		});

		console.log('orders: ', ReleaseDeliveryBlockModels)
		DI_releaseDeliveryBlock({ ReleaseDeliveryBlockModels }, (err, res) => {
			if (err || res.statusCode >= 300) {
				releaseStatus = "1";
				alert('Unable to release order from SAP.');
				console.log('err', err, 'res', res);
			} else if (res.result.hasOwnProperty('message')){
				releaseStatus = "1";
				alert(res.result.message);
			} else if (res.statusCode <= 299) {
				let result = res.result;
				console.log('result : ', result);
				releaseStatus = result[0].recode;
			}
		});

		return releaseStatus;
	}

	// update order on couch
	function updateOrderCouch(order, proceedtoSAP, approver) {
		let isSuccess = true;

		let changesObj = {};
		for (let i in order) {
			let data = order[i];
			changesObj[data.id] = {
				backorder		   : data.backOrder,
				amount			   : data.amount.toString(),
				netAmount          : data.netAmount.toString(),
				discount           : data.discount.toString(),
				salesOrderApprover : LOCAL_STORAGE.userid,
				dateApproved       : moment().format('YYYY-MM-DD'),
				creditLimit        : order[0].creditLimit,
				creditExceed       : order[0].creditExceed,
				overduePayment     : order[0].overduePayment,

				orderItemStatus    : (proceedtoSAP) ? 'confirmed' : 'submitted'
			}
			
			if (!proceedtoSAP) changesObj[data.id].approver = approver;
		}

		updateOrders(changesObj, (err, res) => {
			if (err || res.statusCode >= 300) { isSuccess = false; }
			else if (res.statusCode <= 299) { updateOrderLocal(changesObj, LCLDB_NORMAL_ORDER); }
		});

		return isSuccess;
	}

	// reject order on couch
	function rejectOrderCouch(order, reason) {
		let isSuccess = true;

		let changesObj = {};
		for (let i in order) {
			let data = order[i];
			changesObj[data.id] = {
				orderItemStatus : 'rejected',
				reasonCancel    : reason
			}
		}

		updateOrders(changesObj, (err, res) => {
			if (err || res.statusCode >= 300) { isSuccess = false; }
			else if (res.statusCode <= 299) { updateOrderLocal(changesObj, LCLDB_NORMAL_ORDER); }
		});

		return isSuccess;
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

	function getCustomerSalesperson(customerCode) {
		let isSuccess = true;
		loadCustomerSalespersonDoc({ customerCode }, (err, res) => {
			if (err || res.statusCode >= 300) {
				alert(`No salesperson. Cannot find salesperson related to this order.`);
				isSuccess = false;
			} else if (res.statusCode <= 299) {
				CUSTOMERSALESPERSON = res.result;
			}
		});

		return isSuccess;
	}

	// email order
	function emailOrderNotif(order, proceedtoSAP, creditExceed, overduePayment) {
		const customerEmail = order[0].email;
		let customerStatus = order[0].status;
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
				price : 'Price',
				quantity : 'Quantity',
				amount : 'Amount',
				discount : 'Discount / pc',
				netAmount : 'Net Amount'
			}
		};

		orderSection.data = order.map(item => {
			let { salesOrderItemNo, usedMaterialCode, price, quantity, amount, discount, netAmount } = item;
			return {
				salesOrderItemNo, usedMaterialCode, price, quantity,
				price:  round2Dec(price).toFixed(2),
				discount:  round2Dec(discount).toFixed(2),
				amount:  round2Dec(amount).toFixed(2),
				netAmount:  round2Dec(netAmount).toFixed(2)
			}
		});


		// access link & email setting
		let accessLink = (proceedtoSAP) ? 'WOS' : 'AMI';
		let emailSetting = {
			subject : (proceedtoSAP) ? 'Your Order is now in process.' : 'Order pending for credit/overdue approval.'
		};

		if (DEPLOYED_ON != 'SAP') {
			emailSetting.to = DEV_EMAILS.OPS_BST;
			emailSetting.cc = [];
		} else {
			if (proceedtoSAP) { // order go to SAP
				// to customer
				// cc logistic, salesman
				/* emailSetting.to = customerEmail;
				emailSetting.cc = [].concat(BSTSG_EMAILS.logisticTeam).concat(SALESPERSON.email); */

				if (customerStatus == 'active') {
					emailSetting.to = customerEmail;
					emailSetting.cc = [].concat(BSTSG_EMAILS.logisticTeam).concat(CUSTOMERSALESPERSON.email);
				} else {
					emailSetting.to = [].concat(BSTSG_EMAILS.logisticTeam).concat(CUSTOMERSALESPERSON.email);
					emailSetting.cc = [];
				}

			} else { // order go ot credit limit
				if (creditExceed < 20000 && overduePayment < 20000) {
					emailSetting.to = ['kelvin.lee@bridgestone.com', 'matsukawa.yang@bridgestone.com'];
				} else if (creditExceed >= 20000 || overduePayment >= 20000) {
					emailSetting.to = ['matsukawa.yang@bridgestone.com'];
				}

				emailSetting.cc = ['weejein.tan@bridgestone.com', 'avon.pang@bridgestone.com', 'vivienne.tang@bridgestone.com', 'jean.cheong@bridgestone.com'];
			}
		}

		const emailNotif = { detailSection, orderSection, accessLink, emailSetting };
		sendOrderNotif(emailNotif, (err, res) => {
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

	// email reject order
	function emailRejectOrderNotif(order, reason) {
		const customerEmail = order[0].email;
		let customerStatus = order[0].status;
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
			/* emailSetting.to = customerEmail;
			emailSetting.cc = [].concat(BSTSG_EMAILS.logisticTeam).concat(BSTSG_EMAILS.managementTeam).concat(SALESPERSON.email); */

			if (customerStatus == 'active') {
				emailSetting.to = customerEmail;
				emailSetting.cc = [].concat(BSTSG_EMAILS.logisticTeam).concat(BSTSG_EMAILS.managementTeam).concat(CUSTOMERSALESPERSON.email);
			} else {
				emailSetting.to = [].concat(BSTSG_EMAILS.logisticTeam).concat(BSTSG_EMAILS.managementTeam).concat(CUSTOMERSALESPERSON.email);
				emailSetting.cc = [];
			}
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

	function printSalesForm(orders, SAPno) {
		if (!SAPno) SAPno = 'SAPERROR'
		orders.map(item => {
			item.salesOrderNoSAP = SAPno;
			item.salesOrderApprover = LOCAL_STORAGE.userid;
			item.dateApproved       = moment().format('YYYY-MM-DD');
			return item
		});

		resetLocalStorage('salesorderform', orders);
		window.open('../../invoice/salesorderform/ROLE::a0ad3978-cb83-4e94-b1ee-619c7de46d3b');
	}

	// update local db copy
	function updateOrderLocal(order, localdb) {
		for (let i in order) {
			let id = i;
			let index = localdb.findIndex(item => item.id == id);
			localdb.splice(index, 1);
		}
	}
});