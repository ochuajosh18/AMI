checkSession();
setUserData();

$(document).ready(function() {

  var localDb_Customer,
      localDb_CreditLimit,
      datatable_Customer;

  // loadIntervalFinish(loadCustomerTable);
    loadCustomerTable();


/* Load document {*/



  function loadCustomerTable() {
    loadCustomer();
    loadCreditLimit();
    var data = localDb_Customer;
    data = addExtraFields_Customer(localDb_Customer);


    datatable_Customer = $('#customer-table').DataTable({
      destroy   : true,
      data      : localDb_Customer,
      autoWidth : false,
      scrollX : true,
      scrollY    : '350px',
      scrollCollapse : true,
      lengthMenu : [[10, 25, 50, -1], [10, 25, 50, "All"]],
      pageLength : 25,

      columns : [
        {'data': 'customerCode'},
        {'data': 'name1'},
        {'data': 'creditLimit'},
        {'data': 'creditLimitUsed'},
        {'data': 'smtpAddr'},
        {'data': 'telNumber'},
        {'data': 'faxNumber'},
        {'data': 'country'},
        {'data': 'city1'},
        {'data': 'street'}
      ],

      columnDefs: 
      [
        { 
          className : 'dt-center',
          targets   : [0, 2, 3, 7]
        },
        { 
          render: function (data, type, row) { return '<b><i>' + data + '</i></b>'; },
          targets : [2, 3]
        },
      ],

      rowCallback : function (row, data, iDataIndex) { $(row).attr('id', data['id']); },
      initComplete : function(settings, json) { $('.loading-state').fadeOut('slow'); },
      drawCallback : function( settings ) {
        var $container = $('.dataTables_scrollBody'),
            $scrollTo = $('#customer-table').find('tbody tr:eq(0)');

        $container.scrollTop(
          $scrollTo.offset().top - $container.offset().top + $container.scrollTop()
        );
      }
    });
  }



  function addExtraFields_Customer(data) {
    for (var i in data) {
      var creditLimitDoc = customArrayFilter(localDb_CreditLimit, 'customerCode', data[i].customerCode);
      // console.log(creditLimitDoc);

      data[i].creditLimit = (creditLimitDoc.length > 0) ? creditLimitDoc[0].creditLimit : 'No credit limit';
      data[i].creditLimitUsed = (creditLimitDoc.length > 0) ? creditLimitDoc[0].creditLimitUsed : 'No credit limit';
    }
  }



  function loadCustomer() {
    var data = [];

    loadByKey('AMI2_CUSTOMER', 'byPartnerType', 'blank', function(err, res) {
      if (res.statusCode <= 299) {
        for (var i = 0; i < res.body.total_rows; i++) {
          data.push(res.body.rows[i].value);
          data[i].id = res.body.rows[i].id;
        }
      } else {
        console.log(res);
      }
    });

    localDb_Customer = data;
  }



  function loadCreditLimit() {
    var data = [];

    loadAll('AMI2_CREDIT_LIMIT', 'all', function(err, res) {
      if (res.statusCode <= 299) {
        for (var i = 0; i < res.body.total_rows; i++) {
          data.push(res.body.rows[i].value);
          data[i].id = res.body.rows[i].id;
        }
      } else {
        console.log(res);
      }
    });

    localDb_CreditLimit = data;
  }
/*}*/





});