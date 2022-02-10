$(document).ready(function() {
	let LCLDB_NORMAL_ORDER, LCLDB_STOCK, VISIBLE_STOCK, ROLE_IDS = role_localdata, SALESPERSON, CUSTOMERSALESPERSON;
	let DT_NORMAL_ORDER, DT_NORMAL_ORDER_DETAILS, DT_CHECK_NORMAL_ORDER, DT_CHECK_NORMAL_ORDER_APPROVAL;
	let DT_CHECK_BACK_ORDER_1, DT_CHECK_BACK_ORDER_APPROVAL;
	let DT_APPROVE_ORDER_DETAILS;
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

	// load stoacks
	loadAllStock((err, res) => {
		if (err || res.statusCode >= 300) { alert('Unable to get stock'); }
		else if (res.statusCode <= 299) { LCLDB_STOCK = res.result; }
	});

	$('.loading-state-backorder').fadeOut('slow');

	loadNormalOrderTable();

	// load normal order table
	function loadNormalOrderTable() {
		let data;
		if (config.db == 'couchbase') {
			loadAllCreditOverduOrder((err, res) => {
				if (err || res.statusCode >= 300) alert('Unable to get order');
				else if (res.statusCode <= 299) { LCLDB_NORMAL_ORDER = res.result; data = res.result; }
			});
		} else if (config.db == 'local') {
			data = LCLDB_NORMAL_ORDER;
		}
		if (LOCAL_STORAGE.role == 'ADMINISTRATOR' || LOCAL_STORAGE.role == 'LOGISTICS MANAGER' || LOCAL_STORAGE.email == 'matsukawa.yang@bridgestone.com') {
			data = removeduplicate_1(data, 'salesOrderNo');
		} else {
			data = data.filter(item => item.approver == LOCAL_STORAGE.role && item.createdBy != LOCAL_STORAGE.userid);
			data = removeduplicate_1(data, 'salesOrderNo');
		}
		
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
				{ data: null, defaultContent: '', title: '<input type="checkbox" id="selectAll">', width: 5},
				{ data: 'salesOrderNo', title: 'Reference no', width: 80 },
				{ data: 'customerCode', title: 'Customer code', width: 80 },
				{ data: 'customerName', title: 'Customer name' },
				{ data: 'orderedBy', title: 'Ordered by' },
				{ data: 'orderType', title: 'Order type', width: 70 },
				{ data: 'dateCreated', title: 'Order date', width: 100 },
				{ data: 'salesOrderNo', title: 'Items', defaultContent: '', width: 40 },
				{ data: null, title: 'Action', width: 40 }
			],
			columnDefs: [
				{ targets: 0, className: 'select-checkbox',  orderable: false}, // checkbox
				{ targets: [1, 2, 5, 6, 7, 8], className: 'dt-center' }, // salesNo, customerCode, dateOrdered, items, btn
				{ targets: 8, orderable: false },  // btn
				{
					targets: [1, 2], // salesNo, customerCode
					render: (data, type, row) => `<b>${data}</b>`,
				},
				{
					targets: 6, // dateOrdered
					render: (data, type, row) => moment(data, 'YYYY-MM-DD hh:mm A').format('MMM DD, YYYY hh:mm A'),
				},
				{
					targets: 7, // items
					render: (data, type, row) => {
						const count = LCLDB_NORMAL_ORDER.filter(item => item.salesOrderNo == data).length;
						return `<span class="badge bg-light-blue">${count}</span>`
					},
				},
				{
					targets: 8, // action
					render: (data, type, row) => '<a href="#" class="btn btn-primary btn-xs view-details" data-toggle="tooltip" data-placement="left" data-original-title="Order details" data-target="#normal-order-carousel" data-slide-to="1"><i class="fa fa-tasks" aria-hidden="true"></i></a>'
				}
			],
			order: [[1, 'asc']],
			select: { 'style': 'multi', 'selector': 'td:first-child' },   
			rowCallback: (row, data, iDataIndex) => {
				$(row).attr('id', data['id']);
				let btn = $(row).find('a.view-details');
				btn.off('click').click(() => {
					$('[data-toggle="tooltip"]').tooltip('hide');
					$('.loading-state-normal-order').fadeIn();
					const order = LCLDB_NORMAL_ORDER.filter(item => item.salesOrderNo == data.salesOrderNo);
					console.log(order)
					setTimeout(()=> {
						loadNormalOrderDetailsTable(order);
						$('.loading-state-normal-order').fadeOut('slow');
					}, 1000);
				});
			}
		});
		
		$("#normal-order-table td:first-child").addClass('cursor');
		let selectedRows = 0;
		$('.approve-btn').hide(); // hide approve button by default
		
		// select all rows
		$('body').on('change', '#selectAll', function() {
			if($('#selectAll:checked').val() === 'on'){ 
				DT_NORMAL_ORDER.rows().select(); // select all rows
				selectedRows = DT_NORMAL_ORDER.rows('.selected').count(); // set count of selected rows to total number of records
				$('.select-checkbox').prop('checked', true) // set all checkbox val to true
				$('.approve-btn').show(); // display approve button
			}
			else{ 
				DT_NORMAL_ORDER.rows().deselect();  // unselect all rows
				selectedRows= 0; // set count of selected rows to 0
				$('.select-checkbox').prop('checked', false) // set all checkbox val to false
				$('.approve-btn').hide(); // hide approve button
			}	  
		}); 

		// select per row
		$('tbody .select-checkbox').click(function(){
			let $this = $(this);
			let isChecked = $this[0].checked;
			$this[0].checked = !isChecked;
			if($this[0].checked == true){ selectedRows++ } // if row is selected, increment the value of selectedRows by 1
			else{ $('.approve-btn').hide(); selectedRows--} // else if row is unselected, decrement the value of selectedRows by 1
			if(selectedRows > 0) { $('.approve-btn').show(); } // if total count of selected rows is greater than 0, display approve button
			else{ $('.approve-btn').hide(); } // hide approve button
		});

		$('#normal-order-table-filter').off('keyup').keyup(function(){ DT_NORMAL_ORDER.search($(this).val()).draw(); });
		$('.loading-state-normal-order').fadeOut('slow');
	}

	$('.approve-btn').click(() => {
		let selectedRecords = DT_NORMAL_ORDER.rows('.selected').data().toArray();

		disableBtn($('.approve-btn'));
		if (DT_APPROVE_ORDER_DETAILS) DT_APPROVE_ORDER_DETAILS.clear().draw(); // clear table if already initialized
		$('.loading-state-approve').fadeOut('slow');
		
		$('#mass-credit-approval-modal').modal();
		$('#total-records').html(`<b>${selectedRecords.length}</b> Selected Record(s)`)
		setTimeout(() => {
			DT_APPROVE_ORDER_DETAILS = $('#mass-credit-approval-table').DataTable({
				destroy        : true,
				data           : selectedRecords,
				autoWidth      : false,
				scrollX        : true,
				scrollY        : 350,
				scrollCollapse : true,
				paging         : false,
				dom            : 'rt',

				columns: [
					{ data: 'salesOrderNo', width: 50 },
					{ data: 'customerName', width: 50 },
					{ data: 'creditLimit', width: 50 },
					{ data: 'creditExceed', width: 50 },
					{ data: 'overduePayment', width: 50 },
					{ data: null, defaultContent: '', width: 20 },
				],
				columnDefs: [

					{ targets: 5, orderable: false, className: 'view-details dt-center' },
					{ targets: [0, 1, 2, 3, 4], className: 'dt-center' }, // All,
					{
						targets: [0, 1,], // salesOrderNo, customerCode, customerName
						render: (data, type, row) => `<b>${data}</b>`,
					},
					{
						targets: [2, 3, 4], // creditLimit, creditExceed, overduePayment
						render: (data, type, row) => {
							if(data){
								return `<b>${convertToNumber(data, '2-decimal')}</b>`
							}
							else{
								return `<b>0.00</b>`
							}
						}
					},
					{
						targets: 5, // expand row action
						render: (data, type, row) => '<i class="fa fa-angle-down" style="font-weight:700"></i>'
					}
				],
				rowCallback: (row, data, iDataIndex) => { $(row).attr('id', data['id']); }
			});

			$("#mass-credit-approval-table td:last-child").addClass('cursor');
			$('.loading-state-approve').fadeOut('slow');
			enableBtn($('.approve-btn'));

			// expand/collapse row
			$('#mass-credit-approval-table tbody').off('click')
			$('#mass-credit-approval-table tbody').on('click', 'td.view-details', function (){
				
				let tr = $(this).closest('tr');
				let tableRow = DT_APPROVE_ORDER_DETAILS.row(tr);
				
				if(tableRow.child.isShown()){
					tableRow.child.hide(); 	//close row
					tr.removeClass('shown');;
					$(this).children('i').removeClass('fa-angle-up arrow-up')
					$(this).children('i').addClass('fa-angle-down');
					$(this).parent().children('td:first-child').addClass('collapse-row');
				}
				else{
					if (DT_APPROVE_ORDER_DETAILS.row('.shown').length) {
						$('.view-details', DT_APPROVE_ORDER_DETAILS.row('.shown').node()).click();
					}
					tableRow.child(displayOrders(tableRow.data())).show(); // open row
					$('.nav-tabs a').on('click', function (e) {
						e.preventDefault();
						$(this).tab('show');
						$($.fn.dataTable.tables(true)).DataTable().columns.adjust();
					});
					tr.addClass('shown');
					$(this).children('i').removeClass('fa-angle-down');
					$(this).children('i').addClass('fa-angle-up arrow-up');
					$(this).parent().children('td:first-child').addClass('expand-row');
					$(this).parents('tr').next('tr').children().addClass('expand-row');
				}

				if (DT_CHECK_NORMAL_ORDER_APPROVAL) DT_CHECK_NORMAL_ORDER_APPROVAL.clear().draw(); // clear table if already initialized
				if (DT_CHECK_BACK_ORDER_APPROVAL) DT_CHECK_BACK_ORDER_APPROVAL.clear().draw(); // clear table if already initialized
				
				$('.loading-state-check-normal-order, .loading-state-check-back-order-1').fadeIn();
				
				const selectedRecordModal = DT_APPROVE_ORDER_DETAILS.row( this ).data();	
				let massNormalOrderModal = LCLDB_NORMAL_ORDER.filter(item => item.salesOrderNo == selectedRecordModal.salesOrderNo);
				const massBackOrderModal = getStock(DEPLOYED_ON, massNormalOrderModal).filter((obj) => parseInt(obj.backorder) > 0);
				
				console.log(massNormalOrderModal)
				// massNormalOrderModal = massNormalOrderModal.map((item) => {
				// 	let data;
				// 	data = { ...item }
					// if(item.orderType === 'Special Order'){
					// 	let orderQuantity = parseInt(item.quantity) > item.totalStock ? parseInt(item.quantity) - (parseInt(item.quantity) - item.totalStock) : parseInt(item.quantity);
					// 	data =  {
					// 		...item,
					// 		backorder : parseInt(item.quantity) > item.totalStock ? parseInt(item.quantity) - item.totalStock : 0,
					// 		quantity :  orderQuantity,
					// 		amount : orderQuantity * parseFloat(item.price),
					// 		netAmount : orderQuantity * parseFloat(item.price)
					// 	}
					
					// }
				// 	return data;
				// });
				
				let newBackOrderData;

				$('#approve-backorder-table-1 tfoot').hide();
				if(massBackOrderModal.length > 0){
					$('#approve-backorder-table-1 tfoot').show();

					newBackOrderData = massBackOrderModal.map((backorder) => {
						const data = { 
							...backorder, 
							amount : parseInt(backorder.backorder) * parseFloat(backorder.price),
							netAmount : (parseInt(backorder.backorder) * parseFloat(backorder.price)) - (parseFloat(backorder.discount) * parseInt(backorder.backorder)),
							quantity : parseInt(backorder.backorder)
						}

						return data;
					});
				}

				console.log(massBackOrderModal)
				console.log(newBackOrderData)
				setTimeout(() => {
					massNormalOrderModal[0].orderType == 'Special Order' ? $('#normal-order-span').html('Special Order') : $('#normal-order-span').html('Normal Order');
					$('span#normal-order-counter').html(massNormalOrderModal.length);
					$('span#backorder-counter').html(newBackOrderData ? newBackOrderData.length : 0);
					loadApprovalNormalOrderTable(massNormalOrderModal)
					loadApprovalBackorderTable(newBackOrderData ? newBackOrderData : []);
					$($.fn.dataTable.tables(true)).DataTable().columns.adjust();
				}, 1000)
			});
		}, 1000);

		//mass approve order

		$('#mass-approve-order-btn').off().on('click', function() {
			$('.loading-state-normal-order').fadeIn();
			$(document.body).css({'cursor' : 'wait'});
			disableBtn($(this));
			selectedRecords = DT_NORMAL_ORDER.rows('.selected').data().toArray();

			for (let i in selectedRecords){
				let order = LCLDB_NORMAL_ORDER.filter(item => item.salesOrderNo == selectedRecords[i].salesOrderNo);
				
				getStock(DEPLOYED_ON, order)
			
				let successUpdate, successSAP = true;
				let proceedtoSAP = true;
				let discounts = [], customerCode = order[0].customerCode;

				for (let a in order) {
					console.log(order[a])
					order[a].backorderQuantity = order[a].backorder;
					// order[a].quantity = parseInt(order[a].quantity)
					// order[a].quantity = parseInt(order[a].quantity) + parseInt(order[a].backorderQuantity);
					// let suggest = (order[a].quantity > order[a].totalStock) ? order[a].quantity - order[a].totalStock : 0;
					order[a].order = parseInt(order[a].quantity);
					order[a].orderDiscount = order[a].discount;
					order[a].orderAmount = parseInt(order[a].order) * parseFloat(order[a].price);
					order[a].orderNetAmount = parseInt(order[a].order) * parseFloat(order[a].price);
					order[a].backorder = convertToNumber(order[a].backorder, 'whole');
					order[a].backorderAmount  = parseInt(order[a].backorder) * parseFloat(order[a].price);
					order[a].backorderNetAmount  = parseInt(order[a].backorder) * parseFloat(order[a].price);
					order[a].quantity = order[a].quantity;

					discounts.push({
						salesOrderItemNo : order[a].salesOrderItemNo,
						materialCode : order[a].materialCode,
						quantity : parseInt(order[a].order)
					});
				}

				console.log(order)

				const backorder = getStock(DEPLOYED_ON, order).filter((obj) => parseInt(obj.backorder) > 0);
				console.log(backorder)
				console.log(order)
				if (DEPLOYED_ON != 'LOCAL') { // Dev or Prod
					let SAPdiscount;
					DI_calculateDisocunt({ customer: customerCode, orders: discounts }, (err, res) => {
						if (err || res.statusCode >= 300) {
							alert('Unable to calculate discount from SAP.');
							console.log('err', err, 'res', res);
							return;
						}
	
						SAPdiscount = res.result;
					});
					console.log(SAPdiscount)
					if (!SAPdiscount) return
					order = calculateDiscount(order, SAPdiscount)
					console.log(order)
					// creditStatus = releaseCreditBlockSAP(order);
					// orderStatus = releaseDeliveryBlockSAP(order);
					// console.log(creditStatus)
					// console.log(orderStatus)
					// successSAP = (creditStatus && orderStatus === "0") ? true : false;
					// console.log(successSAP)

					let creditStatus = "1";
					orderStatus = releaseDeliveryBlockSAP(order)
					console.log(orderStatus)

					if(orderStatus === "0") creditStatus = releaseCreditBlockSAP(order)
					console.log(creditStatus)
					successSAP = creditStatus === "0" ?  true : false;
					console.log(successSAP)

				}

				if (successSAP) successUpdate = updateOrderCouch(order);
				console.log(successUpdate)
				if (successUpdate) {
					emailOrderNotif(order);
	
					if (LOG_FUNCTION) {
						createLog(`LOG::${LOCAL_STORAGE.referenceId}`, {
							dateCreated : moment().toISOString(),
							action : `Approved order ${order[0].salesOrderNo}`,
							module : "Approval/Credit Exceed/Overdue Payment",
							app : "AMI"
						}, moment().toISOString());
					}
				}
				if (backorder.length > 0) {  // there is backorder
					successUpdate = createBackorderCouch(backorder,"massApproval");
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
				console.log(successUpdate, successSAP)
				if(i == i.length - 1){
					$('#mass-credit-approval-modal').modal('hide');
					if (successUpdate && successSAP) { // all success
						
						resultNotify('fa-check-circle', 'SUCCESS', '<b>Orders successfully allocated</b>', 'success');
					} else {
						alert('Orders not allocated.\nSomething went wrong. Please try again later');
					}
					setTimeout(() => {
						enableBtn($(this));
						setTimeout(() => {
							config.db = 'local';
							$(document.body).css({'cursor' : 'default'});
							loadNormalOrderTable();
						}, 1000);
					}, 1000);
				}
			}

		});
	});

	function loadApprovalNormalOrderTable (data){
			data = getStock(DEPLOYED_ON, data);
			DT_CHECK_NORMAL_ORDER_APPROVAL = $('#approve-order-table-1').DataTable({
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
				{ data: 'salesOrderItemNo', title: '#',
				"render": function ( data, type, full, meta ) {
					return  meta.row + 1;
				},
				width: 20 },
				{ data: 'usedMaterialCode', title: 'Material code' },
				{ data: 'size', title: 'Size' },
				{ data: 'oldMaterialNumber', title: 'Pattern', width: 50 },
				{ data: 'orderItemStatus', title: 'Status', width: 50 },
				{ data: 'price', title: 'Price', width: 50 },
				{ data: 'quantity', title: 'Quantity', width: 50 },
				{ data: 'amount', title: 'Amount', width: 50 },
				{ data: 'discount', title: 'Discount / pc', defaultContent: '0.00', width: 50 },
				{ data: 'netAmount', title: 'Net Amount', defaultContent: '0.00', width: 50 },
			],
			columnDefs: [
				{ targets: [0, 6], className: 'dt-center' }, // item no, quantity
				{ targets: [1, 2], className: 'row-left-padding' }, // material code, bcp
				{ // price, discount, netAmount
					targets: [5, 7, 8], className: 'dt-right row-right-padding',
					render: (data, type, row) => convertToNumber((data) ? data : 0, '2-decimal'),
				},
				{ // status
					targets: 4,
					render: (data, type, row) => `<span class="text-yellow"><b>${data}</b></span>` ,
				},
				{ // quantity
					targets: 5,
					render: (data, type, row) => convertToNumber(data, 'whole'),
				},
				{ // netAmount
					targets: 9,
					className: 'dt-right row-right-padding',
					render: (data, type, row) => `<b>${convertToNumber((data) ? data : 0, '2-decimal')}</b>`
				}
			],
			rowCallback: (row, data, iDataIndex) => {  $(row).attr('id', data['id']); },
			footerCallback: function (row, data, start, end, display) {
				let api = this.api();
				let intVal = (i) => typeof i === 'string' ? i.replace(/[\$,]/g, '')*1 : typeof i === 'number' ? i : 0;// Remove the formatting to get integer data for summation
				let total = api.column(9).data().reduce((a, b) => intVal(a) + intVal(b), 0); // Total over all pages

				// Update footer
				$(api.column(6).footer())
				.html(convertToNumber(total, '2-decimal'))
				.attr('data-salestotal', total)
				.addClass('dt-right row-right-padding');
			}
		});

		$('.loading-state-check-normal-order').fadeOut('slow');
	}

	function loadApprovalBackorderTable(data){
			DT_CHECK_BACK_ORDER_APPROVAL = $('#approve-backorder-table-1').DataTable({
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
				{ data: 'salesOrderItemNo', title: '#',
				"render": function ( data, type, full, meta ) {
					return  meta.row + 1;
				},
				width: 20 },
				{ data: 'usedMaterialCode', title: 'Material code' },
				{ data: 'size', title: 'Size' },
				{ data: 'oldMaterialNumber', title: 'Pattern', width: 50 },
				{ data: 'orderItemStatus', title: 'Status', width: 50 },
				{ data: 'price', title: 'Price', width: 50 },
				{ data: 'quantity', title: 'Quantity', width: 50 },
				{ data: 'amount', title: 'Amount', width: 50 },
				{ data: 'discount', title: 'Discount / pc', defaultContent: '0.00', width: 50 },
				{ data: 'netAmount', title: 'Net Amount', defaultContent: '0.00', width: 50 },
			],	
			columnDefs: [
				{ targets: [0, 6], className: 'dt-center' }, // item no, quantity
				{ targets: [1, 2], className: 'row-left-padding' }, // material code, size
				{ // price, discount, netAmount
					targets: [5, 7, 8], className: 'dt-right row-right-padding',
					render: (data, type, row) => convertToNumber((data) ? data : 0, '2-decimal'),
				},
				{ // status
					targets: 4,
					render: (data, type, row) => {
						data == 'submitted' ? data = 'saved' : data;
						return `<span class="text-yellow"><b>${data}</b></span>`
					} ,
				},
				{ // netAmount
					targets: 9,
					className: 'dt-right row-right-padding',
					render: (data, type, row) => `<b>${convertToNumber((data) ? data : 0, '2-decimal')}</b>`
				}
			],
			rowCallback: (row, data, iDataIndex) => {  $(row).attr('id', data['id']); },
			footerCallback: function (row, data, start, end, display) {
				let api = this.api();
				let intVal = (i) => typeof i === 'string' ? i.replace(/[\$,]/g, '')*1 : typeof i === 'number' ? i : 0;// Remove the formatting to get integer data for summation
				let total = api.column(9).data().reduce((a, b) => intVal(a) + intVal(b), 0); // Total over all pages

				// Update footer
				$(api.column(6).footer())
				.html(convertToNumber(total, '2-decimal'))
				.attr('data-salestotal', total)
				.addClass('dt-right row-right-padding');
			}
		});
		$('.loading-state-check-back-order-1').fadeOut('slow');
	}

	function displayOrders (data) {
		let table =  `
				<div class="nav-tabs-custom" style="box-shadow: none;">
				<ul class="nav nav-tabs pull-right" id="normal-order-tabs">
					<li class="active pull-left"><a href="#order-tab" data-toggle="tab"><span id="normal-order-span" style="font-size: 14px;">Normal order</span> <span class="badge bg-light-blue margin-left-5" id="normal-order-counter"></span></a></li>
					<li class="pull-left"><a href="#backorder-tab" data-toggle="tab"><span style="font-size: 14px;">Backorder</span> <span class="badge bg-light-blue margin-left-5" id="backorder-counter"></span></a></li>
				</ul>

				<div class="tab-content">
					<div class="tab-pane active" id="order-tab">
						<div class="box box-solid" style="box-shadow: none; margin-bottom: 0;">
							<div class="box-body">
								<div class="row">
									<div class="col-lg-12">
										<table id="approve-order-table-1" class="table table-bordered table-hover table-condensed table-responsive nowrap datatable order-approval-table" style="width:100%">
											<tfoot>
												<tr>
													<th colspan="6" style='background-color: #5499C7'>Total : </th>
													<th id="normal-order-sales-total" style='background-color: #5499C7'></th>
												</tr>
											</tfoot>
										</table>
									</div>
								</div>
							</div>
							<div class="overlay loading-state-check-normal-order">
								<i class="fa fa-spinner fa-spin"></i>
							</div>
						</div>
					</div>

					<div class="tab-pane" id="backorder-tab">
						<div class="box box-solid" style="box-shadow: none; margin-bottom: 0;">
							<div class="box-body">
								<div class="row">
									<div class="col-lg-12">
										<table id="approve-backorder-table-1" class="table table-bordered table-hover table-condensed table-responsive nowrap datatable order-approval-table" style="width:100%">
											<tfoot>
												<tr>
													<th colspan="6" style='background-color: #5499C7'>Total : </th>
													<th id="back-order-sales-total" style='background-color: #5499C7'></th>
												</tr>
											</tfoot>
										</table>
									</div>
								</div>
							</div>
							<div class="overlay loading-state-check-back-order-1">
								<i class="fa fa-spinner fa-spin"></i>
							</div>
						</div>
					</div>
				</div>
			</div>`;
		return table;
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
		// data = getCreditLimit(DEPLOYED_ON, data); // get credit, overdue
		if (data == 'SAPerror') return;
		
		const creditExceedData = data.map((datum) => {
			datum.backorder ? datum.backorder : datum.backorder = 0;
			let newData;

			newData = {
				...datum, 
				quantity : parseInt(datum.quantity) + parseInt(datum.backorder)
			}

			// if(datum.orderType == 'Special Order'){
			// 	newData = {
			// 		...datum,
			// 		quantity : parseInt(datum.quantity)
			// 	}
			// }

			return newData;
		});

		DT_NORMAL_ORDER_DETAILS = $('#normal-order-details-table').DataTable({
			destroy        : true,
			data           : creditExceedData,
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
				{ data: 'backorder', title: 'Backorder', width: 60 },
				{ data: null, title: 'Amount', width: 50 }
			],
			columnDefs: [
				{ targets: [0, 4, 5, 6, 7, 8], className: 'dt-center'},  // #, quantity, visibleStock, actualStock
				{ // price
					targets: 3, className: 'dt-right',
					render: (data, type, row) => convertToNumber(data, '2-decimal')
				},
				{ // quantity,
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
				{ //actualStock
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
						let suggest = parseInt(data) - parseInt(row.backorder);
						// return suggest;
						return `<input type="number" disabled class="form-control input-sm allocateNormalorder" style="width: 60px;" min="0" max="${row.quantity}" value="${suggest}" placeholder="0">`;
					}
				},
				{ // backorder
					targets: 8,
					render: (data, type, row) => {
						let suggest = convertToNumber(data, 'whole');
						// return suggest;
						return `<input type="number" disabled class="form-control input-sm allocateBackorder" style="width: 60px;" min="0" max="${row.quantity}" value="${suggest}" placeholder="0">`;
					}
				},
				{
					targets: 9, className: 'dt-right',
					render: (data, type, row) => {
						let orderAmount = parseFloat(parseInt(row.quantity) * parseFloat(row.price)).toFixed(2);
						row.orderAmount = orderAmount;
						return orderAmount;
					}
				}
			],
			rowCallback : (row, data, iDataIndex) => {
				$(row)
					.attr('id', data['id'])
					.attr('data-salesOrderItemNo', data['salesOrderItemNo'])
					.find('.note-column').addClass('mark');
			}
		});

		$('.normal-order-details-panel [data-type="details"]').each(function(index, el) {
			let key = $(el).attr('data-key'), split = key.split('.');
			if (split.length == 1) $(el).text(data[0][key]);
		});

		$('#credit-warn2').text('0.00');
		const creditExceed = data[0].creditExceed;
		if (creditExceed > 0) {
			$('#credit-warn2').text(convertToNumber(creditExceed, '2-decimal'));
		}

		// credit display
		let credit = $('.normal-order-details-panel [data-key="creditLimit"]').text();
		$('.normal-order-details-panel [data-key="creditLimit"]').text(convertToNumber(credit, '2-decimal'));

		// overdue display
		let overdue = $('.normal-order-details-panel [data-key="overduePayment"]').text();
		$('.normal-order-details-panel [data-key="overduePayment"]').text(convertToNumber(overdue, '2-decimal'));

		// payment term display
		if (data[0].orderType == 'Special Order') {
			$('.normal-order-details-panel [data-key="paymentTerms"]').parent().show()
			let paymentTerms = $('.normal-order-details-panel [data-key="paymentTerms"]').text(), paymentTermsDisp;
			if (paymentTerms == 'TS00') paymentTermsDisp = 'Cash';
			else if (paymentTerms == 'TS30') paymentTermsDisp = 'Within 30 days';
			else if (paymentTerms == 'TS00') paymentTermsDisp = 'Within 60 days';
			$('.normal-order-details-panel [data-key="paymentTerms"]').text(paymentTermsDisp);
		} else {
			$('.normal-order-details-panel [data-key="paymentTerms"]').parent().hide()
		}

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
	/* function loadCheckNormalOrderTable(data) {
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

		$('.loading-state-check-normal-order').fadeOut('hide');
		enableBtn($('#check-allocate-normal-order-btn'));
	} */


	function loadCheckNormalOrderTable(data) {
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
		console.log(data)
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

					console.log(stock)
					console.log(combination)

					order[i].totalStock = stock.reduce((sum, item) => sum + parseInt(item.stock), 0);
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

	// get credit, overdue
	/*function getCreditLimit(environment, order) {
		if (!order[0].creditLimit && !order[0].overduePayment) {
			if (environment == 'LOCAL') {
				// const creditFixed = 0, overdueFixed = 22;
				const creditFixed = 500, overdueFixed = 0;

				for (let i in order) {
					order[i].creditLimit = creditFixed;
					order[i].overduePayment = overdueFixed;
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
					}
				}
			}
		}

		return order;
	}*/

	function calculateDiscount(orders, discounts) {
		console.log(orders, discounts)
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
		`<a><h6 id="btn-approve" data-toggle="modal" data-target="#modal-default" data-help="creditExceed" style="cursor: pointer;">How to approve order</h6></a>
		<a><h6 id="btn-reject" data-toggle="modal" data-target="#modal-default" data-help="creditExceed" style="cursor: pointer;">How to reject order</h6></a>
		<a><h6 id="btn-mass-approve" data-toggle="modal" data-target="#modal-default" data-help="creditExceed" style="cursor: pointer;">How to mass approve credits</h6></a>`
	);

	$(document).on("click", "#btn-approve", function(event) {
		let helptype = $('#btn-approve').attr('data-help');
		helpCarouselMultiple(helptype, 'approve')
    });

    $(document).on("click", "#btn-reject", function(event) {
		let helptype = $('#btn-reject').attr('data-help');
		helpCarouselMultiple(helptype, 'reject')
    });

	$(document).on("click", "#btn-mass-approve", function(event) {
		let helptype = $('#btn-mass-approve').attr('data-help');
		helpCarouselMultiple(helptype, 'mass-approve')
    });

	// check order to proceed
	/* $('#check-allocate-normal-order-btn').click(function() {
		if (DT_CHECK_NORMAL_ORDER) DT_CHECK_NORMAL_ORDER.clear().draw(); // clear table if already initialized

		let order = DT_NORMAL_ORDER_DETAILS.rows().data().toArray();
		$('#allocate-order-modal').modal();
		$('.loading-state-check-normal-order').fadeIn();
		setTimeout(() => {
			$('span#normal-order-counter').html(order.length);

			loadCheckNormalOrderTable(order);
		}, 1000);
	}); */

	// navigate on normal and back tabs
	$('#normal-order-tabs').click(function() {
		$('#check-allocate-normal-order-btn').click();
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
			console.log(data)

			data.order = parseInt(rownode.find('input.allocateNormalorder').val());
			data.orderDiscount = 0.0;
			data.orderAmount = parseInt(data.order) * parseFloat(data.price);
			data.orderNetAmount = parseInt(data.order) * parseFloat(data.price);
			
			data.quantity = parseInt(data.order) + parseInt(data.backorder);

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

			/* if (data.order) {
				discounts.push({
					salesOrderItemNo : data.salesOrderItemNo,
					materialCode : data.materialCode,
					quantity : data.order
				});
			} */

			discounts.push({
				salesOrderItemNo : data.salesOrderItemNo,
				materialCode : data.materialCode,
				quantity : data.order
			});
		}
		console.log(discounts)
		let validOrder = DT_NORMAL_ORDER_DETAILS.rows('.orderOk').count();
		if (validOrder == DT_NORMAL_ORDER_DETAILS.rows().count()) {
			let order = DT_NORMAL_ORDER_DETAILS.rows('.success').data().toArray();
			let backorder = DT_NORMAL_ORDER_DETAILS.rows('.danger').data().toArray();
			console.log(order)
			console.log(backorder)
			console.log(discounts)
			console.log(customerCode)
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
				console.log(SAPdiscount)
				if (!SAPdiscount) return
				order = calculateDiscount(order, SAPdiscount)
			}
			console.log(order)
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


	// approve order
	$('#approve-normal-order-btn').click(function() {
		$('.loading-state-normal-order').fadeIn();
		disableBtn($(this));
		setTimeout(() => {
			let order = DT_CHECK_NORMAL_ORDER.rows().data().toArray();
			let backorder = DT_CHECK_BACK_ORDER_1.rows().data().toArray();
			let successUpdate, successSAP = true;
			let proceedtoSAP = true;
			
			order = order.map((data) => {
				return {
					...data, 
					quantity : parseInt(data.quantity) - parseInt(data.backorder)
				}
			});
			console.log(order)
			if (DEPLOYED_ON != 'LOCAL') { // Dev or Prod
				// creditStatus = releaseCreditBlockSAP(order);
				// orderStatus = releaseDeliveryBlockSAP(order);
				// console.log(creditStatus)
				// console.log(orderStatus)
				// successSAP = (creditStatus && orderStatus === "0") ? true : false;
				// console.log(successSAP)

				let creditStatus = "1";
				orderStatus = releaseDeliveryBlockSAP(order)
				console.log(orderStatus)

				if(orderStatus === "0") creditStatus = releaseCreditBlockSAP(order)
				console.log(creditStatus)
				successSAP = creditStatus === "0" ?  true : false;
				console.log(successSAP)
			}

			if (successSAP) successUpdate = updateOrderCouch(order);
			if (successUpdate) {
				emailOrderNotif(order);

				if (LOG_FUNCTION) {
					createLog(`LOG::${LOCAL_STORAGE.referenceId}`, {
						dateCreated : moment().toISOString(),
						action : `Approved order ${order[0].salesOrderNo}`,
						module : "Approval/Credit Exceed/Overdue Payment",
						app : "AMI"
					}, moment().toISOString());
				}
			}

			if (backorder.length > 0) {  // there is backorder
				backorder = backorder.map((data) => {
					return { ...data, quantity : parseInt(data.quantity) - parseInt(data.backorder) }
				});

				console.log(backorder)

				successUpdate = createBackorderCouch(backorder);
				if (successUpdate){
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
				const rejectStatus = rejectCreditSO(order);
				successSAP = (rejectStatus === "0") ? true : false;
			}

			if	(successSAP) successUpdate = rejectOrderCouch(order, reason);
			if	(successUpdate) 
				emailRejectOrderNotif(order, reason);
			
				if (LOG_FUNCTION) {
					createLog(`LOG::${LOCAL_STORAGE.referenceId}`, {
						dateCreated : moment().toISOString(),
						action : `Rejected order ${order[0].salesOrderNo}`,
						module : "Approval/Credit Exceed/Overdue Payment",
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
		console.log(order);
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
				console.log(result);
				releaseStatus = result[0].recode;
				console.log(releaseStatus)
			}
		});

		return releaseStatus;
	}

	const releaseCreditBlockSAP = (order) => {
		console.log(order);
		let releaseStatus = "0";

		let ordersRelease = order.map(item => {
			return {
				salesOrderNo: item.salesOrderNo
			}
		});

		DI_releaseCreditBlock({ ordersRelease }, (err, res) => {
			if (err || res.statusCode >= 300) {
				releaseStatus = "1";
				alert('Unable to release credit block from SAP.');
				console.log('err', err, 'res', res);
			} else if (res.result.hasOwnProperty('message')){
				releaseStatus = "1";
				alert(res.result.message);
			} else if (res.statusCode <= 299) {
				let result = res.result;
				console.log(result);
				releaseStatus = result[0].RECODE;
				console.log(releaseStatus)
			}
		});

		return releaseStatus;
	}

	const rejectCreditSO = (order) => {
		console.log(order)
		let rejectStatus = "0";

		let RejectCreditStatusModels = order.map(item => {
			return {
				salesOrderNo: item.salesOrderNo
			}
		});
		console.log(RejectCreditStatusModels)
		DI_rejectCreditStatus({ RejectCreditStatusModels }, (err, res) => {
			if (err || res.statusCode >= 300) {
				rejectStatus = "1";
				alert('Unable to reject order from SAP.');
				console.log('err', err, 'res', res);
			} else if (res.result.hasOwnProperty('message')){
				rejectStatus = "1";
				alert(res.result.message);
			} else if (res.statusCode <= 299) {
				let result = res.result;
				console.log('result : ', result)
				rejectStatus = result[0].recode;
			}
		});

		return rejectStatus;
	}

	// update order on couch
	/* function updateOrderCouch(order) {
		let isSuccess = true;

		let changesObj = {};
		for (let i in order) {
			let data = order[i];
			changesObj[data.id] = {
				netAmount           : data.netAmount.toString(),
				discount            : data.discount.toString(),
				salesOrderNoSAP     : (order[0].salesOrderNoSAP) ? order[0].salesOrderNoSAP.toString() : '',
				creditOrderApprover : LOCAL_STORAGE.userid,
				creditDateApproved  : moment().format('YYYY-MM-DD'),

				orderItemStatus : 'confirmed',
			}
		}

		updateOrders(changesObj, (err, res) => {
			if (err || res.statusCode >= 300) { isSuccess = false; }
			else if (res.statusCode <= 299) { updateOrderLocal(changesObj, LCLDB_NORMAL_ORDER); }
		});

		return isSuccess;
	} */

	function updateOrderCouch(order) {
		console.log(order)
		let isSuccess = true;

		let changesObj = {};
		for (let i in order) {
			let data = order[i];
			changesObj[data.id] = {
				amount             : data.orderAmount.toString(),
				netAmount          : data.orderNetAmount.toString(),
				discount           : data.orderDiscount.toString(),
				quantity           : data.order.toString(),
				creditOrderApprover : LOCAL_STORAGE.userid,
				creditDateApproved  : moment().format('YYYY-MM-DD'),

				orderItemStatus : 'confirmed',
			}
		}
		console.log(changesObj)
		updateOrders(changesObj, (err, res) => {
			if (err || res.statusCode >= 300) { isSuccess = false; }
			else if (res.statusCode <= 299) { updateOrderLocal(changesObj, LCLDB_NORMAL_ORDER); }
		});

		return isSuccess;
	}

	// create backorder doc
	function createBackorderCouch(backorder,massApproval) {
		console.log(backorder)
		
		let SOno, backorders = [], orderDelete = {},table = DT_NORMAL_ORDER_DETAILS;
		if(massApproval){
			table = DT_APPROVE_ORDER_DETAILS
		}
		for (let i in backorder) {
			let data = backorder[i];
			let rownode = table.row(`[data-salesOrderItemNo="${data.salesOrderItemNo}"]`).nodes().to$();

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

			if(!massApproval){
				if (!rownode.hasClass('success')) {
					console.log('here')
					orderDelete[data.id] = {
						isDeleted: true,
						deleteDate: moment().toISOString(),
						deleteReason: 'order converted to backorder'
					}
				}
			}
		}
		console.log(backorders)
		console.log(orderDelete)
		createBackorders({ backorders }, (err, res) => {
			if (err || res.statusCode >= 300) {}
			else if (res.statusCode <= 299) {
				SOno = res.result;

				updateOrders(orderDelete, (err2, res2) => { // soft delete order
					if (err2 || res2.statusCode >= 300) {}
					else if (res2.statusCode <= 299) {
						updateBackorderLocal(backorder, LCLDB_NORMAL_ORDER);
					}
				});
			}
		});

		return SOno;
	}

	// reject order on couch
	function rejectOrderCouch(order, reason) {
		console.log(order)
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
				alert(`No salesperson`);
				isSuccess = false;
			} else if (res.statusCode <= 299) {
				CUSTOMERSALESPERSON = res.result;
			}
		});

		return isSuccess;
	}

	// email order
	function emailOrderNotif(order) {
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
		let accessLink = 'AMI';
		let emailSetting = {
			subject : 'Credit exceed/overdue payment had been approved.'
		};

		if (DEPLOYED_ON != 'SAP') {
			emailSetting.to = DEV_EMAILS.OPS_BST;
			emailSetting.cc = [];
		} else {
			// to logistic
			emailSetting.to = [].concat(BSTSG_EMAILS.logisticTeam);
			emailSetting.cc = [];
		}

		let emailNotif = { detailSection, orderSection, accessLink, emailSetting };
		sendOrderNotif(emailNotif, (err, res) => {
			if (err) {
				if (err.statusCode == 400 && err.message == 'Unable to send email') {
					alert(err.message);
					return;
				}

				alert('Something went wrong while sending email');
			}
		});

		// access link & email setting
		accessLink = 'WOS';
		emailSetting = {
			subject : 'Your Order is now in process.'
		};

		if (DEPLOYED_ON != 'SAP') {
			emailSetting.to = DEV_EMAILS.OPS_BST;
			emailSetting.cc = [];
		} else {
			// to customer
			// cc logistic, salesman
			emailSetting.to = customerEmail;
			emailSetting.cc = [].concat(BSTSG_EMAILS.logisticTeam).concat(CUSTOMERSALESPERSON.email);
		}

		emailNotif = { detailSection, orderSection, accessLink, emailSetting };
		sendOrderNotif(emailNotif, (err, res) => {
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
			if (err) {
				if (err.statusCode == 400 && err.message == 'Unable to send email') {
					alert(err.message);
					return;
				}

				alert('Something went wrong while sending email');
			}
		});
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
	function updateBackorderLocal(backorder, localdb) {
		for (let i in backorder) {
			let id = backorder[i].id;
			let index = localdb.findIndex(item => item.id == id);
			if (index != -1) localdb.splice(index, 1);
		}
	}
});