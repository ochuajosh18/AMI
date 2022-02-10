$(document).ready(function() {
	let orders = JSON.parse(localStorage.getItem('salesorderform'));
	let details = orders[0];

	if (!orders.length || !details) {
		alert('Unable to print form');
		return;
	}

	let orderInfo = getOrderStatusSAP(orders[0].salesOrderNo);
	$('[data-sap-invoice-info="deliveryNo"]').text((orderInfo.deliveryNo) ? Number(orderInfo.deliveryNo) : '');
	$('[data-sap-invoice-info="invoiceNo"]').text((orderInfo.invoiceNo) ? Number(orderInfo.invoiceNo) : '');

	$('[data-invoice-info]').each(function(index, el) {
		let value = $(this).attr('data-invoice-info')
		$(this).text(details[value])
	});

	let requestedDate = $('[data-invoice-info="requestedDate"]').text();
	$('[data-invoice-info="requestedDate"]').text(moment(new Date(`${requestedDate.slice(0, -3)} ${moment().format('hh:mm')} ${requestedDate.slice(-2)}`).toISOString()).format('DD-MMM-YYYY A'));
	$('[data-invoice-info="dateNow"]').text(moment().format('DD-MMM-YYYY'));
	$(`[data-invoice-info="orderType"][value="${details.orderType == 'Normal Order' ? 'Normal' : 'Special'}"]`).attr('checked', true);

	let approverInfo = getApproverData(details.salesOrderApprover);
	$('[data-invoice-info="preparedBy"]').text(`${approverInfo.firstName} ${approverInfo.lastName}`);

	$('#invoice-table').DataTable({
		destroy      : true,
		data         : orders,
		ordering     : false,
		searching    : false,
		paging       : false,
		lengthChange : false,
		info         : false,
		autoWidth    : false,

		columns: [
			{ data: 'salesOrderItemNo', width: 20, title: 'S/n' },
			{ data: 'materialCode', width: 100, title: 'Product Code' },
			{ data: 'size', title: 'Size/Pattern' },
			{ data: 'order', width: 20, title: 'Qty' },
			{ data: 'price', width: 50, title: 'Price' },
			{ data: 'discount', defaultContent: '', width: 50, title: 'Discount Grouping(%)' }
		],
		columnDefs: [
			{ targets: [0, 3], className : 'dt-center' },
			{ targets: [4, 5], className : 'dt-right' },
			{ // order
				targets: 2,
				render: (data, type, row) => data
			},
			{ // order
				targets: 3, className: 'dt-right',
				render: (data, type, row) => convertToNumber(data ? data : row.quantity, 'whole')
			},
			{ // price
				targets: 4,
				render: (data, type, row) => convertToNumber(data, '2-decimal')
			},
			{ // price
				targets: 5,
				render: (data, type, row) => {

					return convertToNumber((data) ? data : 0, '2-decimal')
				}
			}
		],
		// rowCallback : function (row, data, iDataIndex) {}
	});

	function getOrderStatusSAP(salesOrderNo) {
		if (!salesOrderNo) {
			alert('No sales order no');
			return;
		}

		let invoice = [{ salesOrderNo, salesOrderItemNo: 1 }], orderStatus;

		DI_orderStatus({ invoice }, (err, res) => {
			if (err || res.statusCode >= 300) {
				alert('Unable to get order status from SAP.');
				console.log('err', err, 'res', res);
			} else if (res.result.hasOwnProperty('message')){
				alert(res.result.message);
			} else if (res.statusCode <= 299) {
				orderStatus = res.result[0];
			}
		});

		return orderStatus;
	}

	function getApproverData(salesOrderApprover) {
		let approverName;

		loadUser(salesOrderApprover, (err,res) => {
			approverName = res.result;
		});

		return approverName;
	}

	window.print();
});