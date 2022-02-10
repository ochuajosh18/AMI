checkSession();
setUserData();
$('#customer-info').parent().parent().hide();

$(document).ready(function() {
  var USER_DOC = JSON.parse(localStorage.getItem("userData"));

  loadAccountInformation();
  $('div.isChangePassword').hide();


  function loadAccountInformation() {
    USER_DOC = JSON.parse(localStorage.getItem("userData"));

    $("#account-info .firstName").text(isNotBlank(USER_DOC.firstName));
    $("#account-info .lastName").text(isNotBlank(USER_DOC.lastName));
    $("#account-info .userName").text(isNotBlank(USER_DOC.userName));
    $("#account-info .email").text(isNotBlank(USER_DOC.email));
  }



  function loadCustomerRoleId() {
    var data = [];

    loadDocsByKey('WOS2_ROLE', 'byRole', 'CUSTOMER', function(err, res) {
      if (res.statusCode <= 299) {
        for (var i = 0; i < res.body.total_rows; i++) {
          data.push(res.body.rows[i].value);
          data[i].id = res.body.rows[i].id;
        }
      } else {
        console.log(res);
      }
    });

    return data[0].id;
  }



  function defaultValidation(id) {
    var error;
    var isValid = true;


    $(id+' input').each(function() {
      // null value
      if ($(this).val().trim() == '') {
        isValid = false;
        $(this).parent().parent().addClass('has-error');
      } else {
        $(this).parent().parent().removeClass('has-error');
        $(this).parent().find('span').fadeOut('slow');
      }
    });

    return isValid;
  }



  $('#update-account-modal-btn').click(function() {
    $('#update-account-modal').modal();
    $('#update-account-form [name="firstName"]').val(USER_DOC.firstName);
    $('#update-account-form [name="lastName"]').val(USER_DOC.lastName);
  });



  $('#update-account-btn').click(function(){
    var isValid = defaultValidation('#update-account-modal');

    if (isValid) {
      disableButton('#update-account-btn');
      setTimeout(function(){ 

      var doc = $('#update-account-form').serializeObject();
          doc.lastName = doc.lastName.toUpperCase().trim(),
          doc.firstName = doc.firstName.toUpperCase().trim();

      updateDocument(USER_DOC.id, doc, function(err, res){
        $('#update-account-modal').modal('hide');

        if (res.statusCode <= 299) {
          var storage = JSON.parse(localStorage.getItem("userData")),
              newKey = Object.keys(doc);

          for (var i in newKey) {
            storage[newKey[i]] = doc[newKey[i]];
          }

          localStorage.setItem('userData', JSON.stringify(storage));
          resultNotify('fa-check-circle', 'SUCCESS', 'Account successfully updated', 'success');
          setTimeout(function(){ loadAccountInformation(); }, 2000);
        }

        else if (res.statusCode >= 300) {
          console.log(res);
          resultNotify('fa fa-times', 'ERROR', 'Account not updated.<br>Something went wrong. Please try again later', 'danger');
        }
      });

      }, 1000);
    }
  });



  $('#update-credential-modal-btn').click(function(){
    $('#update-credential-modal').modal();
    $('#update-credential-form [name="userName"]').val(USER_DOC.userName);
    $('#update-credential-form [name="email"]').val(USER_DOC.email);
  });



  $('#isChangePassword').change(function(){
    if ($(this).is(':checked')) {
      $('div.isChangePassword').fadeIn();
    } else {
      $('div.isChangePassword').fadeOut();
    }
  });



  $('#update-credential-btn').click(function(){
    var isValid = defaultValidation('#update-credential-form');

    if (isValid) {
      disableButton('#update-credential-btn');
      setTimeout(function(){ 

      var credentialForm = $('#update-credential-form').serializeObject();

      // change password checked
      if ($('#isChangePassword').is(':checked')) {
        var isValid2 = defaultValidation('#update-credential2-form');
        
        if (isValid2) {
          var credential2Form = $('#update-credential2-form').serializeObject();
          // password correct
          if (credential2Form.oldPassword == USER_DOC.password) {
            // new password match
            if (credential2Form.newPassword == credential2Form.newPassword2) {
              var doc2 = {
                password : credential2Form.newPassword,
                oldUserName : USER_DOC.userName
              };

              updatePassword(doc2, function(err, res){
                $('#update-credential-modal').modal('hide');

                if (res.statusCode <= 299) {
                  res.password = credential2Form.newPassword;
                  localStorage.setItem('userData', JSON.stringify(res));

                  updateDocument(USER_DOC.id, credentialForm, function(err, res2){
                    if (res2.statusCode <= 299) {
                      var storage = JSON.parse(localStorage.getItem("userData"));

                      storage.userName = credentialForm.userName;
                      localStorage.setItem('userData', JSON.stringify(storage));
                      resultNotify('fa-check-circle', 'SUCCESS', 'Credential successfully updated', 'success');
                      setTimeout(function(){ window.location.href = '/ami/profile/' + USER_DOC.roleId; }, 1500);
                    }

                    else if (res2.statusCode >= 300) {
                      console.log(res2);
                      resultNotify('fa fa-times', 'ERROR', 'Account not updated.<br>Something went wrong. Please try again later', 'danger');
                    }
                  });
                }

                else if (res.statusCode >= 300) {
                  console.log(res);
                  resultNotify('fa fa-times', 'ERROR', 'Credential not updated.<br>Something went wrong. Please try again later', 'danger');
                }
              });

              $('#update-credential2-form [name=newPassword2]').parent().parent().removeClass('has-error');
            } else {
              alert('Password did not match');
              $('#update-credential2-form [name=newPassword2]').parent().parent().addClass('has-error');
            }
            $('#update-credential2-form [name=oldPassword]').parent().parent().removeClass('has-error');
          } else {
            alert('Incorrect password');
            $('#update-credential2-form [name=oldPassword]').parent().parent().addClass('has-error');
          }
        }
      }

      /*// change password not checked
      else {
        updateDocument(USER_DOC.id, credentialForm, function(err, res){
          $('#update-credential-modal').modal('hide');

          if (res.statusCode <= 299) {
            var storage = JSON.parse(localStorage.getItem("userData"));

            storage.userName = credentialForm.userName;
            localStorage.setItem('userData', JSON.stringify(storage));
            resultNotify('fa-check-circle', 'SUCCESS', 'Credential successfully updated', 'success');
            setTimeout(function(){ loadAccountInformation(); }, 2000);
          }

          else if (res.statusCode >= 300) {
            console.log(res);
            resultNotify('fa fa-times', 'ERROR', 'Account not updated.<br>Something went wrong. Please try again later', 'danger');
          }
        });
      }*/

      }, 1000);
    }
  });
})

