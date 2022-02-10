$(document).ready(function(){
	let LCLDB_MATERIAL, LCLDB_VISIBLESTOCK, LCLDB_ALL_MAX_ORDER_QUANTITY, LCLDB_ALL_MAX_ORDER_QUANTITY_THRESHOLD;
	let DT_MATERIAL, DT_THRESHOLD;
	let OLD_THRESHOLD_DATA, INITIAL_MATERIAL_DATA;
    
    const config = {
	    // db : 'offline'
	    db : 'couchbase'
	};
	
	loadStockData();
	loadMaxOrderQuantityData();
	loadMaterialTable();
	enableHelpFunction();
	$("[data-toggle=popover]").popover();
	
	function loadStockData() {
		let data;

		if (config.db == 'couchbase') {
			loadStock('VISIBLE::STOCK::e1c40730-4cc6-4061-a23a-4dbe96fdc418', (err, res) => {
				if (err || res.statusCode >= 300) { end = true; return };
				if (res.statusCode <= 299) { LCLDB_VISIBLESTOCK = parseInt(res.result.stock); data = parseInt(res.result.stock); }
			});
		} 
		else if (config.db == 'local') { data = LCLDB_VISIBLESTOCK; } 
		else { LCLDB_VISIBLESTOCK = offlineDB; data = offlineDB; }
	}

	function loadMaxOrderQuantityData() {
		loadMaxOrderQuantity('MAXORDER::QUANTITY::20473c37-6bdf-4883-88d4-d6d44f9de1b8', (err, res) => {
			if (err || res.statusCode >= 300) { end = true; return };

			if (res.statusCode <= 299) { 
				LCLDB_ALL_MAX_ORDER_QUANTITY_THRESHOLD = res.result.maxOrderQuantityThreshold;
				LCLDB_ALL_MAX_ORDER_QUANTITY = parseInt(res.result.maxOrderQuantity); 
				loadThreshold(LCLDB_ALL_MAX_ORDER_QUANTITY_THRESHOLD);
				OLD_THRESHOLD_DATA = DT_THRESHOLD.rows().data().toArray();
			}
		});
	}

    function loadMaterialTable() {
		let data;
		let thresholdData = LCLDB_ALL_MAX_ORDER_QUANTITY_THRESHOLD;

		if (config.db == 'couchbase') {
			loadAllMaterialWithMaxOrderQuantity((err, res) => {
				if (err || res.statusCode >= 300) { end = true; return };
				if (res.statusCode <= 299) { LCLDB_MATERIAL = res.result; data = res.result; }
				
			});
		} 
		else if (config.db == 'local') { data = LCLDB_MATERIAL; } 
		else { LCLDB_MATERIAL = offlineDB; data = offlineDB; }

		for (let i in data) {
			data[i].visibleStock = LCLDB_VISIBLESTOCK;
			data[i].withAssignedMaxOrderQuantity = true;

			if(!data[i].maxOrderQuantity){
				data[i].maxOrderQuantity = LCLDB_ALL_MAX_ORDER_QUANTITY;
				data[i].withAssignedMaxOrderQuantity = false;
			}
			
			// set max order quantity based on threshold values
			for(let x in thresholdData){
				if(data[i].stock >= parseInt(thresholdData[x].minimumStockLevel) && data[i].stock <= parseInt(thresholdData[x].maximumStockLevel)){
					data[i].maxOrderQuantity = thresholdData[x].maxOrderQty;
				}
			}
		}
		INITIAL_MATERIAL_DATA = data;
		data = removeduplicate_2(data, 'size', 'oldMaterialNumber');
		if(DT_MATERIAL) DT_MATERIAL.clear();
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
				{ data: 'materialCode', title: 'Material code', width: 100 },
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
				{ targets: [4, 5, 6 , 7, 8], className: 'dt-center' }, // matGroup, storage, stock, count, maxorderquantity
				{ // matcode
					targets: 0,
					render: (data, type, row) => {
						str =  data.slice(0, 3);
						str += `-${row.size.trim().replace(/-/g, " ").replace(/\s+/g, '-')}-${row.country}`;

						row.usedMaterialCode = str;
						return str;
					}
				},
				{ // stock
					targets: 6,
					render: (data, type, row) => {
						let stock = data;
						return `<b>${convertToNumber(stock, 'whole')}</b>`
					}
				},
				{ // visibleStock
					targets: 7,
					render: (data, type, row) => {
						data = (row.stock >= row.visibleStock) ? row.visibleStock : row.stock;
						return `<b>${convertToNumber(data, 'whole')}</b>`
					}
				},
				
				{ // maxOrderQuantity
					targets: 8,
					orderable: false,
					render: (data, type, row, meta) => {
						let index = null;
						index = meta.row;
						return `<input class="form-control input-max-order-qty" type="hidden" value='${data}'>
								<b class="order-quantity-text">${data}</b>
								<button type="button" class="btn btn-sm btn-default btn-flat save-max-order-quantity-btn">SAVE</button>
								<span class='max-order-quantity-span'><i class="fa fa-pencil-square-o" aria-hidden="true"></i><span>`
					}
				}
			],
			rowCallback: (row, data, index) => {
				$(row)
				.attr('id', data['id'])
				.attr('index', index)
				.find('input.input-max-order-qty')
				.on("input", function(e) {
					$(this).val(function(i, v) {
						return v.replace(/[^\d]/gi, '');
					});
				});
			}
		});

		// custom search and buttons -outside datatable
		$('#material-table-filter').keyup(function(){
		    DT_MATERIAL.search($(this).val()).draw();
		});

		$('.general-tab-loading-state').fadeOut('slow');
	}

	function loadThreshold(response){
		if(response.length <= 3){ $('#remove-threshold').prop('disabled', true); }
		$('#save-max-order-quantity-threshold').prop('disabled', true); //disable save button by default

		if(DT_THRESHOLD) DT_THRESHOLD.clear();
		DT_THRESHOLD = $('#threshold-table').DataTable({
			destroy        : true,
			data           : response,
			order          : [],
			autoWidth      : false,
			scrollX        : true,
			scrollY        : 350,
			scrollCollapse : false,
			deferRender    : true,
			scroller       : true,
			dom            : 'rti',
			info		   : false,

			columns: [
				{ data: 'minimumStockLevel', title: 'Minumum Stock Level' },
				{ data: 'maximumStockLevel', title: 'Maximum Stock Level' },
				{ data: 'maxOrderQty', title: 'Max Order QTY' },
			],

			columnDefs:
			[
				{
					targets: 0,
					orderable: false,
					render: (data, type, row, meta) => {
						let index = meta.row + 1;
						return  `<div class="threshold-div">
									<div>
										<button class="btn btn-default btn-flat stock-level-${index} threshold" id="minus-minimum-stock-level-${index}-btn">
											<i class="fa fa-minus"></i>
										</button>
									</div>
									<div>
										<input type="text" class="form-control threshold" value="${data}" id="minimum-stock-level-${index}">
									</div>
									<div>
										<button class="btn btn-default btn-flat stock-level-${index} threshold" id="add-minimum-stock-level-${index}-btn">
											<i class="fa fa-plus"></i>
										</button>
									</div>
								</div>`;
					}
				},
				{
					targets: 1,
					orderable: false,
					render: (data, type, row, meta) => {
						let index = meta.row + 1;
						return  `<div class="threshold-div">
									<div>
										<button class="btn btn-default btn-flat stock-level-${index} threshold" id="minus-maximum-stock-level-${index}-btn">
											<i class="fa fa-minus"></i>
										</button>
									</div>
									<div>
										<input type="text" class="form-control threshold" value="${data}" id="maximum-stock-level-${index}">
									</div>
									<div>
										<button class="btn btn-default btn-flat stock-level-${index} threshold" id="add-maximum-stock-level-${index}-btn">
											<i class="fa fa-plus"></i>
										</button>
									</div>
								</div>`;
					}
				},
				{
					targets: 2,
					orderable: false,
					render: (data, type, row, meta) => {
						let index = meta.row + 1;
						return  `<div class="threshold-div">
									<div>
										<input type="text" class="form-control threshold" value="${data}" id="max-order-quantity-${index}">
									</div>
								</div>`;
					}
				}
			],
			rowCallback: (row, data, index) => {
				$(row)
				.attr('id', data['id'])
				.find('input.threshold')
				.on("input", function(e) {
					$(this).val(function(i, v) {
						return v.replace(/[^\d]/gi, '');
					});
				});
			}
		});

		for(let x in response){
			let index = parseInt(x)+1;
			if($(`#minimum-stock-level-${index}`).val() == 0){ $(`#minus-minimum-stock-level-${index}-btn`).prop('disabled', true); }
			if($(`#maximum-stock-level-${index}`).val() == 0){ $(`#minus-maximum-stock-level-${index}-btn`).prop('disabled', true); }
		}

		$('.threshold-tab-loading-state').fadeOut('hide');
	}

	// help modal
	$('#btn-help-multiple').attr('data-content', 
		`<a><h6 id="btn-setup-threshold" data-toggle="modal" data-target="#modal-default" data-help="maxOrderQuantity" style="cursor: pointer;">How to setup threshold</h6></a>
		<a><h6 id="btn-setup-max-order-quantity" data-toggle="modal" data-target="#modal-default" data-help="maxOrderQuantity" style="cursor: pointer;">How to setup max order</h6></a>`
	);

	$(document).on("click", "#btn-setup-threshold", function(event) {
		let helptype = $('#btn-setup-threshold').attr('data-help');
		helpCarouselMultiple(helptype, 'threshold')
    });

    $(document).on("click", "#btn-setup-max-order-quantity", function(event) {
		let helptype = $('#btn-setup-max-order-quantity').attr('data-help');
		helpCarouselMultiple(helptype, 'maxOrder')
    });
	
	$('.max-order-quantity-tabs').click(function() {
		if (DT_MATERIAL) DT_MATERIAL.clear().draw(); // clear table if already initialized
		if (DT_THRESHOLD) DT_THRESHOLD.clear().draw();
		LCLDB_ALL_MAX_ORDER_QUANTITY_THRESHOLD = OLD_THRESHOLD_DATA.filter(data => data != null || data != '');
		$('.general-tab-loading-state, .threshold-tab-loading-state').fadeIn();

		setTimeout(() => {
			loadMaterialTable();
			loadThreshold(LCLDB_ALL_MAX_ORDER_QUANTITY_THRESHOLD);
		}, 1000);
	});

	// toggle edit and save button per sku
	$('#material-table').on('click', '.max-order-quantity-span', function(){
		const rowId = DT_MATERIAL.row($(this).parent()).data().id;
		const maxOrderQuantityValue = DT_MATERIAL.row(`[id="${rowId}"]`).data().maxOrderQuantity;
		let rownode = DT_MATERIAL.row(`[id="${rowId}"]`).nodes().to$();
		rownode.find('.max-order-quantity-span').hide();
		rownode.find('.order-quantity-text').hide();
		rownode.find('.input-max-order-qty').prop('type', 'text').val(maxOrderQuantityValue);
		rownode.find('.save-max-order-quantity-btn').show().prop('disabled', true);
	});
	
	// enable and disable save button per sku
	$('#material-table').on('input', '.input-max-order-qty', function(){
		const maxOrderQtyValue = $(this).val();
		const rowId = DT_MATERIAL.row($(this).parent()).data().id;
		const rowData = DT_MATERIAL.row(`[id="${rowId}"]`).data();
		let rownode = DT_MATERIAL.row(`[id="${rowId}"]`).nodes().to$();
		rownode.find('.save-max-order-quantity-btn').show().prop('disabled', true);
	
		if((maxOrderQtyValue !== '') && (rowData.maxOrderQuantity != maxOrderQtyValue)){
			rownode.find('.save-max-order-quantity-btn').show().prop('disabled', false);
		}
	});

	// save max order quantity per sku
	$('#material-table').on('click', '.save-max-order-quantity-btn', function(){
		const index = $(this).closest('td').parent()[0].sectionRowIndex;
		const rowId = DT_MATERIAL.row($(this).parent()).data().id;
		let rowData = DT_MATERIAL.row($(this).parent()).data();
		let rownode = DT_MATERIAL.row(`[id="${rowId}"]`).nodes().to$();
		let maxOrderQuantity = rownode.find('.input-max-order-qty').val();	
		let thresholdData = LCLDB_ALL_MAX_ORDER_QUANTITY_THRESHOLD;	

		$('.general-tab-loading-state').fadeIn();
        disableBtn(this);
        
        setTimeout(() => {
			let changesObj = {};
			let changes = {
				maxOrderQuantity : maxOrderQuantity
			}
			rowData.toBeUpdated = true;

			for(let x in thresholdData){
				if(rowData.stock >= parseInt(thresholdData[x].minimumStockLevel) && rowData.stock <= parseInt(thresholdData[x].maximumStockLevel)){
					rowData.toBeUpdated = false;
					changes = { maxOrderQuantity : thresholdData[x].maxOrderQty };
				}
			}

			if((rowData.toBeUpdated === false)){
				setTimeout(() => { enableBtn(this); }, 1000);
				$('.general-tab-loading-state').fadeOut('slow');
				resultNotify('fa-check-circle', 'SUCCESS', 'Max Order Quantity successfully saved', 'success');
				rownode.find('.order-quantity-text').text(changes.maxOrderQuantity);
				rownode.find('.order-quantity-text').show();
				rownode.find('.max-order-quantity-span').show();
				rownode.find('.input-max-order-qty').prop('type', 'hidden');
				rownode.find('.save-max-order-quantity-btn').hide();
				return;
			}
			else{
				const newData = INITIAL_MATERIAL_DATA.filter(data => data.combination === rowData.combination);
				for(let i in newData){
					changesObj[newData[i].id] = {
						maxOrderQuantity : maxOrderQuantity
					}
				}
				
				updateAllMaxOrderQuantity(changesObj, (err, res) => {
					setTimeout(() => { enableBtn(this); }, 1000);
	
					if (err || res.statusCode >= 300) {
						console.log(res);
						$('.general-tab-loading-state').fadeOut('slow');
						resultNotify('fa fa-times', 'ERROR', 'Max Order Quantity not saved.<br>Something went wrong. Please try again later', 'danger');
						return;
					}
	
					if (res.statusCode <= 299) {
						$('.general-tab-loading-state').fadeOut('slow');
						resultNotify('fa-check-circle', 'SUCCESS', 'Max Order Quantity successfully saved', 'success');
						rownode.find('.order-quantity-text').text(changes.maxOrderQuantity);
						rownode.find('.order-quantity-text').show();
						rownode.find('.max-order-quantity-span').show();
						rownode.find('.input-max-order-qty').prop('type', 'hidden');
						rownode.find('.save-max-order-quantity-btn').hide();
					
						let previousMaxOrderQuantityPerSKU = 0;
	
						if(LCLDB_MATERIAL[index].maxOrderQuantity){ previousMaxOrderQuantityPerSKU = LCLDB_MATERIAL[index].maxOrderQuantity  }
						else{previousMaxOrderQuantityPerSKU = LCLDB_ALL_MAX_ORDER_QUANTITY };
						
						if (LOG_FUNCTION) {	
							createLog(`LOG::${LOCAL_STORAGE.referenceId}`, {
								dateCreated : moment().toISOString(),
								action : `Set max order quantity per sku from ${previousMaxOrderQuantityPerSKU} to ${maxOrderQuantity}`,
								module : "Settings/Max Order Quantity",
								app : "AMI"
							}, moment().toISOString());
						}
						setTimeout(function(){ loadMaterialTable(); }, 2000);
					}
				});
			}
		}, 1000);
	});
	
	// max order quantity apply to all
	$('#save-all-max-order-quantity-btn').click(function(){
		let maxOrderQuantityAll = $('#all-max-order-quantity').val();
		let thresholdData = LCLDB_ALL_MAX_ORDER_QUANTITY_THRESHOLD;
        
        displayApplyToAllError('all-max-order-quantity');
        if (!maxOrderQuantityAll.trim()) { // check if blank
            resultNotify('fa-exclamation-circle', 'INVALID', `Max Order Quantity is <b>required</b>`, 'warning');
            return;
        }

		$('.general-tab-loading-state').fadeIn('slow');
		disableBtn($(this));

		setTimeout(() => {
			let changes = { maxOrderQuantity : maxOrderQuantityAll }
			let changesObj = {};

			updateMaxOrderQuantity('MAXORDER::QUANTITY::20473c37-6bdf-4883-88d4-d6d44f9de1b8', changes, (err, res) => {
				
				if (err || res.statusCode >= 300) {
					console.log(res);
					$('.general-tab-loading-state').fadeOut('slow');
					resultNotify('fa fa-times', 'ERROR', 'Max Order Quantity not saved.<br>Something went wrong. Please try again later', 'danger');
					return;
				}

				if (res.statusCode <= 299) {
					if (LOG_FUNCTION) {	
						createLog(`LOG::${LOCAL_STORAGE.referenceId}`, {
							dateCreated : moment().toISOString(),
							action : `Set max order quantity from ${LCLDB_ALL_MAX_ORDER_QUANTITY} to ${maxOrderQuantityAll}`,
							module : "Settings/Max Order Quantity",
							app : "AMI"
						}, moment().toISOString());
					}

					for(let i in LCLDB_MATERIAL){
						LCLDB_MATERIAL[i].maxOrderQuantity = maxOrderQuantityAll;
						LCLDB_MATERIAL[i].toBeUpdated = true;
						
						for(let x in thresholdData){
							if(LCLDB_MATERIAL[i].stock >= parseInt(thresholdData[x].minimumStockLevel) && LCLDB_MATERIAL[i].stock <= parseInt(thresholdData[x].maximumStockLevel)){
								LCLDB_MATERIAL[i].toBeUpdated = false;
								LCLDB_MATERIAL[i].maxOrderQuantity = thresholdData[x].maxOrderQty;
							}
						}

						if(LCLDB_MATERIAL[i].withAssignedMaxOrderQuantity === true && LCLDB_MATERIAL[i].toBeUpdated === true){
							changesObj[LCLDB_MATERIAL[i].id] = {
								maxOrderQuantity : LCLDB_MATERIAL[i].maxOrderQuantity,
							}
						}
					}

					updateAllMaxOrderQuantity(changesObj, (err, res) => {
						setTimeout(() => { enableBtn($(this)); }, 1000);
	
						if (err || res.statusCode >= 300) { 
							console.log(res); 
							$('.general-tab-loading-state').fadeOut('slow');
							resultNotify('fa fa-times', 'ERROR', 'Max Order Quantity not updated. <br>Something went wrong. Please try again later', 'danger');
							return;
						}
	
						if (res.statusCode <= 299) {
							$('.general-tab-loading-state').fadeOut('slow');
							resultNotify('fa-check-circle', 'SUCCESS', 'Max Order Quantity successfully updated', 'success');
							LCLDB_ALL_MAX_ORDER_QUANTITY = maxOrderQuantityAll;
							setTimeout(function(){ if (DT_MATERIAL) DT_MATERIAL.clear().draw(); loadMaterialTable()  }, 2000);
						}
					});
				}
			});
		}, 1000);
	});

	// max order quantity threshold
	$('#save-max-order-quantity-threshold').click(function(){
		let thresholdData = [];
		let data = {};
		let arr = [];
		DT_THRESHOLD.rows().nodes().to$().find('input.threshold').removeClass('threshold-error');

		for(let x in LCLDB_ALL_MAX_ORDER_QUANTITY_THRESHOLD){
			x = parseInt(x);
			data = {};
			data.minimumStockLevel = $(`#minimum-stock-level-${x+1}`).val();
			data.maximumStockLevel = $(`#maximum-stock-level-${x+1}`).val();
			data.maxOrderQty = $(`#max-order-quantity-${x+1}`).val();
			thresholdData.push(data);
		}

		// ----- threshold validations ------ //
		for(let i in thresholdData){
			// check if minimimum and maximum stock level are the same
			if(parseInt(thresholdData[i].minimumStockLevel) === parseInt(thresholdData[i].maximumStockLevel)){
				displayThresholdError(1, null);
				$('.threshold-tab-loading-state').fadeOut('slow');
				resultNotify('fa-exclamation-circle', 'INVALID', `Minimum and Maximum Stock Level should <b>not</b> be the same`, 'warning');
				return;
			}
			// check if minimum stock level is greater than the maximum stock level
			if((parseInt(thresholdData[i].minimumStockLevel) > parseInt(thresholdData[i].maximumStockLevel))){
				displayThresholdError(2, null);
				$('.threshold-tab-loading-state').fadeOut('slow');
				resultNotify('fa-exclamation-circle', 'INVALID', `Minimum Stock Level must be <b>less</b> than the Maximum Stock Level`, 'warning');
				return;
			}
		}

		// check for duplicate set of threshold
		const thresholdDuplicateSet = Object.values(thresholdData.reduce((c, v) => {
			let k = v.minimumStockLevel + '-' + v.maximumStockLevel + v.maxOrderQty; 
			c[k] = c[k] || [];
			c[k].push(v);
			return c;
		}, {})).reduce((c, v) => v.length > 1 ? c.concat(v) : c, []);

		if(thresholdDuplicateSet.length > 0){
			displayThresholdError(3, thresholdDuplicateSet);
			$('.threshold-tab-loading-state').fadeOut('slow');
			resultNotify('fa-exclamation-circle', 'INVALID', `<b>Duplicate</b> Set of Threshold`, 'warning');
			return;
		}

		// check for duplicate values in minimum or maximum stock level column
		thresholdData.forEach(values => {
			arr.push(values.minimumStockLevel);
			arr.push(values.maximumStockLevel);
		});

		let minimumAndMaximumStockLevelDuplicates = arr.filter((item, index) => arr.indexOf(item) != index);

		if(minimumAndMaximumStockLevelDuplicates.length > 0){
			displayThresholdError(4, minimumAndMaximumStockLevelDuplicates);
			$('.threshold-tab-loading-state').fadeOut('slow');
			resultNotify('fa-exclamation-circle', 'INVALID', `<b>Duplicate</b> values in Minimum or Maximum Stock Level`, 'warning');
			return;
		}

		// check for duplicate values in max order quantity column
		const maxOrderQuantityMap = thresholdData.map(item => item.maxOrderQty);
		const duplicateMaxOrderQuantity = maxOrderQuantityMap.filter((item, index) => maxOrderQuantityMap.indexOf(item) != index);

		if(duplicateMaxOrderQuantity.length > 0){
			displayThresholdError(5, duplicateMaxOrderQuantity);
			$('.threshold-tab-loading-state').fadeOut('slow');
			resultNotify('fa-exclamation-circle', 'INVALID', `<b>Duplicate</b> values in Max Order Quantity`, 'warning');
			return;
		}

		// ----- end of threshold validations ------ //

		$('.threshold-tab-loading-state').fadeIn();
        disableBtn(this);
        
        setTimeout(() => {
			let changes = { maxOrderQuantityThreshold : thresholdData };
			let changesObj = {};

			updateMaxOrderQuantity('MAXORDER::QUANTITY::20473c37-6bdf-4883-88d4-d6d44f9de1b8', changes, (err, res) => {
           
				if (err || res.statusCode >= 300) {
					console.log(res);
					$('.threshold-tab-loading-state').fadeOut('slow');
					resultNotify('fa fa-times', 'ERROR', 'Max Order Quantity Threshold not saved.<br>Something went wrong. Please try again later', 'danger');
					return;
				}

				if (res.statusCode <= 299) {
					if (LOG_FUNCTION) {	
						createLog(`LOG::${LOCAL_STORAGE.referenceId}`, {
							dateCreated : moment().toISOString(),
							action : `Set max order quantity threshold from ${LCLDB_ALL_MAX_ORDER_QUANTITY_THRESHOLD} to ${thresholdData}`,
							module : "Settings/Max Order Quantity",
							app : "AMI"
						}, moment().toISOString());
					}
				
					for(let i in LCLDB_MATERIAL){
						LCLDB_MATERIAL[i].toBeUpdated = false;
						for(let x in thresholdData){
							if(LCLDB_MATERIAL[i].stock >= parseInt(thresholdData[x].minimumStockLevel) && LCLDB_MATERIAL[i].stock <= parseInt(thresholdData[x].maximumStockLevel)){
								LCLDB_MATERIAL[i].toBeUpdated = true;
								LCLDB_MATERIAL[i].maxOrderQuantity = thresholdData[x].maxOrderQty;
							}
						}
						
						if(LCLDB_MATERIAL[i].withAssignedMaxOrderQuantity === true && LCLDB_MATERIAL[i].toBeUpdated === true){
							changesObj[LCLDB_MATERIAL[i].id] = {
								maxOrderQuantity : LCLDB_MATERIAL[i].maxOrderQuantity,
							}
						}
					}

					if(jQuery.isEmptyObject(changesObj)){
						setTimeout(() => { enableBtn($(this)); }, 1000);

						setTimeout(function(){ 
							LCLDB_ALL_MAX_ORDER_QUANTITY_THRESHOLD = thresholdData; // update threshold value
							loadMaterialTable(); 
							loadThreshold(LCLDB_ALL_MAX_ORDER_QUANTITY_THRESHOLD);
							OLD_THRESHOLD_DATA = DT_THRESHOLD.rows().data().toArray(); // update old threshold value
							$('.threshold-tab-loading-state').fadeOut('slow');
							resultNotify('fa-check-circle', 'SUCCESS', 'Max Order Quantity Threshold successfully saved', 'success');
						}, 2000);
						return;
					}
					else{
						updateAllMaxOrderQuantity(changesObj, (err, res) => {
							setTimeout(() => { enableBtn($(this)); }, 1000);
							if (err || res.statusCode >= 300) { 
								console.log(res); 
								$('.threshold-tab-loading-state').fadeOut('slow');
								resultNotify('fa fa-times', 'ERROR', 'Max Order Quantity Threshold not saved.<br>Something went wrong. Please try again later', 'danger');
								return; 
							}
		
							if (res.statusCode <= 299) { 
								setTimeout(function(){ 
									LCLDB_ALL_MAX_ORDER_QUANTITY_THRESHOLD = thresholdData; // update threshold value
									loadMaterialTable(); 
									loadThreshold(LCLDB_ALL_MAX_ORDER_QUANTITY_THRESHOLD);
									OLD_THRESHOLD_DATA = DT_THRESHOLD.rows().data().toArray(); // update old threshold value
									$('.threshold-tab-loading-state').fadeOut('slow');
									resultNotify('fa-check-circle', 'SUCCESS', 'Max Order Quantity Threshold successfully saved', 'success');
								}, 2000);
							}
						});
					}
				}
        	});
		}, 1000);
	});

	// add new row/threshold
	$('#add-new-threshold').click(function(){
		$('#remove-threshold').prop('disabled', false); // enable remove button
		$('#save-max-order-quantity-threshold').prop('disabled', false); // enable save button

		// add datatable row
		DT_THRESHOLD.row.add({
			"maxOrderQty"	   : "0",
			"maximumStockLevel": "0",
			"minimumStockLevel": "0",
		}).draw();

		LCLDB_ALL_MAX_ORDER_QUANTITY_THRESHOLD.length++; // update threshold length
		LCLDB_ALL_MAX_ORDER_QUANTITY_THRESHOLD = DT_THRESHOLD.rows().data().toArray(); // update threshold value
		let index = LCLDB_ALL_MAX_ORDER_QUANTITY_THRESHOLD.length; 
		$(`#minus-minimum-stock-level-${index}-btn, #minus-maximum-stock-level-${index}-btn`).prop('disabled', true);
	});

	// remove row/threshold
	$('#remove-threshold').click(function(){
		$(this).attr('disabled', false); 

		if(LCLDB_ALL_MAX_ORDER_QUANTITY_THRESHOLD.length > 1){
			let $lastRow = $('#threshold-table tbody').find('tr:last'); // get datatable last row
			DT_THRESHOLD.row($lastRow).remove().draw(); // remove last row
			LCLDB_ALL_MAX_ORDER_QUANTITY_THRESHOLD.length--; // update threshold length
			if(LCLDB_ALL_MAX_ORDER_QUANTITY_THRESHOLD.length === 3){ $(this).prop('disabled', true) }
		}

		checkThresholdChanges(LCLDB_ALL_MAX_ORDER_QUANTITY_THRESHOLD);
	});

	$('#threshold-table').on('click input', '.threshold', function(){
		// disable minus button on input if value = 0;
		if($(this).is("input")){
			let index = $(this).attr("id").split("-").reverse()[0];
			let stockLevelType = $(this).attr("id").split("-")[0];

			if(stockLevelType === 'minimum'){
				$(`#minus-minimum-stock-level-${index}-btn`).prop("disabled", false);
				if($(this).val() == 0){
					$(`#minus-minimum-stock-level-${index}-btn`).prop("disabled", true);
				}
			}
			else if(stockLevelType === 'maximum'){
				$(`#minus-maximum-stock-level-${index}-btn`).prop("disabled", false);
				if($(this).val() == 0){
					$(`#minus-maximum-stock-level-${index}-btn`).prop("disabled", true);
				}
			}
		}

		if($(this).is("button")){
			let index = $(this).attr("id").split("-").reverse()[1];
			let buttonType = $(this).attr("id").split("-")[0];
			let stockLevelType = $(this).attr("id").split("-")[1];
			let minimumStockValue = $(`#minimum-stock-level-${index}`).val();
			let maximumStockValue = $(`#maximum-stock-level-${index}`).val();

			if(buttonType === 'minus'){
				if(stockLevelType === 'minimum'){
					minimumStockValue--; // decrement minimum stock level value
					$(`#minimum-stock-level-${index}`).val(minimumStockValue); // display minimum stock level current value
					
				    // disable minimum stock level minus button on button click if value = 0;
					if(minimumStockValue == 0){
						$(`#minus-minimum-stock-level-${index}-btn`).prop('disabled', true);
					}
				}
				else if(stockLevelType === 'maximum'){
					maximumStockValue--; // decrement maximum stock level value
					$(`#maximum-stock-level-${index}`).val(maximumStockValue); // display maximum stock level current value
					
					// disable maximum stock level minus button on button click if value = 0;
					if(maximumStockValue == 0){
						$(`#minus-maximum-stock-level-${index}-btn`).prop('disabled', true)
					}
				}
			}
			else if(buttonType === 'add'){
				if(stockLevelType === 'minimum'){
					minimumStockValue++; // increment minimum stock level value
					$(`#minimum-stock-level-${index}`).val(minimumStockValue); // display minimum stock level current value
					$(`#minus-minimum-stock-level-${index}-btn`).prop('disabled', false); // enable maximum stock level minus button
				}
				else if(stockLevelType === 'maximum'){
					maximumStockValue++; // increment maximum stock level value
					$(`#maximum-stock-level-${index}`).val(maximumStockValue); // display maximum stock level current value
					$(`#minus-maximum-stock-level-${index}-btn`).prop('disabled', false); // enable maximum stock level minus button
				}
			}
		}
		checkThresholdChanges(LCLDB_ALL_MAX_ORDER_QUANTITY_THRESHOLD);
	});
	
	function checkThresholdChanges(thresholdData){
		let newThresholdData = [], oldThresholdData = [];

		$('#save-max-order-quantity-threshold').prop('disabled', false);

		for(let x in thresholdData){
			x = parseInt(x);
			newThresholdData.push($(`#max-order-quantity-${x+1}`).val());
			newThresholdData.push($(`#minimum-stock-level-${x+1}`).val());
			newThresholdData.push($(`#maximum-stock-level-${x+1}`).val());
			
			if(thresholdData.length == OLD_THRESHOLD_DATA.length){
				oldThresholdData.push(OLD_THRESHOLD_DATA[x].maxOrderQty);
				oldThresholdData.push(OLD_THRESHOLD_DATA[x].minimumStockLevel);
				oldThresholdData.push(OLD_THRESHOLD_DATA[x].maximumStockLevel);
			}
		}

		const newThresholdDataLength = newThresholdData.filter(data => data != null && data != '').length;

		if(thresholdData.length == OLD_THRESHOLD_DATA.length){
			const oldThresholdDataLength = oldThresholdData.length;

			if((JSON.stringify(oldThresholdData) === JSON.stringify(newThresholdData)) 
				|| (newThresholdDataLength != oldThresholdDataLength)){
				$('#save-max-order-quantity-threshold').prop('disabled', true);
			}
		}
		else{
			if(newThresholdDataLength != newThresholdData.length){
				$('#save-max-order-quantity-threshold').prop('disabled', true);
			}
		}
	}

	//highlight error on threshold
	function displayThresholdError(error, thresholdData){
		DT_THRESHOLD.rows((idx, data, node) => {  
			let minimumStockLevel = $(node).find(`input#minimum-stock-level-${idx+1}`).val();
			let maximumStockLevel = $(node).find(`input#maximum-stock-level-${idx+1}`).val(); 
			let maxOrderQty = $(node).find(`input#max-order-quantity-${idx+1}`).val()
			
			if(error === 1){
				if(parseInt(minimumStockLevel) ===  parseInt(maximumStockLevel)){
					$(node).find(`input#minimum-stock-level-${idx+1}`).addClass('threshold-error');   
					$(node).find(`input#maximum-stock-level-${idx+1}`).addClass('threshold-error');   
				}
			}
			if(error === 2){
				if(parseInt(minimumStockLevel) >  parseInt(maximumStockLevel)){
					$(node).find(`input#minimum-stock-level-${idx+1}`).addClass('threshold-error');      
					$(node).find(`input#maximum-stock-level-${idx+1}`).addClass('threshold-error');    
				}
			}
			if(error === 3){
				for(let x in thresholdData){
					if(maxOrderQty === thresholdData[x].maxOrderQty 
					&& maximumStockLevel === thresholdData[x].maximumStockLevel 
					&& minimumStockLevel === thresholdData[x].minimumStockLevel){
						$(node).find('input.threshold').addClass('threshold-error');        
					}
				}
			}
			if(error === 4){
				for(let value of thresholdData){
					if(minimumStockLevel == value){
						$(node).find(`input#minimum-stock-level-${idx+1}`).addClass('threshold-error');  
					}
					else if(maximumStockLevel == value){
						$(node).find(`input#maximum-stock-level-${idx+1}`).addClass('threshold-error');     
					}
				}
			}
			if(error === 5){
				for(let value of thresholdData){
					if(maxOrderQty == value){
						$(node).find(`input#max-order-quantity-${idx+1}`).addClass('threshold-error');   
					}
				}
			}	
		});
	}

	// highlight error on apply to all
	function displayApplyToAllError(inputId) {
        if ($(`#${inputId}`).val().trim() == '') $(`#${inputId}`).parent().addClass('has-error');
		else $(`#${inputId}`).parent().removeClass('has-error');
    }
});

function numberOnly(id) {
    var element = document.getElementById(id);
    var regex = /[^0-9]/gi;
    element.value = element.value.replace(regex, "");
}