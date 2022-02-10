checkSession();
setUserData();

$(document).ready(function() {
	let LCLDB_ORDER, DT_ORDER, DT_ORDER_DETAILS, DT_BACK_ORDER_DETAILS, 
	DT_CHECK_NORMAL_ORDER, DT_CHECK_BACK_ORDER;
	let BACK_ORDERS_HANDLER;
	const config = {
		// db : 'offline'
		db : 'couchbase'
	};

	$('.datatable').DataTable({destroy: true, dom: 'rt'}); // init tables as datatables

	loadOrderTable();
	// magic 
	// setTimeout(function(){ $('a.view-trigger')[8].click(); }, 500);


	function loadOrderTable() {
		if (config.db == 'couchbase') {
			loadNormalOrder2(function(err, res) {
				try {
					if (res instanceof Array) {
						LCLDB_ORDER = res;
					} else {
						throw 'Unable to get order list';
					}
				} catch (err) {
					alert('Something went wrong\n' + err);
					console.log(err);
					console.log(res);
				}
			});
		} else if (config.db == 'local') {
			LCLDB_ORDER = LCLDB_ORDER;
		} 
		else {
			LCLDB_ORDER = offlineDB;
		}

		if (LCLDB_ORDER) {
			let data = removeDuplicate(LCLDB_ORDER, 'salesOrderNo');
			$.fn.dataTable.moment('MMM DD, YYYY hh:mm a'); // sort by date

			DT_ORDER = $('#order-table').DataTable({
				destroy        : true,
				data           : data,
				autoWidth      : false,
				scrollX        : true,
				scrollY        : 350,
				scrollCollapse : true,
				// deferRender    : true,
				// scroller       : true,
				dom            : 'rti',

				columns  :
				[
					{data: 'orderno', width: '80'},
					{data: 'customerCode', width: '80'},
					{data: 'soldTo.name1'},
					{data: 'creator', width: '70'},
					{data: 'orderType', width: '70'},
					{data: 'dateCreated', width: '100'},
					{data: 'items', width: '40'},
					{data: null, width: '50'}
				], 

				columnDefs: 
				[
					{ // salesNo, customerCode, orderType, dateOrdered, items
						className : 'dt-center', 
						targets   : [0, 1, 4, 5, 6, 7]
					},
					{ // orderType, 
						orderable : false,
						targets   : [4, 7]
					},
					{ // salesNo
						render: function (data, type, row) {
							return '<b>'+ data +'</b>'; 
						},
						targets : [0, 1]
					},
					{ // order items
						render: function (data, type, row) {
							return '<span class="badge bg-light-blue">'+ data +'</span>'; 
						},
						targets : 6
					},
					{ // button
						render: function (data, type, row) {
							let dataSlide = (row.docType == 'ORDER') ? 1 : 2;
							return '<a href="#" class="btn btn-primary btn-xs view-trigger" data-toggle="tooltip" data-placement="left" title="" data-original-title="Order details" data-target="#carousel-example-generic" data-slide-to="' + dataSlide + '"><i class="fa fa-tasks" aria-hidden="true"></i></a>'
							// return '<div class="dropdown"><button class="btn btn-default btn-sm btn-flat btn-block dropdown-toggle" type="button" data-toggle="dropdown" data-orderno="'+ row.orderno +'">Action <span class="caret"></span></button><ul class="dropdown-menu small-font dropdown-menu-right"><li> <a href="#" class="view-trigger view" data-target="#carousel-example-generic" data-slide-to="' + dataSlide + '"> <i class="fa fa-tasks"></i> View order details </a></li></ul></div>';
						},
						targets : 7
					}
				],

				rowCallback : function (row, data, iDataIndex) {
					$(row).attr('id', data['id']);
					viewOrderDetails($(row).find('a.view-trigger'), data);
				}
			});

			$('#order-table-filter').keyup(function(){
				DT_ORDER.search($(this).val()).draw();
			})
		}

		$('.loading-state').fadeOut('slow');
		$('#refresh-btn').find('i').removeClass('fa-spin');
	}


	function computeTotalStock(environment, data) {
		if (environment == 'SAP' || environment == 'DEV') {
			let stocks, totalStock;
			for (var i in data) {
				totalStock = 0;
				for (var j in data[i].stocks) {
					// getStockAvailable_SAP(data[i].stocks[j].materialCode, data[i].stocks[j].storageLocation, function(err, res){
					// 	try {
					// 		console.log('\n------ ' + data[i].stocks[j].materialCode);
					// 		console.log('couch : ' + parseInt(data[i].stocks[j].totalStock));
					// 		var SAPstock = JSON.parse(res.body)[0];
					// 		data[i].stocks[j].totalStock = parseInt(SAPstock.totalStock);
					// 		totalStock += parseInt(SAPstock.totalStock);
					// 		console.log('SAP  : ' + parseInt(SAPstock.totalStock));
					// 	} catch (err) {
					// 		alert('Something went wrong\nUnable to get stock from SAP');
					// 		console.log(err);
					// 		console.log(res);
					// 	}
					// });
					DI_stockStatus({ stocks: [{materialNo: data[i].stocks[j].materialCode, storageLocation: data[i].stocks[j].storageLocation}]  }, (err, res) => {
						console.log(res);
						totalStock += parseInt(res.result[0].totalStock);
					});
				}

				data[i].totalStock = totalStock;
			}

			return data;
		} else {
			let stocks;
			for (let i in data) {
				stocks = data[i].stocks;
				data[i].totalStock = stocks.reduce((sum, item) => sum + parseInt(item.totalStock), 0);
			}

			return data;
		}
	}


	function loadOrderDetailsTable(order) {
		try {
			let data = computeTotalStock(DEPLOYED_ON, order);
			let creditLimit = loadCreditLimit(DEPLOYED_ON, order[0].customerCode);
			let overduePayment = loadOverduePayment(DEPLOYED_ON, order[0].customerCode);

			if (creditLimit && overduePayment) {
				DT_ORDER_DETAILS = $('#order-details-table').DataTable({
					destroy   : true,
					data      : data,
					autoWidth : false,
					scrollX   : true,
					dom       : 'rti',

					columns  :
					[
						{data: 'salesOrderItemNo', width: 20},
						{data: 'usedMaterialCode'},
						{data: 'materialCode'},
						{data: 'price', width: 50},
						{data: 'quantity', width: 50},
						{data: 'visibleStock', width: 50},
						{data: 'totalStock', width: 50},
						{data: 'inputNormalOrder', width: 70},
						{data: 'inputBackorder', width: 70},
						{data: 'note', defaultContent: ''}
					],

					columnDefs: 
					[
						{ // #, quantity, quantity, visibleStock, actualStock, normal input, backorder input
							className : 'dt-center',
							targets   : [0, 4, 5, 6, 7, 8]
						},
						{ // price
							className : 'dt-right',
							targets   : 3
						},
						{ // price
							render : function (data, type, row) { return convertToNumber(data, '2-decimal'); },
							targets : 3
						},
						{ // visibleStock
							render : function (data, type, row) {
								data = (row.totalStock >= row.visibleStock) ? row.visibleStock : row.totalStock;
								return convertToNumber(data, 'whole');
							},
							targets : 5
						},
						{ // quantity, actualStock
							render : function (data, type, row) {
								return convertToNumber(data, 'whole'); 
							},
							targets : [4, 6]
						},
						{ // normal input
							render: function (data, type, row) {
								let suggest = (row.quantity > row.totalStock) ? row.totalStock : row.quantity;
								return '<input type="number" class="form-control input-sm allocateNormalorder" style="width: 70px;" min="0" max="'+row.quantity+'" value="' + suggest + '" placeholder="0">';
							},
							targets : 7
						},
						{ // backorder input
							render: function (data, type, row) {
								let suggest = (row.quantity > row.totalStock) ? parseInt(row.quantity) - parseInt(row.totalStock) : 0;
								return '<input type="number" class="form-control input-sm allocateBackorder" style="width: 70px;" min="0" max="'+row.quantity+'" value="'+suggest+'" placeholder="0">';
							},
							targets : 8
						},
						{ // note
							targets: 9, render: (data, type, row) => (data) ? `<b>${data}</b>` :  '', orderable: false
						},
						{ // insert fields
							render: function (data, type, row) { 
								row.creditLimit = creditLimit;
								row.overduePayment = overduePayment;
								return data;
							},
							targets : 0
						}
					],

					rowCallback : function (row, data, iDataIndex) {
						$(row).attr('id', data['id']);
						automaticAllocate($(row).find('input.allocateNormalorder'), $(row).find('input.allocateBackorder'), data['quantity']);
						$(row).find('input.allocateNormalorder, input.allocateBackorder').keypress(function(e){
							if (e.which < 48 || e.which > 57) { e.preventDefault(); }
						});
					}
				});

				setTimeout(function(){ DT_ORDER_DETAILS.draw() }, 100); // fix thrad & tbody alignment

				// details
				let key, split;
				$('.normal-order-details-panel [data-type="details"]').each(function(index, el) {
					key = $(el).attr('data-key');
					split = key.split(".");
					
					if (split.length == 1) {
						$(el).text(order[0][key]);
					} else if (split.length == 2) {
						if ($(el).attr('data-render')) {
							$(el).text(convertToNumber(order[0][split[0]][split[1]], '2-decimal'));
						} else {
							$(el).text(order[0][split[0]][split[1]]);
						}
					}
				});

				if (data[0].requestDeliveryMethod == 'delivery') {
					$('.normal-order-details-panel [data-key="shipTo.street"]').parent().show();
					$('.normal-order-details-panel [data-key="carPlateNo"]').parent().hide();
				} else {
					$('.normal-order-details-panel [data-key="shipTo.street"]').parent().hide();
					$('.normal-order-details-panel [data-key="carPlateNo"]').parent().show();
				}

				$('.normal-order-details-panel .delivery-info').height($('.normal-order-details-panel .customer-info').height());
			}
		} catch (err) {
			alert('Something went wrong\n' + err);
			console.log(err);
			$('.back').click();
		}

		$('.loading-state').fadeOut('slow');
	}


	function loadBackorderDetailsTable(order) {
		try {
			let data = computeTotalStock(DEPLOYED_ON, order);
			let creditLimit = loadCreditLimit(DEPLOYED_ON, order[0].customerCode);
			let overduePayment = loadOverduePayment(DEPLOYED_ON, order[0].customerCode);

			if (creditLimit && overduePayment) {
				DT_BACK_ORDER_DETAILS = $('#back-order-details-table').DataTable({
					destroy   : true,
					data      : data,
					autoWidth : false,
					scrollX   : true,
					dom       : 'rti',

					columns  :
					[
						{data: 'salesOrderItemNo', width: 20},
						{data: 'usedMaterialCode'},
						{data: 'materialCode'},
						{data: 'price', width: 50},
						{data: 'quantity', width: 50},
						{data: 'visibleStock', width: 50},
						{data: 'totalStock', width: 50},
						{data: 'inputBackorder', width: 70},
						{data: 'note', defaultContent: ''}
					],

					columnDefs: 
					[
						{ // #, quantity, quantity, visibleStock, actualStock, normal input, backorder input
							className : 'dt-center',
							targets   : [0, 4, 5, 6, 7]
						},
						{ // price
							className : 'dt-right',
							targets   : 3
						},
						{ // price
							render : function (data, type, row) { return convertToNumber(data, '2-decimal'); },
							targets : 3
						},
						{ // visibleStock
							render : function (data, type, row) {
								data = (row.totalStock >= row.visibleStock) ? row.visibleStock : row.totalStock;
								return convertToNumber(data, 'whole');
							},
							targets : 5
						},
						{ // quantity, actualStock
							render : function (data, type, row) {
								return convertToNumber(data, 'whole'); 
							},
							targets : [4, 6]
						},
						{ // backorder input
							render: function (data, type, row) {
								let suggest = (row.quantity > row.totalStock) ? parseInt(row.quantity) - parseInt(row.totalStock) : 0;
								// '+suggest+'
								return '<input type="number" class="form-control input-sm allocateBackorder" style="width: 70px;" min="0" max="'+row.quantity+'" value="2" placeholder="0">';
							},
							targets : 7
						},
						{ // note
							targets: 8, render: (data, type, row) => (data) ? `<b>${data}</b>` :  '', orderable: false
						},
						{ // insert fields
							render: function (data, type, row) { 
								row.creditLimit = creditLimit;
								row.overduePayment = overduePayment;
								return data;
							},
							targets : 0
						}
					],

					rowCallback : function (row, data, iDataIndex) {
						$(row).attr('id', data['id']);
						$(row).find('input.allocateBackorder').keypress(function(e){
							if (e.which < 48 || e.which > 57) { e.preventDefault(); }
						});
					}
				});

				setTimeout(function(){ DT_BACK_ORDER_DETAILS.draw() }, 100); // fix thrad & tbody alignment

				// details
				let key, split;
				$('.back-order-details-panel [data-type="details"]').each(function(index, el) {
					key = $(el).attr('data-key');
					split = key.split(".");
					
					if (split.length == 1) {
						$(el).text(order[0][key]);
					} else if (split.length == 2) {
						if ($(el).attr('data-render')) {
							$(el).text(convertToNumber(order[0][split[0]][split[1]], '2-decimal'));
						} else {
							$(el).text(order[0][split[0]][split[1]]);
						}
					}
				});

				if (data[0].requestDeliveryMethod == 'delivery') {
					$('.back-order-details-panel [data-key="soldTo.street"]').parent().show();
					$('.back-order-details-panel [data-key="carPlateNo"]').parent().hide();
				} else {
					$('.back-order-details-panel [data-key="soldTo.street"]').parent().hide();
					$('.back-order-details-panel [data-key="carPlateNo"]').parent().show();
				}

				$('.back-order-details-panel .delivery-info').height($('.back-order-details-panel .customer-info').height());
			}
		} catch (err) {
			alert('Something went wrong\n' + err);
			console.log(err);
			$('.back').click();
		}

		$('.loading-state').fadeOut('slow');
	}


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


	function viewOrderDetails(element, data) {
		element.off('click');
		element.click(function(){
			$('[data-toggle="tooltip"]').tooltip('hide');
			$('.loading-state').fadeIn('slow');

			let order = data.orderno,
				orderType = data.orderType,
				orderData;

			if (orderType == 'Normal Order') {
				orderData = LCLDB_ORDER.filter(item => item.salesOrderNo == data.orderno),
				setTimeout(function(){ loadOrderDetailsTable(orderData); }, 2000);
			}

			else if (orderType == 'Backorder') {
				orderData = LCLDB_ORDER.filter(item => item.backOrderNo == data.orderno)
				setTimeout(function(){ loadBackorderDetailsTable(orderData); }, 2000);
				// setTimeout(function(){ local_loadBackorderDetailsTable(orderData, data.customerCode); }, 2000);
			}
		});
	}


	function loadCreditLimit(environment, customerCode) {
		let credit;

		if (environment == 'SAP' || environment == 'DEV') {
			getCreditLimit_SAP(customerCode, function(err, res){
				try {
					let doc = JSON.parse(res.body)[0];
				 	credit = {
						creditLimitAmount : parseFloat(doc.creditLimit) - parseFloat(doc.creditLimitUsed)
					};
				} catch (err) {
					alert('Something went wrong\nUnable to get credit limit from SAP');
					console.log(err);
					console.log(res);
				}
			});

			return credit;
		} else {
			loadByKey('BST_CREDIT', 'byCustomerCode', customerCode, function(err, res) {
				try {
					if (res.body.rows.length) {
						let doc = res.body.rows[0].value;
						credit = {
							creditLimitAmount : parseFloat(doc.creditLimit) - parseFloat(doc.creditLimitUsed)
						};
					} else {
						throw 'Unable to get credit';
					}
				} catch (err) {
					alert('Something went wrong\n' + err);
					console.log(err);
					console.log(res);
				}
			});

			return credit;
		}
	}


	function loadOverduePayment(environment, customerCode) {
		let overdue;

		if (environment == 'SAP' || environment == 'DEV') {
			getOverduePayment_SAP(customerCode, function(err, res){
				try {
					doc = JSON.parse(res.body)[0];
					overdue = doc.overdueAmount;
				} catch (err) {
					alert('Something went wrong\nUnable to get overdue payment from SAP');
					console.log(err);
					console.log(res);
				}
			});

			return {
				overdueAmount : overdue
			};
		} else {
			return {
				overdueAmount : 0
			};
		}
	}


	function getSalesperson(customerCode) {
		let salespersons = {
			customerCode  : [],
			email : []
		}

		loadByKey('BST_ROLE', 'byRole', 'SALESPERSON', function(err, res){
			let salespersonRoleId;

			try {
				salespersonRoleId = res.body.rows[0].id;

				loadUser_ByRole(salespersonRoleId, 'SALESPERSON', function(err, res){
					try {
						if (res.length) {
							let allSalespersons = res;

							for (let i in allSalespersons) {
								if (allSalespersons[i].customers.indexOf(customerCode) != -1) {
									salespersons.customerCode.push(allSalespersons[i].customerCode);
									salespersons.email.push(allSalespersons[i].email);
								}
							}
						} else {
							throw 'Unable to get salespersons';
						}
					} catch (err) {
						alert('Something went wrong\n' + err);
						console.log(err);
						console.log(res);
					}
				});
			} catch (err) {
				alert('Something went wrong. Unable to get salesperson role id\n' + err);// 
				console.log(err);
				console.log(res);
			}
		});

		return salespersons;
	}

	// check orders to approve
	$('#check-allocate-order-btn').click(function() {
		try {
			let normalorderData = [], backorderData = [], errorTrack;

			DT_ORDER_DETAILS.rows().every(function(){
				let data = this.data(), row = DT_ORDER_DETAILS.row(this).nodes().to$();
					data.normalOrder = parseInt(row.find('input.allocateNormalorder').val()),
					data.backorder   = parseInt(row.find('input.allocateBackorder').val()),
					data.discount    = 0.0; // data.discount = (data.discount) ? data.discount : 0,
					data.amount      =  parseInt(data.normalOrder) * parseFloat(data.price),
					data.netAmount   = parseFloat(data.amount) - parseFloat(data.discount),
					data.netAmount2  = parseInt(data.backorder) * parseFloat(data.price); // ) - parseFloat(data.discount)

				if (data.normalOrder == 0 && data.backorder == 0) {
					errorTrack = '0 order';
					row.find('input.allocateNormalorder').addClass('zxcerror');
					row.find('input.allocateBackorder').addClass('zxcerror');
				} else {
					row.find('input.allocateNormalorder').removeClass('zxcerror');
					row.find('input.allocateBackorder').removeClass('zxcerror');
					// ORDER
					
					if (data.normalOrder > 0 && data.normalOrder <= data.totalStock) { // order sufficient
						if (data.normalOrder <= data.quantity) { // right order not excced on quantity
							normalorderData.push(data);
							row.find('input.allocateNormalorder').removeClass('zxcerror');
						} else { // order exceed on quantity
							errorTrack = 'order exceed';
							row.find('input.allocateNormalorder').addClass('zxcerror');
						}
					} else if (data.normalOrder > data.totalStock) { // excced order insufficient
						errorTrack = 'stock not enough';
						row.find('input.allocateNormalorder').addClass('zxcerror');
					}

					// BACKORDER
					if (data.backorder > 0) { 
						if (data.backorder + data.normalOrder <= data.quantity) { // right order not excced on quantity
							backorderData.push(data);
							row.find('input.allocateBackorder').removeClass('zxcerror');
						} else { // order exceed on quantity
							errorTrack = 'order exceed';
							row.find('input.allocateBackorder').addClass('zxcerror');
						}
					}
				}
			});

			if (errorTrack == '0 order') {
				resultNotify('fa-exclamation-circle', 'INVALID', 'Allocate an order or back order quantity on all items', 'warning');
			} else if (errorTrack == 'order exceed'){
				resultNotify('fa-exclamation-circle', 'INVALID', 'Allocation should not exceed customers order quantity', 'warning');
			} else if (errorTrack == 'stock not enough'){
				resultNotify('fa-exclamation-circle', 'INVALID', 'Normal order should not exceed stock', 'warning');
			}  else {
				// counters
				$('span#normal-order-counter').html(normalorderData.length);
				$('span#backorder-counter').html(backorderData.length);
				$('#allocate-order-modal').modal();
				BACK_ORDERS_HANDLER = backorderData;

				setTimeout(function(){
					if ($('#normal-order-tabs li.active').attr('data-tab-name') == 'normal-order') {
						// Normal order table
						DT_CHECK_NORMAL_ORDER = $('#approve-order-table').DataTable({
							destroy      : true,
							data         : normalorderData,
							autoWidth    : false,
							scrollX      : true,
							dom          : 'rt',

							columns   : 
							[
								{data: 'salesOrderItemNo', width: 20},
								{data: 'usedMaterialCode'},
								{data: 'materialCode'},
								{data: 'price', width: 50},
								{data: 'normalOrder', width: 50},
								{data: 'discount', defaultContent: '0.00', width: 50},
								{data: 'netAmount', defaultContent: '0.00', width: 50}
							],

							columnDefs: 
							[
								{ // salesItemNo, quantity
									className : 'dt-center',
									targets   : [0, 4]
								},
								{ // price, disocunt, netAmount
									className : 'dt-right',
									targets   : [3, 5, 6]
								},
								{ // discount
									visible : false,
									targets : 5
								},
								{ // price, disocunt, netAmount
									render: function (data, type, row) { return convertToNumber((data) ? data : 0, '2-decimal'); },
									targets : [3, 5, 6]
								},
								{ // quantity
									render: function (data, type, row) { return convertToNumber(data, 'whole'); },
									targets : 4
								}
							],

							rowCallback : function (row, data, iDataIndex) {  $(row).attr('id', data['id']); },
							footerCallback : function (row, data, start, end, display) {
								let api = this.api();

								// Remove the formatting to get integer data for summation
								let intVal = function ( i ) { return typeof i === 'string' ? i.replace(/[\$,]/g, '')*1 : typeof i === 'number' ? i : 0; };

								// Total over all pages
								let total = api.column(6).data().reduce( function (a, b) { return intVal(a) + intVal(b); }, 0);

								// Update footer
								$(api.column(6).footer())
								.html(convertToNumber(total, '2-decimal'))
								.attr('data-salestotal', total);
							}
						});

						if (DT_CHECK_NORMAL_ORDER.rows().count() > 0) {
							// creditexceed & overduepayment on modal
							let creditExceed = parseFloat($('#normal-order-sales-total').attr('data-salestotal')) - parseFloat(normalorderData[0].creditLimit.creditLimitAmount);
							let overduePayment = parseFloat(normalorderData[0].overduePayment.overdueAmount);
							$('#credit-warn').text('0.00');
							$('#overdue-warn').text('0.00');

							if (overduePayment > 0) {
								$('#overdue-warn').text(convertToNumber(overduePayment, '2-decimal'));
								$('#overdue-warn').addClass('text-red').css('font-weight', 'bold');
							} else {
								$('#overdue-warn').removeClass('text-red').removeAttr( 'style' );
							}

							if (creditExceed > 0) {
								$('#credit-warn').text(convertToNumber(creditExceed, '2-decimal'));
								$('#credit-warn').addClass('text-red').css('font-weight', 'bold');
							} else {
								$('#credit-warn').removeClass('text-red').removeAttr( 'style' );
							}
						}
					} else {
						// Backorder table
						DT_CHECK_BACK_ORDER = $('#approve-backorder-table').DataTable({
							destroy      : true,
							data         : backorderData,
							autoWidth    : false,
							scrollX      : true,
							dom          : 'rt',

							columns   :
							[
								{data: 'salesOrderItemNo', width: 20},
								{data: 'usedMaterialCode'},
								{data: 'materialCode'},
								{data: 'price', width: 50},
								{data: 'backorder', width: 50},
								// {'data': 'discount'},
								{data: 'netAmount2', 'defaultContent': '0', width: 50}
							],

							columnDefs: 
							[
								{ // salesItemNo, quantity
									className : 'dt-center',
									targets   : [0, 4]
								},
								{ // price, netAmount
									className : 'dt-right',
									targets   : [3, 5]
								},
								{ // price, netAmount
									render: function (data, type, row) { return convertToNumber((data) ? data : 0, '2-decimal'); },
									targets : [3, 5]
								},
								{ // quantity
									render: function (data, type, row) { return convertToNumber(data, 'whole'); },
									targets : 4
								}
							],

							rowCallback : function (row, data, iDataIndex) { $(row).attr('id', data['id']); },
							footerCallback : function (row, data, start, end, display) {
								$(row).find('th').removeClass('dt-center').addClass('dt-right');
								let api = this.api();

								// Remove the formatting to get integer data for summation
								let intVal = function ( i ) { return typeof i === 'string' ? i.replace(/[\$,]/g, '')*1 : typeof i === 'number' ? i : 0; };

								// Total over all pages
								let total = api.column(5).data().reduce( function (a, b) { return intVal(a) + intVal(b); }, 0);

								// Update footer
								$(api.column(5).footer())
								.html(convertToNumber(total, '2-decimal'))
								.attr('data-salestotal', total);
							}
						});
					}
				}, 1000);
			}
		} catch (err) {
			alert('Something went wrong\n' + err);
			console.log(err);
		}
	});

	// for order and backorder table width problem
	$('#normal-order-tabs').click(function() {
		$('#check-allocate-order-btn').click();
	});

	// approve order
	$('#approve-order-button').click(function() {
		$('.loading-state').fadeIn('slow');
		disableButton('#approve-order-button');

		setTimeout(function(){
			try {
				let tableData = DT_CHECK_NORMAL_ORDER.rows().data().toArray();
				let isSuccess = true;

				if (DT_CHECK_NORMAL_ORDER.rows().count() > 0) { // there is normal order
					let creditExceed = parseFloat($('#normal-order-sales-total').attr('data-salestotal')) - parseFloat(tableData[0].creditLimit.creditLimitAmount);
					let overduePayment = parseFloat(tableData[0].overduePayment.overdueAmount);
					let salesOrderNo_SAP;
					let emailorderData = [];
					let proceedtoSAP, SAPdataArray = [];

					if (overduePayment <= 0 && creditExceed <= 0) {
						proceedtoSAP = true;
					} else {
						proceedtoSAP = false;
						if (creditExceed > 0) {
							alert('Credit limit exceeded. This order will go to credit/overdue approval.');
						} else if (overduePayment > 0) {
							alert('Customer have overdue payment. This order will go to credit/overdue approval.');
						}
					}

					if (DEPLOYED_ON != 'LOCAL') {
						if (proceedtoSAP) {
							DT_CHECK_NORMAL_ORDER.rows().every(function(){
								let data = this.data();

								SAPdataArray.push({
									salesOrderNo        : data.salesOrderNo,
									salesOrderItemNo    : data.salesOrderItemNo,
									distributionChannel : data.distributionChannel,
									division            : '00',
									soldToParty         : data.customerCode,
									materialCode        : data.materialCode,
									orderQuantity       : data.normalOrder,
									paymentTerms        : '',
									percentageDisicount : '0',
									amountDiscount      : '0',
									dateTime            : moment().format('DD.MM.YYYY'),
									partner             : parseInt(data.salesperson[0]),
									storageLocation     : data.storageLocation,
									poCustomer          : '',
									shipToParty         : data.shipToParty,
									remark              : '' 
								});
							});

							createOrder_SAP({ 'SAPdata' :  SAPdataArray }, function(err, res) {
								try {
									console.log('\n\ncreate order on SAP -----');
									console.log(res);

									var fortest = {
										recepient : 'patrick.caringal.ops@gmail.com',
										subject : 'for testing purposes',
										content : res.body.realBody,
										dynamicContent : res.body.DIAPI
									}
									sendDynamicEmail(fortest, function(err, res) { console.log(res); });

									const ordersOnSAP = JSON.parse(res.body.realBody);
									if(ordersOnSAP.length != SAPdataArray.length) {
										alert('ERROR : ' + ordersOnSAP.length + ' order created on SAP out of ' + SAPdataArray.length + 'order');
										throw 'Did not fully create all orders';
									}
								} catch (err) {
									isSuccess = false;
									console.log(err);
									console.log(res);
								}
							});

							if (!isSuccess) throw 'Unable to create order on SAP';

							releaseSalesOrder_SAP(tableData[0].salesOrderNo, function(err, res) {
								try {
									console.log('\n\nrelease order on SAP ---------');
									console.log(res);

									const releasedOrder = JSON.parse(res.body);
									if (releasedOrder.tsStandardOrder) {
										salesOrderNo_SAP = parseInt(releasedOrder.tsStandardOrder).toString();
									} else {
										throw 'order not released';
									}
								} catch (err) {
									isSuccess = false;
									console.log(err);
									console.log(res);
								}
							});
						}
					}

					DT_CHECK_NORMAL_ORDER.rows().every(function(){
						let data = this.data();
						const updatedDoc = {
							amount          : parseFloat(data.amount).toFixed(2),
							netAmount       : parseFloat(data.netAmount).toFixed(2),
							discount        : parseFloat(data.discount).toFixed(2),
							orderItemStatus : (proceedtoSAP) ? 'confirmed' : 'submitted',
							salesOrderNoSAP : (proceedtoSAP) ? salesOrderNo_SAP : 'SAP-'+tableData[0].salesOrderNo,
							quantity        : data.normalOrder
						}

						data.netAmount = parseFloat(data.netAmount).toFixed(2);
						emailorderData.push(data);
						// funcdis
						updateDocument(data.id, updatedDoc, function(err, res){
							if (res.statusCode <= 299) {
								deleteOnLocalArray(LCLDB_ORDER, 'id', data.id);
							} else if (res.statusCode >= 300) {
								isSuccess = false;
								resultNotify('fa fa-times', 'ERROR', 'Order/s not updated.<br>Something went wrong. Please try again later', 'danger');
							}
						});
					});

					let emailorderDetails  = {
						salesOrderNo       : { label : 'Reference no', value : emailorderData[0].salesOrderNo },
						soldTo             : { label : 'Sold to', value : emailorderData[0].customerCode },
						soldToName         : { label : '', value : emailorderData[0].soldTo.name1 },
						orderType          : { label : 'Order type', value : emailorderData[0].orderType },
						dateCreated        : { label : 'Date ordered', value : moment(new Date(emailorderData[0].dateCreated).toISOString()).format('MMM DD,YYYY (ddd)') },
						requestedDate      : { label : 'Requested delivery<br>date & time', value : moment(new Date(emailorderData[0].requestedDate.slice(0, -3) + ' ' + moment().format('hh:mm')  + ' ' + emailorderData[0].requestedTime).toISOString()).format('MMM DD,YYYY a (ddd)') }
					}
					
					if (emailorderData[0].requestDeliveryMethod == 'delivery') {
						emailorderDetails.shipTo = { label : 'Ship to', value : emailorderData[0].shipToParty };
						emailorderDetails.shipToName = { label : '', value : emailorderData[0].shipTo.name1 };
						emailorderDetails.shipToPartyAddress = { label : '', value : emailorderData[0].shipTo.street };
					} else {
						emailorderDetails.selfCollect = { label : 'Self collect<br>Car plate no.', value : emailorderData[0].carPlateNo };
					}

					let toEmails, ccEmails;
					if (DEPLOYED_ON == 'LOCAL' || DEPLOYED_ON == 'DEV') {
						toEmails = DEV_EMAILS.OPS_BST;
						ccEmails = [];
					} else {
						if (proceedtoSAP) { // order go to SAP
							toEmails = emailorderData[0].email;
							ccEmails = [].concat(BSTSG_EMAILS.logisticTeam).concat(getSalesperson(emailorderData[0].customerCode).email);
							// TO • Customer
							// CC • Logistic • Sales
						} else { // order go ot credit limit
							if (creditExceed < 15000 && overduePayment < 15000) {
								toEmails = ['dennis.lee@bridgestone.com', 'jeffrey.boey@bridgestone.com', 'matsukawa.yang@bridgestone.com'];
							} else if (creditExceed >= 15000 || overduePayment >= 15000) {
								toEmails = ['matsukawa.yang@bridgestone.com'];
							}

							ccEmails = ['weejein.tan@bridgestone.com', 'avon.pang@bridgestone.com', 'vivienne.tang@bridgestone.com', 'jean.cheong@bridgestone.com'];
						}
					}

					let emailData = {
						to : toEmails,
						cc : ccEmails,
						subject : (proceedtoSAP) ? 'Your Order is now in process.' : 'Order pending for credit/overdue approval.',
						accessLink : (proceedtoSAP) ? 'WOS' : 'AMI'
					}

					let emailtableData = {
						salesOrderItemNo : 'Item #',
						usedMaterialCode : 'Material code',
						price : 'Price',
						normalOrder : 'Quantity',
						// amount : 'Amount',
						// discount : 'Discount',
						netAmount : 'Net Amount'
					}

					emailOrders(emailorderDetails, emailtableData, emailorderData, emailData, 'processOrder', function(err, res){
						console.log(res);
					});
				}

				// BACK_ORDERS_HANDLER is used bcause of tab open conflict
				if (BACK_ORDERS_HANDLER.length > 0) { // there is back order
					let backOrderNo;
					let emailbackorderData = [];

					// get back order id
					loadItemCode('BACKORDERSNO', function(err, res){
						backOrderNo = res;
						if (res.statusCode > 299) {
							isSuccess = false;
						}
					});
					// backOrderNo = 'test123'; // funcdis

					for (let i in BACK_ORDERS_HANDLER) {
						let data = BACK_ORDERS_HANDLER[i];
						data.backOrderNo = backOrderNo;

						const updatedDoc = {
							id              : data.id,
							backOrderNo     : backOrderNo,
							docType         : 'BACKORDER',
							amount          : parseFloat(data.netAmount2).toFixed(2),
							netAmount       : parseFloat(data.netAmount2).toFixed(2),
							discount        : parseFloat(0).toFixed(2),
							orderItemStatus : 'backorderPending',
							orderType       : 'Normal Order',
							quantity        : data.backorder
						}

						emailbackorderData.push(data);
						// funcdis
						createOrder(updatedDoc, function(err, res) { // create back order
							if (res.statusCode >= 300) {
								isSuccess = false;
								resultNotify('fa fa-times', 'ERROR', 'Backorder/s not allocated.<br>Something went wrong. Please try again later', 'danger');
							} else if (res.statusCode <= 299) {
								if (customArrayFind(tableData, 'salesOrderItemNo', data.salesOrderItemNo)) {
									// console.log(data.salesOrderItemNo + ' dont delete');
								} else {
									deleteDocument(data.id, function(err, res){  // delete parent order
										if (res.statusCode >= 300) {
											isSuccess = false;
										} else if (res.statusCode <= 299) {
											deleteOnLocalArray(LCLDB_ORDER, 'id', data.id);
										}
									});
								}
							}
						});
					}

					let emailbackorderDetails  = {
						salesOrderNo       : { label : 'Reference no', value : emailbackorderData[0].salesOrderNo },
						backOrderNo        : { label : 'Backorder no', value : emailbackorderData[0].backOrderNo },
						soldTo             : { label : 'Sold to', value : emailbackorderData[0].customerCode },
						soldToName         : { label : '', value : emailbackorderData[0].soldTo.name1 },
						orderType          : { label : 'Order type', value : emailbackorderData[0].orderType },
						dateCreated        : { label : 'Date ordered', value : moment(new Date(emailbackorderData[0].dateCreated).toISOString()).format('MMM DD,YYYY (ddd)') },
						requestedDate      : { label : 'Requested delivery<br>date & time', value : moment(new Date(emailbackorderData[0].requestedDate.slice(0, -3) + ' ' + moment().format('hh:mm')  + ' ' + emailbackorderData[0].requestedTime).toISOString()).format('MMM DD,YYYY a (ddd)') }
					}

					if (emailbackorderData[0].requestDeliveryMethod == 'delivery') {
						emailbackorderDetails.shipTo = { label : 'Ship to', value : emailbackorderData[0].shipToParty };
						emailbackorderDetails.shipToName = { label : '', value : emailbackorderData[0].shipTo.name1 };
						emailbackorderDetails.shipToPartyAddress = { label : '', value : emailbackorderData[0].shipTo.street };
					} else {
						emailbackorderDetails.selfCollect = { label : 'Self collect<br>Car plate no.', value : emailbackorderData[0].carPlateNo };
					}

					let toEmails, ccEmails;
					if (DEPLOYED_ON == 'LOCAL' || DEPLOYED_ON == 'DEV') {
						toEmails = DEV_EMAILS.OPS_BST;
						ccEmails = [];
					} else {
						toEmails = emailbackorderData[0].email;
						ccEmails = [].concat(BSTSG_EMAILS.logisticTeam).concat(getSalesperson(emailbackorderData[0].customerCode).email);
						// TO  • Customer
						// CC • Logistic • Sales
					}

					let emailData = {
						to : toEmails,
						cc : ccEmails,
						subject : 'You have a backorder pending for your apporval.',
						accessLink : 'WOS'
					}

					var emailtableData = {
						salesOrderItemNo : 'Item #',
						usedMaterialCode : 'Material code',
						price : 'Price',
						backorder : 'Quantity',
						// amount : 'Amount',
						// discount : 'Discount',
						netAmount2 : 'Net Amount'
					}

					emailOrders(emailbackorderDetails, emailtableData, emailbackorderData, emailData, 'processOrder', function(err, res){
						console.log(res);
					});
				}

				if (isSuccess) {
					$('#allocate-order-modal').modal('hide');
					resultNotify('fa-check-circle', 'SUCCESS', 'Order/s successfully allocated', 'success');
					$('.back').click();
					setTimeout(function(){
						config.db = 'local'
						loadOrderTable(); 
					}, 1000);
				} else {
					throw 'Order/s not allocated. Please try again later.'
				}
			} catch (err) {
				alert('Something went wrong\n' + err);
				$('.loading-state').fadeOut('slow');
				$('#allocate-order-modal').modal('hide');
				$('.back').click();
				console.log(err);
			}
		}, 1000);
	});

	// check order to reject
	$('#confirm-reject-order-btn').click(function(){		
		$('#reject-order-modal').modal();
	});

	// reject order
	$('#reject-order-btn').click(function(){
		let isValid = true;

		$('#reject-order-form textarea').each(function(index, el){
			if ($(el).val().trim() != '') {
				$(el).parent().removeClass('has-error');
			} else {
				isValid = false;
				$(el).parent().addClass('has-error');
			}
		});

		if (isValid) {
			$('.loading-state').fadeIn('slow');
			disableButton('#reject-order-btn');

			let reason = $('#reject-order-form').serializeObject().reason;

			setTimeout(function(){
				try {
					let isSuccess = true;
					let emailorderData = [];

					DT_ORDER_DETAILS.rows().every(function(){
						let data = this.data();
						let doc = { 
								orderItemStatus : 'rejected',
								reasonCancel    : reason 
							};

						data.reasonCancel = reason; // for local db

						// funcdis
						updateDocument(data.id, doc, function(err, res){
							if (res.statusCode <= 299) {
								deleteOnLocalArray(LCLDB_ORDER, 'id', data.id);
							} else if (res.statusCode >= 300) {
								isSuccess = false;
								resultNotify('fa fa-times', 'ERROR', 'Order/s not updated.<br>Something went wrong. Please try again later', 'danger');
							}
						});

						emailorderData.push(data);
					});

					let emailorderDetails = {
						salesOrderNo       : { label : 'Reference no', value : emailorderData[0].salesOrderNo },
						soldTo             : { label : 'Sold to', value : emailorderData[0].customerCode },
						soldToName         : { label : '', value : emailorderData[0].soldTo.name1 },
						orderType          : { label : 'Order type', value : emailorderData[0].orderType },
						dateCreated        : { label : 'Date ordered', value : moment(new Date(emailorderData[0].dateCreated).toISOString()).format('MMM DD,YYYY (ddd)') },
						shipTo             : { label : 'Ship to', value : emailorderData[0].shipToParty },
						shipToName         : { label : '', value : emailorderData[0].shipTo.name1 },
						shipToPartyAddress : { label : '', value : emailorderData[0].shipTo.street },
					}

					let toEmails, ccEmails;
					if (DEPLOYED_ON == 'LOCAL' || DEPLOYED_ON == 'DEV') {
						toEmails = DEV_EMAILS.OPS_BST;
						ccEmails = [];
					} else {
						toEmails = [].concat(BSTSG_EMAILS.logisticTeam).concat(BSTSG_EMAILS.managementTeam).concat(getSalesperson(createOrder_Data[0].customerCode).email);
						ccEmails = [];
						// TO • Logistic • Management • Sales
						// CC none
					}

					let emailData = {
						to : toEmails,
						cc : ccEmails,
						subject : 'The order has been canceled by following reason.',
						accessLink : 'WOS'
					}

					let emailtableData = {
						salesOrderItemNo : 'Item #',
						usedMaterialCode : 'Material code',
						quantity : 'Quantity',
						reasonCancel : 'Reason'
					}

					emailOrders(emailorderDetails, emailtableData, emailorderData, emailData, 'rejectOrder', function(err, res){
						console.log(res);
					});

					if (isSuccess) {
						$('#reject-order-modal').modal('hide');
						resultNotify('fa-check-circle', 'SUCCESS', 'Order/s successfully rejected', 'success');
						$('.back').click();
						setTimeout(function(){
							config.db = 'local'
							loadOrderTable(); 
						}, 1000);
					} else {
						throw 'Order/s not rejected. Please try again later.'
					}
				} catch (err) {
					alert('Something went wrong\n' + err);
					console.log(err);
				}
			}, 1000);
		}
	});

	// check backorders to approve
	$('#check-allocate-back-order-btn').click(function() {
		try {
			let backorderData = [], errorTrack;

			DT_BACK_ORDER_DETAILS.rows().every(function(){
				let data = this.data(), row = DT_BACK_ORDER_DETAILS.row(this).nodes().to$();
					data.backorder   = parseInt(row.find('input.allocateBackorder').val()),
					data.discount    = 0.0; // data.discount = (data.discount) ? data.discount : 0,
					data.amount      = parseInt(data.backorder) * parseFloat(data.price),
					data.netAmount   = parseFloat(data.amount) - parseFloat(data.discount);

				if (data.backorder == 0) {
					errorTrack = '0 order';
					row.find('input.allocateBackorder').addClass('zxcerror');
				} else {
					row.find('input.allocateBackorder').removeClass('zxcerror');
					// BACKORDER
					
					if (data.backorder > 0 && data.backorder <= data.totalStock) { // order sufficient
						if (data.backorder <= data.quantity) { // right order not excced on quantity
							backorderData.push(data);
							row.find('input.allocateBackorder').removeClass('zxcerror');
						} else { // order exceed on quantity
							errorTrack = 'order exceed';
							row.find('input.allocateBackorder').addClass('zxcerror');
						}
					} else if (data.backorder > data.totalStock) { // excced order insufficient
						errorTrack = 'stock not enough';
						row.find('input.allocateBackorder').addClass('zxcerror');
					}
				}
			});

			if (errorTrack == '0 order') {
				resultNotify('fa-exclamation-circle', 'INVALID', 'Allocate a back order quantity on all items', 'warning');
			} else if (errorTrack == 'order exceed'){
				resultNotify('fa-exclamation-circle', 'INVALID', 'Allocation should not exceed customers order quantity', 'warning');
			} else if (errorTrack == 'stock not enough'){
				resultNotify('fa-exclamation-circle', 'INVALID', 'Backorder should not exceed stock', 'warning');
			} else {
				// counters
				$('span#backorder-counter2').html(backorderData.length);
				$('#allocate-back-order-modal').modal();

				setTimeout(function(){
					DT_CHECK_BACK_ORDER = $('#approve-backorder-table2').DataTable({
						destroy      : true,
						data         : backorderData,
						autoWidth    : false,
						scrollX      : true,
						dom          : 'rt',

						columns   :
						[
							{data: 'salesOrderItemNo', width: 20},
							{data: 'usedMaterialCode'},
							{data: 'materialCode'},
							{data: 'price', width: 50},
							{data: 'backorder', width: 50},
							// {'data': 'discount'},
							{data: 'netAmount', 'defaultContent': '0', width: 50}
						],

						columnDefs: 
						[
							{ // salesItemNo, quantity
								className : 'dt-center',
								targets   : [0, 4]
							},
							{ // price, netAmount
								className : 'dt-right',
								targets   : [3, 5]
							},
							{ // price, netAmount
								render: function (data, type, row) { return convertToNumber((data) ? data : 0, '2-decimal'); },
								targets : [3, 5]
							},
							{ // quantity
								render: function (data, type, row) { return convertToNumber(data, 'whole'); },
								targets : 4
							}
						],

						rowCallback : function (row, data, iDataIndex) { $(row).attr('id', data['id']); },
						footerCallback : function (row, data, start, end, display) {
							$(row).find('th').removeClass('dt-center').addClass('dt-right');
							let api = this.api();

							// Remove the formatting to get integer data for summation
							let intVal = function ( i ) { return typeof i === 'string' ? i.replace(/[\$,]/g, '')*1 : typeof i === 'number' ? i : 0; };

							// Total over all pages
							let total = api.column(5).data().reduce( function (a, b) { return intVal(a) + intVal(b); }, 0);

							// Update footer
							$(api.column(5).footer())
							.html(convertToNumber(total, '2-decimal'))
							.attr('data-salestotal', total);
						}
					});
				}, 1000);
			}
		} catch (err) {
			alert('Something went wrong\n' + err);
			console.log(err);
		}
	});

	// approve backorders
	$('#approve-back-order-button').click(function() {
		$('.loading-state').fadeIn('slow');
		disableButton('#approve-back-order-button');

		setTimeout(function(){
			try {
				let isSuccess = true;

				if (DT_CHECK_BACK_ORDER.rows().count() > 0) { // there is back order
					let emailbackorderData = [];

					DT_CHECK_BACK_ORDER.rows().every(function(){
						let data = this.data();

						const updatedDoc = {
							amount          : parseFloat(data.netAmount).toFixed(2),
							netAmount       : parseFloat(data.netAmount).toFixed(2),
							discount        : parseFloat(0).toFixed(2),
							orderItemStatus : 'backorderPending',
							quantity        : data.backorder
						}

						emailbackorderData.push(data);
						// funcdis
						updateDocument(data.id, updatedDoc, function(err, res){
							if (res.statusCode >= 300) {
								isSuccess = false;
							} else if (res.statusCode <= 299) {
								deleteOnLocalArray(LCLDB_ORDER, 'id', data.id);
							}
						});
					});

					let emailbackorderDetails  = {
						salesOrderNo       : { label : 'Reference no', value : emailbackorderData[0].salesOrderNo },
						backOrderNo        : { label : 'Backorder no', value : emailbackorderData[0].backOrderNo },
						soldTo             : { label : 'Sold to', value : emailbackorderData[0].customerCode },
						soldToName         : { label : '', value : emailbackorderData[0].soldTo.name1 },
						orderType          : { label : 'Order type', value : emailbackorderData[0].orderType },
						dateCreated        : { label : 'Date ordered', value : moment(new Date(emailbackorderData[0].dateCreated).toISOString()).format('MMM DD,YYYY (ddd)') },
						requestedDate      : { label : 'Requested delivery<br>date & time', value : moment(new Date(emailbackorderData[0].requestedDate.slice(0, -3) + ' ' + moment().format('hh:mm')  + ' ' + emailbackorderData[0].requestedTime).toISOString()).format('MMM DD,YYYY a (ddd)') }
					}

					if (emailbackorderData[0].requestDeliveryMethod == 'delivery') {
						emailbackorderDetails.shipTo = { label : 'Ship to', value : emailbackorderData[0].shipToParty };
						emailbackorderDetails.shipToName = { label : '', value : emailbackorderData[0].shipTo.name1 };
						emailbackorderDetails.shipToPartyAddress = { label : '', value : emailbackorderData[0].shipTo.street };
					} else {
						emailbackorderDetails.selfCollect = { label : 'Self collect<br>Car plate no.', value : emailbackorderData[0].carPlateNo };
					}

					let toEmails, ccEmails;
					if (DEPLOYED_ON == 'LOCAL' || DEPLOYED_ON == 'DEV') {
						toEmails = DEV_EMAILS.OPS_BST;
						ccEmails = [];
					} else {
						toEmails = emailbackorderData[0].email;
						ccEmails = [].concat(BSTSG_EMAILS.logisticTeam).concat(getSalesperson(emailbackorderData[0].customerCode).email);
						// TO  • Customer
						// CC • Logistic • Sales
					}

					let emailData = {
						to : toEmails,
						cc : ccEmails,
						subject : 'You have a backorder pending for your apporval.',
						accessLink : 'WOS'
					}

					var emailtableData = {
						salesOrderItemNo : 'Item #',
						usedMaterialCode : 'Material code',
						price : 'Price',
						backorder : 'Quantity',
						// amount : 'Amount',
						// discount : 'Discount',
						netAmount2 : 'Net Amount'
					}

					emailOrders(emailbackorderDetails, emailtableData, emailbackorderData, emailData, 'processOrder', function(err, res){
						console.log(res);
					});
				}

				if (isSuccess) {
					$('#allocate-back-order-modal').modal('hide');
					resultNotify('fa-check-circle', 'SUCCESS', 'Backorder/s successfully allocated', 'success');
					$('.back').click();
					setTimeout(function(){
						config.db = 'local'
						loadOrderTable(); 
					}, 1000);
				} else {
					throw 'Backorder/s not allocated. Please try again later.'
				}
			} catch (err) {
				alert('Something went wrong\n' + err);
				$('.loading-state').fadeOut('slow');
				$('#allocate-back-order-modal').modal('hide');
				$('.back').click();
				console.log(err);
			}
		}, 1000);
	});

	// check back order to reject
	$('#confirm-reject-back-order-btn').click(function(){
		$('#reject-back-order-modal').modal();
	});

	// reject back order
	$('#reject-back-order-btn').click(function(){
		let isValid = true;

		$('#reject-back-order-form textarea').each(function(index, el){
			if ($(el).val().trim() != '') {
				$(el).parent().removeClass('has-error');
			} else {
				isValid = false;
				$(el).parent().addClass('has-error');
			}
		});

		if (isValid) {
			$('.loading-state').fadeIn('slow');
			disableButton('#reject-back-order-btn');

			let reason = $('#reject-back-order-form').serializeObject().reason;

			setTimeout(function(){
				try {
					let isSuccess = true;
					let emailorderData = [];

					DT_BACK_ORDER_DETAILS.rows().every(function(){
						let data = this.data();
						let doc = { 
								orderItemStatus : 'rejected',
								reasonCancel    : reason
							};

						data.reasonCancel = reason; // for local db

						// funcdis
						updateDocument(data.id, doc, function(err, res){
							if (res.statusCode <= 299) {
								deleteOnLocalArray(LCLDB_ORDER, 'id', data.id);
							} else if (res.statusCode >= 300) {
								isSuccess = false;
								resultNotify('fa fa-times', 'ERROR', 'Order/s not updated.<br>Something went wrong. Please try again later', 'danger');
							}
						});

						emailorderData.push(data);
					});

					let emailorderDetails = {
						salesOrderNo       : { label : 'Reference no', value : emailorderData[0].salesOrderNo },
						backOrderNo        : { label : 'Backorder no', value : emailorderData[0].backOrderNo },
						soldTo             : { label : 'Sold to', value : emailorderData[0].customerCode },
						soldToName         : { label : '', value : emailorderData[0].soldTo.name1 },
						orderType          : { label : 'Order type', value : emailorderData[0].orderType },
						dateCreated        : { label : 'Date ordered', value : moment(new Date(emailorderData[0].dateCreated).toISOString()).format('MMM DD,YYYY (ddd)') },
						shipTo             : { label : 'Ship to', value : emailorderData[0].shipToParty },
						shipToName         : { label : '', value : emailorderData[0].shipTo.name1 },
						shipToPartyAddress : { label : '', value : emailorderData[0].shipTo.street },
					}

					let toEmails, ccEmails;
					if (DEPLOYED_ON == 'LOCAL' || DEPLOYED_ON == 'DEV') {
						toEmails = DEV_EMAILS.OPS_BST;
						ccEmails = [];
					} else {
						toEmails = [].concat(BSTSG_EMAILS.logisticTeam).concat(BSTSG_EMAILS.managementTeam).concat(getSalesperson(createOrder_Data[0].customerCode).email);
						ccEmails = [];
						// TO • Logistic • Management • Sales
						// CC none
					}

					let emailData = {
						to : toEmails,
						cc : ccEmails,
						subject : 'The backorder has been canceled by following reason.',
						accessLink : 'WOS'
					}

					let emailtableData = {
						salesOrderItemNo : 'Item #',
						usedMaterialCode : 'Material code',
						quantity : 'Quantity',
						reasonCancel : 'Reason'
					}

					emailOrders(emailorderDetails, emailtableData, emailorderData, emailData, 'rejectOrder', function(err, res){
						console.log(res);
					});

					if (isSuccess) {
						$('#reject-back-order-modal').modal('hide');
						resultNotify('fa-check-circle', 'SUCCESS', 'Order/s successfully rejected', 'success');
						$('.back').click();
						setTimeout(function(){
							config.db = 'local'
							loadOrderTable(); 
						}, 1000);
					} else {
						throw 'Order/s not rejected. Please try again later.'
					}
				} catch (err) {
					alert('Something went wrong\n' + err);
					console.log(err);
				}
			}, 1000);
		}
	});
});