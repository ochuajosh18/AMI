$(document).ready(function() {
	let DT_ORDER, LCLDB_ORDER;
	const config = {
		db : 'couchbase'
	};

	$('#buttons').hide();

	loadOrdersTable();


	function loadOrdersTable() {
		let data;

		if (config.db == 'couchbase') {
			loadAllOrders(function(err, res){
				try {
					if (res instanceof Array) {
						LCLDB_ORDER = res;
						data = LCLDB_ORDER;
					} else {
						throw 'Unable to get order list';
					}
				} catch (err) {
					alert('Something went wrong\n' + err);
					console.log(err);
					console.log(res);
				}
			});
		} else {
			data = offlineDB;
		}

		if (data) {
			$.fn.dataTable.moment('DD-MMM-YYYY'); // sort by date

			DT_ORDER = $('#orders-table').DataTable({
				destroy        : true,
				data           : data,
				order          : [1, 'asc'],
				autoWidth      : false,
				scrollX        : true,
				scrollY        : 300,
				scrollCollapse : true,
				deferRender    : true,
				scroller       : true,
				lengthChange   : false,
				dom            : "rti",

				columns  :
				[
					{data: 'salesOrderNoSAP', defaultContent: ''},
					{data: 'salesOrderNo'},
					{data: 'salesOrderItemNo', width: '50'},
					{data: 'dateCreated', width: '70'},
					{data: 'orderItemStatus', width: '70'},
					{data: 'orderType', width: '70'},
					{data: 'customerCode', width: '70'},
					{data: 'materialCode', width: '70'},
					{data: 'price', width: '50'},
					{data: 'quantity', width: '50', defaultContent: ''},
					{data: 'amount', width: '50'}, // , width: '50'
				], 

				columnDefs: 
				[
					{
						className : 'dt-center', 
						targets   : [0, 1, 2, 3, 4, 9]
					},
					{
						className : 'dt-right', 
						targets   : [8, 10]
					},
					{ 
						className : 'input-filtering', 
						targets   : [0, 1]
					},
					{ 
						className : 'select-filtering', 
						targets   : [4]
					},
					{ 
						className : 'date-filtering', 
						targets   : [3]
					},
					{ // salesorder no
						orderData : [1, 2],
						targets   : 1
					},
					{ // sap no, salesorder no
						render: function (data, type, row) { 
							data = (data) ? data : '';
							return '<b>' + data + '</b>';
						},
						targets : [0, 1]
					},
					{ // date created
						render: function (data, type, row) {
							return moment(data).format('DD-MMM-YYYY');
						},
						targets : 3
					},
					{ // orderstatus
						render: function (data, type, row) {
							switch(data) {
								case 'confirmed':
								case 'scheduled':
								case 'invoiced':
									return '<span class="text-green"><b>'+data+'</b></span>'
								break;

								case 'rejected':
								case 'cancelled':
									return '<span class="text-red"><b>'+data+'</b></span>'
								break;

								default: return '<span class="text-orange"><b>'+data+'</b></span>'
							}
						},
						targets : 4
					},
					{ // price, amount
						render: function (data, type, row) { 
							return convertToNumber(data, '2-decimal'); 
						},
						targets : [8, 10]
					},
					{ // quantity
						render: function (data, type, row) {
							data = (data) ? data : 0;
							return '<span class="badge bg-light-blue">'+data+'</span>';
						},
						targets : 9
					},
				],

				buttons: [
					{ // excel
						extend    : 'excel',
						text      :'<span style="color: white; font-weight: bolder;" id="btn-excel"><i class="fa fa-file-excel-o"></i> Excel</span>', 
						title     : 'BST WOS Orders ' + moment().format('DD-MMM-YYYY'),
				    	filename  : 'BST WOS Orders ' + moment().format('DD-MMM-YYYY'),
						className : 'btn btn-warning btn-sm btn-flat',
				    	exportOptions : {
				    		columns : ':visible',
				    		rows    : ':visible'
				    	} 
					},
				    { // pdf
				    	extend        : 'pdf',
				    	text          :'<span style="color: white; font-weight: bolder;" id="btn-pdf"><i class="fa fa-file-pdf-o"></i> PDF</span>', 
				    	title         : 'BST WOS Orders ' + moment().format('DD-MMM-YYYY'),
				    	filename      : 'BST WOS Orders ' + moment().format('DD-MMM-YYYY'),
				    	className     : 'btn btn-warning btn-sm btn-flat',
				    	exportOptions : {
				    		columns : ':visible',
				    		rows    : ':visible'
				    	}
				    },
				    { //colvis
				    	extend: 'colvis',
				    	text:'<span style="color: white; font-weight: bolder;" id="btn-pdf"><i class="fa fa-eye-slash"></i> Toggle column</span>', 
				    	className: 'btn btn-warning btn-sm btn-flat' 
				    }
				],

				// select : { 
				// 	'style'    : 'multi'
				// },

				rowCallback : function (row, data, iDataIndex) {
					$(row).attr('id', data.id);
				},
				initComplete : function(settings, json) {}
			});

			// create elements for filtering
			$('#orders-table thead th').each( function (index, el) {
				let title = $(this).text();

				if ($(this).hasClass('input-filtering')) {
					$('<div class="col-lg-2"><div class="input-group">'+
						'<span class="input-group-addon small-font"><b>'+title+'</b></span>'+
						'<input type="text" data-column="'+index+'" class="form-control input-sm input-filtering" placeholder="Search '+title+'" />'+
					  '</div></div>').appendTo('#extreme');
				}  else if ($(this).hasClass('select-filtering')) {
					let column = DT_ORDER.column(index);
					let select =
					$('<div class="col-lg-2"><div class="input-group">'+
						'<span class="input-group-addon small-font"><b>'+title+'</b></span>'+
						'<select class="form-control input-sm select-filtering "  data-column="'+index+'"><option value="">Select status</option></select>'+
					  '</div></div>').appendTo('#extreme');

					column.data().unique().sort().each( function ( d, j ) {
						select.find('select').append('<option value="'+d+'">'+d+'</option>')
					});
				} else if ($(this).hasClass('date-filtering')) {
					$('<div class="col-lg-2"><div class="input-group date">'+
						'<span class="input-group-addon small-font"><b>'+title+'</b></span>'+
						'<input type="text" class="form-control input-sm date-filtering datepicker" data-column="'+index+'" placeholder="Search '+title+'">'+
					  '</div></div>').appendTo('#extreme');
				}
			});

			$('#extreme .input-filtering').each(function(index, el) {
				$(this).on('keyup change', function(){
					let colIndex = $(this).attr('data-column');
					let column = DT_ORDER.columns(colIndex);
					if (column.search() !== this.value) {
						column.search(this.value).draw();
					}
				});
			});

			$('#extreme .date-filtering').each(function(index, el) {
				$(this).datepicker( {
					autoclose : true,
					format: 'M, yyyy',
					viewMode: 'months', 
					minViewMode: 'months'
				}).on('keyup changeDate', function() {
					let colIndex = $(this).attr('data-column');
					let column = DT_ORDER.columns(colIndex);
					let date = (this.value) ? moment(this.value).format('MMM-YYYY') : '';

					column.search(date).draw();
				});
			});

			$('#extreme .select-filtering').each(function(index, el) {
				$(this).on('change', function(){
					let colIndex = $(this).attr('data-column');
					let column = DT_ORDER.columns(colIndex);

					column.search(this.value).draw();
				});
			});

			DT_ORDER.buttons().container().appendTo('#buttons');
		}

		$('.loading-state').fadeOut('slow');
	}

	$('#table-tools button').click(function(event) {
		let btnText = $(this).text().trim();
		
		if (btnText == 'Filter') {
			$('#buttons').slideUp('slow');
			setTimeout(function(){ $('#extreme').slideDown('slow'); }, 500);

			$(this).toggleClass('btn-primary btn-default');
			$(this).siblings().toggleClass('btn-primary btn-default');
		} else if (btnText == 'Eport') {
			$('#extreme').slideUp('slow');
			setTimeout(function(){ $('#buttons').slideDown('slow'); }, 500);

			$(this).toggleClass('btn-primary btn-default');
			$(this).siblings().toggleClass('btn-primary btn-default');
		}
	});
});