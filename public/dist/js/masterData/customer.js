$(document).ready(function() {
	var LCLDB_CUSTOMER, DT_CUSTOMER, LCLDB_CUSTOMER_SHIPTO;

	loadCustomerTable();

	function loadCustomerTable() {

		loadMainCustomers((err, res) => {
			LCLDB_CUSTOMER = res.result;
			console.log(LCLDB_CUSTOMER)
		});

		loadAllCustomerShipTo((err,res) => {
			LCLDB_CUSTOMER_SHIPTO = res.result;
			console.log(LCLDB_CUSTOMER_SHIPTO)
		});

		DT_CUSTOMER = $('#customer-table').DataTable({
			destroy        : true,
			data           : LCLDB_CUSTOMER,
			autoWidth      : false,
			scrollX        : true,
			scrollY        : 350,
			scrollCollapse : true,
			deferRender    : true,
			scroller       : true,
			ordering       : true,
			dom            : 'rti',

			columns: [
				{ data: null, title: '', width: 10 },
				{ data: 'customerCode', title: 'Customer code' },
				{ data: 'customerName', title: 'Name' },
				{ data: 'smtpAddr', title: 'Email', defaultContent: '' },
				{ data: 'telNumber', title: 'Tel.no' },
				{ data: 'faxNumber', title: 'Fax no' },
				{ data: 'street', title: 'Street' },
				{ data: 'city1', title: 'City', defaultContent: '---' },
				{ data: 'postCode1', title: 'Postal Code' },
				{ data: 'country', title: 'Country' }
			],
			columnDefs: [
				{ targets: [1, 4, 5, 7, 8, 9], className: 'dt-center' },
				{ // expand
					targets: 0, className: 'details-control dt-center', orderable: false,
					render: (data, type, row) => '<i class="fa fa-plus-circle text-green" aria-hidden="true" style="font-size: 16px;"></i>'
				},
			],
			buttons: [
				{
					extend    : 'excel',
					footer    : true,
					text      : '<span style="color: white; font-weight: bolder;" id="btn-excel"><i class="fa fa-file-excel-o"></i> Excel</span>',
					title     : `Customer Master Data ${moment().format('MM-DD-YYYY')}`,
			    	filename  : `Customer Master Data ${moment().format('MM-DD-YYYY')}`,
					className : 'btn btn-warning btn-sm btn-flat'
				},
			    {
			    	extend      : 'pdf',
			    	footer      : true,
			    	text        : '<span style="color: white; font-weight: bolder;" id="btn-pdf"><i class="fa fa-file-pdf-o"></i> PDF</span>',
			    	title       : `Customer Master Data ${moment().format('MM-DD-YYYY')}`,
			    	filename    : `Customer Master Data ${moment().format('MM-DD-YYYY')}`,
			    	orientation : 'landscape',
			    	className   : 'btn btn-warning btn-sm btn-flat'
			    }
			],
			rowCallback: (row, data, index) => { $(row).attr('id', data['id']); }
		});

		// custom search and buttons -outside datatable
		$('#customer-table-filter').keyup(function(){
		    DT_CUSTOMER.search($(this).val()).draw() ;
		});
		DT_CUSTOMER.buttons().container().appendTo('#customer-table-buttons');

		$('#customer-table tbody').off('click').on('click', 'td.details-control', function() {
			let tr = $(this).closest('tr'), row = DT_CUSTOMER.row(tr);

			if (row.child.isShown()) {
				row.child.hide();
				tr.removeClass('shown');
				$(this).html('<i class="fa fa-plus-circle text-green" aria-hidden="true" style="font-size: 16px;"></i>')
			} else {
				row.child(format(row.data())).show();
				row.child().addClass('mark');
				tr.addClass('shown');
				$(this).html('<i class="fa fa-minus-circle text-red" aria-hidden="true" style="font-size: 16px;"></i>')
			}
		});

		$('.loading-state').fadeOut('slow');
	}

	// for expand row
	function format(data) {
		let custExpandInfo = LCLDB_CUSTOMER_SHIPTO.filter(item => item.mainCustomerCode == data.customerCode);
		let code = `<div class="col-lg-6"><table class="table nowrap table-responsive table-bordered" style="margin-bottom: 0px;">`;

		for (let i in custExpandInfo) {
			code +=
			`<tr>
			<td>${custExpandInfo[i].customerCode}</td>
			<td>${custExpandInfo[i].address}</td>
			<td>${(custExpandInfo[i].city1) ? custExpandInfo[i].city1 : ''}</td>
			<td>${custExpandInfo[i].postCode1}</td>
			<td>${custExpandInfo[i].country}</td>
			</tr>`;
		}

		code += `</table></div>`;

		return code;
	}

});