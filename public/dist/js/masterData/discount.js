checkSession();
setUserData();

$(document).ready(function() {
	let LCLDB_CHANNEL, DT_CHANNEL, LCLDB_FACTORY, DT_FACTORY, LCLDB_MOQ, DT_MOQ, LCLDB_TIMELIMITED, DT_TIMELIMITED;
	const config = {
		// db : 'offline'
		db : 'couchbase'
	};

	loadChannelTable();

	// load channel discount table
	function loadChannelTable() {

		channelDiscount((err, res) => {
			LCLDB_CHANNEL = res.result;
			console.log(LCLDB_CHANNEL)
		});

		DT_CHANNEL = $('#channel-table').DataTable({
			destroy        : true,
			data           : LCLDB_CHANNEL,
			autoWidth      : false,
			scrollX        : true,
			scrollY        : 350,
			scrollCollapse : true,
			deferRender    : true,
			scroller       : true,
			dom            : 'rti',

			columns: [
				{ data: 'customerCode' },
				{ data: 'customerName' },
				{ data: 'PSRdescription' },
				{ data: 'PSRdiscount' },
				{ data: 'TBRdescription' },
				{ data: 'TBRdiscount' }
			],

			columnDefs: [
				{ targets: [0, 3, 5], className: 'dt-center' },
			],
		});

		$('#channel-table-filter').keyup(function(){
		    DT_CHANNEL.search($(this).val()).draw() ;
		});

		$('.loading-state').fadeOut('slow');
	}

	// load factory discount table
	function loadFactoryTable() {

		factoryDiscount((err, res) => {
			LCLDB_FACTORY = res.result;
			console.log(LCLDB_FACTORY)
		});

		DT_FACTORY = $('#factory-table').DataTable({
			destroy        : true,
			data           : LCLDB_FACTORY,
			autoWidth      : false,
			scrollX        : true,
			scrollY        : 350,
			scrollCollapse : true,
			deferRender    : true,
			scroller       : true,
			dom            : 'rti',

			columns: [
				{ data: 'materialCode', title: 'Material code', defaultContent: '' },
				{ data: 'discount', title: 'Discount %' },
				{ data: 'validFrom', title: 'Start Date', defaultContent: '' },
				{ data: 'validTo', title: 'End Date', defaultContent: '' }
			],

			columnDefs: [
				{ targets: [2, 3], render: (data, type, row) => moment(data).format('MMM DD, YYYY') },
			]
		});

		$('#factory-table-filter').keyup(function(){
		    DT_FACTORY.search($(this).val()).draw() ;
		});

		$('.loading-state').fadeOut('slow');
	}

	// load moq discount table
	function loadMoqTable() {

		moqDiscount((err, res) => {
			LCLDB_MOQ = res.result;
			console.log(LCLDB_MOQ)
		});

		DT_MOQ = $('#moq-table').DataTable({
			destroy        : true,
			data           : LCLDB_MOQ,
			autoWidth      : false,
			scrollX        : true,
			scrollY        : 350,
			scrollCollapse : true,
			deferRender    : true,
			scroller       : true,
			dom            : 'rti',

			columns: [
				{ data: 'discount', title: 'Discount %' },
				{ data: 'validFrom', title: 'Start Date', defaultContent: '' },
				{ data: 'validTo', title: 'End Date', defaultContent: '' }
			],

			columnDefs: [
				{ targets: [1, 2], render: (data, type, row) => moment(data).format('MMM DD, YYYY') },
			]
		});

		$('#moq-table-filter').keyup(function(){
		    DT_MOQ.search($(this).val()).draw() ;
		});

		$('.loading-state').fadeOut('slow');
	}

	// load timelimited discount table
	function loadTimeLimitedTable() {

		timeLimitedDiscount((err, res) => {
			LCLDB_TIMELIMITED = res.result;
			console.log(LCLDB_TIMELIMITED)
		});

		DT_TIMELIMITED = $('#time-limited-table').DataTable({
			destroy        : true,
			data           : LCLDB_TIMELIMITED,
			autoWidth      : false,
			scrollX        : true,
			scrollY        : 350,
			scrollCollapse : true,
			deferRender    : true,
			scroller       : true,
			dom            : 'rti',

			columns: [
				{ data: 'materialCode', title: 'Material code', defaultContent: '' },
				{ data: 'psrtbrChannel', title: 'PSR/TBR Channel', defaultContent: '' },
				{ data: 'minimumQuantity', title: 'Minimum quantity', defaultContent: '' },
				{ data: 'discount', title: 'Discount %' },
				{ data: 'validFrom', title: 'Start Date', defaultContent: '' },
				{ data: 'validTo', title: 'End Date', defaultContent: '' }
			],

			columnDefs: [
				{ targets: [4, 5], render: (data, type, row) => moment(data).format('MMM DD, YYYY') },
			]
		});

		$('#time-limited-table-filter').keyup(function(){
		    DT_TIMELIMITED.search($(this).val()).draw() ;
		});

		$('.loading-state').fadeOut('slow');
	}

	// tabs navigate
	$('.nav-tabs > li a[data-toggle="tab"]').click(function() {
		const action = $(this).attr('data-action');
		switch(action) {
			case 'channel':
				$('.loading-state:eq(0)').fadeIn('slow');
				setTimeout(() => { loadChannelTable(); }, 1000);
			break;
			case 'moq':
				$('.loading-state:eq(1)').fadeIn('slow');
				setTimeout(() => { loadMoqTable(); }, 1000);
			break;
			case 'factory':
				$('.loading-state:eq(2)').fadeIn('slow');
				setTimeout(() => { loadFactoryTable(); }, 1000);
			break;
			case 'timelimited':
				$('.loading-state:eq(3)').fadeIn('slow');
				setTimeout(() => { loadTimeLimitedTable(); }, 1000);
			break;
		}
	});

});