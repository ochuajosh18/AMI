var request = require('request').defaults({json: true}),
    config = require('../config/config'),
    uuid= require('uuid'),
    async = require('async'),
    loadModel  = require('../models/load').loadModel,
    emailModel  = require('../models/email').emailModel,
    moment = require('moment');


function credentialModel(){}



credentialModel.loginUser = function(info, callback){

  try {
    async.waterfall([

      // get reference id
      function(callback){
        var syncOptions = {
          url    : config.admin.url + '_design/AMI2_USER/_view/byUserName?key="' + info.name + '"', 
          method : 'GET'
        }


        request(syncOptions, function(err, res) {
          if (err) {
            console.log(err); 
            return callback(err, null);
          } 

          else if (res.statusCode >= 300) {
            console.log('--- ERROR: get reference id by username (statusCode '+ res.statusCode +')');
            return callback(res, null);
          }

          else if(res.body.total_rows == 0 ){
            console.log('--- ERROR: get reference id by username (username do not exist)');

            var custError = {
              statusCode : '322',
              message    : 'Username do not exist'
            }

            return callback(null, 'tryEmail');
          }

          else {
            callback(null, res.body.rows[0].value.referenceId);            
          }
        });            
      },

      // get reference id 2
      function(referenceId, callback){
        if (referenceId == 'tryEmail') {
          var syncOptions = {
            url    : config.admin.url + '_design/AMI2_USER/_view/byEmail?key="' + info.name + '"',
            method : 'GET'
          }


          request(syncOptions, function(err, res) {
            if (err) {
              console.log(err); 
              return callback(err, null);
            } 

            else if (res.statusCode >= 300) {
              console.log('--- ERROR: get reference id by email (statusCode '+ res.statusCode +')');
              return callback(res, null);
            }

            else if(res.body.total_rows == 0 ){
              console.log('--- ERROR: get reference id by email (email do not exist)');

              var custError = {
                statusCode : '322',
                message    : 'Email do not exist'
              }

              return callback(custError, null);
            }

            else {
              console.log(res.body.rows[0].value);
              callback(null, res.body.rows[0].value.referenceId);            
            }
          });     
        }

        else {
          callback(null, referenceId);
        } 
      },


      // get session id
      function(referenceId, callback){
        var userCredentials = {
          name     : referenceId,
          password : info.password
        }


        var syncOptions = {
          headers : {
            "Content-Type" : "application/json",
            "Accept"       : "application/json"
          },
          url    : config.public.url + '_session',
          method : 'POST',
          body   : userCredentials
        }


        request(syncOptions, function(err, res) {
          if (err) {
            console.log(err); 
            return callback(err, null);
          } 

          else if (res.statusCode >= 300) {
            console.log('--- ERROR: get session id (statusCode '+ res.statusCode +')');
            return callback(res, null);
          }

          else {
            var sessionID = res.headers['set-cookie'][0].split(';')[0];
            callback(null, sessionID, referenceId)
          }
        });
      },


      // get user data
      function(sessionID, referenceId, callback) {
        var id = "USER::" + referenceId ;


        loadModel.loadDocsByIdModel(id, function(err, res) {
          if(err) {
            console.log(err)
            return callback(err, null);
          }

          else if (res.statusCode >= 300) {
            console.log('--- ERROR: get user data (statusCode '+ res.statusCode +')');
            return callback(res, null);
          }

          else {
            var userData = res.body;
            userData.sessionID = sessionID;
            userData.id = res.body._id;
            callback(null, userData);
          }

        });
      },


      // get role fields
      function(userData, callback) {
        loadModel.loadDocsByIdModel(userData.roleId, function(err, res) {
          if (err) {
            return callback(err, null);
          } 

          else if (res.statusCode >= 300) {
            console.log('--- ERROR: get role fields (statusCode '+ res.statusCode +')');
            return callback(err, null);
          }

          else if (res.body.access == 'WOS') {
            var custError = {
              statusCode : 322,
              message    : 'This account is on wos only'
            }

            return callback(custError, null);
          }

          else {
            userData.amiPermission = res.body.amiPermission,
            userData.access = res.body.access;
            userData.statusCode = res.statusCode;
            callback(null, userData);
          }
        });
      }
    ],


    function (err, res) {
      if (err) {
        callback(err, null);
      }

      else {
        callback(null, res);
      }
    });

  } catch (err) {
    console.log(err)
  }
}



