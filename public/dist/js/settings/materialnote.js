checkSession();
setUserData();

$(document).ready(function() {
	let LCLDB_MATERIAL, DT_MATERIAL, DT_NOTE, DT_NOTE_CHECK, NOTE_ID = 'NOTE::MATERIAL';
	const config = {
		// db : 'offline'
		db : 'couchbase'
	};

	enableHelpFunction();
	$("[data-toggle=popover]").popover();
	loadMaterialTable();

	// load material page
	function loadMaterialTable() {
		let data;

		if (config.db == 'couchbase') {
			loadAllMaterialNote((err, res) => {
				if (err || res.statusCode >= 300) { alert('Unable to load materials'); }
				else if (res.statusCode <= 299) {
					LCLDB_MATERIAL = res.result; data = res.result;
					config.db = 'local'
				}
			});
		} else if (config.db == 'local') {
			data = LCLDB_MATERIAL;
		}

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
				{ data: 'materialGroup', title: 'Material<br>group' },
				{ data: 'storageLocation', title: 'Storage<br>location' },
				{ data: 'country', title: 'Country', defaultContent: '', width: 60 },
				{ data: 'stock', title: 'Stock', defaultContent: '', width: 40 },
				{ data: 'sameitem', title: 'Same<br>item', defaultContent: '', width: 40 },
				{ data: 'note', title: 'Note', defaultContent: '' }
			],
			columnDefs: [
				{ targets: [5, 6, 7, 8, 9], className: 'dt-center' }, // matGroup, storage, stock, count
				{ targets: 10, className: 'note-column', orderable: false },
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
						str += '-' +row.country

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
				if (data.note) $(row).find('.note-column').addClass('bg-teal');
			}
		});

		expandRowDetail('material-table', DT_MATERIAL);

		$('#material-table-filter').off('keyup').keyup(function(){ DT_MATERIAL.search($(this).val()).draw(); });
		$('.loading-state').fadeOut('slow');
	}

	// load note page crud
	function loadNoteTable(action) {
		let data = JSON.parse(JSON.stringify(LCLDB_MATERIAL)); // deep copy
		data = removeduplicate_3(data, 'size', 'oldMaterialNumber', 'country');

		if (action == 'create') {
			data = data.filter(item => item.note == '');
			$('#create-note-modal-show').closest('div').show();
			$('#update-note-modal-show').closest('div').hide();
			$('#delete-note-modal-show').closest('div').hide();
		} else if (action == 'update') {
			data = data.filter(item => item.note != '');
			$('#create-note-modal-show').closest('div').hide();
			$('#update-note-modal-show').closest('div').show();
			$('#delete-note-modal-show').closest('div').hide();
		} else {
			data = data.filter(item => item.note != '');
			$('#create-note-modal-show').closest('div').hide();
			$('#update-note-modal-show').closest('div').hide();
			$('#delete-note-modal-show').closest('div').show();
		}

		DT_NOTE = $('#note-table').DataTable({
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
				{ data: null, defaultContent: '', width: 10 },
				{ data: null, width: 10 },
				{ data: 'materialCode', title: 'Material code', width: 100 },
				{ data: 'materialCode', title: 'BCP', width: 80 },
				{ data: 'size', title: 'Size' },
				{ data: 'oldMaterialNumber', title: 'Pattern', width: 80 },
				{ data: 'materialGroup', title: 'Material<br>group' },
				{ data: 'storageLocation', title: 'Storage<br>location' },
				{ data: 'country', title: 'Country', defaultContent: '', width: 60 },
				{ data: 'stock', title: 'Stock', defaultContent: '', width: 40 },
				{ data: 'sameitem', title: 'Same<br>item', defaultContent: '', width: 40 },
				{ data: 'note', title: 'Note', defaultContent: '' }
			],
			columnDefs: [
				{ targets: 0, className: 'select-checkbox', orderable: false }, // check
				{ targets: [6, 7, 9, 10], className: 'dt-center' }, // matGroup, storage, stock, count
				{ targets: 11, className: 'note-column', orderable: false },
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
						str += '-' +row.country

						row.usedMaterialCode = str;
						return str;
					}
				},
				{ // stock
					targets: 9,
					render: (data, type, row) => {
						return  '<b>' + convertToNumber(data, 'whole') + '</b>';
					}
				},
				{ // count
					targets: 10,
					render: (data, type, row) => `<span class="badge bg-light-blue" >${data}</span>`
				}
			],
			select: { style: 'multi' },
			rowCallback: (row, data, index) => {
				$(row)
					.attr('id', data.id)
					.find('.note-column').addClass('bg-teal');
			},
			initComplete: (settings, json) => { $('#note-table tbody').css('cursor', 'pointer'); }
		});

		if (action == 'create') DT_NOTE.columns(11).visible(false);

		expandRowDetail('note-table', DT_NOTE);

		$('#note-table-filter').off('keyup').keyup(function() { DT_NOTE.search($(this).val()).draw(); });
		$('.loading-state:eq(1)').fadeOut('slow');
	}

	// for expand row
	function format(data) {
		let material = LCLDB_MATERIAL.filter(item => item.combination == data.combination);
		material.sort((a, b) => (b.stockOwn) - (a.stockOwn));

		let code = `<div class="col-lg-6"><span class="info-box-number">${material.length} items</span>`;
		code += `<table class="table nowrap table-responsive table-bordered" style="margin-bottom: 0px;">`;

		for (let i in material) {
			code +=
			`<tr>
				<td>${material[i].materialCode}</td>
				<td>${material[i].size}</td>
				<td>${material[i].oldMaterialNumber}</td>
				<td>${material[i].materialGroup}</td>
				<td>${material[i].storageLocation}</td>
				<td>${material[i].country}</td>
				<td class="dt-right"><b>${convertToNumber(parseInt(material[i].stockOwn), 'whole')}</b></td>
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

	$('#btn-help-multiple').attr('data-content', 
		`<a><h6 id="btn-create" data-toggle="modal" data-target="#modal-default" data-help="materialNote" style="cursor: pointer;">How to create note</h6></a>
		<a><h6 id="btn-update" data-toggle="modal" data-target="#modal-default" data-help="materialNote" style="cursor: pointer;">How to update note</h6></a>
		<a><h6 id="btn-delete" data-toggle="modal" data-target="#modal-default" data-help="materialNote" style="cursor: pointer;">How to delete note</h6></a>`
	);

	$(document).on("click", "#btn-create", function(event) {
		let helptype = $('#btn-create').attr('data-help');
		helpCarouselMultiple(helptype, 'create')
    });

    $(document).on("click", "#btn-update", function(event) {
		let helptype = $('#btn-update').attr('data-help');
		helpCarouselMultiple(helptype, 'update')
    });

    $(document).on("click", "#btn-delete", function(event) {
		let helptype = $('#btn-delete').attr('data-help');
		helpCarouselMultiple(helptype, 'delete')
    });

	// tabs navigate
	$('.nav-tabs > li a[data-toggle="tab"]').click(function() {
		const action = $(this).attr('data-action');
		switch(action) {
			// material
			case 'r-material':
				$('.loading-state:eq(0)').fadeIn('slow');
				setTimeout(() => { loadMaterialTable(); }, 1000);
			break;

			// note
			case 'c-note':
				$('.loading-state:eq(1)').fadeIn('slow');
				setTimeout(() => { loadNoteTable('create'); }, 1000);
			break;
			case 'u-note':
				$('.loading-state:eq(1)').fadeIn('slow');
				setTimeout(() => { loadNoteTable('update'); }, 1000);
			break;
			case 'd-note':
				$('.loading-state:eq(1)').fadeIn('slow');
				setTimeout(() => { loadNoteTable('delete'); }, 1000);
			break;
		}
	});

	// show create note modal
	$('#create-note-modal-show').click(function() {
		if (!DT_NOTE.rows('.selected').count()) {
			resultNotify('fa-exclamation-circle', 'INVALID', `Select an item to create note`, 'warning');
			return;
		}

		$('#create-note-modal').modal();

		setTimeout(() => {
			let data = DT_NOTE.rows('.selected').data().toArray();
			DT_NOTE_CHECK = $('#check-create-note-table').DataTable({
				destroy        : true,
				data           : data,
				order          : [],
				autoWidth      : false,
				scrollX        : true,
				scrollY        : 300,
				scrollCollapse : true,
				dom            : 'rti',

				columns : [
					{ data: 'materialCode', title: 'BCP', width: 40 },
					{ data: 'size', title: 'Size', width: 100 },
					{ data: 'oldMaterialNumber', title: 'Pattern', width: 40 },
					{ data: null, title: 'Note', defaultContent: '' }
				],

				columnDefs: [
					{ // note
						targets: 3,
						render: (data, type, row) => `<textarea class="form-control note" rows="2" style="resize: none; font-size: 12px; width: 200px;" placeholder="place your note"></textarea>`
					}
				],
				rowCallback: (row, data, index) => { $(row).attr('id', data.id); }
			});
		}, 1000);
	});

	// save create note
	$('#save-create-note-btn').click(function() {
		// validate all note not blank
		DT_NOTE_CHECK.rows().every(function(){
			let material = this.data(), row = DT_NOTE_CHECK.row(this).nodes().to$();
			let note = row.find('textarea.note').val().trim();

			if (note) {
				material.note = note;
				row.find('textarea.note').css('border-color', '#ccc')
				.closest('tr').removeClass('invalid');
			} else {
				row.find('textarea.note').css('border-color', '#dd4b39')
				.closest('tr').addClass('invalid');
			}
		});

		if (DT_NOTE_CHECK.rows('.invalid').data().toArray() != 0) return; // there is invalid

		$('.loading-state:eq(1)').fadeIn('slow');
		disableBtn($(this));

		setTimeout(() => {
			let materials = DT_NOTE_CHECK.rows().data().toArray();
			let notes = {};
			// for (let i in materials) notes[`${materials[i].size} ${materials[i].oldMaterialNumber}`] = materials[i].note;
			for (let i in materials) notes[materials[i].combination] = materials[i].note;

			$('#create-note-modal').modal('hide');
			setTimeout(() => { enableBtn($(this)); }, 1000);
			updateMaterialNote(NOTE_ID, notes, (err, res) => {
				if (res.statusCode >= 300) { alert('Unable to save notes'); }
				else if (res.statusCode <= 299) {
					resultNotify('fa-check-circle', 'SUCCESS', 'Note successfully saved', 'success');

					if (LOG_FUNCTION) {	
						createLog(`LOG::${LOCAL_STORAGE.referenceId}`, {
							dateCreated : moment().toISOString(),
							action : `Created notes`,
							module : "Settings/Material Note",
							app : "AMI"
						}, moment().toISOString());
					}
					updateNoteLocal(LCLDB_MATERIAL, notes);
					setTimeout(() => { $('a[data-action="c-note"]').click(); }, 1000);
				}
			});
		}, 1000);
	});

	// update note
	$('#update-note-modal-show').click(function() {
		if (!DT_NOTE.rows('.selected').count()) {
			resultNotify('fa-exclamation-circle', 'INVALID', `Select an item to update note`, 'warning');
			return;
		}

		$('#update-note-modal').modal();

		setTimeout(() => {
			let data = DT_NOTE.rows('.selected').data().toArray();
			DT_NOTE_CHECK = $('#check-update-note-table').DataTable({
				destroy        : true,
				data           : data,
				order          : [],
				autoWidth      : false,
				scrollX        : true,
				scrollY        : 350,
				scrollCollapse : true,
				dom            : 'rti',

				columns : [
					{ data: 'materialCode', title: 'BCP', width: 40 },
					{ data: 'size', title: 'Size', width: 100 },
					{ data: 'oldMaterialNumber', title: 'Pattern', width: 40 },
					{ data: null, title: 'Note', defaultContent: '' }
				],

				columnDefs: [
					{ // note
						targets: 3,
						render: (data, type, row) => `<textarea class="form-control note" rows="2" style="resize: none; font-size: 12px; width: 200px;" placeholder="place your note">${row.note}</textarea>`
					}
				],
				rowCallback: (row, data, index) => {
					$(row).attr('id', data.id);
					data.oldnote = data.note;
				}
			});
		}, 1000);
	});

	// save update note
	$('#save-update-note-btn').click(function() {
		// validate all note not blank & changed
		DT_NOTE_CHECK.rows().every(function(){
			let material = this.data(), row = DT_NOTE_CHECK.row(this).nodes().to$();
			let note = row.find('textarea.note').val().trim();

			if (note && note != material.oldnote) {
				material.note = note;
				row.find('textarea.note').css('border-color', '#ccc')
				.closest('tr').removeClass('invalid');
			} else {
				row.find('textarea.note').css('border-color', '#dd4b39')
				.closest('tr').addClass('invalid');
			}
		});

		if (DT_NOTE_CHECK.rows('.invalid').data().toArray() != 0) return; // there is invalid

		$('.loading-state:eq(1)').fadeIn('slow');
		disableBtn($(this));

		setTimeout(() => {
			let materials = DT_NOTE_CHECK.rows().data().toArray();
			let notes = {};
			for (let i in materials) notes[materials[i].combination] = materials[i].note;

			$('#update-note-modal').modal('hide');
			setTimeout(() => { enableBtn($(this)); }, 1000);
			updateMaterialNote(NOTE_ID, notes, (err, res) => {
				if (res.statusCode >= 300) { alert('Unable to update notes'); }
				else if (res.statusCode <= 299) {
					resultNotify('fa-check-circle', 'SUCCESS', 'Note successfully updated', 'success');

					if (LOG_FUNCTION) {	
						createLog(`LOG::${LOCAL_STORAGE.referenceId}`, {
							dateCreated : moment().toISOString(),
							action : `Updated notes`,
							module : "Settings/Material Note",
							app : "AMI"
						}, moment().toISOString());
					}
					updateNoteLocal(LCLDB_MATERIAL, notes);
					setTimeout(() => { $('a[data-action="u-note"]').click(); }, 1000);
				}
			});
		}, 1000);
	});

	// show delete note modal
	$('#delete-note-modal-show').click(function() {
		if (!DT_NOTE.rows('.selected').count()) {
			resultNotify('fa-exclamation-circle', 'INVALID', `Select an item to delete note`, 'warning');
			return;
		}

		$('#delete-note-modal').modal();

		setTimeout(() => {
			let data = DT_NOTE.rows('.selected').data().toArray();
			DT_NOTE_CHECK = $('#check-delete-note-table').DataTable({
				destroy        : true,
				data           : data,
				order          : [],
				autoWidth      : false,
				scrollX        : true,
				scrollY        : 350,
				scrollCollapse : true,
				dom            : 'rti',

				columns : [
					{ data: 'materialCode', title: 'BCP', width: 40 },
					{ data: 'size', title: 'Size', width: 100 },
					{ data: 'oldMaterialNumber', title: 'Pattern', width: 40 },
					{ data: 'note', title: 'Note', render: (data, type, row) => `<b>${data}</b>` }
				],
				rowCallback: (row, data, index) => { $(row).attr('id', data.id); }
			});
		}, 1000);
	});

	// delete note
	$('#delete-note-btn').click(function() {
		$('.loading-state:eq(1)').fadeIn('slow');
		disableBtn($(this));

		setTimeout(() => {
			let materials = DT_NOTE_CHECK.rows().data().toArray();
			let notes = {};
			for (let i in materials) notes[materials[i].combination] = materials[i].note;

			$('#delete-note-modal').modal('hide');
			setTimeout(() => { enableBtn($(this)); }, 1000);
			updateUnsetMaterial(NOTE_ID, notes, (err, res) => {
				if (res.statusCode >= 300) { alert('Unable to delete notes'); }
				else if (res.statusCode <= 299) {
					resultNotify('fa-check-circle', 'SUCCESS', 'Note successfully deleted', 'success');

					if (LOG_FUNCTION) {	
						createLog(`LOG::${LOCAL_STORAGE.referenceId}`, {
							dateCreated : moment().toISOString(),
							action : `Deleted notes`,
							module : "Settings/Material Note",
							app : "AMI"
						}, moment().toISOString());
					}
					deleteNoteLocal(LCLDB_MATERIAL, notes);
					setTimeout(() => { $('a[data-action="d-note"]').click(); }, 1000);
				}
			});
		}, 1000);
	});

	function updateNoteLocal(arr, sizePattern) {
		for (let i in sizePattern) {
			let toUpdate = arr.filter(item => item.combination==i);
			for (let j in toUpdate) {
				let index = arr.findIndex(item => item.materialCode == toUpdate[j].materialCode);
				arr[index].note = sizePattern[i];
			}
		}
	}

	function deleteNoteLocal(arr, sizePattern) {
		for (let i in sizePattern) {
			let toUpdate = arr.filter(item => item.combination==i);
			for (let j in toUpdate) {
				let index = arr.findIndex(item => item.materialCode == toUpdate[j].materialCode);
				arr[index].note = '';
			}
		}
	}
});