$(document).ready(function() {
	let DB_ORDER_MATERIAL, LCLDB_ORDER_MATERIAL;
	const config = {
		db : 'offline'
	};

	loadOrderMaterialTable('couchbase');

	function loadOrderMaterialTable(database) {
		const table_config = {
			selectedRows : 0
		};

		let data, selectCount = 0;

		if (database == 'couchbase') {
			loadOrderMaterialRelation(function(err, res){
				try {
					if (res instanceof Array) {
						LCLDB_ORDER_MATERIAL = res;
						data = res;
						data = LCLDB_ORDER_MATERIAL.filter(function(item) {
							return !item.oldMaterialNumber;
						});
					} else {
						throw 'Unable to get order list';
					}
				} catch (err) {
					alert('Something went wrong\n' + err);
					console.log(err);
					console.log(res);
				}
			});
		} else  if (database == 'complete doc') {
			console.log('complete doc');
			data = LCLDB_ORDER_MATERIAL.filter(function(item) {
				return item.oldMaterialNumber;
			});
		} else  if (database == 'incomplete doc') {
			console.log('complete doc');
			data = LCLDB_ORDER_MATERIAL.filter(function(item) {
				return !item.oldMaterialNumber;
			});
		} else {
			console.log('show all');
			data = LCLDB_ORDER_MATERIAL;
		}

		if (data) {
			DB_ORDER_MATERIAL = $('#order-material-table').DataTable({
				destroy        : true,
				data           : data,
				order          : [1, "asc"],
				autoWidth      : false,
				scrollX        : true,
				scrollY        : 300,
				scrollCollapse : true,
				deferRender    : true,
				scroller       : true,
				lengthChange   : false,
				dom            : "rti",

				columns  :
				[
					{data: 'id'},
					{data: 'salesOrderNo', width: '50'},
					{data: 'salesOrderItemNo', width: '10'},
					{data: 'materialCode', width: '50'},
					{data: 'sizePattern', defaultContent : ''},
					{data: 'size', defaultContent : ''},
					{data: 'oldMaterialNumber', defaultContent : '', width: '50'},
					{data: 'materialGroup', defaultContent : '', width: '50'},
					{data: 'storageLocation', defaultContent : '', width: '50'},
					// material
					{data: 'material_oldMaterialNumber', defaultContent : '', width: '50'},
					{data: 'material_materialGroup', defaultContent : '', width: '50'},
					{data: 'material_storageLocation', defaultContent : '', width: '50'},
				], 

				columnDefs: 
				[
					{
						className : 'dt-center', 
						targets   : [1, 2]
					},
					{
						className : 'check-blank', 
						targets   : [4, 5, 6, 7, 8]
					},
					{
						className : 'check-blank2', 
						targets   : [9, 10, 11]
					},
					{
						visible : false,
						targets : 0
					}
				],

				select : { 
					'style'    : 'multi'
				},

				rowCallback : function (row, data, iDataIndex) {
					$(row).find('.check-blank').each(function(index, el) {
						if (!$(this).text()) {
							$(this).addClass('danger')
						}
					});
					
					$(row).find('.check-blank2').each(function(index, el) {
						if (!$(this).text()) {
							$(this).addClass('warning')
						}
					});

					if (data.oldMaterialNumber == data.material_oldMaterialNumber) {
						$(row).addClass('success')
					} else if (selectCount != table_config.selectedRows) {
						selectCount++;
						$(row).addClass('selected')
					}
				},
				initComplete : function(settings, json) { $(this).find('tbody tr').css('cursor', 'pointer'); }
			});
		}

		$('.loading-state').fadeOut('slow');
	}

	
	$('#order-material-table-filter').keyup(function(){
      	DB_ORDER_MATERIAL.search($(this).val()).draw() ;
	})

	$('#map-btn').click(function(event) {
		$('.loading-state').fadeIn('slow');

		setTimeout(function() { 
			let data, updateData, succesCounter = 0, 
			tableData = DB_ORDER_MATERIAL.rows('.selected').data().toArray();

			for (let i in tableData) {
				data = tableData[i];

				updateData = {
					materialGroup : data.material_materialGroup,
					oldMaterialNumber : data.material_oldMaterialNumber,
					storageLocation : data.material_storageLocation
				}

				
				updateDocument(data.id, updateData, function(err, res){
					console.log(res);
					if (res.statusCode <= 299) {
						succesCounter++;
					} else if (res.statusCode >= 300) {
						isSuccess = false;
						console.log('error updating order');
						console.log(data.id);
						resultNotify('fa fa-times', 'ERROR', 'Order/s not updated.<br>Something went wrong. Please try again later', 'danger');
					}
				});
			}

			setTimeout(function() { alert(succesCounter + ' / ' + tableData.length); }, 500);
			loadOrderMaterialTable('couchbase');
		}, 1000);
	});


	$('#show-all-btn').click(function(event) {
		$('.loading-state').fadeIn('slow');
		setTimeout(function() {
			loadOrderMaterialTable(null);
		}, 500);
	});

	$('#comlpete-doc-btn').click(function(event) {
		$('.loading-state').fadeIn('slow');
		setTimeout(function() {
			loadOrderMaterialTable('complete doc');
		}, 500);
	});

	$('#incomlpete-doc-btn').click(function(event) {
		$('.loading-state').fadeIn('slow');
		setTimeout(function() {
			loadOrderMaterialTable('incomplete doc');
		}, 500);
	});
});