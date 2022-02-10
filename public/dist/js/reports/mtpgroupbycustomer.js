$(document).ready(function() {
	var LCLDB_CUSTOMER, DT_CUSTOMER;

	const defaultColumn = [
		{ title: 'Channel'},
		{ title: 'Customer Code' },
		{ title: 'Customer Name' },
		{ title: 'Total Billing Value', defaultContent: ''}
	]

	initFilters();
	$('#customer-table').DataTable({ destroy : true, data : [], columns: defaultColumn, dom : 'rti' });
	$('.loading-state').fadeOut('slow');

	// loadCustomerTable("2018-05-01", "2018-08-31", ["PSR","TBR"], ["Normal Order","Special Order"], ["00000001","00000002"])
	function loadCustomerTable(startDate, endDate, materialGroups, orderTypes, salesperson) {
		let filterObj = { startDate, endDate, materialGroups, orderTypes, salesperson }

		mtpCustomerReport(filterObj, (err, res) => {
			LCLDB_CUSTOMER = res;
		});

		$('.datatable').wrap('<div style="overflow:auto;" />'); // sroll x
		DT_CUSTOMER = $('#customer-table').DataTable({
			destroy    : true,
			data       : LCLDB_CUSTOMER,
			autoWidth  : false,
			ordering   : false,

			columns: [
				{ data: 'channel', title: 'Channel', defaultContent: ' --- ' },
				{ data: 'customerCode', title: 'Customer Code', defaultContent: '', },
				{ data: 'customerName', title: 'Customer Name', defaultContent: '', },
				{ data: 'amount', title: 'Total Billing Value', defaultContent: '', }
			],

			columnDefs: [
				{ targets: [0, 1], className: 'dt-center' },
				{ targets: 3, className: 'dt-right' },
				{ targets: 3, render: (data, type, row) => convertToNumber(data, '2-decimal') }
			],

			dom: 'rti',
			buttons: [
				{
					extend    : 'excel',
					footer    : true,
					text      : '<span style="color: white; font-weight: bolder;" id="btn-excel"><i class="fa fa-file-excel-o"></i> Excel</span>',
					title     : 'MTP Group by Customer',
			    	filename  : `MTP Group by Customer ${moment().format('MM-DD-YYYY')}`,
					className : 'btn btn-warning btn-sm btn-flat'
				},
			    {
			    	extend    : 'pdf',
			    	footer    : true,
			    	text      : '<span style="color: white; font-weight: bolder;" id="btn-pdf"><i class="fa fa-file-pdf-o"></i> PDF</span>',
			    	title     : 'MTP Group by Customer',
			    	filename  : `MTP Group by Customer ${moment().format('MM-DD-YYYY')}`,
			    	customize : (doc) => { doc.content[1].margin = [ 100, 0, 100, 0 ] }, // center table on PDF
			    	className : 'btn btn-warning btn-sm btn-flat'
			    }
			],

			footerCallback : function (row, data, start, end, display) {
				let api = this.api();
				// Remove the formatting to get integer data for summation
				let intVal = ( i ) => { return typeof i === 'string' ? i.replace(/[\$,]/g, '')*1 : typeof i === 'number' ? i : 0; };
				// Total over all pages
				let total = api.column(3).data().reduce((a, b) => { return intVal(a) + intVal(b); }, 0);

				$(api.column(3).footer()).html(convertToNumber(total, 'whole'))
			}
		});

		// custom search and buttons -outside datatable
		$('#customer-table-filter').keyup(function(){
		    DT_CUSTOMER.search($(this).val()).draw() ;
		});

		DT_CUSTOMER.buttons().container().appendTo('#customer-table-buttons');

		$('.loading-state').fadeOut('slow');
	}

	// generate salesperson dropdown options
	function salespersonDropdown() {
		const salesRoleId = role_localdata.SALESPERSON;
		let salesperson;

		loadSalespersonUser({ salesRoleId }, (err, res) => {
			if (err || res.statusCode >= 300) { end = true; return };

			if (res.statusCode <= 299) { salesperson = res.result; data = res.result; }
		});

		$('#salesperson-dropdown ul.dropdown-menu').html(`<li><a href="#" class="select-all"><div class="checkbox"><label><input type="checkbox"> All</label></div></a></li>`);

		for (let i in salesperson) {
			$('#salesperson-dropdown ul.dropdown-menu').append(`<li><a href="#"><div class="checkbox"><label><input type="checkbox" data-value="${salesperson[i].customerCode}"> <b>${salesperson[i].customerCode}</b> - ${salesperson[i].accountName} </label></div></a></li>`);
		}

	}

	// generate mat group dropdown options
	function materialGroupDropdown() {
		$('#material-group-dropdown ul.dropdown-menu').html(`
			<li><a href="#" class="select-all"><div class="checkbox"><label><input type="checkbox"> All</label></div></a></li>
			<li><a href="#"><div class="checkbox"><label><input type="checkbox" data-value="PSR"> PSR</label></div></a></li>
			<li><a href="#"><div class="checkbox"><label><input type="checkbox" data-value="TBR"> TBR</label></div></a></li>
		`);
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
		salespersonDropdown();
		materialGroupDropdown();
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
		const materialGroups = getDataSelected('material-group-dropdown');
		const salespersons = getDataSelected('salesperson-dropdown');
		const orderTypes = getDataSelected('distribution-channel-dropdown');
		const startDate = $('#daterange-btn').attr('startDate');
		const endDate = $('#daterange-btn').attr('endDate');

		if (!materialGroups.length || !salespersons.length || !orderTypes.length || !startDate || !endDate) {
			resultNotify('fa fa-exclamation-circle', 'INVALID', 'All dropdowns are required', 'warning');
			return;
		}

		$('.loading-state').fadeIn('slow');
		setTimeout(() => { loadCustomerTable(startDate, endDate, materialGroups, orderTypes, salespersons) }, 1000);
	});

});