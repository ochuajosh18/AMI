checkSession();
setUserData();

$(document).ready(function() {
	let LCLDB_MATERIAL, DT_MATERIAL, DT_EXPORT;
	const config = {
    	// db : 'offline'
	    db : 'couchbase'
	};

	loadMaterialTable();

	// load material page
	function loadMaterialTable() {
		let data;

		if (config.db == 'couchbase') {
			loadMaterialMasterData((err, res) => {
				data = res;
				LCLDB_MATERIAL = res;
				console.log(data)
			});
		} else if (config.db == 'offline') {
			data = offlineDB;
			LCLDB_MATERIAL = offlineDB;
		} else if (config.db == 'local') {
			data = LCLDB_MATERIAL;
		}

		exportData = JSON.parse(JSON.stringify(data));
		loadExportTable(exportData);

		data = removeduplicate_2(data, 'size', 'oldMaterialNumber');
		DT_MATERIAL = $('#material-table').DataTable({
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
				{ data: 'materialGroup', title: 'Material<br>group', width: 60 },
				{ data: 'storageLocation', title: 'Storage<br>location', width: 60 },
				{ data: 'stocks', title: 'Stock', defaultContent: '', width: 60 },
				{ data: 'stocks', title: 'Same<br>item', defaultContent: '', width: 60 }
			],

			columnDefs:
			[
				{ targets: [5, 6, 7, 8], className: 'dt-center' }, // matGroup, storage, stock, count
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
					render: (data, type, row) => {
						data = data.reduce((sum, stock) => { return sum + parseInt(stock.totalStock); }, 0);
						return  '<b>' + convertToNumber(data, 'whole') + '</b>'; 
					}
				},
				{ // count
					targets: 8,
					render: (data, type, row) => '<span class="badge bg-light-blue" >'+data.length+'</span>'
				}
			],
			rowCallback: (row, data, index) => { $(row).attr('id', data['id']); }
		});

		$('#material-table tbody').off('click').on('click', 'td.details-control', function() {
			let tr = $(this).closest('tr'), row = DT_MATERIAL.row(tr);

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

		$('#material-table-filter').off('keyup').keyup(function(){ DT_MATERIAL.search($(this).val()).draw(); });
		$('.loading-state').fadeOut('slow');
	}

	function loadExportTable(data) {
		DT_EXPORT = $('#material-export-table').DataTable({
			destroy        : true,
			data           : data,
			order          : [[ 5, "desc" ]],
			autoWidth      : false,
			scrollX        : true,
			scrollY        : 350,
			scrollCollapse : true,
			deferRender    : true,
			scroller       : true,
			dom            : 'rti',

			columns: [
				{ data: 'materialCode', title: 'BCP', width: 80 },
				{ data: 'size', title: 'Size' },
				{ data: 'oldMaterialNumber', title: 'Pattern', width: 80 },
				{ data: 'materialGroup', title: 'Material group', width: 60 },
				{ data: 'storageLocation', title: 'Storage location', width: 60 },
				{ data: 'individualStock.totalStock', title: 'Stock', defaultContent: '', width: 60 },
			],

			/*columnDefs: [
				{ targets: [4, 5, 6], className: 'dt-center' }, // matGroup, storage, stock
				{ // matcode
					targets: 0,
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
				}
			],*/
			buttons: [
				{
					extend    : 'excel',
					text      : '<span style="color: white; font-weight: bolder;"><i class="fa fa-file-excel-o"></i> Excel</span>', 
					className : 'btn btn-warning btn-sm btn-flat',
					footer    : true
				}
			]
		});

		DT_EXPORT.buttons().container().appendTo('.material-table-tools');
	}

	// for expand row
	function format(data) {
		console.log(data)
		let stocks = data.stocks;
		let code = `<div class="col-lg-6"><span class="info-box-number">${stocks.length} items</span>`;

		console.log(stocks)
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
});