var request = require('request').defaults({json: true}),
    async = require('async'),
    config = require('../config/config'),
    uuid= require('uuid'),
    moment = require('moment');

function updateModel(){}

updateModel.updateDocument = function(docId , newDoc, callback){
  var loadModel  = require('../models/load').loadModel;


  try {

    async.waterfall([

      // get specific doc
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
            var doc = res.body;
            callback(null, doc);
          }
        });
      },


      // apply changes
      function(mainDoc, callback) {
        var newKey =  Object.keys(newDoc);

        for (var i in newKey) {
          mainDoc[newKey[i]] = newDoc[newKey[i]];
        }

        callback(null, mainDoc);
      },


      // update
      function(changedDoc, callback) {
        var id = changedDoc._id,
            rev = changedDoc._rev;


        var syncOptions = {
          headers : {
            "Content-Type" : "application/json",
            "Accept" : "application/json"
          },
          url    : config.admin.url + id + '?rev=' + rev,
          method : 'PUT',
          body   : changedDoc
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

// Cedrix
updateModel.updateDocumentArray = function(docId , newDoc, callback){
  var loadModel  = require('../models/load').loadModel;

  try {

    async.waterfall([

      // get specific doc
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
            var doc = res.body;
            callback(null, doc);
          }
        });
      },


      // apply changes
      function(mainDoc, callback) {
        var newKey =  Object.keys(newDoc);

        let newObject, oldObject;
        for (var i in newKey) { // array
          if (newDoc[newKey[i]] instanceof Object){
            newObject = newDoc[newKey[i]];
            oldObject = mainDoc[newKey[i]]; 

            oldObject.push(newObject); 
            mainDoc[newKey[i]] = oldObject;
          } else { // string
            mainDoc[newKey[i]] = newDoc[newKey[i]];
          }
        }

        callback(null, mainDoc);
      },


      // update
      function(changedDoc, callback) {
        var id = changedDoc._id,
            rev = changedDoc._rev;


        var syncOptions = {
          headers : {
            "Content-Type" : "application/json",
            "Accept" : "application/json"
          },
          url    : config.admin.url + id + '?rev=' + rev,
          method : 'PUT',
          body   : changedDoc
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

updateModel.updatePermission = function(docId , partialDoc, callback){
  var loadModel  = require('../models/load').loadModel;

  try {
    
    var newDoc = {};
    
    // console.log(partialDoc);
    if (partialDoc.hasOwnProperty("amiPermission")) {
      newDoc.amiPermission = {};
      for (var module in partialDoc.amiPermission){
        newDoc.amiPermission[module] = [];

        for (var submodule in partialDoc.amiPermission[module]){
          if (partialDoc.amiPermission[module][submodule] == 'true') {
            newDoc.amiPermission[module].push(submodule);
          }
        }
      }
    } else if (partialDoc.hasOwnProperty("wosPermission")) {
      newDoc.wosPermission = {};
      for (var module in partialDoc.wosPermission){
        newDoc.wosPermission[module] = [];

        for (var submodule in partialDoc.wosPermission[module]){
          if (partialDoc.wosPermission[module][submodule] == 'true') {
            newDoc.wosPermission[module].push(submodule);
          }
        }
      }
    }
    

    
  

    async.waterfall([

      function(callback) {
        loadModel.loadDocsByIdModel(docId,function(err, res){
          if (err) {
            return res.send(err);
          } else {
            var doc = res.body;
            callback(null, doc);
          }
        });
      },

      function(mainDoc, callback) {
        var newKey =  Object.keys(newDoc);

        for (var i in newKey) {
          mainDoc[newKey[i]] = newDoc[newKey[i]];
        }

        callback(null, mainDoc);
      },

      function(changedDoc, callback) {
        var id = changedDoc._id, rev = changedDoc._rev;
        var syncOptions = {
          headers: {
            "Content-Type": "application/json",
            "Accept" : "application/json"
          },
          url: config.admin.url + id + '?rev=' + rev,
          method: 'PUT',
          body: changedDoc
        };

        request(syncOptions, function(err, res) {

          if (err) {
            console.log(err);
            return res.status(400).send(err);
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

updateModel.updateItemNo=function(id, rev, info, callback){

	try	{
		var syncOptions = {
			headers: {
				"Content-Type": "application/json",
				"Accept" : "application/json"
			},
			url: config.admin.url + id + '?rev=' + rev,
			method: 'PUT',
			body: info
   	};

    request(syncOptions, function(err, res) {

    	if (err) {
    		console.log(err);
    		return callback(err, null);
    	} else {
    		callback(null, res);
    	}
      
    });
	} catch (err) {
		console.log(err)
	}
}

updateModel.cancelOrder = function(info, callback){

  var salesOrderNo = info.salesOrderNo;
  var salesOrderItemNo = info.salesOrderItemNo;
  var sessionId  = info.sessionId;
  try {
  
    async.waterfall([

      function(callback) {

          loadModel.loadDocsBy2KeyModel("AMI_ORDER","bySalesOrderNo_orderItemNo", salesOrderNo, salesOrderItemNo, sessionId, function(error, result) {
            if (err) {
              return res.status(400).send(err);
            } else {
              var id = result.body.rows[0].id;
              callback(null, id);
            }
          });
      },
      function(id, callback) {
        loadModel.loadDocsByIdModel(id, function(error, documents) {
            if (err) {
              return res.status(400).send(err);
            } else {
              callback(null, documents);
            }

        }); 
      },
      function(documents, callback) {
        var id = documents._id, rev = documents._rev;
        var data = {};
            data = documents;
            data.quantity = 0 ;


        var syncOptions = {
          headers: {
            "Content-Type": "application/json",
            "Accept" : "application/json"
          },
          url: config.admin.url + id + '?rev=' + rev,
          method: 'PUT',
          body: data
        };

        request(syncOptions, function(err, res) {

          if (err) {
            console.log(err);
            return res.status(400).send(err);
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

updateModel.manageMaterialNote = (updateObj, action, callback) => {
  try {
    async.waterfall([
      // arrange query
      (callback) => {
        if (action == 'updateNote') {
          let SETquery = [];
          for (let i in updateObj) SETquery.push(`note.\`${i}\`='${updateObj[i]}'`);

          const query = `
          UPDATE ${config.db.bucket} 
          USE KEYS 'MATERIAL::NOTE' 
          SET ${SETquery.toString()}`;

          callback(null, query);
        }

        else if (action == 'deleteNote') {
          let UNSETquery = [];
          for (let i in updateObj) UNSETquery.push(`note.\`${i}\``);

          const query = `
          UPDATE ${config.db.bucket} 
          USE KEYS 'MATERIAL::NOTE' 
          UNSET ${UNSETquery.toString()}`;

          callback(null, query);
        }
      },

      // proceed request
      (query, callback) => {
        const options = {
          headers : {'Accept': 'application/json'},
          url     : config.public.n1ql_url,
          method  : 'POST',
          body    : {statement: query}
        };

        request(options, (err, res) => {
          if (err) return callback(err, null);
          else if (res.statusCode >= 300) return callback(res, null);
          else if (res.statusCode <= 299) {
            callback(null, res);
          } else return callback(res, null);
        });
      }
    ],

    (err, res) => {
      if (err) callback(err, null);
      else callback(null, res);
    });
  } catch (err) {
    callback(err, null);
  }
}

// materialblock
updateModel.manageMaterialBlock = (updateObj, action, callback) => {
  try {
    async.waterfall([
      // arrange query
      (callback) => {
        if (action == 'blockNormal') {
          let SETquery = [];
          for (let i in updateObj) SETquery.push(`block.\`${i}\`=${JSON.stringify(updateObj[i])}`);

          const query = `
          UPDATE ${config.db.bucket} 
          USE KEYS 'BLOCK::NORMAL' 
          SET ${SETquery.toString()}`;

          callback(null, query);
        }

        else if (action == 'blockDate') {
          let dateKey = updateObj.dateKey;
          delete updateObj.dateKey;

          // check if the datekey is existing or not
          const query = `
          SELECT RAW blockDate.${dateKey}.block
          FROM ${config.db.bucket}
          USE KEYS 'BLOCK::DATE'
          `;

          const options = {
            headers : {'Accept': 'application/json'},
            url     : config.public.n1ql_url,
            method  : 'POST',
            body    : {statement: query}
          };
          
          request(options, (err, res) => {
            if (err) return callback(err, null);
            else if (res.statusCode >= 300) return callback(res, null);
            else if (res.statusCode <= 299) {
              let dateGroups = res.body.results[0];
              let block = updateObj.block;

              if (dateGroups) { // date key existing
                let SETquery = [];
                for (let i in block) SETquery.push(`blockDate.${dateKey}.block.\`${i}\`=${JSON.stringify(block[i])}`);
                // blockDate.`2018-08-24 - 2018-08-25`.block.`1000 R20   16R150AZ R150AZ`='123456'

                const query = `
                UPDATE ${config.db.bucket} 
                USE KEYS 'BLOCK::DATE' 
                SET ${SETquery.toString()}`;

                callback(null, query);
              } else { // date key not existing
                const query = `
                UPDATE ${config.db.bucket}
                USE KEYS 'BLOCK::DATE'
                SET blockDate.${dateKey}=${JSON.stringify(updateObj)}`;

                callback(null, query);
              }
            } else return callback(res, null);
          });
        }

        else if (action == 'unblockNormal') {
          let SETquery = [], UNSETquery = [];

          for (let i in updateObj) {
            if (updateObj[i] == 'unblock') UNSETquery.push(`block.\`${i}\``);
            else SETquery.push(`block.\`${i}\`=${JSON.stringify(updateObj[i])}`);
          }

          let query = `UPDATE ${config.db.bucket} USE KEYS 'BLOCK::NORMAL'`;
          if (SETquery.length) query += `\nSET ${SETquery.toString()}`;
          if (UNSETquery.length) query += `\nUNSET ${UNSETquery.toString()}`;

          callback(null, query);
        }

        else if (action == 'unblockDate') {
          let SETquery = [], UNSETquery = [];
          for (let i in updateObj) {
            for (let j in updateObj[i]) {
              if (updateObj[i][j] == 'unblock') UNSETquery.push(`blockDate.\`${i}\`.block.\`${j}\``);
              else SETquery.push(`blockDate.\`${i}\`.block.\`${j}\`=${JSON.stringify(updateObj[i][j])}`);
            }
          }

          let query = `UPDATE ${config.db.bucket} USE KEYS 'BLOCK::DATE'`;
          if (SETquery.length) query += `\nSET ${SETquery.toString()}`;
          if (UNSETquery.length) query += `\nUNSET ${UNSETquery.toString()}`;

          callback(null, query);
        }

        else if (action == 'unblockDateByDateGroup') {
          const query = `
          UPDATE ${config.db.bucket} 
          USE KEYS 'BLOCK::DATE' 
          UNSET blockDate.\`${updateObj.dateKey}\``;

          callback(null, query);
        }
      },

      // proceed request
      (query, callback) => {
        const options = {
          headers : {'Accept': 'application/json'},
          url     : config.public.n1ql_url,
          method  : 'POST',
          body    : {statement: query}
        };

        request(options, (err, res) => {
          if (err) return callback(err, null);
          else if (res.statusCode >= 300) return callback(res, null);
          else if (res.statusCode <= 299) {
            callback(null, res);
          } else return callback(res, null);
        });
      }
    ],

    (err, res) => {
      if (err) callback(err, null);
      else callback(null, res);
    });
  } catch (err) {
    callback(err, null);
  }
}

module.exports.updateModel = updateModel;