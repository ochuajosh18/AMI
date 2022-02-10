checkSession();
setUserData();

$(document).ready(function() {

  $("#email-content").wysihtml5();
  $("#terms-condition-content").wysihtml5();

  
  loadInterval(loadEmails);


  function loadEmails() {
    var data = [];

    loadAll('AMI2_EMAIL', 'all', function(err, res) {
      if (res.statusCode <= 299) {
        for (var i = 0; i < res.body.total_rows; i++) {
          data.push(res.body.rows[i].value);
          data[i].id = res.body.rows[i].id;
        }
      } else {
        console.log(res);
      }

      // localDb_Email = data;
    });


    var list = '';
    for (var i = 0; i < data.length; i++) {
      list += '<li data-toggle="tab"><a href="#">'+data[i].type+'</a>';
      list +=   '<form hidden>'; // hidden
      list +=     '<input type="text" name="id" value="'+data[i].id+'">';
      list +=     '<input type="text" name="subject" value="'+data[i].subject+'">';
      list +=     '<textarea name="content">'+data[i].content+'</textarea>';
      if (data[i].type == 'CUSTOMER INVITATION') {
        list +=     '<textarea name="termsAndCondition">'+data[i].termsAndCondition+'</textarea>';
      }
      list +=   '</form>';
      list += '</li>';
    }

    $('#email-list').html(list);
    listClick();

    $('.loading-state').fadeOut('slow');
  }


  function listClick() {
    $('#email-list li').click(function(){
      var email = $(this).find('form').serializeObject(),
          type = $(this).find('a').text();
      $('#email-notif-form input[name=id]').val(email.id);
      $('#email-notif-form input[name=subject]').val(email.subject);
      $('#email-notif-form [name=content]').html(email.content);

      $('iframe:eq(0)').contents().find("body").html(email.content);

      
      if (type == 'CUSTOMER INVITATION') {
        $('.show-hide-nav-tab').show();
        $('#email-notif-form [name=termsAndCondition]').html(email.content);
        $('iframe:eq(1)').contents().find("body").html(email.termsAndCondition);
      } else {
        $('.show-hide-nav-tab').hide();
        $('#email-notif-form [name=termsAndCondition]').html('');
        $('iframe:eq(1)').contents().find("body").html('');
      }

      $('.show-hide-nav-tab li:eq(0)').addClass('active');
      $('.show-hide-nav-tab li:eq(1)').removeClass('active');

      $('#content-tab').addClass('in active');
      $('#tems-condition-tab').removeClass('in active');

    });
  }


  $('#edit-email-notif-btn').click(function(){
    var name = $('#email-notif-form input[name=subject]').val().trim(),
    isValid = true;

    if ( name != '' ) {
      $('#email-notif-form input[name=subject]').parent().removeClass("has-error");
    } else {
      isValid = false;
      $('#email-notif-form input[name=subject]').parent().addClass("has-error");
    }


    if (isValid) {

      $('.loading-state').fadeIn('slow');

      var doc = $('#email-notif-form').serializeObject();
      console.log(doc);
      var id = doc.id;
      doc.subject = doc.subject.toUpperCase().trim();
      delete doc["_wysihtml5_mode"];
      delete doc["id"];


      updateDocument(id , doc, function(err, res) {
        if ( res.statusCode <= 299 ) {
          var form = $('input[value="'+id+'"]').parent();

          form.find('input[name=subject]').val(doc.subject);
          form.find('textarea[name=content]').val(doc.content);
          form.find('textarea[name=termsAndCondition]').val(doc.termsAndCondition);

          resultNotify('fa-check-circle', 'SUCCESS', 'Email tempalate succecssfully updated', 'success');
          $('.loading-state').fadeOut('slow');
        } else {
          resultNotify('fa fa-times', 'ERROR', 'Email tempalate not updated.<br>Something went wrong. Please try again later', 'danger');
        }
      });

    }
  });
});