checkSession();
setUserData();

$(document).ready(function(){
  var localDb_User, localDb_Role, localDb_Customer,
      datatable_User, dataTable_CheckUser,
      customerRoleId;

loadRole();
loadCustomer();
loadUserTable();
$('.loading-state').fadeOut('slow');
// loadIntervalFinish(loadUserTable);

/* Load document {*/


  function loadUserTable() {
    loadUser();
    localDb_User = customArrayFilter(localDb_User, 'roleId', customerRoleId);
    localDb_User = addExtraFields_User();

    datatable_User = $('#user-table').DataTable({
      destroy   : true,
      data      : localDb_User,
      autoWidth : false,

      columns: 
      [
        {'data': 'customerCode', 'width': '10%'},
        {'data': 'companyName', 'width': '20%'},
        {'data': 'fullName', 'width': '20%'},
        {'data': 'channel01', 'width': '5%', 'orderable': false},
        {'data': 'channel03', 'width': '5%', 'orderable': false},
      ],

      columnDefs: 
      [
        {
          className : 'dt-center', 
          targets   : [3, 4]
        }
      ],

      rowCallback : function (row, data, iDataIndex) {
        $(row).attr('id', data['id']);

        if (data['distributionChannel'] == '01') {
          $(row).find('input[value="01"]').prop('checked', true);
        } else if (data['distributionChannel'] == '03') {
          $(row).find('input[value="03"]').prop('checked', true);
        }
      }
    });
  }



  function loadRole() {
    var data = [];

    loadAll('AMI2_ROLE', 'all', function(err, res) {
      if (res.statusCode <= 299) {
        for (var i = 0; i < res.body.total_rows; i++) {
          data.push(res.body.rows[i].value);
          data[i].id = res.body.rows[i].id;
        }
      } else {
        console.log(res);
      }
    });

    localDb_Role = data;
    customerRoleId = customArrayFilter(localDb_Role, 'role', 'CUSTOMER')[0].id;
  }



  function loadUser() {
    var data = [];

    loadAll('AMI2_USER', 'all', function(err, res) {
      if (res.statusCode <= 299) {
        for (var i = 0; i < res.body.total_rows; i++) {
          data.push(res.body.rows[i].value);
          data[i].id = res.body.rows[i].id;
        }
      } else {
        console.log(res);
      }
    });

    localDb_User = data;
  }



  function loadCustomer() {
    var data = [];

    loadAll('AMI2_CUSTOMER', 'all', function(err, res) {
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



  function addExtraFields_User() {
    var data = localDb_User;

    for (var i in data) {
      var role = customArrayFilter(localDb_Role, 'id', data[i].roleId)[0];
      data[i].role = (isNotNull(role)) ? role.role : '- - -';


      data[i].fullName = data[i].firstName + ' ' + data[i].middleName + ' ' + data[i].lastName;


      data[i].channel01 = '<input type="radio" value="01" name="'+data[i].id+'">';
      

      data[i].channel03 = '<input type="radio" value="03" name="'+data[i].id+'">';


      var customer = customArrayFilter(localDb_Customer, 'customerCode', data[i].customerCode)[0]
      data[i].companyName = (isNotNull(customer)) ? customer.name1 : '- - -';
    }

    return data;
  }



/*}*/






/* Internal function {*/


/*}*/





/* Events {*/


  $('#check-distribution-channel').click(function(){
    var user_Data = [];


    datatable_User.rows().every(function(){
      var row = datatable_User.row(this).nodes().to$(),
          selectedDistributionChannel = row.find('input:radio:checked').val(),
          doc = this.data();

      if (doc.distributionChannel != selectedDistributionChannel) {
        doc.newDistributionChannel = selectedDistributionChannel;

        if (selectedDistributionChannel == '01') {
          doc.channel01 = '<i style="font-size: 16px;" class="fa fa-check text-success" aria-hidden="true"></i>';
          doc.channel03 = '';
        } 

        else if (selectedDistributionChannel == '03') {
          doc.channel01 = '';
          doc.channel03 = '<i style="font-size: 16px;" class="fa fa-check text-success" aria-hidden="true"></i>';
        }

        user_Data.push(doc);
      }
    });


    $('span#check-user-counter').html(user_Data.length);


    if (user_Data.length != 0) {
      dataTable_CheckUser = $('#check-user-table').DataTable({
        destroy      : true,
        data         : user_Data,
        ordering     : false,
        searching    : false,
        paging       : false,
        lengthChange : false,
        info         : false,
        autoWidth    : false,

        columns: 
        [
          {'data': 'customerCode', 'width': '10%'},
          {'data': 'companyName', 'width': '20%'},
          {'data': 'fullName', 'width': '20%'},
          {'data': 'channel01', 'width': '5%'},
          {'data': 'channel03', 'width': '5%'},
        ],

        columnDefs: 
        [
          {
            className : 'dt-center', 
            targets   : [3, 4]
          }
        ],

        rowCallback : function (row, data, iDataIndex) {
          $(row).attr('id', data['id']);
        }
      });

      $('#check-user-modal').modal();
    } 

    else {
      resultNotify('fa-exclamation-circle', 'INVALID', 'Change a distribution channel', 'warning');
    }
  });



  $('#save-distribution-channel').click(function(){
    $('.loading-state').fadeIn('slow');
    var isSuccess = true;

    dataTable_CheckUser.rows().every(function(){
      var data = this.data(),
          doc = {
            distributionChannel : data.newDistributionChannel
          };

      updateDocument(data.id, doc, function(err, res){
        if (res.statusCode > 299) {
          isSuccess = false;
          console.log(res);
        }
      });
    });

    
    $('#check-user-modal').modal('hide');
    if (isSuccess) {
      resultNotify('fa-check-circle', 'SUCCESS', 'Distribution channel successfully saved', 'success');
      setTimeout(function(){ loadIntervalFinish(loadUserTable); }, 2000);
    } 

    else {
      resultNotify('fa fa-times', 'ERROR', 'Distribution channel not saved.<br>Something went wrong. Please try again later', 'danger');
    }
  });



/*}*/


 
});