$(document).ready(function() {
	$('.loading-state').fadeOut('slow');
	var LCLDB_DELIVERY_SCHEDULE, DT_DELIVERY_SCHEDULE;

	loadDeliveryScheduleTable();
	$('#daterange-btn span').html(moment().format('MMM D, YYYY'));

	function loadDeliveryScheduleTable() {
		loadDelivery_Report(function(err, res) {
			LCLDB_DELIVERY_SCHEDULE = res;
		});

		DT_DELIVERY_SCHEDULE = $('#delivery-schedule-table').DataTable({
			destroy        : true,
			data           : LCLDB_DELIVERY_SCHEDULE,
			autoWidth      : false,
			scrollX        : true,
			scrollY        : 300,
			scrollCollapse : true,
			deferRender    : true,
			scroller       : true,
			lengthChange   : false,

			columns  :
			[
				{data: 'requestedDate'},
				{data: 'requestedTime'},
				{data: 'customerCode'},
				{data: 'customerName'},
				{data: 'materialCode'},
				{data: 'quantity', defaultContent: '0'},
				{data: '', defaultContent: ' --- '}
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

			dom: '<"row" <"col-lg-2 date-range-container">'+ // date range
				 '<"col-lg-2"B> <"col-lg-8"f>>rt'+ // button
				 '<"col-lg-6"i>',

			buttons: [
				{ "extend": 'excel', "text":'<span style="color: white; font-weight: bolder;"><i class="fa fa-file-excel-o"></i> Excel</span>',"className": 'btn btn-success btn-sm' },
			    { "extend": 'pdf', "text":'<span style="color: white; font-weight: bolder;"><i class="fa fa-file-pdf-o"></i> PDF</span>',"className": 'btn btn-danger btn-sm' }
			],

			rowCallback : function (row, data, iDataIndex) { $(row).attr('id', data['id']); }
		});

		$('.date-range-container').html('<div class="date-range-div" id="daterange-btn" style="background: #fff; cursor: pointer; padding: 5px 10px; border: 1px solid #ccc; text-align: center; width: 100%">'+
											'<i class="fa fa-calendar pull-left"></i> &nbsp;'+
											'<span></span> <i class="fa fa-caret-down pull-left"></i>'+
										'</div>');

		$('.loading-state').fadeOut('slow');
	}

	$('#daterange-btn').daterangepicker({
		opens: "right",
		singleDatePicker: true,
		showDropdowns: true,
		startDate: moment(),
		endDate: moment()
	}, function (start, end) {
		$('#daterange-btn span').html(start.format('MMM D, YYYY'));

		$('#daterange-btn').attr('startDate', start.format('MM/DD/YYYY')).attr('endDate', end.format('MM/DD/YYYY'));
		$('.loading-state-disable').show();
	});
});