credentialModel.createUser = function(info, callback){
  // info.dateCreated = moment().format('YYYY-MM-DD h:mm a');

  try {
    var reference = uuid.v4();
    var id = 'USER::' + reference;
    info.channels.push(id);

    async.waterfall([

      // create doc on couchbase
      function(callback){
        info.referenceId = reference ;
        var syncOptions = {
          headers : {
            "Content-Type" : "application/json",
            "Accept" : "application/json"
          },
          url    : config.admin.url + id,
          method : 'PUT',
          body   : info
        };

        request(syncOptions, function(err, res) {
          if (err) {
            console.log(err); 
            return callback(err, null);
          } 

          else if (res.statusCode > 300) {
            return callback(res, null);
          } 
          
          else {
            callback(null, res);
          }
        });
      },

      // create user on sync gateway
      function(res, callback) {
        var info2 = {
          name     : reference,
          password : 'password', // 'brdg' + id.substring(6, 14)
          admin_channels : [
              id,
              "ADMIN",
              "CREDIT::LIMIT",
              "CUSTOMER",
              "MATERIAL",
              "PRICE",
              "STOCK::LIMIT",
              "STORING::REPORT",

              "DISCOUNT::SETTING",
              "CHANNEL::DISCOUNT",
              "MOQ::DISCOUNT",
              "FACTORY::SUPPORT::DISCOUNT",
              "TIME::LIMITED::DISCOUNT",
              // "CUSTOMER::CHANNEL",
              // "CUSTOMERCHANNEL",
              // "DEALER",
              
              "ROLE",
              "EMAIL",
              "VISIBLE::STOCK",
              "PAYMENT",
              "SETTING",
              "USER",

              "NON::CUSTOMER::USER"
            ]
        }


        var syncOptions2 = {
          headers : {
            "Content-Type" : "application/json",
            "Accept" : "application/json"
          },
          url    : config.admin.url + '_user/' + reference,
          method : 'PUT',
          body   : info2
        };

        request(syncOptions2, function(err, res) {
          if (err) {
            console.log(err); 
            return callback(err, null);
          } 

          else if (res.statusCode > 300) {
            return callback(res, null);
          } 
          
          else {
            callback(null, res);
          }
        });
      }
    ],
    function (err, res) {
      if (err) {
        callback(err, null);
      } else {
        callback(null, res);
      }
      
    });
   
  } catch (err) {
    console.log(err)
  }
}


/*
invitation.js 
1) create doc on couchbase
2) create user on sync gateway
*/
credentialModel.createCustomerUserAccount = function(info, callback){
  console.log('createCustomerUserAccount');
  try {
    const reference =  uuid.v4();
    info.referenceId = reference;

    async.waterfall([
      // create doc on couchbase
      function(callback){
        let id = 'USER::' + reference;
        const syncOptions = {
          headers : {
            "Content-Type" : "application/json",
            "Accept"       : "application/json"
          },
          url    : config.admin.url + id,
          method : 'PUT',
          body   : info
        };

        request(syncOptions, function(err, res) {
          if (err) {
            console.log('--- ERROR: there is an error');
            return callback(err, null);
          } else if (res.statusCode >= 300) {
            console.log('--- ERROR: cannot create document on couchbase (statusCode '+ res.statusCode +')');
            return callback(res, null);
          } else if (res.statusCode <= 299) {
            callback(null, res);
          } else {
            return callback(res, null);
          }
        });
      },

      // create user on sync gateway
      function(result, callback) {
        let user_sync = {
          name     : reference,
          password : 'BST' + reference.substring(0,5),
          admin_channels : [
            info.customerCode,
            "CHANNEL::DISCOUNT",
            "CREDIT::LIMIT",
            "CUSTOMER",
            "EMAIL",
            "FACTORY::SUPPORT::DISCOUNT",
            "MATERIAL",
            "MOQ::DISCOUNT",
            "NON::CUSTOMER::USER",
            "PRICE",
            "ROLE",
            "STOCK::LIMIT",
            "STORING::REPORT",
            "TIME::LIMITED::DISCOUNT",
            "VISIBLE::STOCK"
          ]
        };

        const syncOptions = {
          headers: {
            "Content-Type" : "application/json",
            "Accept"       : "application/json"
          },
          url    : config.admin.url + '_user/' + reference,
          method : 'PUT',
          body   : user_sync
        };

        request(syncOptions, function(err, res) {
          if (err) {
            console.log('--- ERROR: there is an error');
            return callback(err, null);
          } else if (res.statusCode >= 300) {
            console.log('--- ERROR: cannot create user on sync gateway (statusCode '+ res.statusCode +')');
            return callback(res, null);
          } else if (res.statusCode <= 299) {
            let doc = {
              statusCode : res.statusCode,
              email      : info.email,
              password   : user_sync.password,
            }
            callback(null, doc);
          } else {
            return callback(res, null);
          }
        });
      }
    ],

    function (err, res) {
      if (err) {
        callback(err, null);
      } else {
        callback(null, res);
      }
    });
  } catch (err) {
    callback(err, null);
  }
}


