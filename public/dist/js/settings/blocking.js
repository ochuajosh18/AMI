checkSession();
setUserData();

$(document).ready(function() {
	let LCLDB_MATERIAL, LCLDB_CUSTOMER = customerList, CUSTOMER_COUNT = LCLDB_CUSTOMER.length;
	let DT_MATERIAL, DT_BLOCK, DT_BLOCK_CHECK, DT_CUSTOMER_LIST, DT_CUSTOMER_BLOCK;
	const config = {
		// db : 'offline'
		db : 'couchbase'
	};

	loadMaterialTable();
	// magic
	// setTimeout(() => { $('a[data-action="block-date"]').click(); }, 500);//1000
	// setTimeout(() => { 
	//   DT_BLOCK.row(':eq(0)').select();
	//   DT_BLOCK.row(':eq(1)').select();
	//   $('#block-date-modal-show').click(); 
	//   // setTimeout(() => { $('#block-date-btn').click();  }, 1000);
	// }, 2000);

	// load material page
	function loadMaterialTable() {
		let data;

		if (config.db == 'couchbase') {
			loadMaterialBlock((err, res) => {
				data = res;
				LCLDB_MATERIAL = res;
				config.db = 'local';
			});
		} else if (config.db == 'offline') {
			data = offlineDB;
			LCLDB_MATERIAL = offlineDB;
		} else if (config.db == 'local') {
			data = LCLDB_MATERIAL;
		}

		data = removeduplicate_2(data, 'size', 'oldMaterialNumber');
		// console.log(data);
		DT_MATERIAL = $('#material-table').DataTable({
			destroy        : true,
			data           : data,
			order          : [[ 7, 'desc' ]],
			autoWidth      : false,
			scrollX        : true,
			scrollY        : 350,
			scrollCollapse : true,
			deferRender    : true,
			scroller       : true,
			dom            : 'rti',

			columns: [
				{ data: null, title: '', width: 10 },
				{ data: 'materialCode', title: 'Material code', width: 100 },
				{ data: 'materialCode', title: 'BCP', width: 80 },
				{ data: 'size', title: 'Size' },
				{ data: 'oldMaterialNumber', title: 'Pattern', width: 80 },
				{ data: 'materialGroup', title: 'Material<br>group', width: 60 },
				{ data: 'storageLocation', title: 'Storage<br>location', width: 60 },
				{ data: 'stocks', title: 'Stock', defaultContent: '', width: 60 },
				{ data: 'stocks', title: 'Same<br>item', defaultContent: '', width: 60 },
				{ data: 'isBlock', title: 'Blocked', defaultContent: '', width: 40 }
			],

			columnDefs: [
				{ targets: [5, 6, 7, 8, 9], className: 'dt-center' }, // matGroup, storage, stock, count
				{ targets: [2, 3, 4], className: 'input-filtering' }, // BCP, size, pattern
				{ targets: [5, 6], visible: false }, // matGroup, storage
				{ // expand
					targets: 0, className: 'details-control dt-center', orderable: false,
					render: (data, type, row) => '<i class="fa fa-plus-circle text-green" aria-hidden="true" style="font-size: 16px;"></i>'
				},
				{ // matcode
					targets: 1,
					render: (data, type, row) => { 
						str =  data.slice(0, 3);
						str += '-' + row.size.trim().replace(/-/g, " ").replace(/\s+/g, '-');
						fifthDigit = data.charAt(4), part3 = '', country = Object.keys(COUNTRY_CODE);
						for (let i in country) {
							if (COUNTRY_CODE[country[i]].indexOf(fifthDigit) != -1) {
								str += '-' +country[i]
								break;
							}
						}

						row.usedMaterialCode = str;
						return str;
					}
				},
				{ // stock
					targets: 7,
					render: (data, type, row) => {
						data = data.reduce((sum, stock) => sum + parseInt(stock.totalStock), 0);
						return `<b>${convertToNumber(data, 'whole')}</b>`; 
					}
				},
				{ // count
					targets: 8,
					render: (data, type, row) => `<span class="badge bg-light-blue" >${data.length}</span>`
				},
				{ // blocked
					targets: 9, orderable: false,
					render: (data, type, row) => {
						if (data) return (row.blockType == 'normal') ? '<i class="fa fa-check text-green" aria-hidden="true" style="font-size: 16px; font-weight: bolder;"></i>' : '<i class="fa fa-check text-yellow" aria-hidden="true" style="font-size: 16px; font-weight: bolder;"></i>'
						else return '';
					}
				}
			],
			rowCallback: (row, data, index) => { $(row).attr('id', data['id']); }
		});

		tableFilterTools('material-tab', 'material-table', DT_MATERIAL);
		expandRowDetail('material-table', DT_MATERIAL);

		$('.loading-state').fadeOut('slow');
	}

	// load block normal/date, unblock normal
	function loadBlockTable1(action) {
		let data = JSON.parse(JSON.stringify(LCLDB_MATERIAL)); // deep copy
		data = removeduplicate_2(data, 'size', 'oldMaterialNumber');

		if (action == 'block-normal') {
			data = data.filter(item => !item.isBlock);
			$('#block-normal-modal-show').closest('div').show();
			$('#manage-block-normal-modal-show').closest('div').hide();
			$('#block-date-modal-show').closest('div').hide();
		} else if (action == 'block-date') {
			data = data.filter(item => !item.isBlock);
			$('#block-normal-modal-show').closest('div').hide();
			$('#manage-block-normal-modal-show').closest('div').hide();
			$('#block-date-modal-show').closest('div').show();
		} else if (action == 'unblock-normal') {
			data = data.filter(item => item.isBlock && item.blockType=='normal');
			data = data.map(item => { item.customerBackup = item.customer; return item; }); // customer convert to array
			$('#block-normal-modal-show').closest('div').hide();
			$('#manage-block-normal-modal-show').closest('div').show();
			$('#block-date-modal-show').closest('div').hide();
		}

		DT_BLOCK = $('#block-table1').DataTable({
			destroy        : true,
			data           : data,
			order          : [[ 8, "desc" ]],
			paging         : false,
			autoWidth      : false,
			scrollX        : true,
			scrollY        : 350,
			scrollCollapse : true,
			dom            : 'rti',

			columns: [
				{ data: null, title: '<span class="toggle-select" style="cursor: pointer; font-size: 16px;"><i class="fa fa-check-square" aria-hidden="true"></i></span>', defaultContent: '', width: 10},
				{ data: null, title: '', width: 10 },
				{ data: 'materialCode', title: 'Material code', width: 100 },
				{ data: 'materialCode', title: 'BCP', width: 80 },
				{ data: 'size', title: 'Size' },
				{ data: 'oldMaterialNumber', title: 'Pattern', width: 80 },
				{ data: 'materialGroup', title: 'Material<br>group', width: 60 },
				{ data: 'storageLocation', title: 'Storage<br>location', width: 60 },
				{ data: 'stocks', title: 'Stock', defaultContent: '', width: 60 },
				{ data: 'stocks', title: 'Same<br>item', defaultContent: '', width: 60 },
				{ data: 'customer', title: 'Customer', defaultContent: '', width: 60 }
			],

			columnDefs: [
				{ targets: 0, className: 'select-checkbox', orderable: false }, // check
				{ targets: [6, 7, 8, 9], className: 'dt-center' }, // matGroup, storage, stock, count
				{ targets: [3, 4, 5], className: 'input-filtering' }, // BCP, size, pattern
				{ targets: [6, 7], visible: false }, // matGroup, storage
				{ // expand
					targets: 1, className: 'details-control dt-center', orderable: false,
					render: (data, type, row) => '<i class="fa fa-plus-circle text-green" aria-hidden="true" style="font-size: 16px;"></i>'
				},
				{ // matCode
					targets: 2,
					render: (data, type, row) => { 
						str =  data.slice(0, 3);
						str += '-' + row.size.trim().replace(/-/g, " ").replace(/\s+/g, '-');
						fifthDigit = data.charAt(4), part3 = '', country = Object.keys(COUNTRY_CODE);
						for (var i in country) {
							if (COUNTRY_CODE[country[i]].indexOf(fifthDigit) != -1) {
								str += '-' +country[i]
								break;
							}
						}

						row.usedMaterialCode = str;
						return str;
					}
				},
				{ // stock
					targets: 8,
					render: (data, type, row) => {
						data = data.reduce((sum, stock) => sum + parseInt(stock.totalStock), 0);
						return `<b>${convertToNumber(data, 'whole')}</b>`; 
					}
				},
				{ // count
					targets: 9,
					render: (data, type, row) => `<span class="badge bg-light-blue" >${data.length}</span>`
				},
				{
					targets: 10, className: 'dt-center',
					render: (data, type, row) => {
						if (data) {
							if (typeof data == 'string') return `<span class="badge bg-light-blue">ALL</span>`
							else return (data.length!=0) ? `<span class="badge bg-light-blue">${convertToNumber(data.length, 'whole')}</span>` : `<span class="badge bg-red">${convertToNumber(0, 'whole')}</span>`
						} else return '';
					}
				}
			],
			select: { style: 'multi' },
			rowCallback: (row, data, index) => { $(row).attr('id', data.id); } , 
			initComplete: (settings, json) => { $('#block-table1 tbody').css('cursor', 'pointer'); }
		});

		if (action != 'unblock-normal') DT_BLOCK.columns(10).visible(false);

		tableFilterTools('block-tab1', 'block-table1', DT_BLOCK);
		expandRowDetail('block-table1', DT_BLOCK);
		toggleSelectAll('block-tab1', DT_BLOCK);

		$('.loading-state').fadeOut('slow');
	}

	// load unblock date item
	function loadBlockTable2(action) {
		let data = JSON.parse(JSON.stringify(LCLDB_MATERIAL)); // deep copy
		data = removeduplicate_2(data, 'size', 'oldMaterialNumber');
		data = data.filter(item => item.isBlock && item.blockType=='date');
		data = data.map(item => { item.customerBackup = item.customer; return item; });

		DT_BLOCK = $('#block-table2').DataTable({
			destroy        : true,
			data           : data,
			order          : [[ 8, "desc" ]],
			paging         : false,
			autoWidth      : false,
			scrollX        : true,
			scrollY        : 350,
			scrollCollapse : true,
			dom            : 'rti',

			columns: [
				{ data: null, title: '<span class="toggle-select" style="cursor: pointer; font-size: 16px;"><i class="fa fa-check-square" aria-hidden="true"></i></span>', defaultContent: '', width: 10 },
				{ data: null, title: '', width: 10 },
				{ data: 'materialCode', title: 'Material code', width: 100 },
				{ data: 'materialCode', title: 'BCP', width: 80 },
				{ data: 'size', title: 'Size' },
				{ data: 'oldMaterialNumber', title: 'Pattern', width: 80 },
				{ data: 'materialGroup', title: 'Material<br>group' },
				{ data: 'storageLocation', title: 'Storage<br>location' },
				{ data: 'stocks', title: 'Stock', defaultContent: '', width: 40 },
				{ data: 'stocks', title: 'Same<br>item', defaultContent: '', width: 40 },
				{ data: 'blockStartDate', title: 'Start', defaultContent: '', width: 50 },
				{ data: 'blockEndDate', title: 'End', defaultContent: '', width: 50 },
				{ data: 'customer', title: 'Customer', defaultContent: '', width: 60 }
			],

			columnDefs: [
				{ targets: 0, className: 'select-checkbox', orderable: false }, // check
				{ targets: [6, 7, 8, 9, 10, 11], className: 'dt-center' }, // matGroup, storage, stock, count
				{ targets: [3, 4, 5], className: 'input-filtering' }, // BCP, size, pattern
				{ targets: [10, 11], className: 'date-filtering' }, // start, end
				{ targets: [6, 7], visible: false }, // matGroup, storage
				{ // expand
					targets: 1, className: 'details-control dt-center', orderable: false,
					render: (data, type, row) => '<i class="fa fa-plus-circle text-green" aria-hidden="true" style="font-size: 16px;"></i>'
				},
				{ // matCode
					targets: 2,
					render: (data, type, row) => { 
						str =  data.slice(0, 3);
						str += '-' + row.size.trim().replace(/-/g, " ").replace(/\s+/g, '-');
						fifthDigit = data.charAt(4), part3 = '', country = Object.keys(COUNTRY_CODE);
						for (var i in country) {
							if (COUNTRY_CODE[country[i]].indexOf(fifthDigit) != -1) {
								str += '-' +country[i]
								break;
							}
						}

						row.usedMaterialCode = str;
						return str;
					}
				},
				{ // stock
					targets: 8,
					render: function (data, type, row) {
						data = data.reduce((sum, stock) => { return sum + parseInt(stock.totalStock); }, 0);
						return `<b>${convertToNumber(data, 'whole')}</b>`; 
					}
				},
				{ // count
					targets: 9,
					render: (data, type, row) => `<span class="badge bg-light-blue" >${data.length}</span>`
				},
				{
					targets: [10, 11],
					render: (data, type, row) => moment(data).format('MMM DD, YYYY'),
				},
				{
					targets: 12, className: 'dt-center',
					render: (data, type, row) => {
						if (typeof data == 'string') return `<span class="badge bg-light-blue">ALL</span>`
						else return (data.length!=0) ? `<span class="badge bg-light-blue">${convertToNumber(data.length, 'whole')}</span>` : `<span class="badge bg-red">${convertToNumber(0, 'whole')}</span>`
					}
				}
			],
			select: { style: 'multi' },
			rowCallback: (row, data, index) => { $(row).attr('id', data.id); } , 
			initComplete: (settings, json) => { $('#block-table2 tbody').css('cursor', 'pointer'); }
		});

		tableFilterTools('block-tab2', 'block-table2', DT_BLOCK);
		expandRowDetail('block-table2', DT_BLOCK);
		toggleSelectAll('block-tab2', DT_BLOCK);

		$('.loading-state').fadeOut('slow');
	}

	// load unblock date group section
	function loadBlockTable3(action) {
		let data = JSON.parse(JSON.stringify(LCLDB_MATERIAL)); // deep copy
		data = removeduplicate_2(data, 'size', 'oldMaterialNumber');
		data = data.filter((item) => item.isBlock && item.blockType=='date');

		// get all unique date group
		let data_nodupli = {};
		for (let i in data) {
			let startDate = moment(data[i].blockStartDate).format('MMM DD, YYYY');
			let endDate = moment(data[i].blockEndDate).format('MMM DD, YYYY');

			data_nodupli[`${startDate} - ${endDate}`] = {
				startDate: data[i].blockStartDate,
				endDate: data[i].blockEndDate 
			}
		}

		// create date group dropdown
		let code = '<option>-- Select date group --</option>';
		for (let i in data_nodupli) code += `<option data-startDate="${data_nodupli[i].startDate}"  data-endDate="${data_nodupli[i].endDate}">${i}</option>`
			$('#unblock-date-group-select').html(code).select2({dropdownCssClass: 'mediumdrop'});

		$('#unblock-date-group-select').off('change').change(function(){
			let startDate = $('#unblock-date-group-select option:selected').attr('data-startDate');
			let endDate = $('#unblock-date-group-select option:selected').attr('data-endDate');

			$('#select2-unblock-date-group-select-container').text($('#unblock-date-group-select option:selected').text());
			$('.loading-state:eq(3)').fadeIn('slow');
			setTimeout(() => { loadDataGroupTable(data.filter((item) => item.blockStartDate==startDate && item.blockEndDate==endDate)); }, 1000);
		});

		loadDataGroupTable([]); // show blank table
		$('.loading-state').fadeOut('slow');
	}

	// load unblock date group
	function loadDataGroupTable(data) {
		DT_BLOCK = $('#block-table3').DataTable({
			destroy        : true,
			data           : data,
			order          : [[ 7, "desc" ]],
			autoWidth      : false,
			scrollX        : true,
			scrollY        : 350,
			scrollCollapse : true,
			deferRender    : true,
			scroller       : true,
			dom            : 'rti',

			columns: [
				{ data: null, title: '', width: 10 },
				{ data: 'materialCode', title: 'Material code', width: 100 },
				{ data: 'materialCode', title: 'BCP', width: 80 },
				{ data: 'size', title: 'Size' },
				{ data: 'oldMaterialNumber', title: 'Pattern', width: 80 },
				{ data: 'materialGroup', title: 'Material<br>group' },
				{ data: 'storageLocation', title: 'Storage<br>location' },
				{ data: 'stocks', title: 'Stock', defaultContent: '', width: 40 },
				{ data: 'stocks', title: 'Same<br>item', defaultContent: '', width: 40 },
				{ data: 'blockStartDate', title: 'Start', defaultContent: '', width: 50 },
				{ data: 'blockEndDate', title: 'End', defaultContent: '', width: 50 }
			],

			columnDefs: [
				{ targets: [5, 6, 7, 8, 9, 10], className: 'dt-center' }, // matGroup, storage, stock, count
				{ targets: [2, 3, 4], className: 'input-filtering' }, // BCP, size, pattern
				{ targets: [5, 6], visible: false }, // matGroup, storage
				{ // expand
					targets: 0, className: 'details-control dt-center', orderable: false,
					render: (data, type, row) => '<i class="fa fa-plus-circle text-green" aria-hidden="true" style="font-size: 16px;"></i>'
				},
				{ // matCode
					targets: 1,
					render: (data, type, row) => { 
						str =  data.slice(0, 3);
						str += '-' + row.size.trim().replace(/-/g, " ").replace(/\s+/g, '-');
						fifthDigit = data.charAt(4), part3 = '', country = Object.keys(COUNTRY_CODE);
						for (var i in country) {
							if (COUNTRY_CODE[country[i]].indexOf(fifthDigit) != -1) {
								str += '-' +country[i]
								break;
							}
						}

						row.usedMaterialCode = str;
						return str;
					}
				},
				{ // stock
					targets: 7,
					render: function (data, type, row) {
						data = data.reduce((sum, stock) => { return sum + parseInt(stock.totalStock); }, 0);
						return `<b>${convertToNumber(data, 'whole')}</b>`; 
					}
				},
				{ // count
					targets: 8,
					render: (data, type, row) => `<span class="badge bg-light-blue" >${data.length}</span>`
				},
				{
					targets: [9, 10],
					render: (data, type, row) => moment(data).format('MMM DD, YYYY'),
				}
			],
			rowCallback: (row, data, index) => { $(row).attr('id', data.id); }
		});

		tableFilterTools('block-tab3', 'block-table3', DT_BLOCK);
		expandRowDetail('block-table3', DT_BLOCK);

		$('.loading-state').fadeOut('slow');
	}

	// individual column search
	function tableFilterTools(tabId, tableId, datatableInstance) {
		$(`#${tabId} .table-filter-tools`).empty();
		$(`#${tableId} thead th`).each(function (index, el) {
			let title = $(this).text();

			if ($(this).hasClass('input-filtering')) {
				$(`<div class="col-lg-2"><div class="input-group"><span class="input-group-addon small-font"><b>${title}</b></span><input type="text" data-column="${index}" class="form-control input-sm input-filtering" placeholder="Search ${title}" /></div></div>`)
				.appendTo(`#${tabId} .table-filter-tools`)
				.find('input').on('keyup change', function(){
					let colIndex = $(this).attr('data-column');
					let column = datatableInstance.columns(colIndex);
					if (column.search() !== this.value) column.search(this.value).draw();
				});
			} else if ($(this).hasClass('date-filtering')) {
				// index + 2, cause storage and matGroup is hidden
				$(`<div class="col-lg-2"><div class="input-group"><span class="input-group-addon small-font"><b>${title}</b></span><input type="text" class="form-control input-sm pull-right" data-column="${index+2}" placeholder="Search ${title}"></div></div>`)
				.appendTo(`#${tabId} .table-filter-tools`)
				.find('input').datepicker({
					format: 'M dd, yyyy',
					autoclose: true
				}).on('keyup change', function() {
					let colIndex = $(this).attr('data-column');
					let column = datatableInstance.columns(colIndex);
					if (column.search() !== this.value) column.search(this.value).draw();
				});
			}
		});
	}

	// expand row code
	function format(data) {
		let stocks = data.stocks;
		let code = `<div class="col-lg-6"><span class="info-box-number">${stocks.length} items</span>`;

		code += `<table class="table nowrap table-responsive table-bordered" style="margin-bottom: 0px;">`;

		for (let i in stocks) {
			code += 
			`<tr>
			<td>${stocks[i].materialCode}</td>
			<td>${data.size}</td>
			<td>${data.oldMaterialNumber}</td>
			<td>${data.materialGroup}</td>
			<td>${data.storageLocation}</td>
			<td class="dt-right"><b>${convertToNumber(parseInt(stocks[i].totalStock), 'whole')}</b></td>
			</tr>`;
		}

		code += `</table></div>`;

		return code;
	}

	// expand row event
	function expandRowDetail(tableId, datatableInstance) {
		$(`#${tableId} tbody`).off('click').on('click', 'td.details-control', function() {
			let tr = $(this).closest('tr'), row = datatableInstance.row(tr);

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
	}

	// toggle select all
	function toggleSelectAll(tabId, datatableInstance) {
		$(`#${tabId} .toggle-select`).off('click').on("click", function() {
			if ($('th.select-checkbox').hasClass('selected')) {
				datatableInstance.rows({search: 'applied'}).deselect();
				$('th.select-checkbox').removeClass('selected');
			} else {
				datatableInstance.rows({search: 'applied'}).select();
				$('th.select-checkbox').addClass('selected');
			}
		});
	}

	// load customer blocked table, per item
	function customerBlockTable(data, tableId) {
		DT_CUSTOMER_BLOCK = $(`#${tableId}`).DataTable({
			destroy        : true,
			data           : data,
			ordering       : false,
			autoWidth      : false,
			scrollX        : true,
			scrollY        : 300,
			scrollCollapse : true,
			paging         : false,
			dom            : 'rt',

			columns : [
				{
					className: 'dt-center', width: 10,
					render : (data, type, row) => `<span class="text-red remove-item" style="cursor: pointer; font-size: 16px;"><i class="fa fa-window-close" aria-hidden="true"></i></span>`
				},
				{ 
					data: 'customerCode', title: 'Blocked customer', width: 30,
					render : (data, type, row) => `${data} - ${row.name1}`
				}
			],
			rowCallback: (row, data, index) => {
				$(row).find('.remove-item').off('click').click(() => {
					DT_CUSTOMER_BLOCK.row(index).remove().draw();
					DT_CUSTOMER_LIST.row(`[data-selector="${data.customerCode}"]`).deselect();
				});
			}
		});

		// search
		$(`#${tableId}`).closest('.box-solid').find('.input-filtering')
		.off('keyup').keyup(function(){ DT_CUSTOMER_BLOCK.search($(this).val()).draw(); });
	}

	// load all customer 
	function customerSelectionTable(data, tableId, tableId2) {
		DT_CUSTOMER_LIST = $(`#${tableId}`).DataTable({
			destroy        : true,
			data           : data,
			ordering       : false,
			paging         : false,
			autoWidth      : false,
			scrollX        : true,
			scrollY        : 300,
			scrollCollapse : true,
			dom            : 'rt',

			columns : [
				{ data: null, title: '<span style="cursor: pointer; font-size: 14px;"><i class="fa fa-check-square" aria-hidden="true"></i></span>', defaultContent: '', className: 'select-checkbox',  width: 10, orderable: false },
				{ 
					data: 'customerCode', title: 'Customer list', width: 30,
					render : (data, type, row) => `${data} - ${row.name1}`
				}
			],
			select: { style: 'multi' },
			rowCallback: (row, data, index) => { $(row).attr('data-selector', data.customerCode); },
			initComplete: (settings, json) => { $(`#${tableId} tbody`).css('cursor', 'pointer'); }
		});

		// search
		$(`#${tableId}`).closest('.box-solid').find('.input-filtering')
		.off('keyup').keyup(function(){ DT_CUSTOMER_LIST.search($(this).val()).draw(); });

		// update customer blocked lists & customer blocked count
		DT_CUSTOMER_LIST.off('select deselect').on('select deselect', (e, dt, type, indexes) => {
			customerBlockTable(DT_CUSTOMER_LIST.rows('.selected').data().toArray(), tableId2); // customer blocked list

			// customer blocked count
			let index = DT_BLOCK_CHECK.row({selected: true}).index();
			let customerBlock = DT_CUSTOMER_BLOCK.rows().data().toArray();
			let data = DT_BLOCK_CHECK.rows().data().toArray();
			data[index].customer = (customerBlock.length == CUSTOMER_COUNT) ? 'all' : customerBlock;
			DT_BLOCK_CHECK.row({selected: true}).invalidate().draw(); // update counter
		});

		// select/deselect all toggle
		$(`#${tableId}_wrapper th.select-checkbox`).off('click').on('click', () => {
			if ($(`#${tableId}_wrapper th.select-checkbox`).hasClass('selected')) {
				DT_CUSTOMER_LIST.rows().deselect();
				$(`#${tableId}_wrapper th.select-checkbox`).removeClass('selected');
			} else {
				DT_CUSTOMER_LIST.rows().select();
				$(`#${tableId}_wrapper th.select-checkbox`).addClass('selected');
			}
		});
	}

	// tabs navigate
	$('.nav-tabs > li a[data-toggle="tab"]').click(function() {
		const action = $(this).attr('data-action');
		switch(action) {
			// material
			case 'r-material':
				$('.loading-state:eq(0)').fadeIn('slow');
				setTimeout(() => { loadMaterialTable(); }, 1000);
			break;

			// block
			case 'block-normal':
				$('.loading-state:eq(1)').fadeIn('slow');
				setTimeout(() => { loadBlockTable1('block-normal'); }, 1000);
			break;
			case 'block-date':
				$('.loading-state:eq(1)').fadeIn('slow');
				setTimeout(() => { loadBlockTable1('block-date'); }, 1000);
			break;
			case 'unblock-normal':
				$('.loading-state:eq(1)').fadeIn('slow');
				setTimeout(() => { loadBlockTable1('unblock-normal'); }, 1000);
			break;
			case 'unblock-date-by-item':
				$('.loading-state:eq(2)').fadeIn('slow');
				setTimeout(() => { loadBlockTable2('unblock-date-by-item'); }, 1000);
			break;
			case 'unblock-date-by-group':
				$('.loading-state:eq(3)').fadeIn('slow');
				setTimeout(() => { loadBlockTable3('unblock-date-by-item'); }, 1000);
			break;
		}
	});

	// ~~ BLOCK NORMAL
	// show block normal modal
	$('#block-normal-modal-show').click(function() {
		if (!DT_BLOCK.rows( '.selected' ).count()) {
			resultNotify('fa-exclamation-circle', 'INVALID', `Select an item to block`, 'warning');
			return;
		}

		$('#block-normal-modal').modal();
		setTimeout(() => { $('#block-normal-modal .overlay').fadeIn(); }, 1000);

		setTimeout(() => {
			let data = DT_BLOCK.rows('.selected').data().toArray().map((item) => { item.customer = []; return item; }); // set custBlock to blank array
			DT_BLOCK_CHECK = $('#check-block-normal-table').DataTable({
				destroy        : true,
				data           : data,
				ordering       : false,
				autoWidth      : false,
				scrollX        : true,
				scrollY        : 300,
				scrollCollapse : true,
				paging         : false,
				dom            : 'rti',

				columns : [
					{ data: 'materialCode', title: 'BCP', width: 40 },
					{ data: 'size', title: 'Size' },
					{ data: 'oldMaterialNumber', title: 'Pattern', width: 40 },
					{ data: 'customer', title: 'Customer', width: 30 }
				],
				columnDefs: [
					{
						targets: 3, className: 'dt-center',
						render: (data, type, row) => {
							if (typeof data == 'string') return `<span class="badge bg-light-blue">ALL</span>`
							else return (data.length!=0) ? `<span class="badge bg-light-blue">${convertToNumber(data.length, 'whole')}</span>` : `<span class="badge bg-red">${convertToNumber(0, 'whole')}</span>`
						}
					}
				],
				select: { style: 'single' },
				rowCallback: (row, data, index) => { $(row).attr('id', data.id); },
				initComplete: (settings, json) => { $(`#check-block-normal-table tbody`).css('cursor', 'pointer'); }
			});

			$(`#check-block-normal-table`).closest('.box-solid')
			.find('.set-selected-all-btn').off('click').click(() => {
				let selectedRowData =  DT_BLOCK_CHECK.row('.selected').data();
				if (!selectedRowData) {
					alert('Select a material first to copy its customer block');
					return
				}

				let customerToCopy = selectedRowData.customer;
				let rowData = DT_BLOCK_CHECK.rows().data().toArray();

				for (let i in rowData) rowData[i].customer = customerToCopy;
				DT_BLOCK_CHECK.rows().invalidate().draw();
			});

			// material block click, load customer block table & deselect/select customer on customer list
			DT_BLOCK_CHECK.off('select').on('select', (e, dt, type, indexes) => {
				let rowData = DT_BLOCK_CHECK.row(indexes).data();
				let customerBlock = (rowData.customer) ? rowData.customer : [];				

				if (customerBlock != 'all') {
					DT_CUSTOMER_LIST.rows('.selected').deselect(); // refresh customer list
					$(`#block-normal-customer-selection-table_wrapper th.select-checkbox`).removeClass('selected');
					let selectors = customerBlock.map(item => `[data-selector="${item.customerCode}"]`).toString();
					if (selectors) DT_CUSTOMER_LIST.rows(selectors).select(); // select customer blocked
				} else {
					$(`#block-normal-customer-selection-table_wrapper th.select-checkbox`).addClass('selected');
					DT_CUSTOMER_LIST.rows().select();
				}

				$('#block-normal-modal .overlay').fadeOut();
			}).off('deselect').on('deselect', (e, dt, type, indexes) => { $('#block-normal-modal .overlay').fadeIn(); });

			customerBlockTable([], 'block-normal-customer-table');
			customerSelectionTable(LCLDB_CUSTOMER, 'block-normal-customer-selection-table', 'block-normal-customer-table');
		}, 1000);
	});

	// save block normal
	$('#block-normal-btn').click(function(){
		let data = DT_BLOCK_CHECK.rows().data().toArray();

		// check if no blank customer per item
		for (let i in data) {
			if (!data[i].customer.length) {
				alert('Select a customer to block, on all material.');
				return;
			}
		}

		disableButton('#block-normal-btn');
		setTimeout(() => {
			let block = {};
			for (let i in data) {
				let sizePattern = `${data[i].size} ${data[i].oldMaterialNumber}`;
				block[sizePattern] = {};
				if (data[i].customer == 'all') block[sizePattern] = data[i].customer; // block all
				else for (let j in data[i].customer) block[sizePattern][data[i].customer[j].customerCode] = data[i].customer[j].name1; // block specific item
			}

			manageMaterialBlock(block, 'blockNormal', (err, res) => {
				$('#block-normal-modal').modal('hide');
				$('.loading-state:eq(1)').fadeOut('slow');

				if (res.statusCode <= 299) {
					blockNormalLocal(LCLDB_MATERIAL, block);
					$('a[data-action="block-normal"]').click();
					resultNotify('fa-check-circle', 'SUCCESS', 'Material/s successfully blocked', 'success');
				} else if (res.statusCode >= 300) {
					console.log('\n\nerror updating block normal');
					console.log(res);
					resultNotify('fa fa-times', 'ERROR', 'Material/s not blocked.<br>Something went wrong. Please try again later', 'danger');
				}
			});
		}, 1000);
	});


	// ~~ BLOCK DATE
	// show block date modal
	$('#block-date-modal-show').click(function() {
		if (!DT_BLOCK.rows( '.selected' ).count()) {
			resultNotify('fa-exclamation-circle', 'INVALID', `Select an item to block`, 'warning');
			return;
		}

		$('#block-date-modal').modal();
		setTimeout(() => { $('#block-date-modal .overlay').fadeIn(); }, 1000);

		setTimeout(() => {
			let data = DT_BLOCK.rows('.selected').data().toArray().map((item) => { item.customer = []; return item; }); // set custBlock to blank array
			DT_BLOCK_CHECK = $('#check-block-date-table').DataTable({
				destroy        : true,
				data           : data,
				ordering       : false,
				autoWidth      : false,
				scrollX        : true,
				scrollY        : 350,
				scrollCollapse : true,
				paging         : false,
				dom            : 'rti',

				columns : [
					{ data: 'materialCode', title: 'BCP', width: 40 },
					{ data: 'size', title: 'Size' },
					{ data: 'oldMaterialNumber', title: 'Pattern', width: 40 },
					{ data: 'customer', defaultContent: '0', title: 'Customer', width: 30 }
				],
				columnDefs: [
					{
						targets: 3, className: 'dt-center',
						render: (data, type, row) => {
							if (typeof data == 'string') return `<span class="badge bg-light-blue">ALL</span>`
							else return (data.length!=0) ? `<span class="badge bg-light-blue">${convertToNumber(data.length, 'whole')}</span>` : `<span class="badge bg-red">${convertToNumber(0, 'whole')}</span>`
						}
					}
				],
				select: { style: 'single' },
				rowCallback: (row, data, index) => { $(row).attr('id', data.id); },
				initComplete: (settings, json) => { $('#check-block-date-table').css('cursor', 'pointer'); },
			});

			$(`#check-block-date-table`).closest('.box-solid')
			.find('.set-selected-all-btn').off('click').click(() => {
				let selectedRowData =  DT_BLOCK_CHECK.row('.selected').data();
				if (!selectedRowData) {
					alert('Select a material first to copy its customer block');
					return
				}

				let customerToCopy = selectedRowData.customer;
				let rowData = DT_BLOCK_CHECK.rows().data().toArray();

				for (let i in rowData) rowData[i].customer = customerToCopy;
				DT_BLOCK_CHECK.rows().invalidate().draw();
			});

			// material block click, load customer block table & deselect/select customer on customer list
			DT_BLOCK_CHECK.off('select').on('select', (e, dt, type, indexes) => {
				let rowData = DT_BLOCK_CHECK.row(indexes).data();
				let customerBlock = (rowData.customer) ? rowData.customer : [];

				if (customerBlock != 'all') {
					DT_CUSTOMER_LIST.rows('.selected').deselect(); // refresh customer list
					$(`#block-date-customer-selection-table_wrapper th.select-checkbox`).removeClass('selected');
					let selectors = customerBlock.map(item => `[data-selector="${item.customerCode}"]`).toString();
					if (selectors) DT_CUSTOMER_LIST.rows(selectors).select(); // select customer blocked
				} else {
					$(`#block-date-customer-selection-table_wrapper th.select-checkbox`).addClass('selected');
					DT_CUSTOMER_LIST.rows().select()
				}

				$('#block-date-modal .overlay').fadeOut();
			}).off('deselect').on('deselect', (e, dt, type, indexes) => { $('#block-date-modal .overlay').fadeIn(); });

			customerBlockTable([], 'block-date-customer-table');
			customerSelectionTable(LCLDB_CUSTOMER, 'block-date-customer-selection-table', 'block-date-customer-table');
		}, 1000);
	});

	// save block date
	$('#block-date-btn').click(function(){
		let data = DT_BLOCK_CHECK.rows().data().toArray();

		// check if no blank customer per item
		for (let i in data) {
			if (!data[i].customer.length) {
				alert('Select a customer to block, on all material.');
				return;
			}
		}

		// check if date range is not blank
		const dateinput = $('#daterange-block-btn').closest('.input-group').find('input');
		if (!dateinput.val()) {
			resultNotify('fa-exclamation-circle', 'INVALID', `Date range is required`, 'warning');
			return;
		}

		disableButton('#block-date-btn');
		setTimeout(() => {
			let startDate = dateinput.attr('data-startdate'), endDate = dateinput.attr('data-enddate');
			let dateKey = `\`${moment(startDate).format('YYYY-MM-DD')} - ${moment(endDate).format('YYYY-MM-DD')}\``;
			let block = {};
			for (let i in data) {
				let sizePattern = `${data[i].size} ${data[i].oldMaterialNumber}`;
				block[sizePattern] = {};
				if (data[i].customer == 'all') block[sizePattern] = data[i].customer; // block all
				else for (let j in data[i].customer) block[sizePattern][data[i].customer[j].customerCode] = data[i].customer[j].name1; // block specific item
			}

			manageMaterialBlock({ block, startDate, endDate, dateKey }, 'blockDate', (err, res) => {
				$('#block-date-modal').modal('hide');
				$('.loading-state:eq(1)').fadeOut('slow');

				if (res.statusCode <= 299) {
					blockDateLocal(LCLDB_MATERIAL, block, startDate, endDate);
					$('a[data-action="block-date"]').click();
					resultNotify('fa-check-circle', 'SUCCESS', 'Material/s successfully blocked', 'success');
				} else if (res.statusCode >= 300) {
					console.log('\n\nerror updating block date');
					console.log(res);
					resultNotify('fa fa-times', 'ERROR', 'Material/s not blocked.<br>Something went wrong. Please try again later', 'danger');
				}
			});
		}, 1000);
	});


	// ~~ MANAGE BLOCK NORMAL
	// show unblock date modal
	$('#manage-block-normal-modal-show').click(function() {
		if (!DT_BLOCK.rows( '.selected' ).count()) {
			resultNotify('fa-exclamation-circle', 'INVALID', `Select an item to unblock`, 'warning');
			return;
		}

		$('#manage-block-normal-modal').modal();
		setTimeout(() => { $('#manage-block-normal-modal .overlay').fadeIn(); }, 1000);

		setTimeout(() => {
			let data = DT_BLOCK.rows('.selected').data().toArray().map(item => { item.customer = item.customerBackup; return item; }); // set custBlock to blank array
			DT_BLOCK_CHECK = $('#manage-block-normal-table').DataTable({
				destroy        : true,
				data           : data,
				ordering       : false,
				paging         : false,
				autoWidth      : false,
				scrollX        : true,
				scrollY        : 350,
				scrollCollapse : true,
				dom            : 'rti',

				columns : [
					{ data: 'materialCode', title: 'BCP', width: 40 },
					{ data: 'size', title: 'Size' },
					{ data: 'oldMaterialNumber', title: 'Pattern', width: 40 },
					{ data: 'customer', title: 'Customer', width: 30 }
				],
				columnDefs: [
					{
						targets: 3, className: 'dt-center',
						render: (data, type, row) => {
							if (typeof data == 'string') return `<span class="badge bg-light-blue">ALL</span>`
							else return (data.length!=0) ? `<span class="badge bg-light-blue">${convertToNumber(data.length, 'whole')}</span>` : `<span class="badge bg-red">UNBLOCK</span>`;
						}
					}
				],
				select: { style: 'single' },
				rowCallback: (row, data, index) => { $(row).attr('id', data.id); },
				initComplete: (settings, json) => { $('#manage-block-normal-table').css('cursor', 'pointer'); }
			});

			$(`#manage-block-normal-table`).closest('.box-solid')
			.find('.set-selected-all-btn').off('click').click(() => {
				let selectedRowData =  DT_BLOCK_CHECK.row('.selected').data();
				if (!selectedRowData) {
					alert('Select a material first to copy its customer block');
					return
				}

				let customerToCopy = selectedRowData.customer;
				let rowData = DT_BLOCK_CHECK.rows().data().toArray();

				for (let i in rowData) rowData[i].customer = customerToCopy;
				DT_BLOCK_CHECK.rows().invalidate().draw();
			});

			// material block click, load customer block table & deselect/select customer on customer list
			DT_BLOCK_CHECK.off('select').on('select', (e, dt, type, indexes) => {
				let rowData = DT_BLOCK_CHECK.row(indexes).data();
				let customerBlock = (rowData.customer) ? rowData.customer : [];				

				if (customerBlock != 'all') {
					DT_CUSTOMER_LIST.rows('.selected').deselect(); // refresh customer list
					$(`#manage-block-normal-customer-selection-table_wrapper th.select-checkbox`).removeClass('selected');
					let selectors = customerBlock.map(item => `[data-selector="${item.customerCode}"]`).toString();
					if (selectors) DT_CUSTOMER_LIST.rows(selectors).select(); // select customer blocked
				} else {
					$(`#manage-block-normal-customer-selection-table_wrapper th.select-checkbox`).addClass('selected');
					DT_CUSTOMER_LIST.rows().select();
				}

				$('#manage-block-normal-modal .overlay').fadeOut();
			}).off('deselect').on('deselect', (e, dt, type, indexes) => { $('#manage-block-normal-modal .overlay').fadeIn(); });

			customerBlockTable([], 'manage-block-normal-customer-table');
			customerSelectionTable(LCLDB_CUSTOMER, 'manage-block-normal-customer-selection-table', 'manage-block-normal-customer-table');
		}, 1000);
	});

	// save unblock normal
	$('#manage-block-normal-btn').click(function(){
		let data = DT_BLOCK_CHECK.rows().data().toArray();

		disableButton('#manage-block-normal-btn');
		setTimeout(() => {
			let block = {};
			for (let i in data) {
				if (JSON.stringify(data[i].customer) != JSON.stringify(data[i].customerBackup)) { // if block is updated
					let sizePattern = `${data[i].size} ${data[i].oldMaterialNumber}`;
					block[sizePattern] = {};
					if (data[i].customer == 'all') block[sizePattern] = data[i].customer; // block all
					else {
						for (let j in data[i].customer) block[sizePattern][data[i].customer[j].customerCode] = data[i].customer[j].name1; // block specific item
						if (Object.keys(block[sizePattern]).length==0) block[sizePattern] = 'unblock';
					}
				}
			}

			if (Object.keys(block).length) { // there is change on block
				$('.loading-state:eq(1)').fadeIn('slow');

				manageMaterialBlock(block, 'unblockNormal', (err, res) => {
					$('#manage-block-normal-modal').modal('hide');
					$('.loading-state:eq(1)').fadeOut('slow');

					if (res.statusCode <= 299) {
						manageBlockNormalLocal(LCLDB_MATERIAL, block);
						$('a[data-action="unblock-normal"]').click();
						resultNotify('fa-check-circle', 'SUCCESS', 'Material/s successfully updated', 'success');
					} else if (res.statusCode >= 300) {
						console.log('\n\nerror updating block normal');
						console.log(res);
						resultNotify('fa fa-times', 'ERROR', 'Material/s not unblocked.<br>Something went wrong. Please try again later', 'danger');
					}
				});
			} else { // there is no change
				alert('There is no change from the block.');
			}
			
		}, 1000);
	});


	// ~~ MANAGE BLOCK DATE BY ITEM
	// show unblock date item modal
	$('#manage-block-date-by-item-modal-show').click(function() {
		if (!DT_BLOCK.rows( '.selected' ).count()) {
			resultNotify('fa-exclamation-circle', 'INVALID', `Select an item to unblock`, 'warning');
			return;
		}

		$('#manage-block-date-by-item-modal').modal();
		setTimeout(() => { $('#manage-block-date-by-item-modal .overlay').fadeIn(); }, 1000);

		setTimeout(() => {
			let data = DT_BLOCK.rows('.selected').data().toArray().map(item => { item.customer = item.customerBackup; return item; }); // set custBlock to blank array
			let dateGroup = {};
			for (let i in data) dateGroup[`${moment(data[i].blockStartDate).format('MMM DD, YYYY')} - ${moment(data[i].blockStartDate).format('MMM DD, YYYY')}`] = true;

			dateGroup = Object.keys(dateGroup);
			$('#affected-date-groups').empty();
			for (let i in dateGroup) $('#affected-date-groups').append(`<li>${dateGroup[i]}</li>`);

			DT_BLOCK_CHECK = $('#manage-block-date-by-item-table').DataTable({
				destroy        : true,
				data           : data,
				ordering       : false,
				paging         : false,
				autoWidth      : false,
				scrollX        : true,
				scrollY        : 350,
				scrollCollapse : true,
				dom            : 'rt',

				columns : [
					{ data: 'materialCode', title: 'BCP', width: 40 },
					{ data: 'size', title: 'Size' },
					{ data: 'oldMaterialNumber', title: 'Pattern', width: 40 },
					{ data: 'blockStartDate', title: 'Date group', width: 110 },
					{ data: 'customer', title: 'Customer', width: 30 }
				],
				columnDefs: [
					{
						targets: 3, className: 'dt-center',
						render: (data, type, row) => `${moment(data).format('MMM DD, YYYY')} - ${moment(row.blockEndDate).format('MMM DD, YYYY')}`,
					},
					{
						targets: 4, className: 'dt-center',
						render: (data, type, row) => {
							if (typeof data == 'string') return `<span class="badge bg-light-blue">ALL</span>`
							else return (data.length!=0) ? `<span class="badge bg-light-blue">${convertToNumber(data.length, 'whole')}</span>` : `<span class="badge bg-red">UNBLOCK</span>`;
						}
					}
				],
				select: { style: 'single' },
				rowCallback: (row, data, index) => { $(row).attr('id', data.id); },
				initComplete: (settings, json) => { $('#manage-block-date-by-item-table tbody').css('cursor', 'pointer'); }
			});

			$(`#manage-block-date-by-item-table`).closest('.box-solid')
			.find('.set-selected-all-btn').off('click').click(() => {
				let selectedRowData =  DT_BLOCK_CHECK.row('.selected').data();
				if (!selectedRowData) {
					alert('Select a material first to copy its customer block');
					return
				}

				let customerToCopy = selectedRowData.customer;
				let rowData = DT_BLOCK_CHECK.rows().data().toArray();

				for (let i in rowData) rowData[i].customer = customerToCopy;
				DT_BLOCK_CHECK.rows().invalidate().draw();
			});

			// material block click, load customer block table & deselect/select customer on customer list
			DT_BLOCK_CHECK.off('select').on('select', (e, dt, type, indexes) => {
				let rowData = DT_BLOCK_CHECK.row(indexes).data();
				let customerBlock = (rowData.customer) ? rowData.customer : [];				

				if (customerBlock != 'all') {
					DT_CUSTOMER_LIST.rows('.selected').deselect(); // refresh customer list
					$(`#manage-block-date-by-item-customer-selection-table_wrapper th.select-checkbox`).removeClass('selected');
					let selectors = customerBlock.map(item => `[data-selector="${item.customerCode}"]`).toString();
					if (selectors) DT_CUSTOMER_LIST.rows(selectors).select(); // select customer blocked
				} else {
					$(`#manage-block-date-by-item-customer-selection-table_wrapper th.select-checkbox`).addClass('selected');
					DT_CUSTOMER_LIST.rows().select();
				}

				$('#manage-block-date-by-item-modal .overlay').fadeOut();
			}).off('deselect').on('deselect', (e, dt, type, indexes) => { $('#manage-block-date-by-item-modal .overlay').fadeIn(); });

			customerBlockTable([], 'manage-block-date-by-item-customer-table');
			customerSelectionTable(LCLDB_CUSTOMER, 'manage-block-date-by-item-customer-selection-table', 'manage-block-date-by-item-customer-table');
		}, 1000);
	});

	// save unblock item normal
	$('#manage-block-date-by-item-btn').click(function(){
		let data = DT_BLOCK_CHECK.rows().data().toArray();

		disableButton('#manage-block-date-by-item-btn');
		setTimeout(() => {
			let dateBlock = {};
			for (let i in data) {
				if (JSON.stringify(data[i].customer) != JSON.stringify(data[i].customerBackup)) { // if block is updated
					let dateKey = `${moment(data[i].blockStartDate).format('YYYY-MM-DD')} - ${moment(data[i].blockEndDate).format('YYYY-MM-DD')}`;
					dateBlock[dateKey] = {};
				}
			}

			for (let i in data) {				
				if (JSON.stringify(data[i].customer) != JSON.stringify(data[i].customerBackup)) { // if block is updated
					let dateKey = `${moment(data[i].blockStartDate).format('YYYY-MM-DD')} - ${moment(data[i].blockEndDate).format('YYYY-MM-DD')}`;
					let sizePattern = `${data[i].size} ${data[i].oldMaterialNumber}`;
					dateBlock[dateKey][sizePattern] = {};
					if (data[i].customer == 'all') dateBlock[dateKey][sizePattern] = data[i].customer; // block all
					else {
						for (let j in data[i].customer) dateBlock[dateKey][sizePattern][data[i].customer[j].customerCode] = data[i].customer[j].name1; // block specific item
						if (Object.keys(dateBlock[dateKey][sizePattern]).length==0) dateBlock[dateKey][sizePattern] = 'unblock';
					}
				}
			}

			if (Object.keys(dateBlock).length) { // there is change on block
				$('.loading-state:eq(2)').fadeIn('slow');
				manageMaterialBlock(dateBlock, 'unblockDate', (err, res) => {
					$('#manage-block-date-by-item-modal').modal('hide');
					$('.loading-state:eq(2)').fadeOut('slow');

					if (res.statusCode <= 299) {
						manageBlockDateLocal(LCLDB_MATERIAL, dateBlock);
						$('a[data-action="unblock-date-by-item"]').click();
						resultNotify('fa-check-circle', 'SUCCESS', 'Material/s successfully unblocked', 'success');
					} else if (res.statusCode >= 300) {
						console.log('\n\nerror updating block normal');
						console.log(res);
						resultNotify('fa fa-times', 'ERROR', 'Material/s not unblocked.<br>Something went wrong. Please try again later', 'danger');
					}
				});
			} else { // there is no change
				alert('There is no change from the block.');
			}
		}, 1000);
	});


	// ~~ MANAGE BLOCK DATE BY DATE GROUP
	// show unblock date group modal
	$('#unblock-date-by-date-group-modal-show').click(function() {
		if (!DT_BLOCK.rows().count()) {
			resultNotify('fa-exclamation-circle', 'INVALID', `Select date group`, 'warning');
			return;
		}

		$('#unblock-date-by-date-group-modal').modal();

		setTimeout(() => {
			let data = DT_BLOCK.rows().data().toArray();
			$('#affected-date-groups2').html(`${moment(data[0].blockStartDate).format('MMM DD, YYYY')} - ${moment(data[0].blockEndDate).format('MMM DD, YYYY')}`);
			DT_BLOCK_CHECK = $('#check-unblock-date-by-date-group-table').DataTable({
				destroy        : true,
				data           : data,
				order          : [],
				autoWidth      : false,
				scrollX        : true,
				scrollY        : 350,
				deferRender    : true,
				scroller       : true,
				scrollCollapse : true,
				dom            : 'rti',

				columns : [
					{ data: 'materialCode', title: 'BCP', width: 40 },
					{ data: 'size', title: 'Size' },
					{ data: 'oldMaterialNumber', title: 'Pattern', width: 40 }
					],
				rowCallback: (row, data, index) => { $(row).attr('id', data.id); }
			});
		}, 1000);
	});

	// save unblock group normal
	$('#unblock-date-by-date-group-btn').click(function(){
		$('.loading-state:eq(3)').fadeIn('slow');
		disableButton('#unblock-date-by-date-group-btn');

		setTimeout(() => {
			let data = DT_BLOCK_CHECK.rows().data().toArray();
			let startDate = moment(data[0].blockStartDate).format('YYYY-MM-DD');
			let endDate = moment(data[0].blockEndDate).format('YYYY-MM-DD');
			let unblock = {};
			for (let i in data) unblock[`${data[i].size} ${data[i].oldMaterialNumber}`] = true;

			manageMaterialBlock({dateKey: `${startDate} - ${endDate}`}, 'unblockDateByDateGroup', (err, res) => {
				$('#unblock-date-by-date-group-modal').modal('hide');
				$('.loading-state:eq(3)').fadeOut('slow');

				if (res.statusCode <= 299) {
					unblockDateLocal(LCLDB_MATERIAL, unblock);
					$('a[data-action="unblock-date-by-group"]').click();
					resultNotify('fa-check-circle', 'SUCCESS', 'Material/s successfully unblocked', 'success');
				} else if (res.statusCode >= 300) {
					console.log('\n\nerror updating block normal');
					console.log(res);
					resultNotify('fa fa-times', 'ERROR', 'Material/s not unblocked.<br>Something went wrong. Please try again later', 'danger');
				}
			});
		}, 1000);
	});


	// date range button
	$('#daterange-block-btn').daterangepicker({}, function(start, end) {
		$('#daterange-block-btn').closest('.input-group').find('input')
		.val(`${start.format('MMM DD,YYYY')} - ${end.format('MMM DD,YYYY')}`)
		.attr('data-startdate', moment(start).toISOString())
		.attr('data-enddate', moment(end).toISOString());
	});

	function blockNormalLocal(arr, sizePattern) {
		for (let i in sizePattern) {
			let toUpdate = arr.filter(item => `${item.size} ${item.oldMaterialNumber}`==i);
			let customer = sizePattern[i];
			if (typeof customer == 'object') { // if not blocked to all
				// change obj to array
				let customerArr = [];
				for (let j in customer) customerArr.push({ customerCode : j, name1 : customer[j] });
				customer = customerArr;
			}

			for (let j in toUpdate) {
				let index = arr.findIndex(item => item.materialCode == toUpdate[j].materialCode);
				arr[index].isBlock = true;
				arr[index].blockType = 'normal';
				arr[index].customer = customer;
			}
		}
	}

	function blockDateLocal(arr, sizePattern, startDate, endDate) {
		for (let i in sizePattern) {
			let toUpdate = arr.filter(item => `${item.size} ${item.oldMaterialNumber}`==i);
			let customer = sizePattern[i];
			if (typeof customer == 'object') { // if not blocked to all
				// change obj to array
				let customerArr = [];
				for (let j in customer) customerArr.push({ customerCode : j, name1 : customer[j] });
				customer = customerArr;
			}

			for (let j in toUpdate) {
				let index = arr.findIndex(item => item.materialCode == toUpdate[j].materialCode);
				arr[index].isBlock = true;
				arr[index].blockType = 'date';
				arr[index].customer = customer;
				arr[index].blockStartDate = startDate;
				arr[index].blockEndDate = endDate;
			}
		}
	}

	function manageBlockNormalLocal(arr, sizePattern) {
		for (let i in sizePattern) {
			let toUpdate = arr.filter(item => `${item.size} ${item.oldMaterialNumber}`==i);
			let customer = sizePattern[i];
			if (typeof customer == 'object') { // if not blocked to all
				// change obj to array
				let customerArr = [];
				for (let j in customer) customerArr.push({ customerCode : j, name1 : customer[j] });
				customer = customerArr;
			}

			for (let j in toUpdate) {
				let index = arr.findIndex(item => item.materialCode == toUpdate[j].materialCode);
				if (customer == 'unblock') delete arr[index].isBlock, arr[index].blockType, arr[index].customer, arr[index].blockStartDate, arr[index].blockEndDate;
				else arr[index].customer = customer;
			}
		}
	}

	function manageBlockDateLocal(arr, dateBlock) {
		for (let i in dateBlock) {
			let sizePattern = dateBlock[i];
			for (let j in sizePattern) {
				let toUpdate = arr.filter(item => `${item.size} ${item.oldMaterialNumber}`==j);
				let customer = sizePattern[j];
				if (typeof customer == 'object') { // if not blocked to all
					// change obj to array
					let customerArr = [];
					for (let k in customer) customerArr.push({ customerCode : k, name1 : customer[k] });
					customer = customerArr;
				}

				for (let k in toUpdate) {
					let index = arr.findIndex(item => item.materialCode == toUpdate[k].materialCode);
					if (customer == 'unblock') delete arr[index].isBlock, arr[index].blockType, arr[index].customer, arr[index].blockStartDate, arr[index].blockEndDate;
					else arr[index].customer = customer;
				}
			}
		}
	}

	function unblockDateLocal(arr, sizePattern) {
		for (let i in sizePattern) {
			let toUpdate = arr.filter(item => `${item.size} ${item.oldMaterialNumber}`==i);
			for (let j in toUpdate) {
				let index = arr.findIndex(item => item.materialCode == toUpdate[j].materialCode);
				delete arr[index].isBlock;
				delete arr[index].blockType;
				delete arr[index].blockStartDate;
				delete arr[index].blockEndDate;
			}
		}
	}
});