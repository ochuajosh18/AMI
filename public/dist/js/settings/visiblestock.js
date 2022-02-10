$(document).ready(function() {
	let LCLDB_MATERIAL, DT_MATERIAL, LCLDB_VISIBLESTOCK, LCLDB_ALL_MAX_ORDER_QUANTITY, LCLDB_ALL_MAX_ORDER_QUANTITY_THRESHOLD;

	const config = {
	    // db : 'offline'
	    db : 'couchbase'
	};

	// load visible stock
	/*loadStock('VISIBLE::STOCK::e1c40730-4cc6-4061-a23a-4dbe96fdc418', (err, res) => {
		if (err || res.statusCode >= 300) { alert('Unable to get stock'); }
		else if (res.statusCode <= 299) { LCLDB_VISIBLESTOCK = parseInt(res.result.stock); }
	});*/

	//load max order quantity
	loadMaxOrderQuantity('MAXORDER::QUANTITY::20473c37-6bdf-4883-88d4-d6d44f9de1b8', (err, res) => {
		if (err || res.statusCode >= 300) { end = true; return }
		else if (res.statusCode <= 299) { 
			LCLDB_ALL_MAX_ORDER_QUANTITY_THRESHOLD = res.result.maxOrderQuantityThreshold;
			LCLDB_ALL_MAX_ORDER_QUANTITY = parseInt(res.result.maxOrderQuantity); 
		}
	});

	enableHelpFunction();
	loadStockData();
	loadMaterialTable();

	function loadStockData() {
		let data;

		if (config.db == 'couchbase') {
			loadStock('VISIBLE::STOCK::e1c40730-4cc6-4061-a23a-4dbe96fdc418', (err, res) => {
				if (err || res.statusCode >= 300) { end = true; return };

				if (res.statusCode <= 299) { LCLDB_VISIBLESTOCK = parseInt(res.result.stock); data = parseInt(res.result.stock);
					console.log(data)
				}
			});
		} else if (config.db == 'local') {
			data = LCLDB_VISIBLESTOCK;
			console.log(data)
		} else {
			LCLDB_VISIBLESTOCK = offlineDB;
			data = offlineDB;
		}
	}

	function loadMaterialTable() {

		let data;
		let thresholdData = LCLDB_ALL_MAX_ORDER_QUANTITY_THRESHOLD;

		if (config.db == 'couchbase') {
			loadAllMaterial((err, res) => {
				if (err || res.statusCode >= 300) { end = true; return };

				if (res.statusCode <= 299) { LCLDB_MATERIAL = res.result; data = res.result;
					console.log(data)
				}
			});
		} else if (config.db == 'local') {
			data = LCLDB_MATERIAL;
			console.log(data)
		} else {
			LCLDB_MATERIAL = offlineDB;
			data = offlineDB;
		}

		for (let i in data) {
			data[i].visibleStock = LCLDB_VISIBLESTOCK;

			if(!data[i].maxOrderQuantity){ data[i].maxOrderQuantity = LCLDB_ALL_MAX_ORDER_QUANTITY }
			
			for(let x in thresholdData){
				if(data[i].stock >= parseInt(thresholdData[x].minimumStockLevel) && data[i].stock <= parseInt(thresholdData[x].maximumStockLevel)){
					data[i].maxOrderQuantity = thresholdData[x].maxOrderQty;
				}
			}
		}

		data = removeduplicate_2(data, 'size', 'oldMaterialNumber');
		DT_MATERIAL = $('#material-table').DataTable({
			destroy        : true,
			data           : data,
			order          : [[ 4, "desc" ]],
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
				{ data: 'oldMaterialNumber', title: 'Pattern' },
				{ data: 'materialGroup', title: 'Material<br>group' },
				{ data: 'storageLocation', title: 'Storage<br>location' },
				{ data: 'stock', title: 'Stock', defaultContent: '' },
				{ data: 'visibleStock', title: 'Visible Stock', defaultContent: '' },
				{ data: 'maxOrderQuantity', title: 'Max Order Quantity', defaultContent: '' }
			],

			columnDefs:
			[
				{ targets: [3, 4, 5, 6, 7], className: 'dt-center' }, // matGroup, storage, stock, count, maxorderquantity
				{ // stock
					targets: 5,
					render: (data, type, row) => {
						let stock = data;
						return `<b>${convertToNumber(stock, 'whole')}</b>`
					}
				},
				{ // visibleStock
					targets: 6,
					render: (data, type, row) => {
						data = (row.stock >= row.visibleStock) ? row.visibleStock : row.stock;
						return `<b>${convertToNumber(data, 'whole')}</b>`
					}
				},
				{ // maxOrderQuantity
					targets: 7,
					orderable: false,
					render: (data, type, row) => {
						return `<b>${data}</b>`
					}
				}
			],
			buttons: [
				{ 
					extend: 'excel',
					text: '<span style="color: white; font-weight: bolder;" id="btn-excel"><i class="fa fa-file-excel-o"></i> Excel</span>', 
					title : `Visible Stock ${moment().format('MM-DD-YYYY')}`,
			    	filename : `Visible Stock ${moment().format('MM-DD-YYYY')}`,
					className: 'btn btn-warning btn-sm btn-flat' 
				}
			],
			rowCallback: (row, data, index) => {
				$(row).attr('id', data['id']);
			}
		});

		// custom search and buttons -outside datatable
		DT_MATERIAL.buttons().container().appendTo('#material-table-buttons');
		$('#material-table-filter').keyup(function(){
		    DT_MATERIAL.search($(this).val()).draw() ;
		});

		$('.loading-state').fadeOut('slow');
	}

	$('#btn-help').click(function(event){
		let helptype = $(this).attr('data-help');
		helpCarousel(helptype)
	});

	$('#save-visible-stock-all-btn').click(function(){
		let visibleStockAll = $('#visible-stock-all').val();

		$('.loading-state').fadeIn('slow');
		disableBtn($(this));

		setTimeout(() => {
			let changes = {
				stock : visibleStockAll
			}

			updateStock('VISIBLE::STOCK::e1c40730-4cc6-4061-a23a-4dbe96fdc418', changes, (err, res) => {
				setTimeout(() => { enableBtn($(this)); }, 1000);

				if (err || res.statusCode >= 300) {
					console.log(res);
					$('.loading-state').fadeOut('slow');
					resultNotify('fa fa-times', 'ERROR', 'Visible stock not updated.<br>Something went wrong. Please try again later', 'danger');
					return;
				}

				if (res.statusCode <= 299) {
					$('.loading-state').fadeOut('slow');
					resultNotify('fa-check-circle', 'SUCCESS', 'Visible stock successfully updated', 'success');
					if (LOG_FUNCTION) {	
						createLog(`LOG::${LOCAL_STORAGE.referenceId}`, {
							dateCreated : moment().toISOString(),
							action : `Set visible stock from ${LCLDB_VISIBLESTOCK} to ${visibleStockAll}`,
							module : "Settings/Visible Stock",
							app : "AMI"
						}, moment().toISOString());
					}
					
					config.db = 'local';
					updateStockLocal(changes);
					setTimeout(function(){ loadMaterialTable(); }, 2000);
				}
			});
			
			/*config.db = 'local';
			updateStockLocal(changes);
			setTimeout(function(){ loadMaterialTable(); }, 2000);*/
		}, 1000);
	});

	// update stock on local array
	function updateStockLocal({ stock }) {
		LCLDB_VISIBLESTOCK = stock;
		console.log(LCLDB_VISIBLESTOCK)
	}

});

function numberOnly(id) {
    var element = document.getElementById(id);
    var regex = /[^0-9]/g;

    
    element.value = element.value.replace(regex, "");
}