$(document).ready(function() {
	var LCLDB_CUSTOMERORDER, DT_CUSTOMERORDER;

	const defaultColumn = [
		{ title: 'Date Ordered' },
		{ title: 'WOS Ref No' },
		{ title: 'SAP Ref No' },
		{ title: 'Delivery No' },
		{ title: 'Invoice No' },
		{ title: 'Sold to Customer Code' },
		{ title: 'Sold to Customer' },
		{ title: 'Order Type' },
		{ title: 'Request Delivery Date' },
		{ title: 'Ship to Customer Code' },
		{ title: 'Ship to Customer' },
		{ title: 'BPC' },
		{ title: 'Material  Code' },
		{ title: 'Pattern' },
		{ title: 'Ship Qty' },
		{ title: 'Price' },
		{ title: 'Discount per pc' },
		{ title: 'Net amount' },
		{ title: 'Total amount' }
	]

	initFilters();
	$('#customer-table').DataTable({ destroy : true, data : [], columns: defaultColumn, dom : 'rti', scrollX: true });
	$('.loading-state').fadeOut('slow');
	// loadCustomerOrderTable('2018-11-01', '2018-12-31', ["TSC100002","TSC100123","TSC100318","TSC100003","TSC100005","TSC100042","TSC100051","TSC100187","TSC100120","TSC100001","TSC100218","TSC100113","TSC100102"], ["Normal Order","Special Order"])

	function loadCustomerOrderTable(startDate, endDate, soldToCustomers, orderTypes) {
		let filterObj = { startDate, endDate, soldToCustomers, orderTypes}

		customerOrderReport(filterObj, (err, res) => {
			if (err || res.statusCode >= 300) alert('Unable to load orders');
			else if (res.statusCode <= 299) LCLDB_CUSTOMERORDER = res.result;
		});

		DT_CUSTOMERORDER = $('#customer-table').DataTable({
			destroy        : true,
			data           : LCLDB_CUSTOMERORDER,
			autoWidth      : false,
			scrollX        : true,
			scrollY        : 350,
			scrollCollapse : true,
			deferRender    : true,
			scroller       : true,
			ordering       : false,
			dom            : 'rti',

			columns: [
				{ data: 'dateCreated', title: 'Date Ordered', defaultContent: '' },
				{ data: 'salesOrderNo', title: 'WOS Ref No', defaultContent: '' },
				{ data: 'salesOrderNoSAP', title: 'SAP Ref No', defaultContent: '' },
				{ data: 'deliveredNo', title: 'Delivery No', defaultContent: '' },
				{ data: 'invoicedNo', title: 'Invoice No', defaultContent: '' },
				{ data: 'customerCode', title: 'Sold to<br>Customer Code', defaultContent: '' },
				{ data: 'soldToCustomer', title: 'Sold to Customer', defaultContent: '' },
				{ data: 'orderType', title: 'Order Type', defaultContent: '' },
				{ data: 'requestedDate', title: 'Request<br>Delivery Date', defaultContent: '' },
				{ data: 'shipToCustomerCode', title: 'Ship to<br>Customer Code', defaultContent: '' },
				{ data: 'shipToCustomer', title: 'Ship to Customer', defaultContent: '' },
				{ data: 'materialCode', title: 'BPC', defaultContent: '' },
				{ data: 'usedMaterialCode', title: 'Material  Code', defaultContent: '' },
				{ data: 'oldMaterialNumber', title: 'Pattern', defaultContent: '' },
				{ data: 'quantity', title: 'Ship Qty', defaultContent: '' },
				{ data: 'price', title: 'Price', defaultContent: '' },
				{ data: 'discount', title: 'Discount per pc', defaultContent: '' },
				{ data: 'netAmount', title: 'Net amount', defaultContent: '' },
				{ data: 'amount', title: 'Total amount', defaultContent: '' }
			],
			columnDefs: [
				{ targets: [0, 1, 2, 5, 8, 9, 11, 14], className: 'dt-center' },
				{ targets: [15, 16, 17, 18], className: 'dt-right' },
				{ 
					targets: 0, 
					render: (data, type, row) => moment(new Date(data).toISOString()).format('MMM DD, YYYY hh:mm A') 
				},
				{
					targets: [3, 4], 
					render: (data, type, row) => data ? Number(data) : '' 
				},

				{
					targets: 8, 
					render: (data, type, row) => (data) ? moment(new Date(`${data.slice(0, -3)} ${moment().format('hh:mm')} ${data.slice(-2)}`).toISOString()).format('MMM DD, YYYY A') : '' 
				},
				{
					targets: [15, 16, 17, 18],
					render: (data, type, row) => convertToNumber(data, '2-decimal')
				}
			],
			buttons: [
				{
					extend    : 'excel',
					footer    : true,
					text      : '<span style="color: white; font-weight: bolder;" id="btn-excel"><i class="fa fa-file-excel-o"></i> Excel</span>',
					title     : 'Customer Order',
			    	filename  : `Customer Order ${moment().format('MM-DD-YYYY')}`,
					className : 'btn btn-warning btn-sm btn-flat'
				},
			    {
			    	extend      : 'pdf',
			    	footer      : true,
			    	text        : '<span style="color: white; font-weight: bolder;" id="btn-pdf"><i class="fa fa-file-pdf-o"></i> PDF</span>',
			    	title       : 'Customer Order',
			    	filename    : `Customer Order ${moment().format('MM-DD-YYYY')}`,
			    	orientation : 'landscape',
			    	pageSize    : 'A3',
			    	className   : 'btn btn-warning btn-sm btn-flat'
			    }
			],
			rowCallback: (row, data, iDataIndex) => {
				$(row).attr('id', data['id']);
			}
		});

		// custom search and buttons -outside datatable
		$('#customer-table-filter').keyup(function(){
		    DT_CUSTOMERORDER.search($(this).val()).draw() ;
		});

		DT_CUSTOMERORDER.buttons().container().appendTo('#customer-table-buttons');

		$('.loading-state').fadeOut('slow');
	}

	// generate customer dropdown options
	function customerDropdown() {
		try {
			const customerRoleId = role_localdata.CUSTOMER;
			let customers;

			loadCustomerUser({ customerRoleId }, (err, res) => {
				if (res.statusCode <= 299) {
					customers = res.result;
					$('#customer-dropdown ul.dropdown-menu').html(`<li><a href="#" class="select-all"><div class="checkbox"><label><input type="checkbox"> All</label></div></a></li>`);
					for (let i in customers) $('#customer-dropdown ul.dropdown-menu').append(`<li><a href="#"><div class="checkbox"><label><input type="checkbox" data-value="${customers[i].customerCode}"> <b>${customers[i].customerCode}</b> - ${customers[i].accountName}</label></div></a></li>`);
				}
			});
		} catch (err) {
			alert('Something went wrong\n' + err);
			console.log(err);
		}
	}

	// generate orderType/distribution channel dropdown options
	function orderTypeDropdown() {
		$('#distribution-channel-dropdown ul.dropdown-menu').html(`
			<li><a href="#" class="select-all"><div class="checkbox"><label><input type="checkbox"> All</label></div></a></li>
			<li><a href="#"><div class="checkbox"><label><input type="checkbox" data-value="Normal Order"> Normal Sales</label></div></a></li>
			<li><a href="#"><div class="checkbox"><label><input type="checkbox" data-value="Special Order"> Special Sales</label></div></a></li>
		`);
	}

	// initialize filters
	function initFilters(){
		$('#daterange-btn').daterangepicker({ startDate: moment(), endDate: moment()}, (start, end) => {
			$('#daterange-btn span').text(`${start.format('MMM DD, YYYY')} - ${end.format('MMM DD, YYYY')}`);
			$('#daterange-btn').attr('startDate', start.format('YYYY-MM-DD')).attr('endDate', end.format('YYYY-MM-DD'));
		});
		customerDropdown();
		orderTypeDropdown();

		$('ul.dropdown-menu a').off('click').on('click', function() { $(this).closest('.dropdown').addClass('open'); }); // keep dropdown open
		$('.dropdown ul.dropdown-menu a.select-all input[type="checkbox"]').change(function(event) { // select all checkbox
			let checkboxes = $(this).closest('.dropdown-menu').find('input[type="checkbox"]')
			if (this.checked != true) checkboxes.prop('checked', false);
			else checkboxes.prop('checked', true);
		});
	}

	function getDataSelected(dropdown) {
		let data = [];
		$(`#${dropdown} input[type="checkbox"]:checked`).each(function(index, el) {
			let item = $(this).attr('data-value');
			if (item) data.push(item);
		});

		return data;
	}

	$('#btn-generate').click(function() {
		const soldToCustomers = getDataSelected('customer-dropdown');
		const orderTypes = getDataSelected('distribution-channel-dropdown');
		const startDate = $('#daterange-btn').attr('startDate');
		const endDate = $('#daterange-btn').attr('endDate');

		if (!soldToCustomers.length || !orderTypes.length || !startDate || !endDate) {
			resultNotify('fa fa-exclamation-circle', 'INVALID', 'All dropdowns are required', 'warning');
			return;
		}

		$('.loading-state').fadeIn('slow');
		setTimeout(() => { loadCustomerOrderTable(startDate, endDate, soldToCustomers, orderTypes) }, 1000);
	});
});