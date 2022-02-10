$(document).ready(function() {
    let LCLDB_CREDIT_EXCEED_APPROVAL_LOGS,DT_CREDITEXCEEDAPPROVAL_LOGS
    const START_OF_MONTH = moment().startOf('month'), END_OF_MONTH = moment().endOf('month');

	$('#btn-help').click(function(event){
		let helptype = $(this).attr('data-help');
		helpCarousel(helptype)
	});

    
    $('#daterange-btn span').html(`${START_OF_MONTH.format('MMM DD, YYYY')} - ${END_OF_MONTH.format('MMM DD, YYYY')}`);
    $('#daterange-btn').attr('startDate',START_OF_MONTH.format('YYYY-MM-DD'))
    $('#daterange-btn').attr('endDate',moment(END_OF_MONTH).add(1, 'days').format('YYYY-MM-DD'))
    loadCreditExceedApprovalLogsTable(START_OF_MONTH.format('YYYY-MM-DD'), moment(END_OF_MONTH).add(1, 'days').format('YYYY-MM-DD'),"","","",['saved','pending order approval','backorderPending','submitted','pending credit note creation']);
    
    $('.loading-state').fadeOut('slow');
    initFilters();
    function loadCreditExceedApprovalLogsTable(startDate, endDate, customerFilter, orderTypeFilter, creditExceedFilter, statusFilter) {
		loadCreditExceedApprovalLogs({ startDate, endDate, customerFilter, orderTypeFilter, creditExceedFilter, statusFilter }, (err, res) => {
            LCLDB_CREDIT_EXCEED_APPROVAL_LOGS = res.result;
            DT_CREDITEXCEEDAPPROVAL_LOGS = $('#creditExceedApprovalLogsTable').DataTable({
                destroy        : true,
                data           : LCLDB_CREDIT_EXCEED_APPROVAL_LOGS,
                order          : [[0, 'desc']], 
                autoWidth      : false,
                scrollX        : true,
                scrollY        : 300,
                scrollCollapse : true,
                deferRender    : true,
                paging         : false,
                lengthChange   : false,
                dom            : 'rti',
                columns: [
                    { data: 'salesOrderNo' },
                    { data: null, width: 100 },
                    { data: 'userName', defaultContent: 'none' },
                    { data: 'orderType' },
                    { data: 'creditExceed', width: 50 },
                    { data: 'orderItemStatus', width: 100 }
                ], 
                columnDefs: [
                    {
						targets: 1,
						render: (data, type, row) => {
							return `${data.dateCreated} ${data.timeCreated}`;
						}
					},
                    {
                        targets: 5, className: 'dt-center',
                        "orderable": false,
                        //Steps progress-bar for Credit Exceed Approval Logs status
                        render: function (data, type, row) {
                            let stepsArrayObject = [
                                {
                                    'status':['saved','pending order approval','backorderPending','submitted','pending credit note creation'],
                                    'percentage':'0%',
                                    'check1':'visited','check2':'','check3':'',
                                    'orderText':'Order Approved',
                                    'isRejected':'',
                                    'orderCreditMessage':'Credit Limit Approved',
                                },
                                // {
                                //     'status':['submitted','pending credit note creation'],
                                //     'percentage':'100%',
                                //     'check1':'visited','check2':'visited','check3':'',
                                //     'orderText':'Order Approved',
                                //     'isRejected':'',
                                //     'orderCreditMessage':'Credit Limit Approved',
                                // },
                                {
                                    'status':['confirmed'],
                                    'percentage':'100%',
                                    'check1':'visited','check2':'visited','check3':'visited',
                                    'orderText':'Order Approved',
                                    'isRejected':'',
                                    'orderCreditMessage':'Credit Limit Approved',
                                },
                                {
                                    'status':['rejected'],
                                    'percentage':'100%',
                                    'check1':'visited','check2':'','check3':'',
                                    'isRejected':'rejectedOrder',
                                    'orderText':'Order Rejected',
                                    'orderCreditMessage':'Credit Limit Rejected',
                                }
                            ]
                            let progress = "";
                            for (var value of stepsArrayObject) {
                                if(value.status.includes(data)){
                                    let showHide = "style = 'display:none'";
                                    let barWidth = "30";
                                    if(row.creditExceed && row.creditExceed != 0){
                                        showHide = ""
                                        barWidth = "65"
                                        if(value.status.includes('submitted')||value.status.includes('pending credit note creation')){
                                            value.percentage = "50%"
                                            value.check2 = "visited"
                                        }
                                        if(value.status.includes('rejected')){
                                            value.check2 = "visited";
                                            value.orderText = "Order Approved";
                                            value.isOrderRejected = '';
                                        }
                                    }
                                    progress = `
                                        <div class="progress-bar-wrapper">
                                            <div class="status-bar" style="width: ${barWidth}%;">
                                                <div class="current-status" style="width: ${value.percentage}; transition: width 4500ms linear 0s;"></div>
                                            </div>
                                            <ul class="progress-bar-creditExceedApprovalLogs">
                                                    <li class="section ${value.check1}">Order Received</li>
                                                    <li class="section ${(value.isOrderRejected != undefined ? value.isOrderRejected : value.isRejected)} ${value.check2}">${value.orderText}</li>
                                                    <li class="section ${value.isRejected} ${value.check3}" ${showHide}>${value.orderCreditMessage}</li>
                                            </ul>
                                        </div>
                                    `
                                    return progress;
                                }
                            }
                        }
                    },
                    {
                        targets: 1,
                        render: (data, type, row) => moment(row.dateCreated).format('YYYY-MM-DD hh:mm A'),
                    },
                    {
                        targets: 4,
                        render: (data, type, row) => {
                            //Credit Exceed Yes or No
                            if((row.overduePayment || row.creditExceed) && (row.overduePayment != 0 || row.creditExceed != 0)){
                                return `<span style="display:none;">yes</span><center><li class="creditExceed section visited"></li></center>`
                            }else{
                                return `<span style="display:none;">no</span><center><li class="creditExceed section no-creditExceed"></li></center>`
                            }
                        }
                    }
                ],
                rowCallback: (row, data, iDataIndex) => { $(row).attr('id', data['id']); }
            });
    
            // custom table and search
            DT_CREDITEXCEEDAPPROVAL_LOGS.buttons().container().appendTo('#creditExceedApprovalLogs-table-buttons');
            $('#txtSearchCreditExceedApprovalLogs').keyup(function(){ DT_CREDITEXCEEDAPPROVAL_LOGS.search($(this).val()).draw(); })
    
            $('.loading-state').fadeOut('slow');
        });
    }

    function initFilters(){

		$('#daterange-btn').daterangepicker({ startDate: moment(), endDate: moment()}, (start, end) => {
			$('#daterange-btn span').text(`${start.format('MMM DD, YYYY')} - ${end.format('MMM DD, YYYY')}`);
			$('#daterange-btn').attr('startDate', start.format('YYYY-MM-DD')).attr('endDate', end.format('YYYY-MM-DD'));
        });
        
        customerDropdown();

        $('#creditExceedApprovalLogsBtn-form').find('input[type=checkbox]:checked').prop('checked', false); //uncheck all checkboxes
		$('ul.dropdown-menu a').off('click').on('click', function() { $(this).closest('.dropdown').addClass('open'); }); // keep dropdown open
        
        $('.dropdown ul.dropdown-menu a.select-all input[type="checkbox"]').change(function(event) { // select all checkbox
			let checkboxes = $(this).closest('.dropdown-menu').find('input[type="checkbox"]')
			if (this.checked != true) checkboxes.prop('checked', false);
			else checkboxes.prop('checked', true);
        });

        $('#orderPendingCheckbox').change(function(event) { // select all orderPendingCheckbox
            let checkboxes = $(this).closest('.pending').find('input[type="checkbox"]');
			if (this.checked != true) checkboxes.prop('checked', false);
			else checkboxes.prop('checked', true);
        });
        
        $('#orderPendingCheckbox').prop('checked', true).trigger("change");
        $('#creditExceed-dropdown a.select-all input[type="checkbox"]').prop('checked', true).trigger("change");
	}

	function customerDropdown() {
		try {
			const customerRoleId = role_localdata.CUSTOMER;
			let customers;

			loadCustomerUser({ customerRoleId }, (err, res) => {
				if (res.statusCode <= 299) {
					customers = res.result;
					$('#customer-dropdown ul.dropdown-menu').html(`<li><a href="#" class="select-all"><div class="checkbox"><label><input type="checkbox"> All</label></div></a></li>`);
					for (let i in customers) $('#customer-dropdown ul.dropdown-menu').append(`<li><a href="#"><div class="checkbox"><label><input type="checkbox" data-value="${customers[i].customerCode}"> <b>${customers[i].customerCode}</b> - ${customers[i].accountName}</label></div></a></li>`);
				}
			});
		} catch (err) {
			alert('Something went wrong\n' + err);
			console.log(err);
		}
    }
    
    function getDataSelected(dropdown) {
		let data = [];
		$(`#${dropdown} input[type="checkbox"]:checked`).each(function(index, el) {
			let item = $(this).attr('data-value');
			if (item) data.push(item);
		});

		return data;
	}

	$('#btn-generate').click(function() {
		const startDate = $('#daterange-btn').attr('startDate');
        const endDate = $('#daterange-btn').attr('endDate');
        const customerFilter = getDataSelected('customer-dropdown');
        const orderTypeFilter = getDataSelected('orderType-dropdown');
        const creditExceedFilter = getDataSelected('creditExceed-dropdown');
        const statusFilter = getDataSelected('status-dropdown');
        $('.loading-state').fadeIn('slow');
		setTimeout(() => { loadCreditExceedApprovalLogsTable(startDate, endDate, customerFilter, orderTypeFilter, creditExceedFilter, statusFilter) }, 1000);
	});

});