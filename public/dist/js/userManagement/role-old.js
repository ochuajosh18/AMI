checkSession();
setUserData();

$(document).ready(function() {

  var localDb_Role,
      datatable_Role,
      customerRoleId;

  loadIntervalFinish(loadRoleTable);
  // loadRoleTable();


/* Load table {*/



  function loadRoleTable() {
    loadRole();
    localDb_Role = addExtraFields_Role(localDb_Role);
    
    dataTable_Role = $('#role-table').DataTable({
      destroy   : true,
      data      : localDb_Role,
      autoWidth : false,

      columns :
      [
        {'data': 'role'},
        {'data': 'access', 'width': '15%'},
        // {
        //   'data': null, 'orderable': false, 'width': '50px', 
        //   render: function (data, type, row) {
        //     var buttons = '<button class="btn btn-primary btn-xs edit-role-modal" data-toggle="tooltip" data-placement="left" data-toggle="tooltip" title="Edit role"><i class="fa fa-pencil-square-o"></i></button>';
        //     buttons += '<button class="btn btn-danger btn-xs delete-role-modal margin-left-10" data-toggle="tooltip" data-placement="left"  data-toggle="tooltip" title="Delete role"><i class="fa fa-trash"></i></button>';
        //     return buttons; 
        //   }
        // }
        {'data': 'action', 'width': '50px', 'orderable': false}
      ], 

      columnDefs:
      [
        { 
          className: 'dt-center', 
          targets: [1, 2]
        }
      ], 
      
      rowCallback : function (row, data, iDataIndex) {
        $(row).attr('id', data['id']);
        editItem($(row).find('a.edit-trigger'), data);
        deleteItem($(row).find('a.delete-trigger'), data['id']);
        // editItem($(row).find('.edit-role-modal'), data);
        // deleteItem($(row).find('.delete-role-modal'), data);
      },
      initComplete : function(settings, json) { $('.loading-state').fadeOut('slow'); }
    });
  }



  function addExtraFields_Role(data) {
    for (var i in data) {
      data[i].action = '';
      data[i].action += '<div class="dropdown">';
      data[i].action +=   '<button class="btn btn-default btn-block btn-sm btn-flat dropdown-toggle" type="button" data-toggle="dropdown">Action <span class="caret"></span></button>';
      data[i].action +=   '<ul class="dropdown-menu small-font">';
      data[i].action +=     '<li><a href="#" class="edit-trigger"><i class="fa fa-pencil-square-o"></i> Edit role</a></li>';
      data[i].action +=     '<li><a href="#" class="delete-trigger"><i class="fa fa-trash"></i> Delete role</a></li>';
      data[i].action +=   '</ul>';
      data[i].action += '</div>';

    }

    return data;
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
  }
/*}*/





/* Internal function {*/



  function editItem(element, data) {
    element.off('click');
    element.click(function(){
      var id = data.id,
          role = data.role,
          access = data.access;

      refreshModal('#edit-role-modal');
      $('#edit-role-form input[name=id]').val(id);
      $('#edit-role-form input[name=role]').val(role);
      $('#edit-role-form input[name=access][value='+access+']').prop('checked', true);
      $('#edit-role-modal').modal();
    });
  }



  function deleteItem(element, id) {
    element.off('click');
    element.click(function(){
      $('#delete-role-modal').modal();
      $('#delete-role-form input[name=id]').val(id);
    });
  }



  function refreshModal(id) {
    $(id+' .form-group').each(function() { 
      $(this).removeClass('has-error');
      $(this).find('input[type=text]').val('');
      $(this).find('span').hide();
      $(this).find('input[type=radio]').prop('checked', false);
    });
  }



  function defaultValidation(id) {
    var error;
    var isValid = true;

    // input type text validation
    $(id + ' input[type=text]').each(function() {
      if ($(this).val().trim() == '') {
        isValid = false;
        error = $(this).parent().parent().find('label').text()+' is required';
        $(this).parent().parent().addClass('has-error');
        $(this).parent().find('span').html(error).fadeIn('slow');
      } 

      else {
        $(this).parent().parent().removeClass('has-error');
        $(this).parent().find('span').fadeOut('slow');
      }
    });


    // dropdown validation
    $(id+' select').each(function() {
      if ($(this).val() == 'blank') {
        isValid = false;
        error = $(this).parent().parent().find('label').text()+' is required';
        $(this).parent().parent().addClass('has-error');
        $(this).parent().find('span').html(error).fadeIn('slow');
      } else {
        $(this).parent().parent().removeClass('has-error');
        $(this).parent().find('span').fadeOut('slow');
      }
    });

    // radio button validation
    $(id+' input[type=radio]').each(function() {

      if($(id + ' input[name='+$(this).attr('name')+']:checked').length <= 0) {
        isValid = false;
        error =$(this).parent().parent().parent().find('label.control-label').text()+' is required';
        $(this).parent().parent().find('span').html(error).fadeIn('slow').css('color', '#dd4b39');
        $(this).parent().parent().parent().addClass('has-error');
      } else {
        $(this).parent().parent().parent().removeClass('has-error');
        $(this).parent().parent().find('span').fadeOut('slow');
      }
    });

    return isValid;
  }
/*}*/






/* Events {*/



  $('[data-toggle="tooltip"]').tooltip();
  $('input[type=radio]').mouseout(function(){
    $('[data-toggle="tooltip"]').tooltip('hide')
  });



  $('#open-add-role-modal').click(function(){
    refreshModal('#add-role-modal');
    $('#add-role-modal').modal();
  });



  $('#add-role-btn').click(function() {
    var isValid = defaultValidation('#add-role-modal');

    if (isValid) {
      $('.loading-state').fadeIn('slow');


      var data = $('#add-role-form').serializeObject(),
          doc = {
            access        : data.access,
            amiPermission : GLOBAL_PERMISSION.amiPermission,
            channels      : ['ROLE'],
            docType       : 'ROLE',
            role          : data.role.toUpperCase(),
            wosPermission : GLOBAL_PERMISSION.wosPermission
          }


      createDocument('ROLE::', doc, function(err, res) {
        $('#add-role-modal').modal('hide');

        if ( res.statusCode <= 299 ) {
          resultNotify('fa-check-circle', 'SUCCESS', 'Role successfully created', 'success');
          setTimeout(function(){ loadIntervalFinish(loadRoleTable); }, 2000);
        } 

        else {
          console.log(res);
          resultNotify('fa fa-times', 'ERROR', 'Role not created.<br>Something went wrong. Please try again later', 'danger');
        }
      });
    }
  });



  $('#edit-role-btn').click(function(){
    var isValid = defaultValidation('#edit-role-modal');

    if (isValid) {
      $('.loading-state').fadeIn('slow');


      var form = $('#edit-role-form').serializeObject(),
          doc = {
            role   : form.role.toUpperCase().trim(),
            access : form.access
          }


      updateDocument(form.id, doc, function(err, res){
        $('#edit-role-modal').modal('hide');

        if (res.statusCode <= 299) {
          resultNotify('fa-check-circle', 'SUCCESS', 'Role successfully updated', 'success');
          setTimeout(function(){ loadIntervalFinish(loadRoleTable); }, 2000);
        } 

        else {
          console.log(res);
          resultNotify('fa fa-times', 'ERROR', 'Role not updated.<br>Something went wrong. Please try again later', 'danger');
        }
      });
    }
  });



  $('#delete-role-btn').click(function(){
    var doc = $('#delete-role-form').serializeObject();
    $('.loading-state').fadeIn('slow');

    deleteChannel(doc.id, function(err, res){
      $('#delete-role-modal').modal('hide');

      if (res.statusCode <= 299) {
        resultNotify('fa-check-circle', 'SUCCESS', 'Role successfully deleted', 'success');
        setTimeout(function(){ loadIntervalFinish(loadRoleTable); }, 2000);
      } 

      else {
        console.log(res);
        resultNotify('fa fa-times', 'ERROR', 'Role not deleted.<br>Something went wrong. Please try again later', 'danger');
      }
    });
  });
/*}*/

  





});