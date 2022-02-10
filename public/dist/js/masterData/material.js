$(document).ready(function() {
	var LCLDB_MATERIAL, DT_MATERIAL, DT_EXPORT;

	const config = {
	    // db : 'offline'
	    db : 'couchbase'
	};

	loadMaterialTable();

	function loadMaterialTable() {

		let data;

		if (config.db == 'couchbase') {
			loadAllMaterial((err, res) => {
				if (err || res.statusCode >= 300) { end = true; return };

				if (res.statusCode <= 299) { LCLDB_MATERIAL = res.result; data = res.result;
				}
			});
		} else if (config.db == 'local') {
			data = LCLDB_MATERIAL;
		} else {
			LCLDB_MATERIAL = offlineDB;
			data = offlineDB;
		}

		exportData = JSON.parse(JSON.stringify(data));
		loadExportTable(exportData);

		data = removeduplicate_3(data, 'size', 'oldMaterialNumber', 'country');
		DT_MATERIAL = $('#material-table').DataTable({
			destroy        : true,
			data           : data,
			order          : [[ 8, "desc" ]],
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
				{ data: 'country', title: 'Country', defaultContent: 'none', width: 60 },
				{ data: 'stock', title: 'Stock', defaultContent: '', width: 60 },
				{ data: 'sameitem', title: 'Same<br>item', defaultContent: '', width: 60 }
			],

			columnDefs:
			[
				{ targets: [5, 6, 8, 9], className: 'dt-center' }, // matGroup, storage, stock, count
				{ // expand
					targets: 0, className: 'details-control dt-center', orderable: false,
					render: (data, type, row) => '<i class="fa fa-plus-circle text-green" aria-hidden="true" style="font-size: 16px;"></i>'
				},
				{ // matcode
					targets: 1,
					render: (data, type, row) => {
						str =  data.slice(0, 3);
						str += '-' + row.size.trim().replace(/-/g, " ").replace(/\s+/g, '-');
						str += '-' + row.country

						row.usedMaterialCode = str;
						return str;
					}
				},
				{ // stock
					targets: 8,
					render: (data, type, row) => {
						return  '<b>' + convertToNumber(data, 'whole') + '</b>';
					}
				},
				{ // count
					targets: 9,
					render: (data, type, row) => `<span class="badge bg-light-blue" >${data}</span>`
				}
			],
			rowCallback: (row, data, index) => {
				$(row).attr('id', data['id']);
			}
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

		// custom search and buttons -outside datatable
		$('#material-table-filter').keyup(function(){
		    DT_MATERIAL.search($(this).val()).draw() ;
		});

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
				{ data: 'country', title: 'Country', defaultContent: 'none', width: 60 },
				{ data: 'stockOwn', title: 'Stock', defaultContent: '', width: 60 ,
					render: function ( data, type, row, meta ) {
						let stock = row.stockOwn
						return convertToNumber(parseInt(stock), 'whole');
				  	}
				},
			],
			buttons: [
				{
					extend    : 'excel',
					footer    : true,
					text      : '<span style="color: white; font-weight: bolder;" id="btn-excel"><i class="fa fa-file-excel-o"></i> Excel</span>',
					title     : `Material Master Data ${moment().format('MM-DD-YYYY')}`,
			    	filename  : `Material Master Data ${moment().format('MM-DD-YYYY')}`,
					className : 'btn btn-warning btn-sm btn-flat'
				}
			],
		});

		DT_EXPORT.buttons().container().appendTo('#material-table-buttons');
	}

	// for expand row
	function format(data) {
		console.log('data : ', data)
		let material = LCLDB_MATERIAL.filter(item => item.combination == data.combination);
		material.sort((a, b) => (b.stockOwn) - (a.stockOwn));
		console.log('material : ', material)

		let code = `<div class="col-lg-6"><table class="table nowrap table-responsive table-bordered" style="margin-bottom: 0px;">`;
		for (let i in material) {
			let stock = material[i].stockOwn

			code +=
			`<tr>
			<td>${material[i].materialCode}</td>
			<td>${material[i].size}</td>
			<td>${material[i].oldMaterialNumber}</td>
			<td>${material[i].materialGroup}</td>
			<td>${material[i].storageLocation}</td>
			<td>${material[i].country}</td>
			<td class="dt-right"><b>${convertToNumber(parseInt(stock), 'whole')}</b></td>
			</tr>`;
		}

		code += `</table></div>`;

		return code;
	}

});