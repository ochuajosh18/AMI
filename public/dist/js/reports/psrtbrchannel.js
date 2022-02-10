$(document).ready(function() {
	let DT_SALES;
	const config = {
	    // db : 'offline'
	    db : 'couchbase'
	};
	const defaultColumn = [{ title: 'Channel'}, { title: 'Customer code' }, { title: 'Customer name' }, { title: 'Quantity', defaultContent: '', width: 50 }]

	initFilters();
	$('#sales-table').DataTable({ destroy : true, data : [], columns: defaultColumn, dom : 'rti', ordering : false });
	$('.loading-state').fadeOut('slow');
	// loadSalesTable("2018-11-01", "2018-11-31", ["PSR","TBR"], ["00000001","00000002"])

	// load sales table
	function loadSalesTable(startDate, endDate, materialGroup, salesperson) {
		try {
			let data, end = false;
			let filtersObj = { startDate, endDate, materialGroup, salesperson, orderStatus: 'confirmed' } // console.log(JSON.stringify(filtersObj));

			if (config.db == 'couchbase') {
				psrtbrChannelReport(filtersObj, (err, res) => {
					if (err || res.statusCode >= 300) {
						alert('Unable to load orders');
						end = true;
					} else if (res.statusCode <= 299) data =  res.result;
				});
			}

			if (end) throw new Error('Unable to load orders');

			let magicData = data.slice();
			let channelChecker = [], subTotal = 0, grandTotal = 0;
			for (let i in data) {
				let nextIndex = parseInt(i)+1;
				// console.log(i + ' - - - - -');
				// console.log('Current : ' + data[i].channel);
				// head
				if (channelChecker.indexOf(data[i].channel) == -1) { // if this channel is its 1st occurence
					channelChecker.push(data[i].channel);
					data[i].isHead = true;
					data[i].channelShow = data[i].channel;
					// console.log('HEAD ' + data[i].channel);
				} else { // if this channel aleady occured
					data[i].channelShow = null;
				}

				subTotal += parseInt(data[i].total); // sum subtotal by channel
				grandTotal += parseInt(data[i].total);

				if (nextIndex != data.length) { // if next is not end of array
					// console.log('Next    : ' + data[nextIndex].channel);

					if (data[i].channel != data[nextIndex].channel) { // if next is new channel
						// console.log('CREATE MAGIC ROW FOOT');
						// console.log('FOOT ' + data[i].channel);
						let toadd = magicData.length - data.length;
						magicData.splice(nextIndex + toadd, 0, {
							channelShow : data[i].channel,
							isFoot  : true,
							total : subTotal
						});
						subTotal = 0;
					}
				} else { // if next is end
					// console.log('Next    : None');
					// console.log('CREATE MAGIC ROW');
					magicData.push({
						channelShow : data[i].channel,
						isFoot  : true,
						total : subTotal
					});
				}
			}

			DT_SALES = $('#sales-table').DataTable({
				destroy        : true,
				data           : magicData,
				autoWidth      : false,
				ordering       : false,
				scrollX        : true,
				scrollY        : 350,
				scrollCollapse : true,
				deferRender    : true,
				scroller       : true,
				dom            : 'rt',

				columns: [
					{ data: 'channelShow', title: 'Channel', defaultContent: '' },
					{ data: 'customerCode', title: 'Customer code', defaultContent: '', width: 70 },
					{ data: 'customerName', title: 'Customer name', defaultContent: '' },
					{ data: 'total', title: 'Quantity', defaultContent: '', width: 50 }
				],
				columnDefs: [
					{ targets: 1, className: 'dt-center' },
					{
						targets: 3, className: 'dt-right',
						render: (data, type, row) => (row.isFoot) ? `<b>${data}</b>` : data
					},
					{
						targets: 0,
						render: (data, type, row) => {
							if (row.isHead) return `<b>${data}</b>`;
							else if (row.isFoot) return `<b>${data} Total</b>`;
							else return data;
						}
					}
				],
				buttons: [
					{
						extend    : 'excel',
						text      : '<span style="color: white; font-weight: bolder;"><i class="fa fa-file-excel-o"></i> Excel</span>',
						title     : 'PSR & TBR Channel',
				    	filename  : `PSR TBR Channel ${moment().format('MM-DD-YYYY')}`,
						className : 'btn btn-warning btn-sm btn-flat',
						footer    : true
					},
				    {
				    	extend    : 'pdf',
				    	text      : '<span style="color: white; font-weight: bolder;"><i class="fa fa-file-pdf-o"></i> PDF</span>',
				    	title     : 'PSR & TBR Channel',
				    	filename  : `PSR TBR Channel ${moment().format('MM-DD-YYYY')}`,
				    	className : 'btn btn-warning btn-sm btn-flat',
				    	footer    : true
				    }
				],
				rowCallback : (row, data, iDataIndex) => {
					$(row).attr('id', data['id']);
					if (data.isFoot) $(row).addClass('bg-gray');
				},
				footerCallback : function (row, data, start, end, display) {
					let api = this.api();
					$(api.column(3).footer()).html(convertToNumber(grandTotal, 'whole'))
				}
			});

			DT_SALES.buttons().container().appendTo('#sales-table-buttons');
			$('.loading-state').fadeOut('slow');
		} catch (err) {
			alert('Something went wrong\n' + err);
			console.log(err);
		}
	}

	// generate salesperson dropdown options
	function salespersonDropdown() {
		try {
			const salesRoleId = role_localdata.SALESPERSON;

			let salespersons;

			loadSalespersonUser({ salesRoleId }, (err, res) => {
				if (res.statusCode <= 299) {
					salespersons = res.result;
					$('#salesperson-dropdown ul.dropdown-menu').html(`<li><a href="#" class="select-all"><div class="checkbox"><label><input type="checkbox"> All</label></div></a></li>`);
					for (let i in salespersons) $('#salesperson-dropdown ul.dropdown-menu').append(`<li><a href="#"><div class="checkbox"><label><input type="checkbox" data-value="${salespersons[i].customerCode}"> <b>${salespersons[i].customerCode}</b> - ${salespersons[i].accountName}</label></div></a></li>`);
				}
			});
		} catch (err) {
			alert('Something went wrong\n' + err);
			console.log(err);
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

	// initialize filters
	function initFilters(){
		$('#daterange-btn').daterangepicker({ startDate: moment(), endDate: moment()}, (start, end) => {
			$('#daterange-btn span').text(`${start.format('MMM DD, YYYY')} - ${end.format('MMM DD, YYYY')}`);
			$('#daterange-btn').attr('startDate', start.format('YYYY-MM-DD')).attr('endDate', end.format('YYYY-MM-DD'));
		});
		salespersonDropdown();
		materialGroupDropdown();

		$('ul.dropdown-menu a').off('click').on('click', function() { $(this).closest('.dropdown').addClass('open'); }); // keep dropdown open
		$('.dropdown ul.dropdown-menu a.select-all input[type="checkbox"]').change(function(event) { // select all checkbox
			let checkboxes = $(this).closest('.dropdown-menu').find('input[type="checkbox"]')
			if (this.checked != true) checkboxes.prop('checked', false);
			else checkboxes.prop('checked', true);
		});
	}

	// get data of dropdown checkboxes
	function getDataSelected(dropdown) {
		let data = [];
		$(`#${dropdown} input[type="checkbox"]:checked`).each(function(index, el) {
			let item = $(this).attr('data-value');
			if (item) data.push(item);
		});

		return data;
	}

	// generate table
	$('#btn-generate').click(function() {
		const materialGroups = getDataSelected('material-group-dropdown');
		const salespersons = getDataSelected('salesperson-dropdown');
		const startDate = $('#daterange-btn').attr('startDate');
		const endDate = $('#daterange-btn').attr('endDate');

		if (!materialGroups.length || !salespersons.length || !startDate || !endDate) {
			resultNotify('fa fa-exclamation-circle', 'INVALID', 'All dropdowns are required', 'warning');
			return;
		}

		$('.loading-state').fadeIn('slow');
		setTimeout(() => { loadSalesTable(startDate, endDate, materialGroups, salespersons) }, 1000);
	});
});