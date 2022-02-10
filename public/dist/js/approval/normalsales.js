$(document).ready(function() {
	let LCLDB_NORMAL_ORDER, LCLDB_STOCK, VISIBLE_STOCK, NOTES, ROLE_IDS = role_localdata, SALESPERSON, CUSTOMERSALESPERSON;
	let LCLDB_BACKORDER, DT_BACKORDER, DT_BACKORDER_DETAILS, DT_CHECK_BACK_ORDER_2;
	let DT_NORMAL_ORDER, DT_NORMAL_ORDER_DETAILS, DT_CHECK_NORMAL_ORDER;
	let DT_CHECK_BACK_ORDER_1;
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
		let data = '';

		if (config.db == 'couchbase') {
			loadNormalOrder((err, res) => {
				if (err || res.statusCode >= 300) { alert('Unable to get normal order'); }
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

	// load normal order table
	function loadBackorderTable() {
		let data = '';

		if (config.db == 'couchbase') {
			loadAllBackorder((err, res) => {
				if (err || res.statusCode >= 300) { alert('Unable to get backorder'); }
				else if (res.statusCode <= 299) { LCLDB_BACKORDER = res.result; data = res.result; }
			});
		} else if (config.db == 'local') {
			data = LCLDB_BACKORDER;
		}

		data = removeduplicate_1(data, 'backOrderNo');
		$.fn.dataTable.moment('MMM DD, YYYY hh:mm A'); // table date column sort
		DT_BACKORDER = $('#backorder-table').DataTable({
			destroy        : true,
			data           : data,
			autoWidth      : false,
			scrollX        : true,
			scrollY        : 350,
			scrollCollapse : true,
			paging         : false,
			dom            : 'rti',

			columns: [
				{ data: 'backOrderNo', title: 'Backorder no', width: 80 },
				{ data: 'salesOrderNo', title: 'Reference no', width: 80 },
				{ data: 'customerCode', title: 'Customer code', width: 80 },
				{ data: 'customerName', title: 'Customer name' },
				{ data: 'orderedBy', title: 'Ordered by' },
				// { data: 'orderType', title: 'Order type', width: '70' },
				{ data: 'dateCreated', title: 'Order date', width: 100 },
				{ data: 'backOrderNo', title: 'Items', defaultContent: '', width: 40 },
				{ data: null, title: 'Action', width: 40 }
			],
			columnDefs: [
				{ targets: [0, 1, 2, 5, 6, 7], className: 'dt-center' }, // salesNo, customerCode, dateOrdered, items, btn
				{ targets: 7, orderable: false },  // btn
				{
					targets: [0, 1, 2], // salesNo, customerCode
					render: (data, type, row) => `<b>${data}</b>`,
				},
				{
					targets: 5, // dateOrdered
					render: (data, type, row) => moment(data, 'YYYY-MM-DD hh:mm A').format('MMM DD, YYYY hh:mm A'),
				},
				{
					targets: 6, // items
					render: (data, type, row) => {
						const count = LCLDB_BACKORDER.filter(item => item.backOrderNo == data).length;
						return `<span class="badge bg-light-blue">${count}</span>`
					},
				},
				{
					targets: 7, // action
					render: (data, type, row) => '<a href="#" class="btn btn-primary btn-xs view-details" data-toggle="tooltip" data-placement="left" data-original-title="Backorder details" data-target="#backorder-carousel" data-slide-to="1"><i class="fa fa-tasks" aria-hidden="true"></i></a>'
				}
			],
			rowCallback: (row, data, iDataIndex) => {
				$(row).attr('id', data['id']);
				let btn = $(row).find('a.view-details');

				btn.off('click').click(() => {
					$('[data-toggle="tooltip"]').tooltip('hide');
					$('.loading-state-backorder').fadeIn();

					const order = LCLDB_BACKORDER.filter(item => item.salesOrderNo == data.salesOrderNo);
					setTimeout(()=> {
						loadBackorderDetailsTable(order);
						$('.loading-state-normal-order').fadeOut('slow');
					}, 1000);
				});
			}
		});

		// // $('#normal-order-table-filter').off('keyup').keyup(function(){ DT_NORMAL_ORDER.search($(this).val()).draw(); });
		$('.loading-state-backorder').fadeOut('slow');
	}

	// load normal order details
	function loadNormalOrderDetailsTable(data) {
		console.log('data : ', data)
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
				{ data: 'quantity', title: 'Normal<br>Order', width: 60 },
				{ data: 'backOrder', title: 'Backorder', width: 60 },
				{ data: 'note', title: '<i class="fa fa-commenting" aria-hidden="true"></i> Note' }
			],
			columnDefs: [
				{ targets: [0, 4, 5, 6, 7, 8], className: 'dt-center'},  // #, quantity, visibleStock, actualStock, normal, backorder
				{ // price
					targets: 3, className: 'dt-right',
					render: (data, type, row) => convertToNumber(data, '2-decimal')
				},
				{ // quantity, actualStock
					targets: [4],
					render: (data, type, row) => parseInt(data) + parseInt(row.backOrder)
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
				{ // quantity, actualStock
					targets: [6],
					render: (data, type, row) => {
						let stock = data;
						if(stock < 0) stock = 0;
						return convertToNumber(stock, 'whole');
					}
				},
				{ // normal
					targets: 7,
					render: (data, type, row) => {
						let suggest = convertToNumber(data, 'whole');
						return `<input type="number" class="form-control input-sm allocateNormalorder" style="width: 60px;" min="0" max="${row.quantity}" value="${suggest}" placeholder="0">`;
					}
				},
				{ // backorder
					targets: 8,
					render: (data, type, row) => {
						let suggest = convertToNumber(data, 'whole');
						return `<input type="number" class="form-control input-sm allocateBackorder" style="width: 60px;" min="0" max="${row.quantity}" value="${suggest}" placeholder="0">`;
					}
				},
				{ // note
					targets: 9, className: 'note-column', orderable: false,
					render: (data, type, row) => (data) ? `<b>${data}</b>` : ''
				}
			],
			rowCallback : (row, data, iDataIndex) => {
				$(row)
					.attr('id', data['id'])
					.attr('data-salesOrderItemNo', data['salesOrderItemNo'])
					.find('.note-column').addClass('mark');
				automaticAllocate($(row).find('input.allocateNormalorder'), $(row).find('input.allocateBackorder'), data['quantity']);
				$(row).find('input.allocateNormalorder, input.allocateBackorder').keypress(function(e){
					if (e.which < 48 || e.which > 57) { e.preventDefault(); }
				});
			}
		});

		$('.normal-order-details-panel [data-type="details"]').each(function(index, el) {
			let key = $(el).attr('data-key'), split = key.split('.');
			if (split.length == 1) $(el).text(data[0][key]);
		});

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

	function loadBackorderDetailsTable(data) {
		data = getStock(DEPLOYED_ON, data); // get stock per item
		if (data == 'SAPerror') return;
		data = getCreditLimit(DEPLOYED_ON, data); // get credit, overdue, note
		if (data == 'SAPerror') return;

		DT_BACKORDER_DETAILS = $('#backorder-details-table').DataTable({
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
				{ data: null, title: 'Backorder', width: 60 },
				{ data: 'note', title: '<i class="fa fa-commenting" aria-hidden="true"></i> Note' }
			],
			columnDefs: [
				{ targets: [0, 4, 5, 6, 7], className: 'dt-center'},  // #, quantity, visibleStock, actualStock, normal, backorder
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
						data = (row.totalStock >= row.visibleStock) ? row.visibleStock : row.totalStock;
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
				{ // backorder
					targets: 7,
					render: (data, type, row) => {
						return `<input type="number" class="form-control input-sm allocateBackorder" style="width: 60px;" min="0" max="${row.quantity}" placeholder="0">`;
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
					.attr('data-salesOrderItemNo', data['salesOrderItemNo'])
					.find('.note-column').addClass('mark')
					.find('input.allocateBackorder').keypress(function(e){
						if (e.which < 48 || e.which > 57) { e.preventDefault(); }
					});
			}
		});

		$('.backorder-details-panel [data-type="details"]').each(function(index, el) {
			let key = $(el).attr('data-key'), split = key.split('.');
			if (split.length == 1) $(el).text(data[0][key]);
		});

		// credit display
		let credit = $('.backorder-details-panel [data-key="creditLimit"]').text();
		$('.backorder-details-panel [data-key="creditLimit"]').text(convertToNumber(credit, '2-decimal'));

		// overdue display
		let overdue = $('.backorder-details-panel [data-key="overduePayment"]').text();
		$('.backorder-details-panel [data-key="overduePayment"]').text(convertToNumber(overdue, '2-decimal'));

		// date created display
		let dateCreated = $('.backorder-details-panel [data-key="dateCreated"]').text();
		$('.backorder-details-panel [data-key="dateCreated"]').text(moment(dateCreated, 'YYYY-MM-DD hh:mm A').format('MMM DD, YYYY hh:mm A'));

		// requested date display
		let requestedDate = $('.backorder-details-panel [data-key="requestedDate"]').text();
		$('.backorder-details-panel [data-key="requestedDate"]').text(`${moment(requestedDate.slice(0, -3), 'YYYY-MM-DD').format('MMM DD, YYYY')} ${requestedDate.slice(-2)}`);

		// delivery details display
		if (data[0].requestDeliveryMethod == 'delivery') {
			$('.backorder-details-panel [data-key="shipToAddress"]').parent().show();
			$('.backorder-details-panel [data-key="carPlateNo"]').parent().hide();
		} else {
			$('.backorder-details-panel [data-key="shipToAddress"]').parent().hide();
			$('.backorder-details-panel [data-key="carPlateNo"]').parent().show();
		}

		$('.backorder-details-panel .order-info, .backorder-details-panel .delivery-info').height($('.backorder-details-panel .customer-info').height());
		$('.loading-state-backorder').fadeOut('slow');
	}

	// load check normal order
	function loadCheckNormalOrderTable(data) {
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
				{ data: 'order', title: 'Quantity', width: 50 },
				{ data: 'orderDiscount', title: 'Discount / pc', defaultContent: '0.00', width: 50 },
				{ data: 'orderNetAmount', title: 'Net Amount', defaultContent: '0.00', width: 50 }
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
		enableBtn($('#check-allocate-normal-order-btn'));
	}

	// load check backorder order
	function loadCheckBackorderTable_1(data) {
		DT_CHECK_BACK_ORDER_1 = $('#approve-backorder-table').DataTable({
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
				{ data: 'backorder', title: 'Quantity', width: 50 },
				{ data: 'discount', title: 'Discount / pc', defaultContent: '0.00', width: 50 },
				{ data: 'backorderNetAmount', title: 'Net amount', defaultContent: '0.00', width: 50 }
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
				.attr('data-backorderSalestotal', total);
			}
		});

		$('.loading-state-check-back-order-1').fadeOut('hide');
	}

	function loadCheckBackorderTable_2(data) {
		DT_CHECK_BACK_ORDER_2 = $('#approve-backorder-table2').DataTable({
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
				{ data: 'order', title: 'Quantity', width: 50 },
				{ data: 'discount', title: 'Discount / pc', defaultContent: '0.00', width: 50 },
				{ data: 'netAmount', title: 'Net amount', defaultContent: '0.00', width: 50 }
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
				.attr('data-backorderSalestotal', total);
			}
		});

		$('.loading-state-check-backorder-2').fadeOut('hide');
	}

	// input suggestion on change
	function automaticAllocate(inputChange, inputAdjust, orderQuantity) {
		inputChange.on('keyup mouseup', function(){
			orderQuantity = parseInt(orderQuantity),
			orderAllocate = parseInt($(this).val()),
			backorderAllocate = orderQuantity - orderAllocate;

			inputAdjust.val( (backorderAllocate <= 0) ? 0 : backorderAllocate);
		});

		// inputAdjust.on('keyup mouseup', function(){
		//   orderQuantity = parseInt(orderQuantity),
		//   orderAllocate = parseInt($(this).val()),
		//   backorderAllocate = orderQuantity - orderAllocate;

		//   inputChange.val( (backorderAllocate <= 0) ? 0 : backorderAllocate )
		// });
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
						console.log(order)
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
				const creditFixed = 500, overdueFixed = 0, creditExceedFixed = 0;

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

	function calculateDiscount(orders, discounts) {
		let order, discount, total;
		for (let i in orders) {
			order = orders[i];
			let origPrice = order.price, orderQuantity = order.order, orderAmount = order.orderAmount;
			let allDiscountPerOrder = 0;

			discounts
				.filter(item => Number(item.salesOrderItemNo) == order.salesOrderItemNo)
				.forEach(item => {
					let discountPerPc = Number(origPrice * parseFloat(item.discount) / 100);
					let discountPerOrder = Number(discountPerPc * orderQuantity);
					origPrice -= discountPerPc;
					allDiscountPerOrder += discountPerOrder;
				})

			order.orderDiscount = allDiscountPerOrder / Number(orderQuantity);
			order.orderNetAmount = Number(orderAmount) - allDiscountPerOrder;
		}

		return orders;
	}

	$('#btn-help-multiple').attr('data-content', 
		`<a><h6 id="btn-approve" data-toggle="modal" data-target="#modal-default" data-help="normalSales" style="cursor: pointer;">How to allocate/approve order</h6></a>
		<a><h6 id="btn-reject" data-toggle="modal" data-target="#modal-default" data-help="normalSales" style="cursor: pointer;">How to reject order</h6></a>`
	);

	// let dataCon = $('#btn-help-multiple').attr('data-content');
	// $(dataCon).each(function(index, el) {
	// 	if ($(el).html()) {
	// 		// console.log('asd')
	// 		let idArray = [];
	// 		let tempval = $(el).val('id');
	// 		let id = tempval[0].firstChild.id;
	// 		console.log('asd')
	// 		console.log(id)

	// 		// $(document).on("click", id, function(event) {
	// 		// 	let helptype = $(id).attr('data-help');
	// 		// 	console.log(helptype)
	// 		// 	helpCarouselMultiple(helptype, 'check')
	// 		// });
	// 	}
	// });

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
		if (DT_CHECK_BACK_ORDER_1) DT_CHECK_BACK_ORDER_1.clear().draw(); // clear table if already initialized

		disableBtn($(this));

		let row = DT_NORMAL_ORDER_DETAILS.rows().data().toArray()
		let discounts = [], customerCode = row[0].customerCode;

		for (let i in row) {
			let data = row[i], rownode = DT_NORMAL_ORDER_DETAILS.row(`[data-salesOrderItemNo="${row[i].salesOrderItemNo}"]`).nodes().to$();

			data.quantity = parseInt(data.order) + parseInt(data.backorder)
			data.order = parseInt(rownode.find('input.allocateNormalorder').val());
			data.orderDiscount = 0.0;
			data.orderAmount = parseInt(data.order) * parseFloat(data.price);
			data.orderNetAmount = parseInt(data.order) * parseFloat(data.price);

			data.backorder = parseInt(rownode.find('input.allocateBackorder').val());
			data.backorderAmount  = parseInt(data.backorder) * parseFloat(data.price);
			data.backorderNetAmount  = parseInt(data.backorder) * parseFloat(data.price);

			if (!data.order && !data.backorder) {
				resultNotify('fa-exclamation-circle', 'INVALID', 'Allocate an order or backorder quantity on all items', 'warning');
				rownode.removeClass('orderOk success danger');
				return;
			} else if (data.order > data.quantity) {
				resultNotify('fa-exclamation-circle', 'INVALID', 'Allocation should not exceed customers order quantity', 'warning');
				rownode.removeClass('orderOk success danger');
				return;
			} 
			// else if (data.order > data.totalStock) {
			// 	resultNotify('fa-exclamation-circle', 'INVALID', 'Normal order should not exceed stock', 'warning');
			// 	rownode.removeClass('orderOk success danger');
			// 	return;
			// } 
			else {
				rownode.addClass('orderOk success').removeClass('danger');
			}

			if (data.backorder) {
				if (!data.order) {
					rownode.removeClass('success');
				}

				if (data.backorder + data.order > data.quantity) {
					resultNotify('fa-exclamation-circle', 'INVALID', 'Allocation should not exceed customers order quantity', 'warning');
					rownode.removeClass('orderOk danger success');
					return;
				} else {
					rownode.addClass('orderOk danger');
				}
			}

			if (data.order) {
				discounts.push({
					salesOrderItemNo : data.salesOrderItemNo,
					materialCode : data.materialCode,
					quantity : data.order
				});
			}
		}

		let validOrder = DT_NORMAL_ORDER_DETAILS.rows('.orderOk').count();
		if (validOrder == DT_NORMAL_ORDER_DETAILS.rows().count()) {
			let order = DT_NORMAL_ORDER_DETAILS.rows('.success').data().toArray();
			let backorder = DT_NORMAL_ORDER_DETAILS.rows('.danger').data().toArray();

			if (DEPLOYED_ON != 'LOCAL') {
				let SAPdiscount;
				DI_calculateDisocunt({ customer: customerCode, orders: discounts }, (err, res) => {
					if (err || res.statusCode >= 300) {
						alert('Unable to calculate discount from SAP.');
						console.log('err', err, 'res', res);
						return;
					}

					SAPdiscount = res.result;
				});

				if (!SAPdiscount) return
				order = calculateDiscount(order, SAPdiscount)
			}

			$('#allocate-order-modal').modal();
			$('.loading-state-check-normal-order, .loading-state-check-back-order-1').fadeIn();
			setTimeout(() => {
				$('span#normal-order-counter').html(order.length);
				$('span#backorder-counter').html(backorder.length);

				loadCheckNormalOrderTable(order);
				loadCheckBackorderTable_1(backorder);
			}, 1000);
		}
	});

	$('#check-allocate-backorder-btn').click(function() {
		if (DT_CHECK_BACK_ORDER_2) DT_CHECK_BACK_ORDER_2.clear().draw(); // clear table if already initialized

		let row = DT_BACKORDER_DETAILS.rows().data().toArray()
		for (let i in row) {
			let data = row[i], rownode = DT_BACKORDER_DETAILS.row(`[data-salesOrderItemNo="${row[i].salesOrderItemNo}"]`).nodes().to$();

			data.order = parseInt(rownode.find('input.allocateBackorder').val());
			data.discount = 0.0;
			data.amount = parseInt(data.order) * parseFloat(data.price);
			data.netAmount = parseInt(data.order) * parseFloat(data.price);

			if (!data.order) {
				resultNotify('fa-exclamation-circle', 'INVALID', 'Allocate a backorder quantity on all items', 'warning');
				rownode.removeClass('orderOk success danger');
				return;
			} else if (data.order > data.quantity) {
				resultNotify('fa-exclamation-circle', 'INVALID', 'Allocation should not exceed customers backorder quantity', 'warning');
				rownode.removeClass('orderOk success danger');
				return;
			} 
			// else if (data.order > data.totalStock) {
			// 	resultNotify('fa-exclamation-circle', 'INVALID', 'Backorder should not exceed stock', 'warning');
			// 	rownode.removeClass('orderOk success danger');
			// 	return;
			// } 
			else {
				rownode.addClass('orderOk success').removeClass('danger');
			}
		}

		let validOrder = DT_BACKORDER_DETAILS.rows('.orderOk').count();
		if (validOrder == DT_BACKORDER_DETAILS.rows().count()) {
			let order = DT_BACKORDER_DETAILS.rows('.success').data().toArray();

			$('#allocate-backorder-modal').modal();
			$('.loading-state-check-back-order-2').fadeIn();
			setTimeout(() => {
				$('span#backorder-counter2').html(order.length);

				// loadCheckNormalOrderTable(order);
				loadCheckBackorderTable_2(order);
			}, 1000);
		}
	});

	// input reject backorder reason
	$('#check-reject-backorder-btn').click(function() {
		$('#reject-backorder-modal').modal();
	 	$('#reject-backorder-form textarea').val('');
	 	$('#reject-backorder-form textarea').parent().removeClass('has-error');
	});

	// reject backorder
	$('#reject-backorder-btn').click(function() {
		const textarea = $('#reject-backorder-form textarea');

		if (!textarea.val().trim()) {
			textarea.parent().addClass('has-error');
			return;
		}

		$('.loading-state-backorder').fadeIn();
		disableBtn($(this));
		setTimeout(() => {
			let order = DT_BACKORDER_DETAILS.rows().data().toArray();
			let reason = textarea.val().trim();
			let successUpdate;
			let orderType = 'backorder';

			successUpdate = rejectOrderCouch(order, reason, orderType);
			if 	(successUpdate) 
				emailRejectOrderNotif(order, reason);

				if (LOG_FUNCTION) {
					createLog(`LOG::${LOCAL_STORAGE.referenceId}`, {
						dateCreated : moment().toISOString(),
						action : `Rejected order ${order[0].salesOrderNo}`,
						module : "Approval/Normal Sales",
						app : "AMI"
					}, moment().toISOString());
				}

			$('#reject-backorder-modal').modal('hide');

			if (successUpdate) {
				resultNotify('fa-check-circle', 'SUCCESS', '<b>Backorder successfully rejected</b>', 'success');
			} else {
				alert('Backorder not rejected.\nSomething went wrong. Please try again later');
			}

			setTimeout(() => {
				enableBtn($(this));
				$('#back-backorder-btn').click();
				setTimeout(() => {
					config.db = 'local';
					loadBackorderTable();
				}, 1000);
			}, 1000);
		}, 1000);
	});

	// clear order details
	$('#back-backorder-btn').click(function() {
		if (DT_BACKORDER_DETAILS) DT_BACKORDER_DETAILS.clear().draw(); // clear table if already initialized
		$('.backorder-details-panel [data-type="details"]').each(function(index, el) { $(el).text(''); });
	});

	// navigate on normal and back tabs
	$('#normal-order-tabs').click(function() {
		$('#check-allocate-normal-order-btn').click();
	});

	$('#main-order-tab > li a[data-toggle="tab"]').click(function() {
		const action = $(this).attr('data-action');
		switch(action) {
			case 'loadnormalorder':
				$('.loading-state-normal-order').fadeIn('slow');
				setTimeout(() => { loadNormalOrderTable(); }, 1000);
			break;

			case 'loadbackorder':
				$('.loading-state-backorder').fadeIn('slow');
				setTimeout(() => { loadBackorderTable('block-normal'); }, 1000);
			break;
		}
	});

	// approve order
	$('#approve-normal-order-btn').click(function() {
		$('.loading-state-normal-order').fadeIn();
		disableBtn($(this));
		setTimeout(() => {
			let order = DT_CHECK_NORMAL_ORDER.rows().data().toArray();
			let backorder = DT_CHECK_BACK_ORDER_1.rows().data().toArray();
			let successUpdate, successSAP = true;
			let creditLimit = order[0].creditLimit;

			if (order.length > 0) { // there is normal order
				const overduePayment = order[0].overduePayment;
				const creditExceed = order[0].creditExceed;
				let proceedtoSAP = true;

				if (overduePayment <= 0 && creditExceed <= 0) { // order okay
					if (DEPLOYED_ON != 'LOCAL') { // Dev or Prod
						orderStatus = releaseDeliveryBlockSAP(order);
						successSAP = (orderStatus === "0") ? true : false;
					}

					if (successSAP) successUpdate = updateOrderCouch(order, proceedtoSAP, '');
					if (successUpdate) {
						if (backorder.length > 0) {  // there is backorder
							successUpdate = createBackorderCouch(backorder);
							if (successUpdate) 
								emailBackorderNotif(backorder, successUpdate);
			
								if (LOG_FUNCTION) {
									createLog(`LOG::${LOCAL_STORAGE.referenceId}`, {
										dateCreated : moment().toISOString(),
										action : `Created backorder ${successUpdate} from ${order[0].salesOrderNo}`,
										module : "Approval/Normal Sales",
										app : "AMI"
									}, moment().toISOString());
								}
						}

						emailOrderNotif(order, proceedtoSAP, creditExceed, overduePayment);
						printSalesForm(order, order[0].salesOrderNoSAP);

						if (LOG_FUNCTION) {
							createLog(`LOG::${LOCAL_STORAGE.referenceId}`, {
								dateCreated : moment().toISOString(),
								action : `Approved order ${order[0].salesOrderNo}`,
								module : "Approval/Normal Sales",
								app : "AMI"
							}, moment().toISOString());
						}
					}
				} else { // order for credit/overdue approval
					let proceedtoSAP = false;
					if (creditExceed > 0) alert('Credit limit exceeded. This order will go to credit/overdue approval.');
					else if (overduePayment > 0) alert('Customer have overdue payment. This order will go to credit/overdue approval.');
					let approver = (overduePayment >= 20000 || creditExceed >= 20000) ? 'MANAGEMENT' : 'SALES MANAGER';
					// let approver = 'SALES MANAGER';

					successUpdate = updateOrderCouch(order, proceedtoSAP, approver);
					if (successUpdate) 
						emailOrderNotif(order, proceedtoSAP, creditExceed, overduePayment);

						if (LOG_FUNCTION) {
							createLog(`LOG::${LOCAL_STORAGE.referenceId}`, {
								dateCreated : moment().toISOString(),
								action : `Approved order ${order[0].salesOrderNo} -> credit exceed/overdue payment`,
								module : "Approval/Normal Sales",
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

	$('#approve-backorder-btn').click(function() {
		$('.loading-state-backorder').fadeIn();
		disableBtn($(this));
		setTimeout(() => {
			let order = DT_CHECK_BACK_ORDER_2.rows().data().toArray();
			let successUpdate;

			successUpdate = updateBackrderCouch(order);
			// if (successUpdate) emailOrderNotif(order, proceedtoSAP, '0', '0');

			$('#allocate-backorder-modal').modal('hide');

			if (successUpdate) { // all success
				resultNotify('fa-check-circle', 'SUCCESS', '<b>Backorder successfully allocated</b>', 'success');
					
				if (LOG_FUNCTION) {	
					createLog(`LOG::${LOCAL_STORAGE.referenceId}`, {
						dateCreated : moment().toISOString(),
						action : `Approved backorder ${order[0].salesOrderNo}`,
						module : "Approval/Normal Sales",
						app : "AMI"
					}, moment().toISOString());
				}
			} else {
				alert('Backorder not allocated.\nSomething went wrong. Please try again later');
			}

			setTimeout(() => {
				enableBtn($(this));
				$('#back-backorder-btn').click();
				setTimeout(() => {
					config.db = 'local';
					loadBackorderTable();
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
			let orderType = 'normal order'

			if 	(DEPLOYED_ON != 'LOCAL') { // Dev or Prod
				const rejectStatus = rejectSOWOS(order);
				successSAP = (rejectStatus === "0") ? true : false;
			}

			if	(successSAP) successUpdate = rejectOrderCouch(order, reason, orderType);
			if	(successUpdate) 
				emailRejectOrderNotif(order, reason);

				if (LOG_FUNCTION) {
					createLog(`LOG::${LOCAL_STORAGE.referenceId}`, {
						dateCreated : moment().toISOString(),
						action : `Rejected order ${order[0].salesOrderNo}`,
						module : "Approval/Normal Sales",
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

	const releaseDeliveryBlockSAP = (order) => {
		let releaseStatus = "0";

		let ReleaseDeliveryBlockModels = order.map(item => {
			return {
				salesOrderNo: item.salesOrderNo
			}
		});
		console.log(ReleaseDeliveryBlockModels)
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
				console.log(result)
				releaseStatus = result[0].recode;
			}
		});

		return releaseStatus;
	}

	const rejectSOWOS = (order) => {
		let rejectStatus = "0";

		let RejectSOWSOsModels = order.map(item => {
			return {
				salesOrderNo: item.salesOrderNo
			}
		});

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
				rejectStatus = result[0].recode;
			}
		});

		return rejectStatus;
	}

	// update order on couch
	function updateOrderCouch(order, proceedtoSAP, approver) {
		let isSuccess = true;

		let changesObj = {};
		for (let i in order) {
			let data = order[i];

			changesObj[data.id] = {
				backorder		   : data.backOrder,
				amount             : data.orderAmount.toString(),
				netAmount          : data.orderNetAmount.toString(),
				discount           : data.orderDiscount.toString(),
				quantity           : data.order.toString(),
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

	function updateBackrderCouch(order) {
		let isSuccess = true;

		let changesObj = {};
		for (let i in order) {
			let data = order[i];
			changesObj[data.id] = {
				amount          : parseFloat(data.amount).toFixed(2),
				netAmount       : parseFloat(data.netAmount).toFixed(2),
				discount        : parseFloat(data.discount).toFixed(2),
				orderItemStatus : 'backorderPending',
				quantity        : parseInt(data.order)
			}
		}

		updateOrders(changesObj, (err, res) => {
			if (err || res.statusCode >= 300) { isSuccess = false; }
			else if (res.statusCode <= 299) { updateOrderLocal(changesObj, LCLDB_BACKORDER); }
		});

		return isSuccess;
	}

	// create backorder doc
	function createBackorderCouch(backorder) {
		let SOno, backorders = [], orderDelete = {}, process = 'create';

		for (let i in backorder) {
			let data = backorder[i];
			let rownode = DT_NORMAL_ORDER_DETAILS.row(`[data-salesOrderItemNo="${data.salesOrderItemNo}"]`).nodes().to$();

			backorders.push({
				salesOrderNo          : data.salesOrderNo,
				salesOrderItemNo      : data.salesOrderItemNo,
				orderType             : data.orderType,
				orderItemStatus       : `backorderPending`,
				materialCode          : data.materialCode,
				materialGroup         : data.materialGroup,
				materialId            : data.materialId,
				size                  : data.size,
				oldMaterialNumber     : data.oldMaterialNumber,
				storageLocation       : data.storageLocation,
				usedMaterialCode      : data.usedMaterialCode,

				// computation
				discount              : parseFloat('0.0').toFixed(2).toString(),
				price                 : parseFloat(data.price).toFixed(2).toString(),
				quantity              : data.backorder.toString(),
				amount                :  parseFloat(data.backorderAmount).toFixed(2).toString(),
				netAmount             : parseFloat(data.backorderNetAmount).toFixed(2).toString(),

				// order ship and sold
				createdBy             : data.createdBy,
				dateCreated           : moment(data.dateCreated, 'YYYY-MM-DD hh:mm A').format('YYYY-MM-DD'),
				timeCreated           : moment(data.dateCreated, 'YYYY-MM-DD hh:mm A').format('hh:mm A'),
				salesperson           : [data.salesperson],
				customerCode          : data.customerCode,
				customerId            : data.customerId,
				soldToUserId          : data.soldToUserId,
				shipToParty           : data.shipToParty,
				shipToId              : data.shipToId,
				requestDeliveryMethod : data.requestDeliveryMethod,
				requestedDate         : data.requestedDate.slice(0, -3),
				requestedTime         : data.requestedDate.slice(-2),
				carPlateNo            : data.carPlateNo
			});

			if (!rownode.hasClass('success')) {
				orderDelete[data.id] = {
					isDeleted: true,
					deleteDate: moment().toISOString(),
					deleteReason: 'order converted to backorder'
				}
			}
		}

		createBackorders({ backorders }, (err, res) => {
			// console.log(res);
			if (err || res.statusCode >= 300) {}
			else if (res.statusCode <= 299) {
				SOno = res.result;

				updateOrders(orderDelete, (err2, res2) => { // soft delete order
					// console.log(res2);
					if (err2 || res2.statusCode >= 300) {}
					else if (res2.statusCode <= 299) {
						updateBackorderLocal(backorder, LCLDB_NORMAL_ORDER, process);
					}
				});
			}
		});

		return SOno;
	}

	// reject order on couch
	function rejectOrderCouch(order, reason, type) {
		let isSuccess = true;
		let process = 'reject';

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
			else if (res.statusCode <= 299) { 
				type === 'backorder' ? updateBackorderLocal(changesObj, LCLDB_BACKORDER, process) : updateOrderLocal(changesObj, LCLDB_NORMAL_ORDER); 
			}
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
		console.log('customer code : ', customerCode)
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
			let { salesOrderItemNo, usedMaterialCode, price } = item;
			return {
				salesOrderItemNo, usedMaterialCode,
				quantity: item.order.toString(),
				price:  round2Dec(price).toFixed(2),
				discount: round2Dec(item.orderDiscount).toFixed(2),
				amount:  round2Dec(item.orderAmount).toFixed(2),
				netAmount:  round2Dec(item.orderNetAmount).toFixed(2)
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

				/* if (customerStatus == 'active') {
					emailSetting.to = DEV_EMAILS.OPS_BST;
					emailSetting.cc = 'cedrixbinan@gmail.com';
				} else {
					emailSetting.to = 'cedrixbinan@gmail.com';
					emailSetting.cc = [];
				} */

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

	// email backorder
	function emailBackorderNotif(order, backOrderNo) {
		const customerEmail = order[0].email;
		let customerStatus = order[0].status;
		let { salesOrderNo, customerCode, customerName, orderType, dateCreated, requestedDate,
			requestDeliveryMethod, shipToCustomerCode, shipToAddress, carPlateNo } = order[0];

		// details section
		let detailSection = {};
		detailSection[`Reference no`] = salesOrderNo;
		detailSection[`Backorder no`] = backOrderNo;
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
				// amount : 'Amount',
				// discount : 'Discount',
				netAmount : 'Net Amount'
			}
		};

		orderSection.data = order.map(item => {
			let { salesOrderItemNo, usedMaterialCode, price } = item;
			return {
				salesOrderItemNo, usedMaterialCode,
				price: parseFloat(price).toFixed(2),
				quantity: item.backorder.toString(),
				netAmount:  parseFloat(item.backorderNetAmount).toFixed(2)
			}
		});


		// access link & email setting
		let accessLink = 'WOS';
		let emailSetting = {
			subject : 'You have a backorder pending for your apporval.'
		};

		if (DEPLOYED_ON != 'SAP') {
			emailSetting.to = DEV_EMAILS.OPS_BST;
			emailSetting.cc = [];
		} else {
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
				emailSetting.cc = [].concat(BSTSG_EMAILS.logisticTeam).concat(BSTSG_EMAILS.managementTeam).concat(CUSTOMERSALESPERSON.email);
				emailSetting.cc = [];
			}
		}

		const emailNotif = { detailSection, orderSection, accessLink, emailSetting };
		sendRejectOrderNotif(emailNotif, (err, res) => {
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
			item.discount = item.orderDiscount;
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

	// update local db copy
	function updateBackorderLocal(backorder, localdb, process) {
		if(process === 'reject'){
			let id = Object.keys(backorder)[0];
			let index = localdb.findIndex(item => item.id == id);
			if (index != -1) localdb.splice(index, 1);
		}
		else{
			for (let i in backorder) {
				let id = backorder[i].id;
				let index = localdb.findIndex(item => item.id == id);
				if (index != -1) localdb.splice(index, 1);
			}
		}
	}
});