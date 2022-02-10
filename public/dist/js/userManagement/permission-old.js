$(document).ready(function() {

  var localDb_Role;

  toggleBtnGroup();
  loadIntervalFinish(loadRole);



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
    createRoleList('AMI');
  }








  function createRoleList(access) {
    var roles = localDb_Role.filter(function(item) {
      return access == item.access || 'BOTH' == item.access;
    });


    var code = '';
    for (var i in roles) {
      code += '<li data-toggle="tab" data-id="' + roles[i].id + '" ><a>' + roles[i].role + '</a></li>'
    }


    $('#' + access.toLowerCase() + '-role-list').html(code);


    $('#' + access.toLowerCase() + '-role-list li').each(function(){
      $(this).click(function(){
        var id = $(this).attr('data-id');

        var permission = localDb_Role.filter(function(item) {
          return id == item.id;
        });
        permission = permission[0][(access.toLowerCase() == 'ami') ? 'amiPermission' : 'wosPermission'];

        local_loadPermission(permission, access);
      });
    });
  }


  function local_loadPermission(docPermission, access) {

    var amiPermission = GLOBAL_PERMISSION.amiPermission;
    // {
    //   "userManagement" : ["role", "permission", "user", "invitation", "distributionChannel"],
    //   "approval" : ["creditLimit", "creditNote", "normalSales", "specialSales", "controlledItemsRequest"],
    //   "discount" : ["channel", "moq", "factorySupport", "timeLimited", "dealer"],
    //   "masterData" : ["customer", "material", "price"],
    //   "settings" : ["limit", "stock", "email", "application", "forceSync", "creditNoteLevels"]
    // }

    var wosPermission = GLOBAL_PERMISSION.wosPermission;
    // {
    //   "order": ["normalOrder", "specialOrder", "consignmentOrder", "backorder", "orderTransaction"]
    // }

    var permission = (access.toLowerCase() == 'ami') ? amiPermission : wosPermission;


    for (var modules in permission) {
      // console.log('---- ' + modules);

      for (var submodules in permission[modules]) {
        var isEnabled = docPermission[modules].indexOf(permission[modules][submodules])
        // console.log(amiPermission[modules][submodules] + ' : ' + isEnabled);
        // if (isEnabled == -1) console.log(amiPermission[modules][submodules]);

        var value = (isEnabled != -1) ? 'true' : 'false';
        $('#' + access.toLowerCase() + '-accordion ul.' + modules + ' input[name='+permission[modules][submodules]+']').val(value) 
      }
    }


    toggleBtnGroup();
  }


  function toggleBtnGroup() {
    $('.btn-group').each(function(){
      $(this).find('button:eq(0)').removeClass('btn-primary').addClass('btn-default');
      $(this).find('button:eq(1)').removeClass('btn-primary').addClass('btn-default');


      var defaultChoice = ($(this).find('input').val() == 'true') ? 0 : 1;
      $(this).find('button:eq(' + defaultChoice + ')').removeClass('btn-default').addClass('btn-primary');

      $(this).find('button').click(function(){
        var choice = $(this).text();

        $(this).removeClass('btn-default').addClass('btn-primary');
        $(this).siblings('button').removeClass('btn-primary').addClass('btn-default');

        $(this).siblings('input').val( (choice == 'Yes') ? 'true' : 'false' );
      });
    });
  }


  $('#save-btn').click(function(){
    var selected = $('span.selected').text();

    if (selected == 'Bridgestone AMI') {
      var doc = {
        'amiPermission' : {}
      };
      

      doc.amiPermission.userManagement = $('#ami-user-management-form').serializeObject(),
      doc.amiPermission.approval = $('#ami-approval-form').serializeObject(),
      doc.amiPermission.discount = $('#ami-discount-form').serializeObject(),
      doc.amiPermission.masterData = $('#ami-master-data-form').serializeObject(),
      doc.amiPermission.settings = $('#ami-settings-form').serializeObject();


      var magicDoc = {
        'amiPermission' : {}
      };

      //* change true to module name
      for (var module in doc.amiPermission){
        // console.log('~ ~ ~ ' + module);
        magicDoc.amiPermission[module] = [];

        for (var submodule in doc.amiPermission[module]){
          if (doc.amiPermission[module][submodule] == 'true') {
            magicDoc.amiPermission[module].push(submodule);
          }
        }
      }


      /* Update role */
      var id = $('#ami-role-list li.active').attr('data-id');

      if (id != undefined) {
        

        if (JSON.parse(localStorage.getItem("userData")).roleId == id) {
          // console.log('old');
          // console.log(JSON.parse(localStorage.getItem("userData")));

          var updatedLocalStorage = JSON.parse(localStorage.getItem("userData"));

              updatedLocalStorage.amiPermission = magicDoc.amiPermission;
              localStorage.setItem("userData", JSON.stringify(updatedLocalStorage));


          // console.log('new');
          // console.log(JSON.parse(localStorage.getItem("userData")));
        }
        

        updatePermission(id, doc, function(err, res){
          if (res.statusCode <=299) {
            resultNotify('fa-check-circle', 'SUCCES', 'Permission successfully updated', 'success');
            $('.loading-state').fadeOut('slow');

            var indexToDelete = localDb_Role.findIndex(function(item){
              return item.id == id
            });

            localDb_Role[indexToDelete].amiPermission = magicDoc.amiPermission;
          } else {
            resultNotify('fa fa-times', 'ERROR', 'Permission not updated.<br>Something went wrong. Please try again later', 'danger');
          }
        });
      } else {
        resultNotify('fa-exclamation-circle', 'INVALID', 'Select a role first', 'warning'); 
      }
      
    } else {
      var doc = {
        'wosPermission' : {}
      };


      doc.wosPermission.order = $('#wos-order-form').serializeObject();
      doc.wosPermission.user = { 'profile' : 'true'};


      var magicDoc = {
        'wosPermission' : {}
      };

      //* change true to module name
      for (var module in doc.wosPermission){
        // console.log('~ ~ ~ ' + module);
        magicDoc.wosPermission[module] = [];

        for (var submodule in doc.wosPermission[module]){
          if (doc.wosPermission[module][submodule] == 'true') {
            magicDoc.wosPermission[module].push(submodule);
          }
        }
      }


      /* Update role */
      var id = $('#wos-role-list li.active').attr('data-id');

      if (id != undefined) {
        updatePermission(id, doc, function(err, res){
          if (res.statusCode <=299) {
            resultNotify('fa-check-circle', 'SUCCES', 'Permission successfully updated', 'success');
            $('.loading-state').fadeOut('slow');
            
            var indexToDelete = localDb_Role.findIndex(function(item){
              return item.id == id
            });

            localDb_Role[indexToDelete].wosPermission = magicDoc.wosPermission;
          } else {
            resultNotify('fa fa-times', 'ERROR', 'Permission not updated.<br>Something went wrong. Please try again later', 'danger');
          }
        });
      } else {
        resultNotify('fa-exclamation-circle', 'INVALID', 'Select a role first', 'warning'); 
      }
    }

    
  });

  

   $('ul.dropdown-menu li').click(function(){
    var selected = $(this).text();
    $(this).parent().siblings('button').find('span.selected').text(selected);

    createRoleList($(this).attr('data-access'));
  });


});