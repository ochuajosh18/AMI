checkSession();
setUserData();


$(document).ready(function() {
var localDb_Price,
    datatable_Price;

  loadPriceTable();
  $('.loading-state').fadeOut('slow');



  function loadPriceTable() {
    loadPrice();
    localDb_Price = addExtraFields_Price();


    datatable_Price = $('#price-table').DataTable({
      destroy   : true,
      data      : localDb_Price,
      autoWidth : false,
      scrollY    : '350px',
      scrollCollapse : true,
      lengthMenu : [[10, 25, 50, -1], [10, 25, 50, "All"]],
      pageLength : 25,

      columns: [
        {'data': 'materialCode'},
        {'data': 'customerCode'},
        {'data': 'price'},
        {'data': 'dateEffective'},
        {'data': 'dateExpired'}
      ],

      columnDefs: 
      [
        { 
          className : 'dt-center',
          targets   : [0, 1, 3, 4]
        },
        { 
          className : 'dt-right',
          targets   : [2]
        }
      ],

      rowCallback : function (row, data, iDataIndex) {
        $(row).attr('id', data['id']);
      },

      drawCallback : function( settings ) {
        var $container = $('.dataTables_scrollBody'),
            $scrollTo = $('#price-table').find('tbody tr:eq(0)');

        $container.scrollTop(
          $scrollTo.offset().top - $container.offset().top + $container.scrollTop()
        );
      }
    });
  }



  function loadPrice() {
    var data = [];

    loadAll('AMI2_PRICE', 'all', function(err, res) {
      if (res.statusCode <= 299) {
        for (var i = 0; i < res.body.total_rows; i++) {
          data.push(res.body.rows[i].value);
          data[i].id = res.body.rows[i].id;
        }
      } else {
        console.log(res);
      }
    });

    localDb_Price = data;
    console.log(localDb_Price);
  }



  function addExtraFields_Price() {
    var data = localDb_Price, temp;

    for (var i in data) {
      data[i].price = parseInt(data[i].price).toFixed(2);
      data[i].dateEffective = moment(data[i].dateEffective).format('MMM DD, YYYY');
      data[i].dateExpired = moment(data[i].dateExpired).format('MMM DD, YYYY');

      // moment(orderDoc[i].requestedDate).format('MMM DD, YYYY')
    }

    return data;
  }







});