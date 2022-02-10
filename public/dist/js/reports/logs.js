$(document).ready(function() {
	let LCLDB_LOGS, DT_LOGS;
	let LOCAL_STORAGE = JSON.parse(localStorage.getItem("userData"));
	const START_OF_MONTH = moment().startOf('month'), END_OF_MONTH = moment().endOf('month');

	$('#daterange-btn span').html(`${START_OF_MONTH.format('MMM DD, YYYY')} - ${END_OF_MONTH.format('MMM DD, YYYY')}`);
	loadLogsTable(START_OF_MONTH.format('YYYY-MM-DD'), moment(END_OF_MONTH).add(1, 'days').format('YYYY-MM-DD'));

	$('.loading-state').fadeOut('slow');

	function loadLogsTable(startDate, endDate) {
		loadLogs({ startDate, endDate }, (err, res) => {
			LCLDB_LOGS = res.result;
			console.log(LCLDB_LOGS)
		});

		DT_LOGS = $('#logs-table').DataTable({
			destroy        : true,
			data           : LCLDB_LOGS,
			order          : [[0, 'desc']], 
			autoWidth      : false,
			scrollX        : true,
			scrollY        : 300,
			scrollCollapse : true,
			deferRender    : true,
			scroller       : true,
			lengthChange   : false,
			dom            : 'rti',

			columns: [
				{ data: 'dateCreated', width: 100 },
				{ data: 'userName', defaultContent: 'none' },
				{ data: 'action' },
				{ data: 'app', width: 50 },
				{ data: 'module', width: 100 }
			], 

			columnDefs: [
				{
					targets: 3, className: 'dt-center',
					render: (data, type, row) => (data == 'WOS') ? `<span class="label label-warning"><b> ${data} </b></span>` : `<span class="label label-primary"><b> ${data} </b></span>`
				},
				{
					targets: 0,
					render: (data, type, row) => moment(row.dateCreated).format('YYYY-MM-DD hh:mm A'),
				}
			],

			buttons: [
				{ 
					extend: 'excel',
					text: '<span style="color: white; font-weight: bolder;" id="btn-excel"><i class="fa fa-file-excel-o"></i> Excel</span>', 
					title : `Log History ${moment().format('MM-DD-YYYY')}`,
			    	filename : `Log History ${moment().format('MM-DD-YYYY')}`,
					className: 'btn btn-warning btn-sm btn-flat' 
				},
			    { 
			    	extend: 'pdf',
			    	text: '<span style="color: white; font-weight: bolder;" id="btn-pdf"><i class="fa fa-file-pdf-o"></i> PDF</span>', 
			    	title : `Log History ${moment().format('MM-DD-YYYY')}`,
			    	filename : `Log History ${moment().format('MM-DD-YYYY')}`,
			    	className: 'btn btn-warning btn-sm btn-flat' 
			    }
			],

			rowCallback: (row, data, iDataIndex) => { $(row).attr('id', data['id']); }
		});

		// custom table and search
		DT_LOGS.buttons().container().appendTo('#logs-table-buttons');
		$('#txtSearchLogs').keyup(function(){ DT_LOGS.search($(this).val()).draw(); })

		$('.loading-state').fadeOut('slow');
	}

	// generate table when daterange is changed
	$('#daterange-btn').daterangepicker({ startDate: START_OF_MONTH, endDate: END_OF_MONTH }, (start, end) => {
		$('.loading-state').fadeIn('slow');
		let startDate = moment(start.toISOString()).format('YYYY-MM-DD');
		let endDate = moment(end).add(1, 'days').format("YYYY-MM-DD");

		setTimeout(() => { loadLogsTable(startDate, endDate) }, 500);
		$('#daterange-btn span').html(`${start.format('MMM DD, YYYY')} - ${end.format('MMM DD, YYYY')}`);
	});
		
});