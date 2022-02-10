$(document).ready(function() {

	$('#loginButton').click(function(){
		if(!loginValidation()) {
			$('.callout').fadeIn('slow');
			setTimeout(function(){ $('.callout').fadeOut('slow'); }, 2000); // hide err msg after 2 sec
		} 

    else {
      disableButton('#loginButton');

      setTimeout(function(){
        async.waterfall([
          // login 1
          function(callback) {
            var info = {
              name     : $("#email").val(),
              password : $("#password").val()
            }

            loginUser(info, function(err, res){
              if (res.statusCode >= 300) {
                $('#err-msg').text('Invalid email or password');
                $('.callout').fadeIn('slow');
                setTimeout(function(){ $('.callout').fadeOut('slow'); }, 2000);
              }

              else if (res.statusCode <= 299) {
                res.password = $("#password").val();
                localStorage.setItem('userData', JSON.stringify(res)); // to register session Id before loadAll
                callback(null, res)
              }
            });
          },

          // get important roles
          function(userData ,callback) {
            var data = [];

            loadAll('AMI2_ROLE', 'all', function(err, res) {
              if (res.statusCode <= 299) {
                for (var i = 0; i < res.body.total_rows; i++) {
                  data.push(res.body.rows[i].value);
                  data[i].id = res.body.rows[i].id;
                }

                var roleData = {
                  'ROLE_ADMINISTRATOR' : customArrayFilter(data, 'role', 'ADMINISTRATOR')[0].id,
                  'ROLE_CUSTOMER'      : customArrayFilter(data, 'role', 'CUSTOMER')[0].id,
                  'ROLE_SALESPERSON'   : customArrayFilter(data, 'role', 'SALESPERSON')[0].id
                }

                callback(null, userData, roleData);
              } 

              else if (res.statusCode >= 300) {
                callback('error getting roles', null);
              }
            });
          },
        ],

        function (err, res, res2) {
          if (err) {
            alert(err);
          } else {

            localStorage.setItem('otherData', JSON.stringify(res2));
            window.location = '/ami/index/' + res.roleId; // role123
          }
        });
      }, 1000);
		}
	});


  // validates email & pass
  function loginValidation() {
    var error = [];

    if($("#email").val().trim() == '') {
    	error.push($("#email").attr('placeholder'));
    }

    if($("#password").val().trim() == '') {
    	error.push($("#password").attr('placeholder'));
    }

    if(error.length == 1) {
    	$('#err-msg').text(error[0] +' is required');
    	return false;
    } else if(error.length == 2) {
    	$('#err-msg').text(error[0] + ' and ' + error[1] + ' is required');
    	return false;
    } else {
    	return true;
    }
  }
});