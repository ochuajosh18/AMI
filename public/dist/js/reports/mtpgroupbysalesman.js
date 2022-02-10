$(document).ready(function() {
	const salespersonRoleId = role_localdata.SALESPERSON;
	let LCLDB_SALESPERSON, DT_SALES;
	const START_OF_MONTH = moment().startOf('month'), END_OF_MONTH = moment().endOf('month');

	$('#daterange-btn span').html(`${START_OF_MONTH.format('MMM DD, YYYY')} - ${END_OF_MONTH.format('MMM DD, YYYY')}`);
	loadSalespersonTable(salespersonRoleId, START_OF_MONTH.format('YYYY-MM-DD'), END_OF_MONTH.format('YYYY-MM-DD'));
	// loadSalespersonTable(salespersonRoleId, "2018-08-01", "2018-08-31");
	$('.loading-state').fadeOut('slow');

	// load sales table
	function loadSalespersonTable(salespersonRoleId, startDate, endDate){
		try {
			let end = false;
			let filterObj = { salespersonRoleId, orderStatus: 'confirmed', startDate, endDate }

			mtpSalesmanReport(filterObj, (err, res) => {
				if (err || res.statusCode >= 300) alert('Unable to load orders');
				else if (res.statusCode <= 299) LCLDB_SALESPERSON = res.result;
			});

			if (end) throw new Error('Unable to load orders');

			// create colums
			let columns = [{data: 'label', title: '', defaultContent: ''}];
		 	for (let i in LCLDB_SALESPERSON) {
		 		columns.push({
		 			data: LCLDB_SALESPERSON[i].customerCode, // code
		 			title: LCLDB_SALESPERSON[i].salespersonName, // name
		 			defaultContent: ''
		 		});
		 	}
		 	columns.push({ data: 'matGroupTotal', title: 'Grand Total', defaultContent: '' });

		 	// create data
		 	let data = [], rows = ['PSR', 'TBR', 'Others'];
			for (let i in rows) {
				data.push({ label: rows[i] });

				let total = 0;
				for (let j in LCLDB_SALESPERSON) { // loop salesperson to get channel computation
					let salesperson = LCLDB_SALESPERSON[j];
					let matGroup = rows[i];
					data[i][LCLDB_SALESPERSON[j].customerCode] = salesperson[matGroup];
					total += salesperson[matGroup];
				}

				data[i].matGroupTotal = total; // for grand total column
			}

			// footer compute
			let totalObj = {};
			for (let i in data) {
				for (let j in data[i]) {
					if (j != 'label' && j != 'matGroupTotal') { // dynamic column only
						if (totalObj[j] == undefined) totalObj[j] = 0;
						totalObj[j] += data[i][j]
					}
				}
			}

			// create footer
			$('#salesperson-table tfoot tr').html(`<th> Grand Total</th>`);
			let grandTotal = 0;
			for (let i in totalObj) {
				$('#salesperson-table tfoot tr').append(`<th>${totalObj[i]}</th>`);
				grandTotal += totalObj[i]
			}
			$('#salesperson-table tfoot tr').append(`<th>${grandTotal}</th>`);


			$('.datatable').wrap('<div style="overflow:auto;" />'); // sroll x
			DT_SALES = $('#salesperson-table').DataTable({
				destroy   : true,
				data      : data,
				columns   : columns,
				autoWidth : false,
				ordering  : false,

				columnDefs: [
					{ targets: 0, className: 'dt-left' },
					{ targets: '_all', className: 'dt-right' }
				],
				dom: 'rti',

				buttons: [
					{ 
						extend    : 'excel',
						footer    : true,
						text      : '<span style="color: white; font-weight: bolder;" id="btn-excel"><i class="fa fa-file-excel-o"></i> Excel</span>', 
						title     : 'MTP Group by Salesman',
				    	filename  : `MTP Group by Salesman ${moment().format('MM-DD-YYYY')}`,
						className : 'btn btn-warning btn-sm btn-flat'
					},
				    { 
				    	extend    : 'pdf',
				    	footer    : true,
				    	text      : '<span style="color: white; font-weight: bolder;" id="btn-pdf"><i class="fa fa-file-pdf-o"></i> PDF</span>', 
				    	title     : 'MTP Group by Salesman',
				    	filename  : `MTP Group by Salesman ${moment().format('MM-DD-YYYY')}`,
				    	customize : (doc) => { doc.content[1].margin = [ 100, 0, 100, 0 ] }, // center table on PDF
				    	className : 'btn btn-warning btn-sm btn-flat' 
				    }
				]
			});

			DT_SALES.buttons().container().appendTo('#salesperson-table-buttons');
			$('.loading-state').fadeOut('slow');
		} catch (err) {
			alert('Something went wrong\n' + err);
			console.log(err);
		}
	}

	// generate table when daterange is changed
	$('#daterange-btn').daterangepicker({ startDate: START_OF_MONTH, endDate: END_OF_MONTH }, (start, end) => {
		$('.loading-state').fadeIn('slow');
		setTimeout(() => { loadSalespersonTable(salespersonRoleId, start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD')) }, 500);
		$('#daterange-btn span').html(`${start.format('MMM DD, YYYY')} - ${end.format('MMM DD, YYYY')}`);
	});
});