/*
invitation.js
1) create doc on couchbase
2) create user on sync gateway
*/
credentialModel.createSalespersonUserAccount = function(info, callback){
  try {
    const reference =  uuid.v4();
    info.referenceId = reference;

    async.waterfall([
      // create doc on couchbase
      function(callback){
        let id = 'USER::' + reference;
        var syncOptions = {
          headers : {
            "Content-Type" : "application/json",
            "Accept"       : "application/json"
          },
          url    : config.admin.url + id,
          method : 'PUT',
          body   : info
        };

        request(syncOptions, function(err, res) {
          if (err) {
            console.log('--- ERROR: there is an error');
            return callback(err, null);
          } else if (res.statusCode >= 300) {
            console.log('--- ERROR: cannot create document on couchbase (statusCode '+ res.statusCode +')');
            return callback(res, null);
          } else if (res.statusCode <= 299) {
            callback(null, res);
          } else {
            return callback(res, null);
          }
        });
      },

      // create user on sync gateway
      function(result, callback) {
        let user_sync = {
          name     : reference,
          password : 'BST' + reference.substring(0,5),
          admin_channels : [
            info.customerCode,
            "CHANNEL::DISCOUNT",
            "CREDIT::LIMIT",
            "CUSTOMER",
            "EMAIL",
            "FACTORY::SUPPORT::DISCOUNT",
            "MATERIAL",
            "MOQ::DISCOUNT",
            "NON::CUSTOMER::USER",
            "PRICE",
            "ROLE",
            "STOCK::LIMIT",
            "STORING::REPORT",
            "TIME::LIMITED::DISCOUNT",
            "VISIBLE::STOCK",
          ]
        };
        
        let customerChannels = info.customers;
        user_sync.admin_channels = user_sync.admin_channels.concat(customerChannels); // add customer

        const syncOptions = {
          headers : {
            "Content-Type" : "application/json",
            "Accept"       : "application/json"
          },
          url    : config.admin.url + '_user/' + reference,
          method : 'PUT',
          body   : user_sync
        };

        request(syncOptions, function(err, res) {
          if (err) {
            console.log('--- ERROR: there is an error');
            return callback(err, null);
          } else if (res.statusCode >= 300) {
            console.log('--- ERROR: cannot create user on sync gateway (statusCode '+ res.statusCode +')');
            return callback(res, null);
          } else if (res.statusCode <= 299) {
            let doc = {
              statusCode : res.statusCode,
              email      : info.email,
              password   : user_sync.password,
            }
            callback(null, doc);
          } else {
            return callback(res, null);
          }
        });
      }
    ],

    function (err, res) {
      if (err) {
        callback(err, null);
      } else {
        callback(null, res);
      }
    });
  } catch (err) {
    callback(err, null);
  }
}


/*
user.js
1) get user document 
2) update changes on document
3) get user on sync gateway
4) remove old customers and add new customers & update changes on channels on user sync gateway
*/
credentialModel.updateSalesperson_CustomerMap = function(info, referenceId, callback){
  try { 
    var oldCustomers;

    async.waterfall([
      // get specific doc
      function(callback) {
        var syncOptions = {
          headers: {
            "Accept" : "application/json"
          },
          url: config.admin.url + 'USER::' + referenceId,
          method: 'GET'
        };

        request(syncOptions, function(err, res) {
          if (err) {
            console.log(err);
            return callback(err, null);
          }

          else if (res.statusCode >= 300) {
            console.log('--- ERROR: cannot get specific document (statusCode '+ res.statusCode +')');
            return callback(res, null);
          } 

          else {
            oldCustomers = res.body.customers;
            callback(null, res.body);
          }
        });
      },

      // update changes on document
      function(mainDoc, callback) {
        var changed =  Object.keys(info);

        for (var i in changed) {
          mainDoc[changed[i]] = info[changed[i]];
        }

        var syncOptions = {
          headers : {
            "Content-Type" : "application/json",
            "Accept" : "application/json"
          },
          url    : config.admin.url + mainDoc._id + '?rev=' + mainDoc._rev,
          method : 'PUT',
          body   : mainDoc
        };

        request(syncOptions, function(err, res) {
          if (err) {
            console.log(err);
            return callback(err, null);
          } 

          else if (res.statusCode >= 300) {
            console.log('--- ERROR: cannot update document (statusCode '+ res.statusCode +')');
            return callback(res, null);
          }

          else {
            callback(null, res);
          }
        });
      },

      // get user on sync gateway
      function (result, callback) {
        var syncOptions = {
          url    : config.admin.url + '_user/' + referenceId,
          method : 'GET',
        };

        request(syncOptions, function(err, res) {
          if (err) {
            return callback(err, null);
          } 

          else if (res.statusCode >= 300) {
            console.log('--- ERROR: cannot get user on sync gateway (statusCode '+ res.statusCode +')');
            return callback(res, null);
          } 

          else {
            callback(null, res.body);
          }
        });     
      },

      // remove old customers & add new customers
      // update changes on channels on user sync gateway
      function (user, callback) {
        var index, index2;

        // remove old customers
        for (var i in oldCustomers) {
          index = user.admin_channels.indexOf(oldCustomers[i]);
          index2 = user.all_channels.indexOf(oldCustomers[i]);

          if (index !== -1) {
            user.admin_channels.splice(index, 1);
          }

          if (index2 !== -1) {
            user.all_channels.splice(index2, 1);
          }
        }

        // add new customers
        user.admin_channels = user.admin_channels.concat(info.customers);
        user.all_channels = user.all_channels.concat(info.customers);

        var option = {
          url : config.admin.url + "_user/" + referenceId,
          method : "PUT",
          body : user
        };

        request(option, function (err, res) {
          if (err) {  
            console.log(err); 
            return callback(err, null);
          }

          else if (res.statusCode >= 300) {
            console.log('--- ERROR: cannot update user on sync gateway (statusCode '+ res.statusCode +')');
            return callback(res, null);
          } 

          else {
            callback(null, res);
          }
        });
      }
    ],

    function (err, res) {
      if (err) {
        callback(err, null);
      } else {
        callback(null, res);
      }
    });
  } catch(err){
    console.log(err)
  }
}



