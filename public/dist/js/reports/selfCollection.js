$(document).ready(function() {
	$('.loading-state').fadeOut('slow');
	var LCLDB_SELF_COLLECTION, DT_SELF_COLLECTION;
	loadSelfCollectionTable();

	$('#daterange-btn span').html(moment().format('MMMM D, YYYY'));

	function loadSelfCollectionTable() {
		loadSelfCollection_Report(function(err, res) {
			LCLDB_SELF_COLLECTION = res;
			console.log(res)
		});

		DT_SELF_COLLECTION = $('#selfcollection-table').DataTable({
			destroy    : true,
			data       : LCLDB_SELF_COLLECTION,
			autoWidth  : false,
			scrollX    : true,
			lengthMenu : [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]],
			pageLength : 10,

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

			dom: 	
				'<"row" <"col-lg-3 date-range-container">'+
				'<"col-lg-2"B> <"col-lg-7"f>>rt'+
				'<"col-lg-6"i><"col-lg-6"p>',

			buttons: [
				{ "extend": 'excel', "text":'<span style="color: white;"><i class="fa fa-file-excel-o"></i> Excel</span>',"className": 'btn btn-success btn-sm' },
			    { "extend": 'pdf', "text":'<span style="color: white;"><i class="fa fa-file-pdf-o"></i> PDF</span>',"className": 'btn btn-danger btn-sm' }
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
		startDate: moment(),
		endDate: moment()
	}, function (start, end) {
		if (start.format('MMM D, YYYY') == end.format('MMM D, YYYY')) {
			$('#daterange-btn span').html(start.format('MMM D, YYYY'));
		}else {
			$('#daterange-btn span').html(start.format('MMM D, YYYY') + ' - ' + end.format('MMM D, YYYY'));
		}

		$('#daterange-btn').attr('startDate', start.format('MM/DD/YYYY')).attr('endDate', end.format('MM/DD/YYYY'));
		$('.loading-state-disable').show();
	});

	
});