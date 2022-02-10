$(document).ready(function() {
	var LCLDB_CREDITOVERDUE, DT_CREDITOVERDUE, DT_EXPORT;

	const config = {
	    // db : 'offline'
	    db : 'couchbase'
	};

	const defaultColumn =  [
		{ title: 'Date Ordered' },
		{ title: 'WOS Ref No' },
		{ title: 'SAP SO no', defaultContent: '' },
		{ title: 'Customer Code' },
		{ title: 'Customer Name' },
		{ title: 'Credit Limit' },
		{ title: 'Credit Exceed' },
		{ title: 'Overdue Payment' },
		{ title: 'Approved By' }
	]

	initFilters();
	$('#creditoverdue-table').DataTable({ destroy : true, data : [], columns: defaultColumn, dom : 'rti', scrollX: true });
	$('.loading-state').fadeOut('slow');

	function loadCreditOverdueTable(startDate, endDate, soldToCustomers) {

		let data;

		if (config.db == 'couchbase') {
			loadCreditApprovalReport({ startDate, endDate, soldToCustomers}, (err, res) => {
				if (err || res.statusCode >= 300) { end = true; return };

				if (res.statusCode <= 299) { LCLDB_CREDITOVERDUE = res.result; data = res.result; }
			});
		} else if (config.db == 'local') {
			data = LCLDB_CREDITOVERDUE;
		} else {
			LCLDB_CREDITOVERDUE = offlineDB;
			data = offlineDB;
		}

		data = removeduplicate_1(data, 'salesOrderNo');
		DT_CREDITOVERDUE = $('#creditoverdue-table').DataTable({
			destroy        : true,
			data           : data,
			order          : [[ 0, "asc" ]],
			autoWidth      : false,
			scrollX        : true,
			scrollY        : 350,
			scrollCollapse : true,
			deferRender    : true,
			scroller       : true,
			dom            : 'rti',

			columns: [
				{ data: 'dateCreated', title: 'Date Ordered' },
				{ data: 'salesOrderNo', title: 'WOS Ref No' },
				{ data: 'salesOrderNoSAP', title: 'SAP SO no', defaultContent: '' },
				{ data: 'customerCode', title: 'Customer Code' },
				{ data: 'customerName', title: 'Customer Name' },
				{ data: 'creditLimit', title: 'Credit Limit' },
				{ data: 'creditExceed', title: 'Credit Exceed' },
				{ data: 'overduePayment', title: 'Overdue Payment' },
				{ data: 'creditApprover', title: 'Approved By' },
			],
			columnDefs:
			[
				{ 
					targets: 0, 
					render: (data, type, row) => moment(data).format('MMM DD, YYYY') 
				},
				{ targets: [0, 3, 8], className: 'dt-center' },
				{
					targets: [5, 6, 7], className: 'dt-right',
					render: (data, type, row) => convertToNumber(data, '2-decimal')
				}
			],
			buttons: [
				{
					extend    : 'excel',
					footer    : true,
					text      : '<span style="color: white; font-weight: bolder;" id="btn-excel"><i class="fa fa-file-excel-o"></i> Excel</span>',
					title     : `Credit Exceed / Overdue Payment Approval Report ${moment().format('MM-DD-YYYY')}`,
			    	filename  : `Credit Exceed / Overdue Payment Approval Report ${moment().format('MM-DD-YYYY')}`,
					className : 'btn btn-warning btn-sm btn-flat'
				}
			]
		});

		DT_CREDITOVERDUE.buttons().container().appendTo('#creditoverdue-table-buttons');

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

	// initialize filters
	function initFilters(){
		$('#daterange-btn').daterangepicker({ startDate: moment(), endDate: moment()}, (start, end) => {
			$('#daterange-btn span').text(`${start.format('MMM DD, YYYY')} - ${end.format('MMM DD, YYYY')}`);
			$('#daterange-btn').attr('startDate', start.format('YYYY-MM-DD')).attr('endDate', end.format('YYYY-MM-DD'));
		});
		customerDropdown();

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
		const startDate = $('#daterange-btn').attr('startDate');
		const endDate = $('#daterange-btn').attr('endDate');

		if (!soldToCustomers.length || !startDate || !endDate) {
			resultNotify('fa fa-exclamation-circle', 'INVALID', 'All dropdowns are required', 'warning');
			return;
		}

		$('.loading-state').fadeIn('slow');
		setTimeout(() => { loadCreditOverdueTable(startDate, endDate, soldToCustomers) }, 1000);
	});

});