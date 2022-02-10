$(document).ready(function() {
	$('.loading-state').fadeOut('slow');
	var LCLDB_PENDING_ORDER_CREDITLIMIT, LCLDB_PENDING_ORDER_OVERDUE, DT_EXCEED_CREDITLIMIT, DT_EXCEED_OVERDUEPAYMENT;
	loadCreditLimitTable();

	function loadCreditLimitTable() {
		loadPendingOrder_ExceedCreditLimit(function(err, res) {
			LCLDB_PENDING_ORDER_CREDITLIMIT = res;
		});

		DT_EXCEED_CREDITLIMIT = $('#creditlimit-table').DataTable({
			destroy    : true,
			data       : LCLDB_PENDING_ORDER_CREDITLIMIT,
			autoWidth  : false,
			scrollX    : true,
			lengthMenu : [[10, 25, 50, -1], [10, 25, 50, "All"]],
			pageLength : 10,

			columns  :
			[
				{data: 'requestedDate'},
				{data: 'requestedTime'},
				{data: 'customerCode'},
				{data: 'customerName'},
				{data: 'materialCode'},
				{data: 'quantity'},
				{data: 'amount'}
			], 

			columnDefs: 
			[
				{
					className : 'dt-center', 
					targets   : [0, 1, 2, 4, 5]
				},
				{
					className : 'dt-right', 
					targets   : 6
				},
			],

			dom: 	
				'<"row" <"col-lg-3 date-range-container-credit">'+
				'<"col-lg-2"B> <"col-lg-7"f>>rt'+
				'<"col-lg-6"i><"col-lg-6"p>',

			buttons: [
				{ "extend": 'excel', "text":'<span style="color: white;"><i class="fa fa-file-excel-o"></i> Excel</span>',"className": 'btn btn-success btn-sm' },
			    { "extend": 'pdf', "text":'<span style="color: white;"><i class="fa fa-file-pdf-o"></i> PDF</span>',"className": 'btn btn-danger btn-sm' }
			],

			rowCallback : function (row, data, iDataIndex) { $(row).attr('id', data['id']); }
		});

		$('.date-range-container-credit').html( '<div class="date-range-div-credit" id="creditDaterange-btn" style="background: #fff; cursor: pointer; padding: 5px 10px; border: 1px solid #ccc; text-align: center; width: 100%">'+
													'<i class="fa fa-calendar pull-left"></i> &nbsp;'+
													'<span></span> <i class="fa fa-caret-down pull-left"></i>'+
												'</div>');

		$('#creditDaterange-btn').daterangepicker({
			opens: "right",
			startDate: moment(),
			endDate: moment()
		}, function (start, end) {
			if (start.format('MMM D, YYYY') == end.format('MMM D, YYYY')) {
				$('#creditDaterange-btn span').html(start.format('MMM D, YYYY'));
			}else {
				$('#creditDaterange-btn span').html(start.format('MMM D, YYYY') + ' - ' + end.format('MMM D, YYYY'));
			}

			$('#creditDaterange-btn').attr('startDate', start.format('MM/DD/YYYY')).attr('endDate', end.format('MM/DD/YYYY'));
			$('.loading-state-disable').show();
		});

		$('#creditDaterange-btn span').html(moment().format('MMMM D, YYYY'));
		$('.loading-state').fadeOut('slow');
	}

	function loadOverdueTable() {
		loadPendingOrder_ExceedOverduePayment(function(err, res) {
			LCLDB_PENDING_ORDER_OVERDUE = res;
		});

		DT_EXCEED_OVERDUEPAYMENT = $('#overdue-table').DataTable({
			destroy        : true,
			data           : LCLDB_PENDING_ORDER_OVERDUE,
			autoWidth      : false,
			scrollX        : true,
			scrollY        : '350px',
			scrollCollapse : true,
			lengthMenu     : [[10, 25, 50, -1], [10, 25, 50, "All"]],
			pageLength     : 10,

			columns  :
			[
				{data: 'requestedDate'},
				{data: 'requestedTime'},
				{data: 'customerCode'},
				{data: 'customerName'},
				{data: 'materialCode'},
				{data: 'quantity'},
				{data: 'amount'}
			], 

			columnDefs: 
			[
				{
					className : 'dt-center', 
					targets   : [0, 1, 2, 4, 5]
				},
				{
					className : 'dt-right', 
					targets   : 6
				},
			],

			dom: 	
				'<"row" <"col-lg-3 date-range-container-overdue">'+
				'<"col-lg-2"B> <"col-lg-7"f>>rt'+
				'<"col-lg-6"i><"col-lg-6"p>',

			buttons: [
				{ "extend": 'excel', "text":'<span style="color: white;"><i class="fa fa-file-excel-o"></i> Excel</span>',"className": 'btn btn-success btn-sm' },
			    { "extend": 'pdf', "text":'<span style="color: white;"><i class="fa fa-file-pdf-o"></i> PDF</span>',"className": 'btn btn-danger btn-sm' }
			],

			rowCallback : function (row, data, iDataIndex) { $(row).attr('id', data['id']); }
		});

		$('.date-range-container-overdue').html('<div class="date-range-div-overdue" id="overdueDaterange-btn" style="background: #fff; cursor: pointer; padding: 5px 10px; border: 1px solid #ccc; text-align: center; width: 100%">'+
													'<i class="fa fa-calendar pull-left"></i> &nbsp;'+
													'<span></span> <i class="fa fa-caret-down pull-left"></i>'+
												'</div>');

		$('#overdueDaterange-btn').daterangepicker({
			opens: "right",
			startDate: moment(),
			endDate: moment()
		}, function (start, end) {
			if (start.format('MMM D, YYYY') == end.format('MMM D, YYYY')) {
				$('#overdueDaterange-btn span').html(start.format('MMM D, YYYY'));
			} else {
				$('#overdueDaterange-btn span').html(start.format('MMM D, YYYY') + ' - ' + end.format('MMM D, YYYY'));
			}

			$('#overdueDaterange-btn').attr('startDate', start.format('MM/DD/YYYY')).attr('endDate', end.format('MM/DD/YYYY'));
			$('.loading-state-disable').show();
		});

		$('#overdueDaterange-btn span').html(moment().format('MMMM D, YYYY'));
		$('.loading-state').fadeOut('slow');
	}

	$('ul.dropdown-menu li').click(function(){
		var selected = $(this).text();
		var currentSelected = $(this).parent().siblings('button').find('span.selected').text();
		$(this).parent().siblings('button').find('span.selected').text(selected);

		if (selected != currentSelected) {
			var dataAccess = $(this).attr('data-access');
			$('.loading-state').fadeIn('slow');

			if (dataAccess == 'credit-limit'){
				setTimeout( function() {loadCreditLimitTable();} , 1000)
			} else {
				setTimeout( function() {loadOverdueTable();} , 1000)
			}
		}
	});

	
});