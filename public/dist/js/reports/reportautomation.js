$(document).ready(function() {
	let LCLDB_SALESMONTH, DT_SALESMONTH, LCLDB_SALESWEEK, DT_SALESWEEK, DT_TOPBUYERS, EXPORTSALESMONTH, EXPORTSALESWEEK, EXPORTBUYERS;
	let filenameDate, orderDetailsDate;
	let ORDERDETAILS = [], LCLDB_TOPBUYERS = [];

	const defaultColumn = [
		{ title: 'Date'},
		{ title: 'YTD Sales' },
		{ title: 'YTD Order No.' }
	]

	const defaultColumnTopBuyers = [
		{ title: 'Customer Name'},
		{ title: 'Customer Code' },
		{ title: 'Number of Orders' }
	]

	initFilters();
	initFiltersCustomers();
	$('#ytdmonth-table').DataTable({ destroy : true, data : [], columns: defaultColumn, dom : 'rti' });
	$('#ytdweek-table').DataTable({ destroy : true, data : [], columns: defaultColumn, dom : 'rti' });
	$('#topbuyers-table').DataTable({ destroy : true, data : [], columns: defaultColumnTopBuyers, dom : 'rti' });
	$('.loading-state-salesmonth').fadeOut('slow');
	$('.loading-state-salesweek').fadeOut('slow');

	function loadSalesMonthTable(startDate, endDate) {
		let filterObj = { startDate, endDate }

		loadYtdSalesAndOrder(filterObj, (err, res) => {
			LCLDB_SALESMONTH = res.result;
		});

		let salesdate = `${moment(startDate).format('MMM DD,YYYY')} - ${moment(endDate).format('MMM DD,YYYY')}`
		let monthdata = [{"Date": salesdate, "YTD Sales": LCLDB_SALESMONTH[1].ytdSales, "YTD Order No": LCLDB_SALESMONTH[0].ytdOrderNo}]
		EXPORTSALESMONTH = 
		[
			{"Date": salesdate, "YTD Sales": LCLDB_SALESMONTH[1].ytdSales, "YTD Order No": LCLDB_SALESMONTH[0].ytdOrderNo},
			{"Date": "Total", "YTD Sales": LCLDB_SALESMONTH[1].ytdSales, "YTD Order No": LCLDB_SALESMONTH[0].ytdOrderNo}
		]

		$('.datatable').wrap('<div style="overflow:auto;" />'); // sroll x
		DT_SALESMONTH = $('#ytdmonth-table').DataTable({
			destroy    : true,
			data       : monthdata,
			autoWidth  : false,
			ordering   : false,

			columns: [
				{ data: 'Date', title: 'Date', defaultContent: ' --- ' },
				{ data: 'YTD Sales', title: 'YTD Sales', defaultContent: '', },
				{ data: 'YTD Order No', title: 'YTD Order No.', defaultContent: '', }
			],

			columnDefs: [
				{ targets: 2, className: 'dt-center' },
				{ 
					targets: 1, className: 'dt-right',
					render: (data, type, row) => `SGD ${convertToNumber(data, '2-decimal')}`
				}
			],

			dom: 'rt',
			footerCallback : function (row, data, start, end, display) {
				let api = this.api();
				// Total over all pages
				let sales = api.column(1).data().toArray();
				let orderno = api.column(2).data().toArray();

				$(api.column(1).footer()).html(`SGD ${convertToNumber(sales, '2-decimal')}`)
				$(api.column(2).footer()).html(orderno)
			}
		});

		$('.loading-state-salesmonth').fadeOut('slow');
	}

	function loadSalesWeekTable(startDate, endDate) {
		let filterObj = { startDate, endDate }

		loadYtdSalesAndOrder(filterObj, (err, res) => {
			LCLDB_SALESWEEK = res.result;
		});

		let salesdate = `${moment(startDate).format('MMM DD,YYYY')} - ${moment(endDate).format('MMM DD,YYYY')}`
		let monthdata = [{"Date": salesdate, "YTD Sales": LCLDB_SALESWEEK[1].ytdSales, "YTD Order No": LCLDB_SALESWEEK[0].ytdOrderNo}]
		EXPORTSALESWEEK = 
		[
			{"Date": salesdate, "YTD Sales": LCLDB_SALESWEEK[1].ytdSales, "YTD Order No": LCLDB_SALESWEEK[0].ytdOrderNo},
			{"Date": "Total", "YTD Sales": LCLDB_SALESWEEK[1].ytdSales, "YTD Order No": LCLDB_SALESWEEK[0].ytdOrderNo}
		]

		$('.datatable').wrap('<div style="overflow:auto;" />'); // sroll x
		DT_SALESWEEK = $('#ytdweek-table').DataTable({
			destroy    : true,
			data       : monthdata,
			autoWidth  : false,
			ordering   : false,

			columns: [
				{ data: 'Date', title: 'Date', defaultContent: ' --- ' },
				{ data: 'YTD Sales', title: 'YTD Sales', defaultContent: '', },
				{ data: 'YTD Order No', title: 'YTD Order No.', defaultContent: '', }
			],

			columnDefs: [
				{ targets: 2, className: 'dt-center' },
				{ 
					targets: 1, className: 'dt-right',
					render: (data, type, row) => `SGD ${convertToNumber(data, '2-decimal')}`
				}
			],

			dom: 'rt',
			footerCallback : function (row, data, start, end, display) {
				let api = this.api();
				// Total over all pages
				let sales = api.column(1).data().toArray();
				let orderno = api.column(2).data().toArray();

				$(api.column(1).footer()).html(`SGD ${convertToNumber(sales, '2-decimal')}`)
				$(api.column(2).footer()).html(orderno)
			}
		});

		$('.loading-state-salesweek').fadeOut('slow');
	}

	function loadCustomers(startDate, endDate) {
		let filterObj = { startDate, endDate }

		loadTopBuyers(filterObj, (err, res) => {
			let topBuyers = res.result;

			for (let i in topBuyers) {
				LCLDB_TOPBUYERS.push({
					"Customer Name": topBuyers[i].customerName,
					"Customer Code": topBuyers[i].customerCode,
					"Number of Orders": topBuyers[i].numberOfOrders
				})
			}
		});

		let totalOrders;
		let date = `${moment(startDate).format('MMM DD,YYYY')} - ${moment(endDate).format('MMM DD,YYYY')}`

		$('.datatable').wrap('<div style="overflow:auto;" />'); // sroll x
		DT_TOPBUYERS = $('#topbuyers-table').DataTable({
			destroy    : true,
			data       : LCLDB_TOPBUYERS,
			autoWidth  : false,
			ordering   : false,

			columns: [
				{ data: 'Customer Name', title: 'Customer Name', defaultContent: ' --- ' },
				{ data: 'Customer Code', title: 'Customer Code', defaultContent: '', },
				{ data: 'Number of Orders', title: 'Number of Orders', defaultContent: '', }
			],

			columnDefs: [
				{ targets: 2, className: 'dt-center' },
			],

			dom: 'rt',
			footerCallback : function (row, data, start, end, display) {
				let api = this.api();
				// Total over all pages
				let intVal = ( i ) => { return typeof i === 'string' ? i.replace(/[\$,]/g, '')*1 : typeof i === 'number' ? i : 0; };
				totalOrders = api.column(2).data().reduce((a, b) => { return intVal(a) + intVal(b); }, 0);
				$(api.column(2).footer()).html(totalOrders)
			}
		});

		LCLDB_TOPBUYERS.push({ "Customer Name": "Total", "Customer Code": "",  "Number of Orders": totalOrders})

	}

	// initialize filters
	function initFilters(){
		$('#daterange-btn').daterangepicker({ startDate: moment(), endDate: moment()}, (start, end) => {
			$('#daterange-btn span').text(`${start.format('MMM DD, YYYY')} - ${end.format('MMM DD, YYYY')}`);
			$('#daterange-btn').attr('startDate', start.format('YYYY-MM-DD')).attr('endDate', end.format('YYYY-MM-DD'));
		});
	}

	// initialize filters
	function initFiltersCustomers(){
		$('#daterange-btn-2').daterangepicker({ startDate: moment(), endDate: moment()}, (start, end) => {
			$('#daterange-btn-2 span').text(`${start.format('MMM DD, YYYY')} - ${end.format('MMM DD, YYYY')}`);
			$('#daterange-btn-2').attr('startDate', start.format('YYYY-MM-DD')).attr('endDate', end.format('YYYY-MM-DD'));
		});
	}

	$('#btn-generate').click(function() {
		const startDate = $('#daterange-btn').attr('startDate');
		const endDate = $('#daterange-btn').attr('endDate');

		orderDetailsDate = `${moment(startDate).format('MMM DD,YYYY').slice(0,6)} - ${moment(endDate).format('MMM DD,YYYY')}`

		if (!startDate || !endDate) {
			resultNotify('fa fa-exclamation-circle', 'INVALID', 'All dropdowns are required', 'warning');
			return;
		}

		$('.loading-state-salesmonth').fadeIn('slow');
		setTimeout(() => { loadSalesMonthTable(startDate, endDate) }, 1000);
	});

	$('#btn-generate-2').click(function() {
		const startDate = $('#daterange-btn-2').attr('startDate');
		const endDate = $('#daterange-btn-2').attr('endDate');

		filenameDate = `${moment(startDate).format('MMM DD,YYYY').slice(0,6)} - ${moment(endDate).format('MMM DD,YYYY')}`

		let startDateDetails = startDate;
		let endDateDetails = endDate;

		if (!startDate || !endDate) {
			resultNotify('fa fa-exclamation-circle', 'INVALID', 'All dropdowns are required', 'warning');
			return;
		}

		$('.loading-state-salesweek').fadeIn('slow');
		setTimeout(() => { 
			loadSalesWeekTable(startDate, endDate);
			loadCustomers(startDate, endDate); 
			loadOrderDetails({ startDateDetails, endDateDetails}, (err, res) => {
				let orderDetailsMonth = res.result;

				for (let i in orderDetailsMonth) {
					ORDERDETAILS.push({
						"SAP #": orderDetailsMonth[i].sapNo,
						"OR #": orderDetailsMonth[i].orNo,
						"Item #": orderDetailsMonth[i].itemNo,
						"Date ordered": orderDetailsMonth[i].dateOrdered,
						"status": orderDetailsMonth[i].status,
						"type": orderDetailsMonth[i].type,
						"customer code": orderDetailsMonth[i].customerCode,
						"material code": orderDetailsMonth[i].materialCode,
						"price": orderDetailsMonth[i].price,
						"quantity": orderDetailsMonth[i].quantity,
						"amount": orderDetailsMonth[i].amount
					})
				}
			});
		}, 1000);
	});


	$("#export-btn").click(function(){
		// Export to Excel
		var wb = XLSX.utils.book_new();
		wb.Props = {
			Title: "WOS Report",
			Subject: "WOS Report",
			Author: "BST",
			CreatedDate: moment().format('YYYY-MM-DD')
		};

		var wscols = [ {wch:37}, {wch:15}, {wch:15} ];
		var wscols2 = [ {wch:15}, {wch:15}, {wch:15}, {wch:22}, {wch:15}, {wch:15}, {wch:15}, {wch:15}, {wch:15}, {wch:15} ];
		wb.SheetNames.push("Report");
		var footerBlank = [["", "",""], ["", "",""]];

		// YTD Month
		var ws = XLSX.utils.json_to_sheet(EXPORTSALESMONTH);
		ws['!cols'] = wscols;
		wb.Sheets["Report"] = ws;
		XLSX.utils.sheet_add_aoa(ws, footerBlank, {origin: -1})

		// YTD Week
		XLSX.utils.sheet_add_json(ws, EXPORTSALESWEEK, {origin: -1})
		XLSX.utils.sheet_add_aoa(ws, footerBlank, {origin: -1})

		// Top 5 Buyers
		XLSX.utils.sheet_add_json(ws, LCLDB_TOPBUYERS, {origin: -1})

		// 2nd Page
		let ws_2 = XLSX.utils.json_to_sheet(ORDERDETAILS);
		ws_2['!cols'] = wscols2;
		XLSX.utils.book_append_sheet(wb, ws_2, `${orderDetailsDate}`);

		var wbout = XLSX.write(wb, {bookType:'xlsx', bookSST: true, type: 'binary'});
		function s2ab(s) {
			var buf = new ArrayBuffer(s.length);
			var view = new Uint8Array(buf);
			for (var i=0; i<s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
				return buf;
		}
			saveAs(new Blob([s2ab(wbout)],{type:"application/octet-stream"}), `${filenameDate} (WOS Report).xlsx`);
		});

});