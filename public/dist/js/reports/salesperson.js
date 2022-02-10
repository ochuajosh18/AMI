checkSession();
setUserData();

$(document).ready(function() {
  var salespersonRoleId = JSON.parse(localStorage.getItem("otherData")).ROLE_SALESPERSON;
  loadSalespersonTable();

  $('.select2').select2();
  
/* Load document {*/
  function loadSalespersonTable() {
    loadUser_ByRole(salespersonRoleId, 'SALESPERSON', function(err, res){
      var salesperson=[],users=[],orders=[];
      var users = res;
      for(var i in users){
        var psrtotal=0,tsrtotal=0;
        loadOrder_BySalesPerson(users[i].customerCode, 'confirmed', '[2018,5,11,0,0,0]', '[2018,6,19,0,0,0]', function(err, res){
          var orders = res;
          var psr=0,tsr=0,total=0;
          for (var x in orders){
            if  (orders[x].materialCode.substring(0, 3)=='PSR'){
              psr=psr+parseInt(orders[x].quantity);
              total=total+parseInt(orders[x].quantity);
            }else{
              tsr=tsr+parseInt(orders[x].quantity);
              total=total+parseInt(orders[x].quantity);
            }
          }
          salesperson.push({'code': users[i].customerCode, 'firstName': users[i].firstName, 'lastName': users[i].lastName, 'PSR': psr, 'TBR': tsr, 'Grand Total' : total});
       });
      }
      var len=salesperson.length;
      var i = 0;
      for (; i < len; ) { 
        psrtotal += salesperson[i].PSR;
        i++;
      }
      var len=salesperson.length;
      var i = 0;
      for (; i < len; ) { 
        tsrtotal += salesperson[i].TBR;
        i++;
      }
      salesperson.push({'code': '', 'firstName': 'Grand Total', 'lastName': 'total', 'PSR': psrtotal, 'TBR': tsrtotal, 'Grand Total' : psrtotal+tsrtotal});
      var columns = 
        [
          {'data': 'label', 'defaultContent': ''},
        ];
      for (var i in salesperson) {
        columns.push({'data': salesperson[i].code, 'defaultContent': ''});
      }
      // create thead
      var theadCode = '<thead><tr>';
      theadCode += '<th>Label</th>';
      for (var i in salesperson) {
        theadCode += '<th>'+salesperson[i].firstName+'</th>'
      }
      theadCode += '</thead></tr>';
      $('#salesperson-table').prepend(theadCode);
      len=salesperson.length;
      var tfootCode = '<tfoot><tr>';
      tfootCode += '<th>Grand Total</th>';
      var grandTotal=0;
      for (i=0; i<len; i++){
        grandTotal=salesperson[i].PSR+salesperson[i].TBR;
        tfootCode += '<th>'+grandTotal+'</th>';
      }
      tfootCode += '</foot></tr>';
      $('#salesperson-table').append(tfootCode);
      // data config DT
      var rows = [ 'PSR', 'TBR' ];
      var data = [];
      for (var i in rows) {
        data.push({ 'label' : rows[i]});
        for (var j in salesperson) {
          data[i][salesperson[j].code] = salesperson[j][rows[i]];
        }
      }
    datatable_CustomerUser = $('#salesperson-table').DataTable({
      data : data,
      columns : columns,
      rowCallback : function (row, data, iDataIndex) {
        $(row).attr('id', data['id']);
        $(row).find('.salesperson-customers-modal').click(function(){
          loadSalespersonCustomers(data);
          $('#map-customer-btn').attr('data-referenceId', data['id'].replace('USER::',''));
        });
      }
    });
  });
    $('.loading-state').fadeOut('slow');
  }

  var months = [
  'January', 'February', 'March', 'April', 'May',
  'June', 'July', 'August', 'September',
  'October', 'November', 'December'
  ];

  var code = "";
  for(m in months){
    code += '<option>' + months[m] + '</option>';
  }

  $("#salesperson-month-select").html(code);

});