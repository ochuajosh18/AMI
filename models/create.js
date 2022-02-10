var request = require('request').defaults({json: true}),
    async = require('async'),
    config = require('../config/config'),
    uuid= require('uuid'),
    moment = require('moment');

function createModel(){}



createModel.createDocument = function(idPrefix, info, callback){
  // info.dateCreated = moment().format('YYYY-MM-DD');
  // info.timeCreated = moment().format('h:mm a');

  try {
    var id = idPrefix + uuid.v4(); // generate uuid

    var syncOptions = {
      headers : {
        "Content-Type": "application/json",
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

      else if (res.statusCode >= 300) {
        return callback(res, null);
      } 

      else {
        callback(null, res);
      }
      
    });

  } catch (err) {
    console.log(err)
  }
}


createModel.createDocument2 = function(id, info, callback){
  try {
    const options = {
      headers : {"Content-Type":"application/json", "Accept":"application/json"},
      url     : config.admin.url + id,
      method  : 'PUT',
      body    : info
    };

    request(options, function(err, res) {
      if (err) {
        console.log(err);
        return callback(err, null);
      } else if (res.statusCode >= 300) {
        return callback(res, null);
      } else {
        callback(null, res);
      }
    });
  } catch (err) {
    callback(err, null);
  }
}


createModel.createOrder = function(info, callback) {
  var loadModel  = require('../models/load').loadModel;

  try {
    async.waterfall([
      // get order doc
      function(callback) {
        loadModel.loadDocsByIdModel(info.id, function(err, res){
          if (err) {
            return res.send(err);
          }

          else if (res.statusCode >= 300) {
            return callback(res, null);
          } 

          else {
            callback(null, res.body);
          }
        });
      },

      // manipulate document
      function(doc, callback) {
        var newKey =  Object.keys(info);

        for (var i in newKey) {
          doc[newKey[i]] = info[newKey[i]];
        }

        delete doc["_id"];
        delete doc["_rev"];
        delete doc["id"];
        callback(null, doc);
      },

      // create order
      function(doc, callback) {
        var idPrefix = (doc.docType == 'ORDER') ? 'ORDER::' : 'BACKORDER::';

        createModel.createDocument(idPrefix, doc, function(err, res){
          if (err) {
            return res.send(err);
          }

          else if (res.statusCode >= 300) {
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



/* AMI 2 */








module.exports.createModel = createModel;