credentialModel.updatePassword = function(info, callback){
  try{ 
    async.waterfall([
      // get user document
      function(callback){
        var syncOptions = {
          url    : config.admin.url + '_design/AMI2_USER/_view/byUserName?key="' + info.oldUserName + '"', 
          method : 'GET'
        };

        request(syncOptions, function(err, res) {
          if (err) {
            return callback(err, null);
          } 

          else if (res.statusCode >= 300) {
            console.log('--- ERROR: cannot get user document (statusCode '+ res.statusCode +')');
            return callback(res, null);
          }

          else if(res.body.total_rows == 0 ){
            console.log('--- ERROR: get reference id by email (username do not exist)');

            var custError = {
              statusCode : '322',
              message    : 'Email do not exist'
            }

            return callback(custError, null);
          }

          else {
            callback(null, res.body.rows[0].value.referenceId);            
          }
        });  
      },

      // get user on sync gateway
      function (referenceId, callback) {
        var syncOptions = {
          url : config.admin.url + '_user/' + referenceId,
          method : 'GET',
        };

        request(syncOptions, function(err, res) {
          if (err) {
            return callback(err, null);
          } 

          else if (res.statusCode >= 300) {
            console.log('--- ERROR: cannot get user on sync gateway (statusCode '+ res.statusCode +')');
            return callback(res, null);
          } 

          else {
            res.body.password = info.password;
            res.body.name = referenceId;
            callback(null, res.body, referenceId);
          }
        });     
      },

      // update user on sync gateway
      function (user, referenceId, callback) {
        var option = {
          url : config.admin.url + "_user/" + referenceId,
          method : "PUT",
          body : user
        };

        request(option, function (err, res) {
          if (err) {  
            console.log(err); 
            return callback(err, null);
          }

          else if (res.statusCode >= 300) {
            console.log('--- ERROR: cannot update user on sync gateway (statusCode '+ res.statusCode +')');
            return callback(res, null);
          } 

          else {
            callback(null, res.body);
          }
        })          
      },

      // relogin user | get new sessionId
      function (result, callback) {
        var newData = {
              name : info.oldUserName,
              password : info.password
            };

        credentialModel.loginUser(newData, function(err, res) {
          if (err) {
            console.log(err); 
            return callback(err, null);
          } 

          else if (res.statusCode >= 300) {
            console.log('--- ERROR: cannot login (statusCode '+ res.statusCode +')');
            return callback(err, null);
          }

          else {
            callback(null, res);
          }
        });  
      }
    ],

    function (err, res) {
      if (err) {
        callback(err, null);
      }
      else {
        callback(null, res);
      }
    });
  }
  catch(err){
  }
}




































credentialModel.logoutUser = function(sessionId,callback) {
  var options = {
      url: config.public.url+"/_session",
      method: 'DELETE',
      headers:{'Cookie':sessionId}
  };
  
  request(options, function(error, response) {
    if(error){
      return callback(error, null);
    }
    callback(null,response);
  });
}

/* AMI 2 */







module.exports.credentialModel = credentialModel;