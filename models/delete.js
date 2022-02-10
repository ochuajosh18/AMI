var request = require('request').defaults({json: true}),
    async = require('async'),
    config = require('../config/config'),
    uuid= require('uuid'),
    moment = require('moment');

function deleteModel(){}



deleteModel.deleteChannel = function(docId , callback){
  var loadModel  = require('../models/load').loadModel;

  try {
    async.waterfall([


      function(callback) {
        loadModel.loadDocsByIdModel(docId, function(err, res){
          if (err) {
            console.log(err);
            return callback(err, null);
          } 

          else if (res.statusCode > 300) {
            return callback(res, null);
          } 

          else {
            callback(null, res.body);
          }
        });
      },



      function(doc, callback) {
        var id = doc._id, 
            rev = doc._rev;


        // delete channels
        doc.channels = [];

        var syncOptions = {
          headers: {
            "Content-Type": "application/json",
            "Accept" : "application/json"
          },
          url: config.admin.url + id + '?rev=' + rev,
          method: 'PUT',
          body: doc
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









deleteModel.deleteDocument=function(docId, callback){
  var loadModel  = require('../models/load').loadModel;

	try	{
     async.waterfall([

      function(callback) {
        loadModel.loadDocsByIdModel(docId, function(err, res){
          if (err) {
            return res.status(400).send(err);
          } else {
            var doc = res.body;
            callback(null, doc);
          }
        });
      },

      function(deleteDoc, callback) {
        var syncOptions = {
          headers: {
            "Accept" : "application/json"
          },
          url: config.admin.url + deleteDoc._id + '?rev=' + deleteDoc._rev,
          method: 'DELETE'
        };

        request(syncOptions, function(err, res) {
          if (err) {
            console.log(err);
            return callback(err, null);
          } else {
            callback(null, res);
          }
          
        });
      }], 


      function (err, res) {
        callback(null, res);
    });




	} catch (err) {
		console.log(err)
	}
}





/* AMI 2 */







module.exports.deleteModel = deleteModel;