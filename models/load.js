var request = require('request').defaults({json: true}),
    async = require('async'),
    config = require('../config/config'),
    uuid= require('uuid'),
    moment = require('moment');

function loadModel(){}

const chan_disc_ix = ['channel', 'description', 'discount'];
const dealer_g_ix = ['customerCode', 'customerName', 'psrChannel', 'tbrChannel'];
const order_ix = ['salesOrderNo', 'customerCode', 'orderType', 'orderItemStatus', 'dateCreated'];

function indexKeyQuery(index) {
  return index.map((item) => `${item} IS NOT MISSING`).toString().replace(/,/g , " AND ")
}

// {

  loadModel.loadAll = function(viewType, viewName, sessionId, callback){

    try {

      var syncOptions = {
        headers : {
          'Accept' : 'application/json',
          'Cookie' : sessionId
        },
        url    : config.public.url + '_design/' + viewType + '/_view/' + viewName+ '?stale=false',
        method : 'GET'
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

    } catch (err) {
      console.log(err)
    }
  }



  loadModel.loadDocsByKeyModel=function(viewType, viewName, key, sessionId, callback){
    try {

      if (key == 'blank') {
        key = '';
      }
        
      var syncOptions = {
        headers: {
          "Accept" : "application/json",
          'Cookie' : sessionId
        },
        url: config.public.url + '_design/' + viewType + '/_view/' + viewName + '?key="' + key + '"',
        method: 'GET'
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



  loadModel.loadDocsBy2KeyModel=function(viewType, viewName, key1, key2, sessionId, callback){

    try {
        
      var syncOptions = {
        headers: {
          "Accept" : "application/json",
          'Cookie' : sessionId
        },
        url: config.public.url + '_design/' + viewType + '/_view/' + viewName + '?key=["'+key1+'", "'+key2+'"]',
        method: 'GET'
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



  loadModel.loadDocsByIdModel=function(id, callback){
    try {
        
      var syncOptions = {
        headers: {
          "Accept" : "application/json"
        },
        url: config.admin.url + id,
        method: 'GET'
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



  loadModel.loadItemCode = function(id, callback){
    var updateModel = require('../models/update').updateModel;

    try {
      async.waterfall([

        function(callback) {
          var syncOptions = {
            headers: {
              "Accept" : "application/json"
            },
            url: config.admin.url + id,
            method: 'GET'
          }

          request(syncOptions, function(err, res) {
            if(err){
              return callback(err, null);
            } else {
              callback(null, res.body);
            }
          });
        },


        function(doc, callback) {
          doc.count += 1;
          var id = doc._id, rev = doc._rev;

          updateModel.updateItemNo(id, rev, doc, function(err,res){
           if (err) {
              console.log(err);
              return res.status(400).send(err);
            } else {
              var backOrderNo;
              var data = (id == 'SALESNO') ? "SA00000000" : "BA00000000";
              
              var no = String(doc.count);
              var dataLength = data.length;
              var noLength = no.length;
              var indexX = parseInt(dataLength)-parseInt(noLength);
              backOrderNo = data.substring(0,indexX) + no ;
              
              callback(null,backOrderNo); 
            }
          });
        }], 


        function (err, res) {
          if (err) {
            console.log(err);
          } else {
            callback(null,res);
          }
      });



    } catch (err) {
      console.log(err)
    }
  }

  loadModel.loadDocsByKeyAdminModel=function(viewType, viewName, key, sessionId, callback){
    try {
        
      var syncOptions = {
        headers: {
          "Accept" : "application/json",
          'Cookie' : sessionId
        },
        url: config.admin.url + '_design/' + viewType + '/_view/' + viewName + '?key="' + key + '"',
        method: 'GET'
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

// }


loadModel.loadOrder = function(sessionId, callback) {

  try {
    var materialDoc = [],
        stockDoc = [],
        storingReportDoc = [],
        orderDoc = [],
        customerDoc = [],
        userDoc = [];


    async.waterfall([
    // {
      // get material
      function(callback) {
        var syncOptions = {
          headers : {
            'Accept' : 'application/json',
            'Cookie' : sessionId
          },
          url    : config.public.url + '_design/AMI2_MATERIAL/_view/all',
          method : 'GET'
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
            materialDoc = makeDataSet(res);
            console.log('- - - material loaded');
            callback(null, 'ok');
          }
        });
      },

      // get customer
      function(result, callback) {
        var syncOptions = {
          headers : {
            'Accept' : 'application/json',
            'Cookie' : sessionId
          },
          url    : config.public.url + '_design/AMI2_CUSTOMER/_view/all',
          method : 'GET'
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
            customerDoc = makeDataSet(res);
            console.log('- - - customer loaded');
            callback(null, 'ok');
          }
        });
      },
 
      // get user
      function(result, callback) {
        var syncOptions = {
          headers : {
            'Accept' : 'application/json',
            'Cookie' : sessionId
          },
          url    : config.public.url + '_design/AMI2_USER/_view/all',
          method : 'GET'
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
            userDoc = makeDataSet(res);
            console.log('- - - user loaded');
            callback(null, 'ok');
          }
        });
      },

      // get stock
      function(result, callback) {
        var syncOptions = {
          headers : {
            'Accept' : 'application/json',
            'Cookie' : sessionId
          },
          url    : config.public.url + '_design/AMI2_STOCK/_view/all',
          method : 'GET'
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
            stockDoc = makeDataSet(res);
            console.log('- - - stock loaded' + ' - ' + res.body.total_rows);
            callback(null, 'ok');
          }
        });
      },

      // get storing report
      function(result, callback) {
        var syncOptions = {
          headers : {
            'Accept' : 'application/json',
            'Cookie' : sessionId
          },
          url    : config.public.url + '_design/AMI2_STORING_REPORT/_view/all',
          method : 'GET'
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
            storingReportDoc = makeDataSet(res);
            console.log('- - - storing report loaded');
            callback(null, 'ok');
          }
        });
      },

      // get order
      function(result, callback) {
        var syncOptions = {
          headers : {
            'Accept' : 'application/json',
            'Cookie' : sessionId
          },
          url: config.public.url + '_design/AMI2_ORDER_DOC_AND_BACKORDER/_view/byOrderType_AND_byOrderType_OrderItemStatus',
          method : 'GET'
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
            orderDoc = makeDataSet(res);
            console.log('- - - order loaded' + ' - ' + res.body.total_rows);
            callback(null, 'ok');
          }
        });
      },
    // }
      // get combine
      function(result, callback) {
        // orderItemStatus
        orderDoc = reverse_customArrayFilter(orderDoc, 'orderItemStatus', 'cancelled');
        for (var i in orderDoc) {
          var material = customArrayFilter(materialDoc, 'materialCode', orderDoc[i].materialCode);
          // var order = customArrayFilter(orderDoc, 'salesOrderNo', orderDoc[i].salesOrderNo);
          var stocks = customArrayFilter_By2Keys(stockDoc, 'size', material[0].size, 'sizePattern', material[0].sizePattern);
          var customer = customArrayFilter(customerDoc, 'customerCode', orderDoc[i].customerCode);
          // var customerShipToParty = customArrayFilter(customerDoc, 'customerCode', orderDoc[i].shipToParty);
          var orders = customArrayFilter(orderDoc, 'salesOrderNo', orderDoc[i].salesOrderNo);
          var creator = customArrayFilter(userDoc, 'id', orderDoc[i].createdBy);

          var stock = [], totalStock = 0;
          for (var j in stocks) {

            var storingReport_perStock = customArrayFilter(storingReportDoc, 'materialCode', stocks[j].materialCode);
                material_perStock = customArrayFilter(materialDoc, 'materialCode', stockDoc[j].materialCode);

            if (storingReport_perStock.length != 0 &&  material_perStock.length != 0) {
              stock.push({
                'id'           : stocks[j].id,
                'deliveryDate' : storingReport_perStock[0].deliveryDate,
                'materialCode' : stocks[j].materialCode,
                'storageLocation' : stocks[j].storageLocation,
                'totalStock' : stocks[j].totalStock
              });
              
              totalStock += parseInt(stocks[j].totalStock);
            }
          }

          // console.log(orderDoc[i].materialCode + ': ' + totalStock);
          stock.sort(function(a, b){ return new Date(a.deliveryDate) - new Date(b.deliveryDate); });

          // orderDoc[i].orderno = stock;
          if (orderDoc[i].docType == "ORDER::DOC") {
            orderDoc[i].orderno = orderDoc[i].salesOrderNo;
          }

          else {
            orderDoc[i].orderno = orderDoc[i].backOrderNo;
             orderDoc[i].orderType = "Backorder";
          }

          // stock doc
          orderDoc[i].stocks = stock;
          orderDoc[i].totalStock = totalStock;

          // material doc
          orderDoc[i].size = (material.length != 0) ? material[0].size : '- - -';
          orderDoc[i].sizePattern = (material.length != 0) ? material[0].sizePattern : '- - -';
          orderDoc[i].storageLocation = (material.length != 0) ? material[0].storageLocation : '- - -';

          // customer doc
          orderDoc[i].name1 = (customer != 0) ? customer[0].name1 : '- - -';
          orderDoc[i].name2 = (customer != 0) ? customer[0].name2 : '- - -';
          // orderDoc[i].deliveryAddress = (customerShipToParty != 0) ? customerShipToParty[0].street : '- - -';

          // user
          orderDoc[i].creator = creator[0].firstName + ' ' + creator[0].lastName;
          
          // modify 
          orderDoc[i].timeCreated = moment().format('YYYY-MM-DD') + ' ' + orderDoc[i].timeCreated;
          orderDoc[i].dateCreated = moment(orderDoc[i].dateCreated).format('MMM DD, YYYY')  + ' - ' + moment(orderDoc[i].timeCreated).format('hh:mm a');;
          orderDoc[i].requestedDate = moment(orderDoc[i].requestedDate).format('MMM DD, YYYY');

          // extra
          var dataSlide = (orderDoc[i].docType == 'ORDER::DOC') ? 1 : 3;
          orderDoc[i].items = orders.length;
          orderDoc[i].blank = '';
          orderDoc[i].action = '';
          orderDoc[i].action += '<div class="dropdown">';
          orderDoc[i].action +=   '<button class="btn btn-default btn-sm btn-flat btn-block dropdown-toggle" type="button" data-toggle="dropdown" data-orderNo="'+orderDoc[i].orderno+'">Action <span class="caret"></span></button>';
          orderDoc[i].action +=   '<ul class="dropdown-menu small-font dropdown-menu-right">';
          orderDoc[i].action +=     '<li><a href="#" class="view-trigger view" data-target="#carousel-example-generic" data-slide-to="'+ dataSlide +'"><i class="fa fa-tasks"></i> View order details</a></li>';
          orderDoc[i].action +=   '</ul>';
          orderDoc[i].action += '</div>';
        }


        callback(null, 'ok');
      }
    ],


      function (err, res) {
        if (err) {
          console.log(err);
        } else {
          callback(null, orderDoc);
        }
    });

  } catch (err) {
    console.log(err)
  }
}


loadModel.loadNormalOrder = function(sessionId, callback) {
  try {
    var materialDoc = [],
        stockDoc = [],
        storingReportDoc = [],
        orderDoc = [],
        customerDoc = [],
        userDoc = [];


    async.waterfall([
    // {
      // get material
      function(callback) {
        var syncOptions = {
          headers : {
            'Accept' : 'application/json',
            'Cookie' : sessionId
          },
          url    : config.public.url + '_design/AMI2_MATERIAL/_view/all',
          method : 'GET'
        };

        request(syncOptions, function(err, res) {
          if (err) {
            console.log('--- ERROR: there is an error');
            return callback(err, null);
          } else if (res.statusCode >= 300) {
            return callback(res, null);
          } else if (res.statusCode <= 299) {
            materialDoc = makeDataSet(res);
            // console.log('- - - material loaded');
            callback(null, 'ok');
          } else {
            return callback(res, null);
          }
        });
      },

      // get customer
      function(result, callback) {
        var syncOptions = {
          headers : {
            'Accept' : 'application/json',
            'Cookie' : sessionId
          },
          url    : config.public.url + '_design/AMI2_CUSTOMER/_view/all',
          method : 'GET'
        };

        request(syncOptions, function(err, res) {
          if (err) {
            console.log('--- ERROR: there is an error');
            return callback(err, null);
          } else if (res.statusCode >= 300) {
            return callback(res, null);
          } else if (res.statusCode <= 299) {
            customerDoc = makeDataSet(res);
            // console.log('- - - customer loaded');
            callback(null, 'ok');
          } else {
            return callback(res, null);
          }
        });
      },
 
      // get user
      function(result, callback) {
        var syncOptions = {
          headers : {
            'Accept' : 'application/json',
            'Cookie' : sessionId
          },
          url    : config.public.url + '_design/AMI2_USER/_view/all',
          method : 'GET'
        };


        request(syncOptions, function(err, res) {
          if (err) {
            console.log('--- ERROR: there is an error');
            return callback(err, null);
          } else if (res.statusCode >= 300) {
            return callback(res, null);
          } else if (res.statusCode <= 299) {
            userDoc = makeDataSet(res);
            // console.log('- - - user loaded');
            callback(null, 'ok');
          } else {
            return callback(res, null);
          }
        });
      },

      // get stock
      function(result, callback) {
        var syncOptions = {
          headers : {
            'Accept' : 'application/json',
            'Cookie' : sessionId
          },
          url    : config.public.url + '_design/AMI2_STOCK/_view/all?stale=false',
          method : 'GET'
        };


        request(syncOptions, function(err, res) {
          if (err) {
            console.log('--- ERROR: there is an error');
            return callback(err, null);
          } else if (res.statusCode >= 300) {
            return callback(res, null);
          } else if (res.statusCode <= 299) {
            stockDoc = makeDataSet(res);
            // console.log('- - - stock loaded' + ' - ' + res.body.total_rows);
            callback(null, 'ok');
          } else {
            return callback(res, null);
          }
        });
      },

      // get storing report
      // function(result, callback) {
      //   var syncOptions = {
      //     headers : {
      //       'Accept' : 'application/json',
      //       'Cookie' : sessionId
      //     },
      //     url    : config.public.url + '_design/AMI2_STORING_REPORT/_view/all',
      //     method : 'GET'
      //   };


      //   request(syncOptions, function(err, res) {
      //     if (err) {
      //       console.log('--- ERROR: there is an error');
      //       return callback(err, null);
      //     } else if (res.statusCode >= 300) {
      //       return callback(res, null);
      //     } else if (res.statusCode <= 299) {
      //       storingReportDoc = makeDataSet(res);
      //       // console.log('- - - storing report loaded');
      //       callback(null, 'ok');
      //     } else {
      //       return callback(res, null);
      //     }
      //   });
      // },

      // get order
      function(result, callback) {
        var syncOptions = {
          headers : {
            'Accept' : 'application/json',
            'Cookie' : sessionId
          },
          url: config.public.url + '_design/BST_ORDER_BACKORDER/_view/byOrderType_OrderItemStatus?keys=[["Normal Order", "saved"],["Normal Order", "pending order approval"]]&stale=false',
          method : 'GET'
        };


        request(syncOptions, function(err, res) {
          if (err) {
            console.log('--- ERROR: there is an error');
            return callback(err, null);
          } else if (res.statusCode >= 300) {
            return callback(res, null);
          } else if (res.statusCode <= 299) {
            orderDoc = makeDataSet(res);
            // console.log('- - - order loaded' + ' - ' + res.body.total_rows);
            callback(null, 'ok');
          } else {
            return callback(res, null);
          }
        });
      },
    // }
      
      // combine material & stock
      function(result, callback) {
        for (let i in materialDoc) {
          materialDoc[i].individualStock = stockDoc.find(function(item) {
            return item.materialCode == materialDoc[i].materialCode
          });
        }

        let stocks, materials;
        for (let i in materialDoc) {
          stocks = [];
          materials = customArrayFilter_By2Keys(materialDoc, 'size', materialDoc[i].size, 'oldMaterialNumber', materialDoc[i].oldMaterialNumber);

          for (let j in materials) {
            stocks.push(materials[j].individualStock);
          }

          materialDoc[i].stocks = stocks;
        }

        callback(null, 'ok');
      },

      // get combine
      function(result, callback) {
        // orderItemStatus
        // orderDoc = reverse_customArrayFilter(orderDoc, 'orderItemStatus', 'cancelled');
        for (var i in orderDoc) {
          var material = customArrayFind(materialDoc, 'materialCode', orderDoc[i].materialCode);
          // var order = customArrayFilter(orderDoc, 'salesOrderNo', orderDoc[i].salesOrderNo);
          // var stocks = customArrayFilter_By2Keys(stockDoc, 'size', material[0].size, 'sizePattern', material[0].sizePattern);
          var customer = customArrayFind(customerDoc, 'customerCode', orderDoc[i].customerCode);
          // var customerShipToParty = customArrayFilter(customerDoc, 'customerCode', orderDoc[i].shipToParty);
          var orders = customArrayFilter(orderDoc, 'salesOrderNo', orderDoc[i].salesOrderNo);
          var creator = customArrayFind(userDoc, 'id', orderDoc[i].createdBy);

          // var stock = [], totalStock = 0;
          // for (var j in stocks) {

          //   var storingReport_perStock = customArrayFilter(storingReportDoc, 'materialCode', stocks[j].materialCode);
          //       material_perStock = customArrayFilter(materialDoc, 'materialCode', stockDoc[j].materialCode);

          //   if (storingReport_perStock.length != 0 &&  material_perStock.length != 0) {
          //     stock.push({
          //       'id'           : stocks[j].id,
          //       'deliveryDate' : storingReport_perStock[0].deliveryDate,
          //       'materialCode' : stocks[j].materialCode,
          //       'storageLocation' : stocks[j].storageLocation,
          //       'totalStock' : stocks[j].totalStock
          //     });
              
          //     totalStock += parseInt(stocks[j].totalStock);
          //   }
          // }

          // console.log(orderDoc[i].materialCode + ': ' + totalStock);
          // stock.sort(function(a, b){ return new Date(a.deliveryDate) - new Date(b.deliveryDate); });

          // orderDoc[i].orderno = stock;
          if (orderDoc[i].docType == "ORDER") {
            orderDoc[i].orderno = orderDoc[i].salesOrderNo;
          }

          else {
            orderDoc[i].orderno = orderDoc[i].backOrderNo;
            orderDoc[i].orderType = "Backorder";
          }

          // stock doc
          // orderDoc[i].stocks = stock;
          // orderDoc[i].totalStock = totalStock;
          orderDoc[i].stocks = material.stocks;

          // material doc
          orderDoc[i].size = material.size;
          orderDoc[i].sizePattern = material.sizePattern;
          orderDoc[i].storageLocation = material.storageLocation;

          // customer doc
          orderDoc[i].name1 = customer.name1;
          // orderDoc[i].name2 = (customer != 0) ? customer[0].name2 : '- - -';
          // orderDoc[i].deliveryAddress = (customerShipToParty != 0) ? customerShipToParty[0].street : '- - -';

          // user
          orderDoc[i].creator = creator.firstName + ' ' + creator.lastName;
          
          // modify
          orderDoc[i].timeCreated = moment().format('YYYY-MM-DD') + ' ' + orderDoc[i].timeCreated;
          orderDoc[i].dateCreated = moment(orderDoc[i].dateCreated).format('MMM DD, YYYY')  + ' - ' + moment(orderDoc[i].timeCreated).format('hh:mm a');;
          orderDoc[i].requestedDate = moment(orderDoc[i].requestedDate).format('MMM DD, YYYY');

          // extra
          var dataSlide = (orderDoc[i].docType == 'ORDER') ? 1 : 3;
          orderDoc[i].items = orders.length;
          orderDoc[i].blank = '';
          orderDoc[i].action = '';
          orderDoc[i].action += '<div class="dropdown">';
          orderDoc[i].action +=   '<button class="btn btn-default btn-sm btn-flat btn-block dropdown-toggle" type="button" data-toggle="dropdown" data-orderNo="'+orderDoc[i].orderno+'">Action <span class="caret"></span></button>';
          orderDoc[i].action +=   '<ul class="dropdown-menu small-font dropdown-menu-right">';
          orderDoc[i].action +=     '<li><a href="#" class="view-trigger view" data-target="#carousel-example-generic" data-slide-to="'+ dataSlide +'"><i class="fa fa-tasks"></i> View order details</a></li>';
          orderDoc[i].action +=   '</ul>';
          orderDoc[i].action += '</div>';
        }


        callback(null, 'ok');
      }
    ],
    function (err, res) {
      if (err) {
        callback(err, null);
      } else {
        callback(null, orderDoc);
      }
    });
  } catch (err) {
    callback(err, null);
  }
}


loadModel.loadNormalOrder2 = function(sessionId, callback) {
  try {    
    let materialDoc = [], noteDoc = {}, customerDoc = [], userDoc = [], stockDoc = [], otherDoc = [], orderDoc = [];

    async.waterfall([
      // get material
      function(callback) {
        var syncOptions = {
          headers : {
            'Accept' : 'application/json',
            'Cookie' : sessionId
          },
          url    : config.public.url + '_design/BST_MATERIAL/_view/all',
          method : 'GET'
        };

        request(syncOptions, function(err, res) {
          if (err) {
            console.log('--- ERROR: there is an error');
            return callback(err, null);
          } else if (res.statusCode >= 300) {
            return callback(res, null);
          } else if (res.statusCode <= 299) {
            materialDoc = mapToResultValue(res);
            callback(null, 'ok');
          } else {
            return callback(res, null);
          }
        });
      },

      // get notes
      function(result, callback) {
        const query = `
        SELECT RAW note
        FROM ${config.db.bucket}
        USE KEYS 'MATERIAL::NOTE'`;

        const options = {
          headers : {'Accept': 'application/json', 'Cookie': sessionId},
          url     : config.public.n1ql_url,
          method  : 'POST',
          body    : {statement: query}
        };

        request(options, function(err, res) {
          if (err) return callback(err, null);
          else if (res.statusCode >= 300) return callback(res, null);
          else {
            noteDoc = res.body.results[0];
            callback(null, 'ok');
          }
        });
      },

      // get customer
      function(result, callback) {
        var syncOptions = {
          headers : {
            'Accept' : 'application/json',
            'Cookie' : sessionId
          },
          url    : config.public.url + '_design/BST_CUSTOMER/_view/all',
          method : 'GET'
        };

        request(syncOptions, function(err, res) {
          if (err) {
            console.log('--- ERROR: there is an error');
            return callback(err, null);
          } else if (res.statusCode >= 300) {
            return callback(res, null);
          } else if (res.statusCode <= 299) {
            customerDoc = mapToResultValue(res);
            callback(null, 'ok');
          } else {
            return callback(res, null);
          }
        });
      },
 
      // get user
      function(result, callback) {
        var syncOptions = {
          headers : {
            'Accept' : 'application/json',
            'Cookie' : sessionId
          },
          url    : config.public.url + '_design/BST_USER/_view/byRoleId',
          method : 'GET'
        };


        request(syncOptions, function(err, res) {
          if (err) {
            console.log('--- ERROR: there is an error');
            return callback(err, null);
          } else if (res.statusCode >= 300) {
            return callback(res, null);
          } else if (res.statusCode <= 299) {
            userDoc = mapToResultValue(res);
            callback(null, 'ok');
          } else {
            return callback(res, null);
          }
        });
      },

      // get stock
      function(result, callback) {
        var syncOptions = {
          headers : {
            'Accept' : 'application/json',
            'Cookie' : sessionId
          },
          url    : config.public.url + '_design/BST_STOCK/_view/all?stale=false',
          method : 'GET'
        };

        request(syncOptions, function(err, res) {
          if (err) {
            console.log('--- ERROR: there is an error');
            return callback(err, null);
          } else if (res.statusCode >= 300) {
            return callback(res, null);
          } else if (res.statusCode <= 299) {
            stockDoc = mapToResultValue(res);
            callback(null, 'ok');
          } else {
            return callback(res, null);
          }
        });
      },

      // get visible stock
      function(result, callback) {
        var syncOptions = {
          url: config.public.url + '_design/BST_ALL/_view/byDocType?key="VISIBLE::STOCK"&stale=false',
          method : 'GET',
          headers : { 'Cookie' : sessionId }
        };

        request(syncOptions, function(err, res) {
          if (err) {
            console.log('--- ERROR: there is an error');
            return callback(err, null);
          } else if (res.statusCode >= 300) {
            console.log('--- ERROR: cannot get visible stock documents (statusCode '+ res.statusCode +')');
            return callback(res, null);
          } else if (res.statusCode <= 299) {
            otherDoc = mapToResultValue(res);
            callback(null, 'ok');
          } else {
            return callback(res, null);
          }
        });
      },

      // get order
      function(result, callback) {
        var syncOptions = {
          headers : {
            'Accept' : 'application/json',
            'Cookie' : sessionId
          },
          url: config.public.url + '_design/BST_ORDER_BACKORDER/_view/byOrderType_OrderItemStatus?keys=[["Normal Order", "saved"],["Normal Order", "pending order approval"]]&stale=false',
          method : 'GET'
        };

        request(syncOptions, function(err, res) {
          if (err) {
            console.log('--- ERROR: there is an error');
            return callback(err, null);
          } else if (res.statusCode >= 300) {
            return callback(res, null);
          } else if (res.statusCode <= 299) {
            orderDoc = mapToResultValue(res);
            callback(null, 'ok');
          } else {
            return callback(res, null);
          }
        });
      },

      // combine material & stock
      function(result, callback) {
        for (let i in materialDoc) {
          materialDoc[i].individualStock = stockDoc.find(item => item.materialCode == materialDoc[i].materialCode);
        }

        let stocks, materials;
        for (let i in materialDoc) {
          stocks = [];
          materials = materialDoc.filter(item => item.size == materialDoc[i].size && item.oldMaterialNumber == materialDoc[i].oldMaterialNumber);

          for (let j in materials) {
            stocks.push(materials[j].individualStock);
          }

          materialDoc[i].stocks = stocks;
        }

        callback(null, 'ok');
      },

      // get combine
      function(result, callback) {
        for (var i in orderDoc) {
          let material = materialDoc.find(item => item.materialCode == orderDoc[i].materialCode),
              // customerRes = customerDoc.filter(item => item.mainCustomerCode == orderDoc[i].customerCode),
              // customer = customerRes.find(item => item.customerCode == orderDoc[i].customerCode),
              // customer2 = customerRes.find(item => item.customerCode == orderDoc[i].shipToParty),
              customer = customerDoc.find(item => item.customerCode == orderDoc[i].customerCode),
              customer2 = customerDoc.find(item => item.customerCode == orderDoc[i].shipToParty),
              orders   = orderDoc.filter(item => item.salesOrderNo == orderDoc[i].salesOrderNo),
              user  = userDoc.find(item => item.id == orderDoc[i].createdBy);
              user2  = userDoc.find(item => item.id == orderDoc[i].soldToUserId);

          // console.log('-----' + orderDoc[i].customerCode);
          if (orderDoc[i].docType == "ORDER") {
            orderDoc[i].orderno = orderDoc[i].salesOrderNo;
          } else {
            orderDoc[i].orderno = orderDoc[i].backOrderNo;
            orderDoc[i].orderType = "Backorder";
          }

          // stock doc
          orderDoc[i].stocks = material.stocks;

          // other doc
          orderDoc[i].visibleStock = otherDoc[0].stock;

          // material doc
          orderDoc[i].size = material.size;
          // orderDoc[i].sizePattern = material.sizePattern;
          orderDoc[i].storageLocation = material.storageLocation;

          // customer doc
          orderDoc[i].soldTo = {
            customerCode : customer.customerCode,
            name1        : customer.name1,
            street       : customer.street
          };
          orderDoc[i].shipTo = {
            customerCode : customer2.customerCode,
            name1        : customer2.name1,
            street       : customer2.street
          };

          // user
          orderDoc[i].creator = user.firstName + ' ' + user.lastName;
          orderDoc[i].distributionChannel = user2.distributionChannel;
          orderDoc[i].email = user2.email;

          // order
          orderDoc[i].items = orders.length;
          
          // modify
          orderDoc[i].dateCreated = moment(new Date(orderDoc[i].dateCreated + ' ' + orderDoc[i].timeCreated).toISOString()).format('MMM DD, YYYY hh:mm a');          
          orderDoc[i].requestedDate = moment(new Date(orderDoc[i].requestedDate + ' ' + moment().format('hh:mm')  + ' ' + orderDoc[i].requestedTime).toISOString()).format('MMM DD, YYYY a');
        
          let sizePattern = `${orderDoc[i].size} ${orderDoc[i].oldMaterialNumber}`;
          if (noteDoc[sizePattern]) orderDoc[i].note = noteDoc[sizePattern];
        }

        callback(null, 'ok');
      }
    ],

    function (err, res){
      if (err) {
        callback(err, null);
      } else {
        callback(null, orderDoc);
      }
    });
  } catch (err) {
    callback(err, null);
  }
}


loadModel.loadSpecialOrder = function(sessionId, callback) {
  try {
    let materialDoc = [], noteDoc = {}, stockDoc = [], storingReportDoc = [], orderDoc = [], customerDoc = [], userDoc = [], otherDoc = [];

    async.waterfall([
    // {
      // get material
      function(callback) {
        var syncOptions = {
          headers : {
            'Accept' : 'application/json',
            'Cookie' : sessionId
          },
          url    : config.public.url + '_design/BST_MATERIAL/_view/all',
          method : 'GET'
        };

        request(syncOptions, function(err, res) {
          if (err) {
            console.log('--- ERROR: there is an error');
            return callback(err, null);
          } else if (res.statusCode >= 300) {
            return callback(res, null);
          } else if (res.statusCode <= 299) {
            materialDoc = mapToResultValue(res);
            callback(null, 'ok');
          } else {
            return callback(res, null);
          }
        });
      },

      // get notes
      function(result, callback) {
        const query = `
        SELECT RAW note
        FROM ${config.db.bucket}
        USE KEYS 'MATERIAL::NOTE'`;

        const options = {
          headers : {'Accept': 'application/json', 'Cookie': sessionId},
          url     : config.public.n1ql_url,
          method  : 'POST',
          body    : {statement: query}
        };

        request(options, function(err, res) {
          if (err) return callback(err, null);
          else if (res.statusCode >= 300) return callback(res, null);
          else {
            noteDoc = res.body.results[0];
            callback(null, 'ok');
          }
        });
      },

      // get customer
      function(result, callback) {
        var syncOptions = {
          headers : {
            'Accept' : 'application/json',
            'Cookie' : sessionId
          },
          url    : config.public.url + '_design/BST_CUSTOMER/_view/all',
          method : 'GET'
        };

        request(syncOptions, function(err, res) {
          if (err) {
            console.log('--- ERROR: there is an error');
            return callback(err, null);
          } else if (res.statusCode >= 300) {
            return callback(res, null);
          } else if (res.statusCode <= 299) {
            customerDoc = mapToResultValue(res);
            callback(null, 'ok');
          } else {
            return callback(res, null);
          }
        });
      },
 
      // get user
      function(result, callback) {
        var syncOptions = {
          headers : {
            'Accept' : 'application/json',
            'Cookie' : sessionId
          },
          url    : config.public.url + '_design/BST_USER/_view/byRoleId',
          method : 'GET'
        };


        request(syncOptions, function(err, res) {
          if (err) {
            console.log('--- ERROR: there is an error');
            return callback(err, null);
          } else if (res.statusCode >= 300) {
            return callback(res, null);
          } else if (res.statusCode <= 299) {
            userDoc = mapToResultValue(res);
            callback(null, 'ok');
          } else {
            return callback(res, null);
          }
        });
      },

      // get stock
      function(result, callback) {
        var syncOptions = {
          headers : {
            'Accept' : 'application/json',
            'Cookie' : sessionId
          },
          url    : config.public.url + '_design/BST_STOCK/_view/all?stale=false',
          method : 'GET'
        };

        request(syncOptions, function(err, res) {
          if (err) {
            console.log('--- ERROR: there is an error');
            return callback(err, null);
          } else if (res.statusCode >= 300) {
            return callback(res, null);
          } else if (res.statusCode <= 299) {
            stockDoc = mapToResultValue(res);
            callback(null, 'ok');
          } else {
            return callback(res, null);
          }
        });
      },

      // get visible stock
      function(result, callback) {
        var syncOptions = {
          url: config.public.url + '_design/BST_ALL/_view/byDocType?key="VISIBLE::STOCK"&stale=false',
          method : 'GET',
          headers : { 'Cookie' : sessionId }
        };

        request(syncOptions, function(err, res) {
          if (err) {
            console.log('--- ERROR: there is an error');
            return callback(err, null);
          } else if (res.statusCode >= 300) {
            console.log('--- ERROR: cannot get visible stock documents (statusCode '+ res.statusCode +')');
            return callback(res, null);
          } else if (res.statusCode <= 299) {
            otherDoc = mapToResultValue(res);
            callback(null, otherDoc);
          } else {
            return callback(res, null);
          }
        });
      },

      // get order
      function(result, callback) {
        var syncOptions = {
          headers : {
            'Accept' : 'application/json',
            'Cookie' : sessionId
          },
          url: config.public.url + '_design/BST_ORDER_BACKORDER/_view/byOrderType_OrderItemStatus?key=["Special Order", "pending order approval"]&stale=false',
          method : 'GET'
        };

        request(syncOptions, function(err, res) {
          if (err) {
            console.log('--- ERROR: there is an error');
            return callback(err, null);
          } else if (res.statusCode >= 300) {
            return callback(res, null);
          } else if (res.statusCode <= 299) {
            orderDoc = mapToResultValue(res);
            callback(null, 'ok');
          } else {
            return callback(res, null);
          }
        });
      },
    // }
      
      // combine material & stock
      function(result, callback) {
        for (let i in materialDoc) {
          materialDoc[i].individualStock = stockDoc.find(item => item.materialCode == materialDoc[i].materialCode);
        }

        let stocks, materials;
        for (let i in materialDoc) {
          stocks = [];
          materials = materialDoc.filter(item => item.size == materialDoc[i].size && item.oldMaterialNumber == materialDoc[i].oldMaterialNumber);

          for (let j in materials) {
            stocks.push(materials[j].individualStock);
          }

          materialDoc[i].stocks = stocks;
        }

        callback(null, 'ok');
      },

      // get combine
      function(result, callback) {
        const paymentTerms = [
          {code : 'TS00', desc : 'Cash'},
          {code : 'TS30', desc : 'Within 30 days'},
          {code : 'TS60', desc : 'Within 60 days'}
        ];

        for (var i in orderDoc) {
          let material  = materialDoc.find(item => item.materialCode == orderDoc[i].materialCode),
              // customerRes = customerDoc.filter(item => item.mainCustomerCode == orderDoc[i].customerCode),
              // customer = customerRes.find(item => item.customerCode == orderDoc[i].customerCode),
              // customer2 = customerRes.find(item => item.customerCode == orderDoc[i].shipToParty),
              customer = customerDoc.find(item => item.customerCode == orderDoc[i].customerCode),
              customer2 = customerDoc.find(item => item.customerCode == orderDoc[i].shipToParty),
              orders    = orderDoc.filter(item => item.salesOrderNo == orderDoc[i].salesOrderNo),
              user      = userDoc.find(item => item.id == orderDoc[i].createdBy);
              user2     = userDoc.find(item => item.id == orderDoc[i].soldToUserId);

          if (orderDoc[i].docType == "ORDER") {
            orderDoc[i].orderno = orderDoc[i].salesOrderNo;
          } else {
            orderDoc[i].orderno = orderDoc[i].backOrderNo;
            orderDoc[i].orderType = "Backorder";
          }

          // stock doc
          orderDoc[i].stocks = material.stocks;

          // other doc
          orderDoc[i].visibleStock = otherDoc[0].stock;

          // material doc
          orderDoc[i].size = material.size;
          // orderDoc[i].sizePattern = material.sizePattern;
          orderDoc[i].storageLocation = material.storageLocation;

          // customer doc
          orderDoc[i].soldTo = {
            customerCode : customer.customerCode,
            name1        : customer.name1,
            street       : customer.street
          };
          orderDoc[i].shipTo = {
            customerCode : customer2.customerCode,
            name1        : customer2.name1,
            street       : customer2.street
          };

          // user
          orderDoc[i].creator = user.firstName + ' ' + user.lastName;
          orderDoc[i].distributionChannel = user2.distributionChannel;
          orderDoc[i].email = user2.email;

          // order
          orderDoc[i].items = orders.length;

          // paymentTerms
          orderDoc[i].paymentTermsDesc = paymentTerms.find(item => item.code == orderDoc[i].paymentTerms).desc;

          // modify
          orderDoc[i].dateCreated = moment(new Date(orderDoc[i].dateCreated + ' ' + orderDoc[i].timeCreated).toISOString()).format('MMM DD, YYYY hh:mm a');          
          orderDoc[i].requestedDate = moment(new Date(orderDoc[i].requestedDate + ' ' + moment().format('hh:mm')  + ' ' + orderDoc[i].requestedTime).toISOString()).format('MMM DD, YYYY a');
        
          let sizePattern = `${orderDoc[i].size} ${orderDoc[i].oldMaterialNumber}`;
          if (noteDoc[sizePattern]) orderDoc[i].note = noteDoc[sizePattern];
        }

        callback(null, 'ok');
      }
    ],
    function (err, res) {
      if (err) {
        callback(err, null);
      } else {
        callback(null, orderDoc);
      }
    });
  } catch (err) {
    callback(err, null);
  }
}


loadModel.loadCreditExceedOverdueOrder = function(sessionId, callback) {
  try {
    let materialDoc = [], stockDoc = [], storingReportDoc = [], orderDoc = [], customerDoc = [], userDoc = [], otherDoc = [];

    async.waterfall([
    // {
      // get material
      function(callback) {
        var syncOptions = {
          headers : {
            'Accept' : 'application/json',
            'Cookie' : sessionId
          },
          url    : config.public.url + '_design/BST_MATERIAL/_view/all',
          method : 'GET'
        };

        request(syncOptions, function(err, res) {
          if (err) {
            console.log('--- ERROR: there is an error');
            return callback(err, null);
          } else if (res.statusCode >= 300) {
            return callback(res, null);
          } else if (res.statusCode <= 299) {
            materialDoc = mapToResultValue(res);
            callback(null, 'ok');
          } else {
            return callback(res, null);
          }
        });
      },

      // get customer
      function(result, callback) {
        var syncOptions = {
          headers : {
            'Accept' : 'application/json',
            'Cookie' : sessionId
          },
          url    : config.public.url + '_design/BST_CUSTOMER/_view/all',
          method : 'GET'
        };

        request(syncOptions, function(err, res) {
          if (err) {
            console.log('--- ERROR: there is an error');
            return callback(err, null);
          } else if (res.statusCode >= 300) {
            return callback(res, null);
          } else if (res.statusCode <= 299) {
            customerDoc = mapToResultValue(res);
            callback(null, 'ok');
          } else {
            return callback(res, null);
          }
        });
      },
 
      // get user
      function(result, callback) {
        var syncOptions = {
          headers : {
            'Accept' : 'application/json',
            'Cookie' : sessionId
          },
          url    : config.public.url + '_design/BST_USER/_view/byRoleId',
          method : 'GET'
        };


        request(syncOptions, function(err, res) {
          if (err) {
            console.log('--- ERROR: there is an error');
            return callback(err, null);
          } else if (res.statusCode >= 300) {
            return callback(res, null);
          } else if (res.statusCode <= 299) {
            userDoc = mapToResultValue(res);
            callback(null, 'ok');
          } else {
            return callback(res, null);
          }
        });
      },

      // get stock
      function(result, callback) {
        var syncOptions = {
          headers : {
            'Accept' : 'application/json',
            'Cookie' : sessionId
          },
          url    : config.public.url + '_design/BST_STOCK/_view/all?stale=false',
          method : 'GET'
        };

        request(syncOptions, function(err, res) {
          if (err) {
            console.log('--- ERROR: there is an error');
            return callback(err, null);
          } else if (res.statusCode >= 300) {
            return callback(res, null);
          } else if (res.statusCode <= 299) {
            stockDoc = mapToResultValue(res);
            callback(null, 'ok');
          } else {
            return callback(res, null);
          }
        });
      },

      // get visible stock
      function(result, callback) {
        var syncOptions = {
          url: config.public.url + '_design/BST_ALL/_view/byDocType?key="VISIBLE::STOCK"&stale=false',
          method : 'GET',
          headers : { 'Cookie' : sessionId }
        };

        request(syncOptions, function(err, res) {
          if (err) {
            console.log('--- ERROR: there is an error');
            return callback(err, null);
          } else if (res.statusCode >= 300) {
            console.log('--- ERROR: cannot get visible stock documents (statusCode '+ res.statusCode +')');
            return callback(res, null);
          } else if (res.statusCode <= 299) {
            otherDoc = mapToResultValue(res);
            callback(null, otherDoc);
          } else {
            return callback(res, null);
          }
        });
      },

      // get order
      function(result, callback) {
        var syncOptions = {
          headers : {
            'Accept' : 'application/json',
            'Cookie' : sessionId
          },
          url: config.public.url + '_design/BST_ORDER_BACKORDER/_view/byOrderType_OrderItemStatus?keys=[["Normal Order", "submitted"], ["Special Order", "submitted"]]&stale=false',
          method : 'GET'
        };

        request(syncOptions, function(err, res) {
          if (err) {
            console.log('--- ERROR: there is an error');
            return callback(err, null);
          } else if (res.statusCode >= 300) {
            return callback(res, null);
          } else if (res.statusCode <= 299) {
            orderDoc = mapToResultValue(res);
            callback(null, 'ok');
          } else {
            return callback(res, null);
          }
        });
      },
    // }
      
      // combine material & stock
      function(result, callback) {
        for (let i in materialDoc) {
          materialDoc[i].individualStock = stockDoc.find(item => item.materialCode == materialDoc[i].materialCode);
        }

        let stocks, materials;
        for (let i in materialDoc) {
          stocks = [];
          materials = materialDoc.filter(item => item.size == materialDoc[i].size && item.oldMaterialNumber == materialDoc[i].oldMaterialNumber);

          for (let j in materials) {
            stocks.push(materials[j].individualStock);
          }

          materialDoc[i].stocks = stocks;
        }

        callback(null, 'ok');
      },

      // get combine
      function(result, callback) {
        const paymentTerms = [
          {code : 'TS00', desc : 'Cash'},
          {code : 'TS30', desc : 'Within 30 days'},
          {code : 'TS60', desc : 'Within 60 days'}
        ];

        for (var i in orderDoc) {
          let material  = materialDoc.find(item => item.materialCode == orderDoc[i].materialCode),
              // customerRes = customerDoc.filter(item => item.mainCustomerCode == orderDoc[i].customerCode),
              // customer = customerRes.find(item => item.customerCode == orderDoc[i].customerCode),
              // customer2 = customerRes.find(item => item.customerCode == orderDoc[i].shipToParty),
              customer = customerDoc.find(item => item.customerCode == orderDoc[i].customerCode),
              customer2 = customerDoc.find(item => item.customerCode == orderDoc[i].shipToParty),
              orders    = orderDoc.filter(item => item.salesOrderNo == orderDoc[i].salesOrderNo),
              user      = userDoc.find(item => item.id == orderDoc[i].createdBy);
              user2     = userDoc.find(item => item.id == orderDoc[i].soldToUserId);

          if (orderDoc[i].docType == "ORDER") {
            orderDoc[i].orderno = orderDoc[i].salesOrderNo;
          } else {
            orderDoc[i].orderno = orderDoc[i].backOrderNo;
            orderDoc[i].orderType = "Backorder";
          }

          // stock doc
          orderDoc[i].stocks = material.stocks;

          // other doc
          orderDoc[i].visibleStock = otherDoc[0].stock;

          // material doc
          orderDoc[i].size = material.size;
          // orderDoc[i].sizePattern = material.sizePattern;
          orderDoc[i].storageLocation = material.storageLocation;

          // customer doc
          orderDoc[i].soldTo = {
            customerCode : customer.customerCode,
            name1        : customer.name1,
            street       : customer.street
          };
          orderDoc[i].shipTo = {
            customerCode : customer2.customerCode,
            name1        : customer2.name1,
            street       : customer2.street
          };

          // user
          orderDoc[i].creator = user.firstName + ' ' + user.lastName;
          orderDoc[i].distributionChannel = user2.distributionChannel;
          orderDoc[i].email = user2.email;

          // order
          orderDoc[i].items = orders.length;

          // paymentTerms
          if (orderDoc[i].paymentTerms) {
            orderDoc[i].paymentTermsDesc = paymentTerms.find(item => item.code == orderDoc[i].paymentTerms).desc;
          }

          // modify
          orderDoc[i].dateCreated = moment(new Date(orderDoc[i].dateCreated + ' ' + orderDoc[i].timeCreated).toISOString()).format('MMM DD, YYYY hh:mm a');          
          orderDoc[i].requestedDate = moment(new Date(orderDoc[i].requestedDate + ' ' + moment().format('hh:mm')  + ' ' + orderDoc[i].requestedTime).toISOString()).format('MMM DD, YYYY a');
        }

        callback(null, 'ok');
      }
    ],
    function (err, res) {
      if (err) {
        callback(err, null);
      } else {
        callback(null, orderDoc);
      }
    });
  } catch (err) {
    callback(err, null);
  }
}


loadModel.loadOrder2 = function(sessionId, callback){

  try {
    var materialDoc = [],
        stockDoc = [],
        storingReportDoc = [],
        orderDoc = [],
        customerDoc = [],
        userDoc = [];


    async.waterfall([
    // {
      // get material
      function(callback) {
        var syncOptions = {
          headers : {
            'Accept' : 'application/json',
            'Cookie' : sessionId
          },
          url    : config.public.url + '_design/AMI2_MATERIAL/_view/all',
          method : 'GET'
        };

        request(syncOptions, function(err, res) {
          if (err) {
            console.log('--- ERROR: there is an error');
            return callback(err, null);
          } else if (res.statusCode >= 300) {
            return callback(res, null);
          } else if (res.statusCode <= 299) {
            materialDoc = makeDataSet(res);
            // console.log('- - - material loaded');
            callback(null, 'ok');
          } else {
            return callback(res, null);
          }
        });
      },

      // get customer
      function(result, callback) {
        var syncOptions = {
          headers : {
            'Accept' : 'application/json',
            'Cookie' : sessionId
          },
          url    : config.public.url + '_design/AMI2_CUSTOMER/_view/all',
          method : 'GET'
        };

        request(syncOptions, function(err, res) {
          if (err) {
            console.log('--- ERROR: there is an error');
            return callback(err, null);
          } else if (res.statusCode >= 300) {
            return callback(res, null);
          } else if (res.statusCode <= 299) {
            customerDoc = makeDataSet(res);
            // console.log('- - - customer loaded');
            callback(null, 'ok');
          } else {
            return callback(res, null);
          }
        });
      },

      // get user
      function(result, callback) {
        var syncOptions = {
          headers : {
            'Accept' : 'application/json',
            'Cookie' : sessionId
          },
          url    : config.public.url + '_design/AMI2_USER/_view/all',
          method : 'GET'
        };


        request(syncOptions, function(err, res) {
          if (err) {
            console.log('--- ERROR: there is an error');
            return callback(err, null);
          } else if (res.statusCode >= 300) {
            return callback(res, null);
          } else if (res.statusCode <= 299) {
            userDoc = makeDataSet(res);
            // console.log('- - - user loaded');
            callback(null, 'ok');
          } else {
            return callback(res, null);
          }
        });
      },

      // get stock
      function(result, callback) {
        var syncOptions = {
          headers : {
            'Accept' : 'application/json',
            'Cookie' : sessionId
          },
          url    : config.public.url + '_design/AMI2_STOCK/_view/all?stale=false',
          method : 'GET'
        };


        request(syncOptions, function(err, res) {
          if (err) {
            console.log('--- ERROR: there is an error');
            return callback(err, null);
          } else if (res.statusCode >= 300) {
            return callback(res, null);
          } else if (res.statusCode <= 299) {
            stockDoc = makeDataSet(res);
            // console.log('- - - stock loaded' + ' - ' + res.body.total_rows);
            callback(null, 'ok');
          } else {
            return callback(res, null);
          }
        });
      },

      // get storing report
      // function(result, callback) {
      //   var syncOptions = {
      //     headers : {
      //       'Accept' : 'application/json',
      //       'Cookie' : sessionId
      //     },
      //     url    : config.public.url + '_design/AMI2_STORING_REPORT/_view/all',
      //     method : 'GET'
      //   };


      //   request(syncOptions, function(err, res) {
      //     if (err) {
      //       console.log('--- ERROR: there is an error');
      //       return callback(err, null);
      //     } else if (res.statusCode >= 300) {
      //       return callback(res, null);
      //     } else if (res.statusCode <= 299) {
      //       storingReportDoc = makeDataSet(res);
      //       console.log('- - - storing report loaded');
      //       callback(null, 'ok');
      //     } else {
      //       return callback(res, null);
      //     }
      //   });
      // },

      // get order
      function(result, callback) {
        var syncOptions = {
          headers : {
            'Accept' : 'application/json',
            'Cookie' : sessionId
          },
          url: config.public.url + '_design/AMI2_ORDER/_view/byOrderType_OrderItemStatus?key=["Special Order", "pending order approval"]&stale=false',
          method : 'GET'
        };


        request(syncOptions, function(err, res) {
          if (err) {
            console.log('--- ERROR: there is an error');
            return callback(err, null);
          } else if (res.statusCode >= 300) {
            return callback(res, null);
          } else if (res.statusCode <= 299) {
            orderDoc = makeDataSet(res);
            // console.log('- - - order loaded' + ' - ' + res.body.total_rows);
            callback(null, 'ok');
          } else {
            return callback(res, null);
          }
        });
      },
    // }
     
      // combine material & stock
      function(result, callback) {
        for (let i in materialDoc) {
          materialDoc[i].individualStock = stockDoc.find(function(item) {
            return item.materialCode == materialDoc[i].materialCode
          });
        }

        let stocks, materials;
        for (let i in materialDoc) {
          stocks = [];
          materials = customArrayFilter_By2Keys(materialDoc, 'size', materialDoc[i].size, 'oldMaterialNumber', materialDoc[i].oldMaterialNumber);

          for (let j in materials) {
            stocks.push(materials[j].individualStock);
          }

          materialDoc[i].stocks = stocks;
        }

        callback(null, 'ok');
      },

      // get combine
      function(result, callback) {
        for (var i in orderDoc) {
          var material = customArrayFind(materialDoc, 'materialCode', orderDoc[i].materialCode);
          // var order = customArrayFilter(orderDoc, 'salesOrderNo', orderDoc[i].salesOrderNo);
          // var stocks = customArrayFilter_By2Keys(stockDoc, 'size', material[0].size, 'sizePattern', material[0].sizePattern);
          var customer = customArrayFind(customerDoc, 'customerCode', orderDoc[i].customerCode);
          // var customerShipToParty = customArrayFilter(customerDoc, 'customerCode', orderDoc[i].shipToParty);
          var orders = customArrayFilter(orderDoc, 'salesOrderNo', orderDoc[i].salesOrderNo);
          var creator = customArrayFind(userDoc, 'id', orderDoc[i].createdBy);

          // var stock = [], totalStock = 0;
          // for (var j in stocks) {

          //   var storingReport_perStock = customArrayFilter(storingReportDoc, 'materialCode', stocks[j].materialCode),
          //       material_perStock = customArrayFilter(materialDoc, 'materialCode', stockDoc[j].materialCode);

          //   if (storingReport_perStock.length != 0 &&  material_perStock.length != 0) {
          //     stock.push({
          //       'id'           : stocks[j].id,
          //       'deliveryDate' : storingReport_perStock[0].deliveryDate,
          //       'materialCode' : stocks[j].materialCode,
          //       'storageLocation' : stocks[j].storageLocation,
          //       'totalStock' : stocks[j].totalStock
          //     });

          //     totalStock += parseInt(stocks[j].totalStock);
          //   }
          // }

          // console.log(orderDoc[i].materialCode + ': ' + totalStock);
          // stock.sort(function(a, b){ return new Date(a.deliveryDate) - new Date(b.deliveryDate); });


          // stock doc
          // orderDoc[i].stocks = stock;
          orderDoc[i].stocks = material.stocks;

          // material doc
          orderDoc[i].size = material.size;
          orderDoc[i].sizePattern = material.sizePattern;
          orderDoc[i].storageLocation = material.storageLocation;

          // customer doc
          orderDoc[i].name1 = customer.name1;
          // orderDoc[i].name2 = (customer != 0) ? customer[0].name2 : '- - -';
          // orderDoc[i].deliveryAddress = (customerShipToParty != 0) ? customerShipToParty[0].street : '- - -';

          // user
          orderDoc[i].creator = creator.firstName + ' ' + creator.lastName;

          // modify 
          orderDoc[i].timeCreated = moment().format('YYYY-MM-DD') + ' ' + orderDoc[i].timeCreated;
          orderDoc[i].dateCreated = moment(orderDoc[i].dateCreated).format('MMM DD, YYYY')  + ' - ' + moment(orderDoc[i].timeCreated).format('hh:mm a');;
          orderDoc[i].requestedDate = moment(orderDoc[i].requestedDate).format('MMM DD, YYYY');

          // extra
          orderDoc[i].items = orders.length;
          orderDoc[i].blank = '';
          orderDoc[i].action = '';
          orderDoc[i].action += '<div class="dropdown">';
          orderDoc[i].action +=   '<button class="btn btn-default btn-sm btn-flat btn-block dropdown-toggle" type="button" data-toggle="dropdown" data-orderNo="'+orderDoc[i].salesOrderNo+'">Action <span class="caret"></span></button>';
          orderDoc[i].action +=   '<ul class="dropdown-menu small-font dropdown-menu-right">';
          orderDoc[i].action +=     '<li><a href="#" class="view-trigger view" data-target="#carousel-example-generic" data-slide-to="1"><i class="fa fa-tasks"></i> View order details</a></li>';
          orderDoc[i].action +=   '</ul>';
          orderDoc[i].action += '</div>';
        }

        callback(null, 'ok');
      }
    ],
    function (err, res) {
        if (err) {
          callback(err, null);
        } else {
          callback(null, orderDoc);
        }
    });
  } catch (err) {
    callback(err, null);
  }
}


loadModel.loadOrder3 = function(sessionId, callback){
  try {
    var materialDoc = [],
        stockDoc = [],
        storingReportDoc = [],
        orderDoc = [],
        customerDoc = [],
        userDoc = [];

    async.waterfall([
    // {
      // get material
      function(callback) {
        var syncOptions = {
          headers : {
            'Accept' : 'application/json',
            'Cookie' : sessionId
          },
          url    : config.public.url + '_design/AMI2_MATERIAL/_view/all',
          method : 'GET'
        };

        request(syncOptions, function(err, res) {
          if (err) {
            console.log('--- ERROR: there is an error');
            return callback(err, null);
          } else if (res.statusCode >= 300) {
            return callback(res, null);
          } else if (res.statusCode <= 299) {
            materialDoc = makeDataSet(res);
            // console.log('- - - material loaded');
            callback(null, 'ok');
          } else {
            return callback(res, null);
          }
        });
      },

      // get customer
      function(result, callback) {
        var syncOptions = {
          headers : {
            'Accept' : 'application/json',
            'Cookie' : sessionId
          },
          url    : config.public.url + '_design/AMI2_CUSTOMER/_view/all',
          method : 'GET'
        };

        request(syncOptions, function(err, res) {
          if (err) {
            console.log('--- ERROR: there is an error');
            return callback(err, null);
          } else if (res.statusCode >= 300) {
            return callback(res, null);
          } else if (res.statusCode <= 299) {
            customerDoc = makeDataSet(res);
            // console.log('- - - customer loaded');
            callback(null, 'ok');
          } else {
            return callback(res, null);
          }
        });
      },

      // get user
      function(result, callback) {
        var syncOptions = {
          headers : {
            'Accept' : 'application/json',
            'Cookie' : sessionId
          },
          url    : config.public.url + '_design/AMI2_USER/_view/all',
          method : 'GET'
        };


        request(syncOptions, function(err, res) {
          if (err) {
            console.log('--- ERROR: there is an error');
            return callback(err, null);
          } else if (res.statusCode >= 300) {
            return callback(res, null);
          } else if (res.statusCode <= 299) {
            userDoc = makeDataSet(res);
            // console.log('- - - user loaded');
            callback(null, 'ok');
          } else {
            return callback(res, null);
          }
        });
      },

      // get stock
      function(result, callback) {
        var syncOptions = {
          headers : {
            'Accept' : 'application/json',
            'Cookie' : sessionId
          },
          url    : config.public.url + '_design/AMI2_STOCK/_view/all?stale=false',
          method : 'GET'
        };


        request(syncOptions, function(err, res) {
          if (err) {
            console.log('--- ERROR: there is an error');
            return callback(err, null);
          } else if (res.statusCode >= 300) {
            return callback(res, null);
          } else if (res.statusCode <= 299) {
            stockDoc = makeDataSet(res);
            // console.log('- - - stock loaded' + ' - ' + res.body.total_rows);
            callback(null, 'ok');
          } else {
            return callback(res, null);
          }
        });
      },

      // get storing report
      // function(result, callback) {
      //   var syncOptions = {
      //     headers : {
      //       'Accept' : 'application/json',
      //       'Cookie' : sessionId
      //     },
      //     url    : config.public.url + '_design/AMI2_STORING_REPORT/_view/all',
      //     method : 'GET'
      //   };


      //   request(syncOptions, function(err, res) {
      //     if (err) {
      //       console.log('--- ERROR: there is an error');
      //       return callback(err, null);
      //     } else if (res.statusCode >= 300) {
      //       return callback(res, null);
      //     } else if (res.statusCode <= 299) {
      //       storingReportDoc = makeDataSet(res);
      //       // console.log('- - - storing report loaded');
      //       callback(null, 'ok');
      //     } else {
      //       return callback(res, null);
      //     }
      //   });
      // },

      // get order
      function(result, callback) {
        var syncOptions = {
          headers : {
            'Accept' : 'application/json',
            'Cookie' : sessionId
          },
          url: config.public.url + '_design/AMI2_ORDER/_view/byOrderItemStatus?key="submitted"&stale=false',
          method : 'GET'
        };


        request(syncOptions, function(err, res) {
          if (err) {
            console.log('--- ERROR: there is an error');
            return callback(err, null);
          } else if (res.statusCode >= 300) {
            return callback(res, null);
          } else if (res.statusCode <= 299) {
            orderDoc = makeDataSet(res);
            // console.log('- - - order loaded' + ' - ' + res.body.total_rows);
            callback(null, 'ok');
          } else {
            return callback(res, null);
          }
        });
      },
    // }
      
      // combine material & stock
      function(result, callback) {
        for (let i in materialDoc) {
          materialDoc[i].individualStock = stockDoc.find(function(item) {
            return item.materialCode == materialDoc[i].materialCode
          });
        }

        let stocks, materials;
        for (let i in materialDoc) {
          stocks = [];
          materials = customArrayFilter_By2Keys(materialDoc, 'size', materialDoc[i].size, 'oldMaterialNumber', materialDoc[i].oldMaterialNumber);

          for (let j in materials) {
            stocks.push(materials[j].individualStock);
          }

          materialDoc[i].stocks = stocks;
        }

        callback(null, 'ok');
      },

      // get combine
      function(result, callback) {
        for (var i in orderDoc) {
          var material = customArrayFind(materialDoc, 'materialCode', orderDoc[i].materialCode);
          // var order = customArrayFilter(orderDoc, 'salesOrderNo', orderDoc[i].salesOrderNo);
          // var stocks = customArrayFilter_By2Keys(stockDoc, 'size', material[0].size, 'sizePattern', material[0].sizePattern);
          var customer = customArrayFind(customerDoc, 'customerCode', orderDoc[i].customerCode);
          // var customerShipToParty = customArrayFilter(customerDoc, 'customerCode', orderDoc[i].shipToParty);
          var orders = customArrayFilter(orderDoc, 'salesOrderNo', orderDoc[i].salesOrderNo);
          var creator = customArrayFind(userDoc, 'id', orderDoc[i].createdBy);

          // var stock = [], totalStock = 0;
          // for (var j in stocks) {

          //   var storingReport_perStock = customArrayFilter(storingReportDoc, 'materialCode', stocks[j].materialCode),
          //       material_perStock = customArrayFilter(materialDoc, 'materialCode', stockDoc[j].materialCode);

          //   if (storingReport_perStock.length != 0 &&  material_perStock.length != 0) {
          //     stock.push({
          //       'id'           : stocks[j].id,
          //       'deliveryDate' : storingReport_perStock[0].deliveryDate,
          //       'materialCode' : stocks[j].materialCode,
          //       'storageLocation' : stocks[j].storageLocation,
          //       'totalStock' : stocks[j].totalStock
          //     });

          //     totalStock += parseInt(stocks[j].totalStock);
          //   }
          // }

          // console.log(orderDoc[i].materialCode + ': ' + totalStock);
          // stock.sort(function(a, b){ return new Date(a.deliveryDate) - new Date(b.deliveryDate); });


          // stock doc
          orderDoc[i].stocks = material.stocks;

          // material doc
          orderDoc[i].size = material.size;
          orderDoc[i].sizePattern = material.sizePattern;
          orderDoc[i].storageLocation = material.storageLocation;

          // customer doc
          orderDoc[i].name1 = customer.name1;
          // orderDoc[i].name2 = (customer != 0) ? customer[0].name2 : '- - -';
          // orderDoc[i].deliveryAddress = (customerShipToParty != 0) ? customerShipToParty[0].street : '- - -';

          // user
          orderDoc[i].creator = creator.firstName + ' ' + creator.lastName;

          // modify 
          orderDoc[i].timeCreated = moment().format('YYYY-MM-DD') + ' ' + orderDoc[i].timeCreated;
          orderDoc[i].dateCreated = moment(orderDoc[i].dateCreated).format('MMM DD, YYYY')  + ' - ' + moment(orderDoc[i].timeCreated).format('hh:mm a');;
          orderDoc[i].requestedDate = moment(orderDoc[i].requestedDate).format('MMM DD, YYYY');

          // extra
          orderDoc[i].items = orders.length;
          orderDoc[i].blank = '';
          orderDoc[i].action = '';
          orderDoc[i].action += '<div class="dropdown">';
          orderDoc[i].action +=   '<button class="btn btn-default btn-sm btn-flat btn-block dropdown-toggle" type="button" data-toggle="dropdown" data-orderNo="'+orderDoc[i].salesOrderNo+'">Action <span class="caret"></span></button>';
          orderDoc[i].action +=   '<ul class="dropdown-menu small-font dropdown-menu-right">';
          orderDoc[i].action +=     '<li><a href="#" class="view-trigger view" data-target="#carousel-example-generic" data-slide-to="1"><i class="fa fa-tasks"></i> View order details</a></li>';
          orderDoc[i].action +=   '</ul>';
          orderDoc[i].action += '</div>';
        }

        callback(null, 'ok');
      }
    ],
    function (err, res) {
      if (err) {
        callback(err, null);
      } else {
        callback(null, orderDoc);
      }
    });
  } catch (err) {
    callback(err, null);
  }
}




loadModel.loadBackorder = function(sessionId, callback){

  try {
    var materialDoc = [],
        stockDoc = [],
        storingReportDoc = [],
        orderDoc = [],
        customerDoc = [],
        userDoc = [];


    async.waterfall([

      // get material
      function(callback) {
        var syncOptions = {
          headers : {
            'Accept' : 'application/json',
            'Cookie' : sessionId
          },
          url    : config.public.url + '_design/AMI2_MATERIAL/_view/all',
          method : 'GET'
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
            materialDoc = makeDataSet(res);
            console.log('- - - material loaded');
            callback(null, 'ok');
          }
        });
      },

      // get customer
      function(result, callback) {
        var syncOptions = {
          headers : {
            'Accept' : 'application/json',
            'Cookie' : sessionId
          },
          url    : config.public.url + '_design/AMI2_CUSTOMER/_view/all',
          method : 'GET'
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
            customerDoc = makeDataSet(res);
            console.log('- - - customer loaded');
            callback(null, 'ok');
          }
        });
      },

      // get user
      function(result, callback) {
        var syncOptions = {
          headers : {
            'Accept' : 'application/json',
            'Cookie' : sessionId
          },
          url    : config.public.url + '_design/AMI2_USER/_view/all',
          method : 'GET'
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
            userDoc = makeDataSet(res);
            console.log('- - - user loaded');
            callback(null, 'ok');
          }
        });
      },

      // get stock
      function(result, callback) {
        var syncOptions = {
          headers : {
            'Accept' : 'application/json',
            'Cookie' : sessionId
          },
          url    : config.public.url + '_design/AMI2_STOCK/_view/all',
          method : 'GET'
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
            stockDoc = makeDataSet(res);
            console.log('- - - stock loaded' + ' - ' + res.body.total_rows);
            callback(null, 'ok');
          }
        });
      },

      // get storing report
      function(result, callback) {
        var syncOptions = {
          headers : {
            'Accept' : 'application/json',
            'Cookie' : sessionId
          },
          url    : config.public.url + '_design/AMI2_STORING_REPORT/_view/all',
          method : 'GET'
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
            storingReportDoc = makeDataSet(res);
            console.log('- - - storing report loaded');
            callback(null, 'ok');
          }
        });
      },

      // get order
      function(result, callback) {
        var syncOptions = {
          headers : {
            'Accept' : 'application/json',
            'Cookie' : sessionId
          },
          url: config.public.url + '_design/AMI2_BACKORDER/_view/byOrderType_OrderItemStatus?key=["Normal Order", "pending order approval"]',
          method : 'GET'
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
            orderDoc = makeDataSet(res);
            console.log('- - - order loaded' + ' - ' + res.body.total_rows);
            callback(null, 'ok');
          }
        });
      },

      // get combine
      function(result, callback) {
        
        for (var i in orderDoc) {
          var material = customArrayFilter(materialDoc, 'materialCode', orderDoc[i].materialCode);
          var order = customArrayFilter(orderDoc, 'salesOrderNo', orderDoc[i].salesOrderNo);
          var stocks = customArrayFilter_By2Keys(stockDoc, 'size', material[0].size, 'sizePattern', material[0].sizePattern);
          var customer = customArrayFilter(customerDoc, 'customerCode', orderDoc[i].customerCode);
          var customerShipToParty = customArrayFilter(customerDoc, 'customerCode', orderDoc[i].shipToParty);          
          var orders = customArrayFilter(orderDoc, 'salesOrderNo', orderDoc[i].salesOrderNo);
          var creator = customArrayFilter(userDoc, 'id', orderDoc[i].createdBy);

          var stock = [], totalStock = 0;
          for (var j in stocks) {

            var storingReport_perStock = customArrayFilter(storingReportDoc, 'materialCode', stocks[j].materialCode),
                material_perStock = customArrayFilter(materialDoc, 'materialCode', stockDoc[j].materialCode);

            if (storingReport_perStock.length != 0 &&  material_perStock.length != 0) {
              stock.push({
                'id'           : stocks[j].id,
                'deliveryDate' : storingReport_perStock[0].deliveryDate
              });

              totalStock += parseInt(stocks[j].totalStock);
            }
          }

          // console.log(orderDoc[i].materialCode + ': ' + totalStock);
          stock.sort(function(a, b){ return new Date(a.deliveryDate) - new Date(b.deliveryDate); });


          // stock doc
          orderDoc[i].stocks = stocks;

          // material doc
          orderDoc[i].size = (material.length != 0) ? material[0].size : '- - -';
          orderDoc[i].sizePattern = (material.length != 0) ? material[0].sizePattern : '- - -';

          // customer doc
          orderDoc[i].name1 = (customer != 0) ? customer[0].name1 : '- - -';
          orderDoc[i].name2 = (customer != 0) ? customer[0].name2 : '- - -';
          orderDoc[i].deliveryAddress = (customerShipToParty != 0) ? customerShipToParty[0].street : '- - -';

          // user
          orderDoc[i].creator = creator[0].firstName + ' ' + creator[0].lastName;

          // modify 
          orderDoc[i].dateCreated = moment(orderDoc[i].dateCreated).format('MMM DD, YYYY - h:mm A');
          orderDoc[i].requestedDate = moment(orderDoc[i].requestedDate).format('MMM DD, YYYY');

          // extra
          orderDoc[i].items = orders.length;
          orderDoc[i].blank = '';
          orderDoc[i].action = '';
          orderDoc[i].action += '<div class="dropdown">';
          orderDoc[i].action +=   '<button class="btn btn-default btn-sm btn-flat btn-block dropdown-toggle" type="button" data-toggle="dropdown" data-orderNo="'+orderDoc[i].backOrderNo+'">Action <span class="caret"></span></button>';
          orderDoc[i].action +=   '<ul class="dropdown-menu small-font dropdown-menu-right">';
          orderDoc[i].action +=     '<li><a href="#" class="view-trigger view" data-target="#carousel-example-generic" data-slide-to="3"><i class="fa fa-tasks"></i> View order details</a></li>';
          orderDoc[i].action +=   '</ul>';
          orderDoc[i].action += '</div>';
        }


        callback(null, 'ok');
      }
    ],


      function (err, res) {
        if (err) {
          console.log(err);
        } else {
          // callback(null, materialDoc);
          callback(null, orderDoc);
        }
    });



    

  } catch (err) {
    console.log(err)
  }
}



loadModel.loadBackorder2 = function(sessionId, callback){

  try {
    var materialDoc = [],
        stockDoc = [],
        storingReportDoc = [],
        orderDoc = [],
        customerDoc = [],
        userDoc = [];


    async.waterfall([

      // get material
      function(callback) {
        var syncOptions = {
          headers : {
            'Accept' : 'application/json',
            'Cookie' : sessionId
          },
          url    : config.public.url + '_design/AMI2_MATERIAL/_view/all',
          method : 'GET'
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
            materialDoc = makeDataSet(res);
            console.log('- - - material loaded');
            callback(null, 'ok');
          }
        });
      },

      // get customer
      function(result, callback) {
        var syncOptions = {
          headers : {
            'Accept' : 'application/json',
            'Cookie' : sessionId
          },
          url    : config.public.url + '_design/AMI2_CUSTOMER/_view/all',
          method : 'GET'
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
            customerDoc = makeDataSet(res);
            console.log('- - - customer loaded');
            callback(null, 'ok');
          }
        });
      },

      // get user
      function(result, callback) {
        var syncOptions = {
          headers : {
            'Accept' : 'application/json',
            'Cookie' : sessionId
          },
          url    : config.public.url + '_design/AMI2_USER/_view/all',
          method : 'GET'
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
            userDoc = makeDataSet(res);
            console.log('- - - user loaded');
            callback(null, 'ok');
          }
        });
      },

      // get stock
      function(result, callback) {
        var syncOptions = {
          headers : {
            'Accept' : 'application/json',
            'Cookie' : sessionId
          },
          url    : config.public.url + '_design/AMI2_STOCK/_view/all',
          method : 'GET'
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
            stockDoc = makeDataSet(res);
            console.log('- - - stock loaded' + ' - ' + res.body.total_rows);
            callback(null, 'ok');
          }
        });
      },

      // get storing report
      function(result, callback) {
        var syncOptions = {
          headers : {
            'Accept' : 'application/json',
            'Cookie' : sessionId
          },
          url    : config.public.url + '_design/AMI2_STORING_REPORT/_view/all',
          method : 'GET'
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
            storingReportDoc = makeDataSet(res);
            console.log('- - - storing report loaded');
            callback(null, 'ok');
          }
        });
      },

      // get order
      function(result, callback) {
        var syncOptions = {
          headers : {
            'Accept' : 'application/json',
            'Cookie' : sessionId
          },
          url: config.public.url + '_design/AMI2_BACKORDER/_view/byOrderType_OrderItemStatus?key=["Special Order", "pending order approval"]',
          method : 'GET'
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
            orderDoc = makeDataSet(res);
            console.log('- - - order loaded' + ' - ' + res.body.total_rows);
            callback(null, 'ok');
          }
        });
      },

      // get combine
      function(result, callback) {
        for (var i in orderDoc) {
          var material = customArrayFilter(materialDoc, 'materialCode', orderDoc[i].materialCode);
          var order = customArrayFilter(orderDoc, 'salesOrderNo', orderDoc[i].salesOrderNo);
          var stocks = customArrayFilter_By2Keys(stockDoc, 'size', material[0].size, 'sizePattern', material[0].sizePattern);
          var customer = customArrayFilter(customerDoc, 'customerCode', orderDoc[i].customerCode);
          var customerShipToParty = customArrayFilter(customerDoc, 'customerCode', orderDoc[i].shipToParty);
          var orders = customArrayFilter(orderDoc, 'salesOrderNo', orderDoc[i].salesOrderNo);
          var creator = customArrayFilter(userDoc, 'id', orderDoc[i].createdBy);


          var stock = [], totalStock = 0;
          for (var j in stocks) {

            var storingReport_perStock = customArrayFilter(storingReportDoc, 'materialCode', stocks[j].materialCode),
                material_perStock = customArrayFilter(materialDoc, 'materialCode', stockDoc[j].materialCode);

            if (storingReport_perStock.length != 0 &&  material_perStock.length != 0) {
              stock.push({
                'id'           : stocks[j].id,
                'deliveryDate' : storingReport_perStock[0].deliveryDate
              });

              totalStock += parseInt(stocks[j].totalStock);
            }
          }

          // console.log(orderDoc[i].materialCode + ': ' + totalStock);
          stock.sort(function(a, b){ return new Date(a.deliveryDate) - new Date(b.deliveryDate); });


          // stock doc
          orderDoc[i].stocks = stocks;

          // material doc
          orderDoc[i].size = (material.length != 0) ? material[0].size : '- - -';
          orderDoc[i].sizePattern = (material.length != 0) ? material[0].sizePattern : '- - -';

          // customer doc
          orderDoc[i].name1 = (customer != 0) ? customer[0].name1 : '- - -';
          orderDoc[i].name2 = (customer != 0) ? customer[0].name2 : '- - -';
          orderDoc[i].deliveryAddress = (customerShipToParty != 0) ? customerShipToParty[0].street : '- - -';
          
          // user
          orderDoc[i].creator = creator[0].firstName + ' ' + creator[0].lastName;

          // modify 
          orderDoc[i].dateCreated = moment(orderDoc[i].dateCreated).format('MMM DD, YYYY - h:mm A');
          orderDoc[i].requestedDate = moment(orderDoc[i].requestedDate).format('MMM DD, YYYY');

          // extra
          orderDoc[i].items = orders.length;
          orderDoc[i].blank = '';
          orderDoc[i].action = '';
          orderDoc[i].action += '<div class="dropdown">';
          orderDoc[i].action +=   '<button class="btn btn-default btn-sm btn-flat btn-block dropdown-toggle" type="button" data-toggle="dropdown" data-orderNo="'+orderDoc[i].backOrderNo+'">Action <span class="caret"></span></button>';
          orderDoc[i].action +=   '<ul class="dropdown-menu small-font dropdown-menu-right">';
          orderDoc[i].action +=     '<li><a href="#" class="view-trigger view" data-target="#carousel-example-generic" data-slide-to="3"><i class="fa fa-tasks"></i> View order details</a></li>';
          orderDoc[i].action +=   '</ul>';
          orderDoc[i].action += '</div>';
        }


        callback(null, 'ok');
      }
    ],


      function (err, res) {
        if (err) {
          console.log(err);
        } else {
          // callback(null, materialDoc);
          callback(null, orderDoc);
        }
    });



    

  } catch (err) {
    console.log(err)
  }
}



loadModel.loadMaterial = function(sessionId, callback){

  try {
    var materialDoc = [],
        stockDoc = [],
        storingReportDoc = [],
        materialGroupConversionDoc = [];


    async.waterfall([

      function(callback) {
        var syncOptions = {
          headers : {
            'Accept' : 'application/json',
            'Cookie' : sessionId
          },
          url    : config.public.url + '_design/AMI2_MATERIAL/_view/all',
          method : 'GET'
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
            for (var i = 0; i < res.body.total_rows; i++) {
              materialDoc.push(res.body.rows[i].value);
              materialDoc[i].id = res.body.rows[i].id;
            }

            callback(null, true);
          }
        });
      },

      function(result, callback) {
        var syncOptions = {
          headers : {
            'Accept' : 'application/json',
            'Cookie' : sessionId
          },
          url    : config.public.url + '_design/AMI2_STOCK/_view/all',
          method : 'GET'
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
            for (var i = 0; i < res.body.total_rows; i++) {
              stockDoc.push(res.body.rows[i].value);
              stockDoc[i].id = res.body.rows[i].id;
            }

            callback(null, 'ok');
          }
        });
      },

      function(result, callback) {
        var syncOptions = {
          headers : {
            'Accept' : 'application/json',
            'Cookie' : sessionId
          },
          url    : config.public.url + '_design/AMI2_STORING_REPORT/_view/all',
          method : 'GET'
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
            for (var i = 0; i < res.body.total_rows; i++) {
              storingReportDoc.push(res.body.rows[i].value);
              storingReportDoc[i].id = res.body.rows[i].id;
            }

            callback(null, 'ok');
          }
        });
      },

      // get group conversion
      function(result, callback) {
        var syncOptions = {
          headers : {
            'Accept' : 'application/json',
            'Cookie' : sessionId
          },
          url: config.public.url + '_design/AMI_DISCOUNT/_view/byMaterialGroupConversion',
          method : 'GET'
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
            materialGroupConversionDoc = makeDataSet(res);
            callback(null, 'ok');
          }
        });
      },

      function(result, callback) {
        for (var i in materialDoc) {
          var stocks = stockDoc.filter(function(item) { return item['size'] == materialDoc[i].size && item['sizePattern'] == materialDoc[i].sizePattern; });
          var storingReport = storingReportDoc.filter(function(item) { return item['materialCode'] == materialDoc[i].materialCode });

          var stock = [], totalStock = 0;
          for (var j in stocks) {
            var storingReportDoc_perStock = storingReportDoc.filter(function(item) { return item['materialCode'] == stocks[j].materialCode });
          
            stock.push({
              'id'           : stocks[j].id,
              'deliveryDate' : (storingReportDoc_perStock.length != 0) ? storingReportDoc_perStock[0].deliveryDate : '- - -'
            });

            totalStock += parseInt(stocks[j].totalStock);
          }

          stock.sort(function(a, b){ return new Date(a.deliveryDate) - new Date(b.deliveryDate); });

          materialDoc[i].stocks = stock;
          // materialDoc[i].usedMaterialCode = materialDoc[i].materialCode;
          materialDoc[i].usedMaterialCode = generateNewMaterialCode(materialDoc[i].materialCode, materialDoc[i].size, materialDoc[i].source);

          var groupConversion = customArrayFilter(materialGroupConversionDoc, 'materialGroup', materialDoc[i].materialGroup);
          materialDoc[i].materialGroup = (groupConversion.length > 0) ? groupConversion[0].materialGroupWOS : 'Others';

          materialDoc[i].controlled = (stocks.length != 0) ? stocks[0].controlled : '- - -';
          materialDoc[i].deliveryDate = (storingReport.length != 0) ? storingReport[0].deliveryDate : '- - -';
          materialDoc[i].totalStock = totalStock;
          materialDoc[i].inputQuantity = '<input type="number" class="form-control input-sm allocate-order" style="width: 70px;" min="1" placeholder="0">';
          materialDoc[i].action = '<button type="button" class="btn btn-sm btn-danger remove-trigger" data-toggle="tooltip" title="Remove item from cart"><i class="fa fa-times" aria-hidden="true"></i></button>';
          materialDoc[i].blank = '';
        }

        callback(null, 'ok');
      }
      ],


      function (err, res) {
        if (err) {
          console.log(err);
        } else {
          callback(null, materialDoc);
        }
    });



    

  } catch (err) {
    console.log(err)
  }
}



/* invitation.js
getting salesperson | customer
1) get customer by partner type
2) get user by role id
3) remove customer with user account
*/
loadModel.loadCustomerUser_WithoutAccount = function(partnerType, role, sessionId, callback){
  try {
    var customerDoc = [],
        userDoc = [];

    async.waterfall([
      // get customer by partner type
      function(callback) {
        if (partnerType == 'blank') {
          partnerType = '';
        }

        var syncOptions = {
          headers : {
            'Accept' : 'application/json',
            'Cookie' : sessionId
          },
          url: config.public.url + '_design/AMI2_CUSTOMER/_view/byPartnerType?key="'+partnerType+'"',
          method : 'GET'
        };

        request(syncOptions, function(err, res) {
          if (err) {
            console.log(err);
            return callback(err, null);
          }

          else if (res.statusCode >= 300) {
            console.log('--- ERROR: cannot get customer documents (statusCode '+ res.statusCode +')');
            return callback(res, null);
          }

          else {
            customerDoc = makeDataSet(res);
            callback(null, 'ok');
          }
        });
      },

      // get user by role id
      function(result, callback) {
        var syncOptions = {
          headers : {
            'Accept' : 'application/json',
            'Cookie' : sessionId
          },
          url: config.public.url + '_design/AMI2_USER/_view/byRoleId?key="'+role+'"&stale=false',
          method : 'GET'
        };

        request(syncOptions, function(err, res) {
          if (err) {
            console.log(err);
            return callback(err, null);
          }

          else if (res.statusCode >= 300) {
            console.log('--- ERROR: cannot get customer documents (statusCode '+ res.statusCode +')');
            return callback(res, null);
          }

          else {
            userDoc = makeDataSet(res);
            callback(null, 'ok');
          }
        });
      },

      // remove customer with user account
      function(result, callback) {
        customerDoc = removeDuplicate(customerDoc, 'customerCode');

        for (var i in userDoc) {
          customerDoc = reverse_customArrayFilter(customerDoc, 'customerCode', userDoc[i].customerCode);
        }

        callback(null, 'ok');
      }
    ],

    function (err, res) {
      if (err) {
        console.log(err);
      } else {
        callback(null, customerDoc);
      }
    });
  } catch (err) {
    console.log(err)
  }
}


/* user.js
getting user that's not customer or salesperson
1) get all user
2) get all role
3) remove user that role is customer and salesperson & add field
*/
loadModel.loadUser_NotCustomer_NotSaleperson = function(role1, role2, sessionId, callback){
  try {
    var userDoc = [],
        roleDoc = [];

    async.waterfall([
      // get all user
      function(callback) {
        var syncOptions = {
          headers : {
            'Accept' : 'application/json',
            'Cookie' : sessionId
          },
          url: config.public.url + '_design/AMI2_USER/_view/all?stale=false',
          method : 'GET'
        };

        request(syncOptions, function(err, res) {
          if (err) {
            console.log(err);
            return callback(err, null);
          }

          else if (res.statusCode >= 300) {
            console.log('--- ERROR: cannot get customer documents (statusCode '+ res.statusCode +')');
            return callback(res, null);
          }

          else {
            userDoc = makeDataSet(res);
            callback(null, 'ok');
          }
        });
      },

      // get all role
      function(result ,callback) {
        var syncOptions = {
          headers : {
            'Accept' : 'application/json',
            'Cookie' : sessionId
          },
          url: config.public.url + '_design/AMI2_ROLE/_view/all?stale=false',
          method : 'GET'
        };

        request(syncOptions, function(err, res) {
          if (err) {
            console.log(err);
            return callback(err, null);
          }

          else if (res.statusCode >= 300) {
            console.log('--- ERROR: cannot get role documents (statusCode '+ res.statusCode +')');
            return callback(res, null);
          }

          else {
            roleDoc = makeDataSet(res);
            callback(null, 'ok');
          }
        });
      },

      // remove user that role is customer and salesperson
      // add field
      function(result, callback) {
        userDoc = reverse_customArrayFilter_By2Keys(userDoc, 'roleId', role1, 'roleId', role2);

        var role, user;
        for (var i in userDoc) {
          role = customArrayFilter(roleDoc, 'id', userDoc[i].roleId);
          userDoc[i].role = (role.length != 0) ? role[0].role : null;

          userDoc[i].action = '';
          userDoc[i].action += '<div class="dropdown">';
          userDoc[i].action +=   '<button class="btn btn-default btn-sm btn-flat btn-block dropdown-toggle" type="button" data-toggle="dropdown">Action <span class="caret"></span></button>';
          userDoc[i].action +=   '<ul class="dropdown-menu small-font dropdown-menu-right">';
          userDoc[i].action +=     '<li><a href="#" class="edit-trigger"><i class="fa fa-pencil-square-o" aria-hidden="true"></i> Edit user</a></li>';
          userDoc[i].action +=     '<li><a href="#" class="delete-trigger"><i class="fa fa-trash" aria-hidden="true"></i> Delete user</a></li>';
          userDoc[i].action +=   '</ul>';
          userDoc[i].action += '</div>';

          user = customArrayFilter(userDoc, 'id', userDoc[i].supervisor);
          userDoc[i].supervisorName = (user.length != 0) ? user.firstName + ' ' + user.lastName : null;
        }

        callback(null, 'ok');
      },
    ],

    function (err, res) {
      if (err) {
        console.log(err);
      } else {
        callback(null, userDoc);
      }
    });
  } catch (err) {
    console.log(err)
  }
}


/* user.js
getting salesperson | customer
1) get user by role id
2) get customer by partner type (for adding customerName field on Customer)
3) add field
*/
// customer
loadModel.loadUser_ByRole = function(role, roleDesc, sessionId, callback){
  try {
    var userDoc = [],
        customerDoc = [],
        roleDoc = [];

    async.waterfall([
      // get user by role id
      function(callback) {
        var syncOptions = {
          headers : {
            'Accept' : 'application/json',
            'Cookie' : sessionId
          },
          url: config.public.url + '_design/AMI2_USER/_view/byRoleId?key="'+role+'"&stale=false',
          method : 'GET'
        };

        request(syncOptions, function(err, res) {
          if (err) {
            console.log(err);
            return callback(err, null);
          }

          else if (res.statusCode >= 300) {
            console.log('--- ERROR: cannot get user documents (statusCode '+ res.statusCode +')');
            return callback(res, null);
          }

          else {
            userDoc = makeDataSet(res);
            callback(null, 'ok');
          }
        });
      },

      // get customer by partner type
      function(result ,callback) {
        var syncOptions = {
          headers : {
            'Accept' : 'application/json',
            'Cookie' : sessionId
          },
          url: config.public.url + '_design/AMI2_CUSTOMER/_view/byPartnerType?key=""',
          method : 'GET'
        };

        request(syncOptions, function(err, res) {
          if (err) {
            console.log(err);
            return callback(err, null);
          }

          else if (res.statusCode >= 300) {
            console.log('--- ERROR: cannot get customer documents (statusCode '+ res.statusCode +')');
            return callback(res, null);
          }

          else {
            customerDoc = makeDataSet(res);
            callback(null, 'ok');
          }
        });
      },

      // add field
      function(result, callback) {
        var role, customer;

        if (roleDesc == 'CUSTOMER') {
          for (var i in userDoc) {            
            customer = customArrayFilter(customerDoc, 'customerCode', userDoc[i].customerCode);
            userDoc[i].customerName = (customer.length != 0) ? customer[0].name1 : null;
          }
        }

        callback(null, 'ok');
      },
    ],

    function (err, res) {
      if (err) {
        console.log(err);
      } else {
        callback(null, userDoc);
      }
    });
  } catch (err) {
    console.log(err)
  }
}

/*KAEL salesperson
1.get roleId using loadUser_ByRole
2.get orders using roleId, orderItemStatus, startDate, endDate
*/
loadModel.loadOrder_BySalesPerson = function(roleId, orderItemStatus, startDate, endDate,  sessionId, callback){
  try {
        var syncOptions = {
          headers : {
            'Accept' : 'application/json',
            'Cookie' : sessionId
          },
          url: config.admin.url + '_design/AMI2_ORDER/_view/bySalesPerson?startkey=[["'+roleId+'"],"'+orderItemStatus+'",'+startDate+']&endkey=[["'+roleId+'"],"'+orderItemStatus+'",'+endDate+']',
          // url: config.admin.url + '_design/AMI2_ORDER/_view/bySalesPerson?startkey=[["00000002"],"confirmed",[2018,5,11,0,0,0]]&endkey=[["00000002"],"confirmed",[2018,6,19,0,0,0]]',
          method : 'GET'
        };

        request(syncOptions, function(err, res) {
          if (err) {
            console.log(err);
            return callback(err, null);
          }

          else if (res.statusCode >= 300) {
            console.log('--- ERROR: cannot get user documents (statusCode '+ res.statusCode +')');
            return callback(res, null);
          }

          else {
            orderDoc = makeDataSet(res)
            callback(null, orderDoc);
          }
        });
  } catch (err) {
    console.log(err)
  }
}

/* user.js
1) get customer by partner  type
*/
loadModel.loadCustomer_ByPartnerType = function(viewType, viewName, partnerType, sessionId, callback){
  try {
    if (partnerType == 'blank') {
      partnerType = '';
    }
        
    var syncOptions = {
      headers: {
        "Accept" : "application/json",
        'Cookie' : sessionId
      },
      url: config.public.url + '_design/' + viewType + '/_view/' + viewName + '?key="' + partnerType + '"',
      method: 'GET'
    };

    request(syncOptions, function(err, res) {

      if (err) {
        console.log(err);
        return callback(err, null);
      } 

      else if (res.statusCode >= 300) {
        console.log('--- ERROR: cannot get customer documents (statusCode '+ res.statusCode +')');
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


/* user.js, normalOrder.js
1) get customer by customer code and partner  type
*/
loadModel.loadCustomer_ByCustomerCode_ByPartnerType = function(customerCode, partnerType, sessionId, callback) {
  try {
    if (partnerType == 'blank') {
      partnerType = '';
    }

    var syncOptions = {
      headers : {
        'Accept' : 'application/json',
        'Cookie' : sessionId
      },
      url: config.public.url + '_design/WOS2_CUSTOMER/_view/byCustomerCode_PartnerType?key=["'+customerCode+'", "'+partnerType+'"]',
      method : 'GET'
    };

    request(syncOptions, function(err, res) {
      if (err) {
        console.log(err);
        return callback(err, null);
      }

      else if (res.statusCode >= 300) {
        console.log('--- ERROR: cannot get customer documents (statusCode '+ res.statusCode +')');
        return callback(res, null);
      }

      else {
        callback(null, makeDataSet(res));
      }
    });
  } catch (err) {
    console.log(err)
  }
}










function customArrayFilter(data, key, value) {
  var filteredArray = data.filter(function(item) {
    return item[key] == value;
  });

  return filteredArray;
}



function customArrayFind(data, key, value) {
  var filteredArray = data.find(function(item) {
    return item[key] == value;
  });

  return filteredArray;
}



function customArrayFilter_By2Keys(data, key1, value1, key2, value2) {
  var filteredArray = data.filter(function(item) {
    return item[key1] == value1 && item[key2] == value2;
  });

  return filteredArray;
}



function reverse_customArrayFilter(data, key, value) {
  var filteredArray = data.filter(function(item) {
    return item[key] != value;
  });

  return filteredArray;
}



function reverse_customArrayFilter_By2Keys(data, key1, value1, key2, value2) {
  var filteredArray = data.filter(function(item) {
    return item[key1] != value1 && item[key2] != value2;
  });

  return filteredArray;
}



function removeDuplicate(data, key) {
  var uniqueData = [], newData = [];

  for(i in data){    
    if(uniqueData.indexOf(data[i][key]) === -1){
      uniqueData.push(data[i][key]);
      newData.push(data[i]);
    }
  }

  return newData;
}


function makeDataSet(res) {
  var data = [];

  for (var i = 0; i < res.body.total_rows; i++) {
    data.push(res.body.rows[i].value);
    data[i].id = res.body.rows[i].id;
  }

  return data;
}

function mapToResultValue(res) {
  return res.body.rows.map((item) => item.value);
}





function generateNewMaterialCode(materialCode, size, source) {
  // part 1
  var part1 = materialCode.slice(0, 3);

  // part 2
  // var lastIndex = size.lastIndexOf(" "),
  //     form1 = size.substring(0, lastIndex).trim();
      // console.log(form1);
      size = size.trim(); // remove space on start and end
      form2 = size.replace(/-/g, " "); // remove dash
      // console.log(form2);
      part2 = form2.replace(/\s+/g, '-'); // replace space by dash 
      // console.log(part2);

  // part 3
  var fifthDigit = materialCode.charAt(4),
      part3 = '',
      contryCode = {
        'TH' : ['L', 'J'],
        'IN' : ['N'],
        'EU' : ['R', 'S', 'Y', 'P', 'G'],
        'SF' : ['X'],
        'TA' : ['F'],
        'CH' : ['H'],
        'JP' : ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
      }

  var country = Object.keys(contryCode);
  for (var i in country) {
    if (contryCode[country[i]].indexOf(fifthDigit) != -1) {
      part3 = country[i];
      break;
    }
  }

  return part1 + '-' + part2 + '-' + part3;
}



// Cedrix
loadModel.loadPendingOrder_ExceedCreditLimit=function(sessionId, callback){
    try {
      var orderDoc = [];
      var customerDoc = [];
        
      async.waterfall([
        function(callback) {
          var syncOptions = {
            headers: {
              "Accept" : "application/json",
              'Cookie' : sessionId
            },
            url: config.public.url + '_design/AMI2_ORDER/_view/byOrderItemStatus?key="submitted"&stale=false',
            method: 'GET'
          };

          request(syncOptions, function(err, res) {
            if (err) {
              console.log('--- ERROR: there is an error');
              return callback(err, null);
            } else if (res.statusCode >= 300) {
              return callback(res, null);
            } else if (res.statusCode <= 299) {
              orderDoc = makeDataSet(res);
              callback(null, 'ok');
            } else {
              return callback(res, null);
            }
          });
        },

        // customer
        function(cust, callback) {
          var syncOptions = {
            headers : {
              "Accept" : "application/json",
              'Cookie' : sessionId
            },
            url    : config.public.url + '_design/AMI2_CUSTOMER/_view/all',
            method : 'GET'
          };

          request(syncOptions, function(err, res) {
            if (err) {
              console.log('--- ERROR: there is an error');
              return callback(err, null);
            } else if (res.statusCode >= 300) {
              return callback(res, null);
            } else if (res.statusCode <= 299) {
              customerDoc = makeDataSet(res);
              callback(null, 'ok');
            } else {
              return callback(res, null);
            }
          });
        },

        // combine orderDoc and customerDoc
        function(result, callback) {
          for(var i in orderDoc){
            for(var j in customerDoc){
              if(orderDoc[i].customerCode == customerDoc[j].customerCode){
                // console.log(orderDoc[i])
                orderDoc[i].customerName = customerDoc[j].name1;
              }
            }
          }

          callback(null, 'ok combined')
        }
      ],

      function (err, res) {
        if(err) {
          callback(err, null);
        } else {
          callback(null, orderDoc)
        }
      });
    } catch (err) {
      console.log(err)
    }
  }



// Cedrix
loadModel.loadPendingOrder_ExceedOverduePayment=function(sessionId, callback){
    try {
      var orderDoc = [];
      var customerDoc = [];
        
      async.waterfall([
        function(callback) {
          var syncOptions = {
            headers: {
              "Accept" : "application/json",
              'Cookie' : sessionId
            },
            url: config.public.url + '_design/AMI2_ORDER/_view/byOrderItemStatus?key="submitted"&stale=false',
            method: 'GET'
          };

          request(syncOptions, function(err, res) {
            if (err) {
              console.log('--- ERROR: there is an error');
              return callback(err, null);
            } else if (res.statusCode >= 300) {
              return callback(res, null);
            } else if (res.statusCode <= 299) {
              orderDoc = makeDataSet(res);
              callback(null, 'ok');
            } else {
              return callback(res, null);
            }
          });
        },

        // customer
        function(cust, callback) {
          var syncOptions = {
            headers : {
              "Accept" : "application/json",
              'Cookie' : sessionId
            },
            url    : config.public.url + '_design/AMI2_CUSTOMER/_view/all',
            method : 'GET'
          };

          request(syncOptions, function(err, res) {
            if (err) {
              console.log('--- ERROR: there is an error');
              return callback(err, null);
            } else if (res.statusCode >= 300) {
              return callback(res, null);
            } else if (res.statusCode <= 299) {
              customerDoc = makeDataSet(res);
              callback(null, 'ok');
            } else {
              return callback(res, null);
            }
          });
        },

        // combine orderDoc and customerDoc
        function(result, callback) {
          for(var i in orderDoc){
            for(var j in customerDoc){
              if(orderDoc[i].customerCode == customerDoc[j].customerCode){
                // console.log(orderDoc[i])
                orderDoc[i].customerName = customerDoc[j].name1;
              }
            }
          }

          callback(null, 'ok combined')
        }
      ],

      function (err, res) {
        if(err) {
          callback(err, null);
        } else {
          callback(null, orderDoc)
        }
      });
    } catch (err) {
      console.log(err)
    }
  }


// Cedrix
loadModel.loadDelivery_Report=function(sessionId, callback){
    try {
      var orderDoc = [];
      var customerDoc = [];
        
      async.waterfall([
        function(callback) {
          var syncOptions = {
            headers: {
              "Accept" : "application/json",
              'Cookie' : sessionId
            },
            url: config.public.url + '_design/BST_ORDER/_view/byRequestDeliveryMethod?key="delivery"&stale=false',
            method: 'GET'
          };

          request(syncOptions, function(err, res) {
            if (err) {
              console.log('--- ERROR: there is an error');
              return callback(err, null);
            } else if (res.statusCode >= 300) {
              return callback(res, null);
            } else if (res.statusCode <= 299) {
              orderDoc = makeDataSet(res);
              callback(null, 'ok');
            } else {
              return callback(res, null);
            }
          });
        },

        // customer
        function(cust, callback) {
          var syncOptions = {
            headers : {
              "Accept" : "application/json",
              'Cookie' : sessionId
            },
            url    : config.public.url + '_design/AMI2_CUSTOMER/_view/all',
            method : 'GET'
          };

          request(syncOptions, function(err, res) {
            if (err) {
              console.log('--- ERROR: there is an error');
              return callback(err, null);
            } else if (res.statusCode >= 300) {
              return callback(res, null);
            } else if (res.statusCode <= 299) {
              customerDoc = makeDataSet(res);
              callback(null, 'ok');
            } else {
              return callback(res, null);
            }
          });
        },

        // combine orderDoc and customerDoc
        function(result, callback) {
          for(var i in orderDoc){
            for(var j in customerDoc){
              if(orderDoc[i].customerCode == customerDoc[j].customerCode){
                // console.log(orderDoc[i])
                orderDoc[i].customerName = customerDoc[j].name1;
              }
            }
          }

          callback(null, 'ok combined')
        }
      ],

      function (err, res) {
        if(err) {
          callback(err, null);
        } else {
          callback(null, orderDoc)
        }
      });
    } catch (err) {
      console.log(err)
    }
  }


// Cedrix
loadModel.loadSelfCollection_Report=function(sessionId, callback){
  try {
    var orderDoc = [];
    var customerDoc = [];

    async.waterfall([
      function(callback) {
        var syncOptions = {
          headers: {
            "Accept" : "application/json",
            'Cookie' : sessionId
          },
          url: config.public.url + '_design/BST_ORDER/_view/byRequestDeliveryMethod?key="selfcollection"&stale=false',
          method: 'GET'
        };

        request(syncOptions, function(err, res) {
          if (err) {
            console.log('--- ERROR: there is an error');
            return callback(err, null);
          } else if (res.statusCode >= 300) {
            return callback(res, null);
          } else if (res.statusCode <= 299) {
            orderDoc = makeDataSet(res);
            callback(null, 'ok');
          } else {
            return callback(res, null);
          }
        });
      },

        // customer
        function(cust, callback) {
          var syncOptions = {
            headers : {
              "Accept" : "application/json",
              'Cookie' : sessionId
            },
            url    : config.public.url + '_design/AMI2_CUSTOMER/_view/all',
            method : 'GET'
          };

          request(syncOptions, function(err, res) {
            if (err) {
              console.log('--- ERROR: there is an error');
              return callback(err, null);
            } else if (res.statusCode >= 300) {
              return callback(res, null);
            } else if (res.statusCode <= 299) {
              customerDoc = makeDataSet(res);
              callback(null, 'ok');
            } else {
              return callback(res, null);
            }
          });
        },

        // combine orderDoc and customerDoc
        function(result, callback) {
          for(var i in orderDoc){
            for(var j in customerDoc){
              if(orderDoc[i].customerCode == customerDoc[j].customerCode){
                // console.log(orderDoc[i])
                orderDoc[i].customerName = customerDoc[j].name1;
              }
            }
          }

          callback(null, 'ok combined')
        }
        ],

        function (err, res) {
          if(err) {
            callback(err, null);
          } else {
            callback(null, orderDoc)
          }
        });
  } catch (err) {
    console.log(err)
  }
}


loadModel.loadOrderMaterialRelation=function(callback){
  try {
    let orderDoc = [],
        materialDoc = [];

    async.waterfall([
      // get orders
      function(callback) {
        var syncOptions = {
          headers : {
            "Accept" : "application/json"
          },
          url    : config.admin.url + '_design/BST_ORDER_BACKORDER/_view/all?stale=false',
          method : 'GET'
        };

        request(syncOptions, function(err, res) {
          if (err) {
            console.log('--- ERROR: there is an error');
            return callback(err, null);
          } else if (res.statusCode >= 300) {
            console.log('--- ERROR: cannot get order documents (statusCode '+ res.statusCode +')');
            return callback(res, null);
          } else if (res.statusCode <= 299) {
            orderDoc = makeDataSet(res);
            callback(null, 'ok');
          } else {
            return callback(res, null);
          }
        });
      },

      // get material
      function(result, callback) {
        var syncOptions = {
          headers : {'Accept' : 'application/json'},
          url    : config.admin.url + '_design/BST_MATERIAL/_view/all',
          method : 'GET'
        };

        request(syncOptions, function(err, res) {
          if (err) {
            console.log('--- ERROR: there is an error');
            return callback(err, null);
          } else if (res.statusCode >= 300) {
            console.log('--- ERROR: cannot get material documents (statusCode '+ res.statusCode +')');
            return callback(res, null);
          } else if (res.statusCode <= 299) {
            materialDoc = makeDataSet(res);
            callback(null, 'ok');
          } else {
            return callback(res, null);
          }
        });
      },

      // combine orderDoc and deaelerDoc
      function(result, callback) {
        // console.log(orderDoc);
        // let channel, order, total,
        //     materialGroupChannel = materialGroup.toLowerCase() + 'Channel'; // key used for sorting [psr/tbr]Channel

        let material;
        for (let i in orderDoc) {
          // channel = customArrayFind(channelsDoc, 'channel', dealerDoc[i][materialGroupChannel]);
          // order = customArrayFilter(orderDoc, 'customerCode', dealerDoc[i].customerCode);
          
          material = materialDoc.find(function(order) {
            return order.materialCode == orderDoc[i].materialCode;
          });

          if (!material) {
            console.log('no material doc' + orderDoc[i]);
          }

            
          orderDoc[i].material_oldMaterialNumber = material.oldMaterialNumber;
          orderDoc[i].material_materialGroup = material.materialGroup;
          orderDoc[i].material_storageLocation = material.storageLocation;
        }

        // sort
        // dealerDoc.sort(function(a, b){
        //   if(a[materialGroupChannel] < b[materialGroupChannel]) return -1;
        //   if(a[materialGroupChannel] > b[materialGroupChannel]) return 1;
        //   return 0;
        // });

        callback(null, 'ok combined')
      }
    ],

    function (err, res) {
      if (err) {
        callback(err, null);
      } else {
        callback(null, orderDoc);
      }
    });
  } catch (err) {
    console.log(err)
  }
}


loadModel.loadAllOrders=function(callback){
  try {
    let orderDoc = [],
        materialDoc = [];

    async.waterfall([
      // get orders
      function(callback) {
        var syncOptions = {
          headers : {
            "Accept" : "application/json"
          },
          url    : config.admin.url + '_design/BST_ORDER_BACKORDER/_view/all?stale=false',
          method : 'GET'
        };

        request(syncOptions, function(err, res) {
          if (err) {
            console.log('--- ERROR: there is an error');
            return callback(err, null);
          } else if (res.statusCode >= 300) {
            console.log('--- ERROR: cannot get order documents (statusCode '+ res.statusCode +')');
            return callback(res, null);
          } else if (res.statusCode <= 299) {
            orderDoc = makeDataSet(res);
            callback(null, 'ok');
          } else {
            return callback(res, null);
          }
        });
      },

      // // get material
      // function(result, callback) {
      //   var syncOptions = {
      //     headers : {'Accept' : 'application/json'},
      //     url    : config.admin.url + '_design/BST_MATERIAL/_view/all',
      //     method : 'GET'
      //   };

      //   request(syncOptions, function(err, res) {
      //     if (err) {
      //       console.log('--- ERROR: there is an error');
      //       return callback(err, null);
      //     } else if (res.statusCode >= 300) {
      //       console.log('--- ERROR: cannot get material documents (statusCode '+ res.statusCode +')');
      //       return callback(res, null);
      //     } else if (res.statusCode <= 299) {
      //       materialDoc = makeDataSet(res);
      //       callback(null, 'ok');
      //     } else {
      //       return callback(res, null);
      //     }
      //   });
      // },

      // // combine orderDoc and deaelerDoc
      // function(result, callback) {
      //   // console.log(orderDoc);
      //   // let channel, order, total,
      //   //     materialGroupChannel = materialGroup.toLowerCase() + 'Channel'; // key used for sorting [psr/tbr]Channel

      //   let material;
      //   for (let i in orderDoc) {
      //     // channel = customArrayFind(channelsDoc, 'channel', dealerDoc[i][materialGroupChannel]);
      //     // order = customArrayFilter(orderDoc, 'customerCode', dealerDoc[i].customerCode);
          
      //     material = materialDoc.find(function(order) {
      //       return order.materialCode == orderDoc[i].materialCode;
      //     });

      //     if (!material) {
      //       console.log('no material doc' + orderDoc[i]);
      //     }

            
      //     orderDoc[i].material_oldMaterialNumber = material.oldMaterialNumber;
      //     orderDoc[i].material_materialGroup = material.materialGroup;
      //     orderDoc[i].material_storageLocation = material.storageLocation;
      //   }

      //   // sort
      //   // dealerDoc.sort(function(a, b){
      //   //   if(a[materialGroupChannel] < b[materialGroupChannel]) return -1;
      //   //   if(a[materialGroupChannel] > b[materialGroupChannel]) return 1;
      //   //   return 0;
      //   // });

      //   callback(null, 'ok combined')
      // }
    ],

    function (err, res) {
      if (err) {
        callback(err, null);
      } else {
        callback(null, orderDoc);
      }
    });
  } catch (err) {
    console.log(err)
  }
}


loadModel.loadMaterialMasterData = (sessionId, callback) => {
  try {
    var materialDoc = [], stockDoc = [], storingReportDoc = [], materialGroupConversionDoc = [];

    async.waterfall([
      // get material
      (callback) => {
        const options = {
          headers : {'Accept': 'application/json', 'Cookie': sessionId},
          url     : config.public.url + '_design/BST_MATERIAL/_view/all',
          method  : 'GET'
        };

        request(options, (err, res) => {
          if (err) {
            console.log(err);
            return callback(err, null);
          } else if (res.statusCode >= 300) {
            return callback(res, null);
          } else {
            materialDoc = mapToResultValue(res);
            callback(null, 'ok');
          }
        });
      },

      // get stock
      (result, callback) => {
        const options = {
          headers : {'Accept': 'application/json', 'Cookie': sessionId},
          url     : config.public.url + '_design/BST_STOCK/_view/all',
          method  : 'GET'
        };

        request(options, (err, res) => {
          if (err) {
            console.log(err);
            return callback(err, null);
          } else if (res.statusCode >= 300) {
            return callback(res, null);
          } else {
            stockDoc = mapToResultValue(res);
            callback(null, 'ok');
          }
        });
      },

      // get group conversion
      (result, callback) => {
        const options = {
          headers : {'Accept': 'application/json', 'Cookie': sessionId},
          url     : config.public.url + '_design/BST_DISCOUNT/_view/byMaterialGroupConversion',
          method  : 'GET'
        };

        request(options, (err, res) => {
          if (err) {
            console.log(err);
            return callback(err, null);
          } else if (res.statusCode >= 300) {
            return callback(res, null);
          } else {
            materialGroupConversionDoc = mapToResultValue(res);
            callback(null, 'ok');
          }
        });
      },

      // combination
      (result, callback) => {
        for (let i in materialDoc) materialDoc[i].individualStock = stockDoc.find((item) => item.materialCode == materialDoc[i].materialCode);
        materialDoc.sort((a, b) => parseInt(b.individualStock.totalStock) - parseInt(a.individualStock.totalStock));

        let stocks, materials, groupConversion, foundNotes = {}, foundStocks = {};
        for (let i in materialDoc) {
          // stocks
          stocks = [];
          if (foundStocks[`${materialDoc[i].size} ${materialDoc[i].oldMaterialNumber}`]) { // stock already recorder
            materials = foundStocks[`${materialDoc[i].size} ${materialDoc[i].oldMaterialNumber}`];
          } else { // record stock
            materials = materialDoc.filter((item) => materialDoc[i].size == item.size && materialDoc[i].oldMaterialNumber == item.oldMaterialNumber);
            foundStocks[`${materialDoc[i].size} ${materialDoc[i].oldMaterialNumber}`] = materials;
          }

          for (let j in materials) stocks.push(materials[j].individualStock);
          materialDoc[i].stocks = stocks;

          // matgroup
          // groupConversion = materialGroupConversionDoc.find((item) => item.materialGroup == materialDoc[i].materialGroup);
          // materialDoc[i].materialGroup = (groupConversion) ? groupConversion.materialGroup : 'Others';
        }

        callback(null, 'ok');
      }
    ],

    (err, res) => {
      if (err) return callback(err, null);
      else callback(null, materialDoc);
    });
  } catch (err) {
    return callback(err, null);
  }
}




// { n1ql
  // roles2
  // permission new
  loadModel.getRoles = function(sessionId, callback) {
    let query = `
    SELECT META(${config.db.bucket}).id AS id, \`role\`, access, amiModules, wosModules
    FROM ${config.db.bucket} 
    WHERE docType="ROLE"`;

    const options = {
      headers : {'Accept': 'application/json', 'Cookie': sessionId},
      url     : config.public.n1ql_url,
      method  : 'POST',
      body    : {statement: query}
    };

    request(options, function(err, res) {
      if(err) return callback(err, null);
      else if(res.statusCode >= 300) return callback(res, null);
      else callback(null, res.body.results);
    });
  }


  // Cedrix
  loadModel.loadLog_ByDate=function(date, sessionId, callback){

    let startDate = date;
    let endDate = moment(date).add(1, 'days').format("YYYY-MM-DD");

    let query = `
    SELECT a.firstName || " " || a.lastName AS userName, a.customerCode, logs.action, logs.app, logs.dateCreated, logs.module, b.userId
    FROM ${config.db.bucket} b JOIN ${config.db.bucket} a ON KEYS b.userId
    UNNEST b.logs
    WHERE b.docType='LOG' AND a.docType='USER'
    AND logs.dateCreated BETWEEN '${startDate}' AND '${endDate}'`;

    const options = {
      headers : {'Accept': 'application/json', 'Cookie': sessionId},
      url     : config.public.n1ql_url,
      method  : 'POST',
      body    : {statement: query}
    };

    request(options, function(err, res) {
      if(err) return callback(err, null);
      else if(res.statusCode >= 300) return callback(res, null);
      else callback(null, res.body.results);
    });
  }


  // Cedrix
  // customer
  loadModel.loadCustomerSalesValue_ByDate= ({ startDate, endDate, materialGroups, orderTypes, salesperson }, sessionId, callback) => {
    try {
      let orderDoc = [], customerDoc = [];

      async.waterfall([
        // get order
        (callback) => {
          let salespersons = salesperson.map(item => `'${item}'`);
          let matGroups = materialGroups.map(item => `'${item}'`);
          let ordertypes = orderTypes.map(item => `'${item}'`);

          let query = `
          SELECT amount, customerCode
          FROM ${config.db.bucket}
          WHERE docType = 'ORDER'
          AND salesperson[0] IN [${salespersons.toString()}]
          AND materialGroup IN [${matGroups.toString()}]
          AND orderType IN [${ordertypes.toString()}] 
          AND dateCreated BETWEEN '${startDate}' AND '${endDate}'`;

          // console.log(query)

          const options = {
            headers : {'Accept': 'application/json', 'Cookie': sessionId},
            url     : config.public.n1ql_url,
            method  : 'POST',
            body    : {statement: query}
          };

          request(options, (err, res) => {
            if (err) return callback(err, null);
            else if (res.statusCode >= 300) return callback(res, null);
            else {
              orderDoc = res.body.results;
              callback(null, 'ok');
            }
          });
        },

        // get customer
        (result, callback) => {
          let query = `
          SELECT name1, customerCode
          FROM ${config.db.bucket}
          WHERE docType = 'CUSTOMER'`;

          const options = {
            headers : {'Accept': 'application/json', 'Cookie': sessionId},
            url     : config.public.n1ql_url,
            method  : 'POST',
            body    : {statement: query}
          };

          request(options, (err, res) => {
            if (err) return callback(err, null);
            else if (res.statusCode >= 300) return callback(res, null);
            else {
              customerDoc = res.body.results;
              callback(null, 'ok');
            }
          });
        },

        // combine
        (result, callback) => {
          for(var i in orderDoc){          
            let customer = customerDoc.find(item => orderDoc[i].customerCode == item.customerCode);
            orderDoc[i].customerName = customer.name1;
          }

          callback(null, 'ok combined')
        },

        // remove duplicate, get total
        (result, callback) => {
          let data = removeDuplicate(orderDoc, 'customerCode');

          let totalBill, customerOrder;
          for (let i in data) { 
            customerOrder = orderDoc.filter(item => data[i].customerCode == item.customerCode);
            data[i].amount = customerOrder.reduce((total, item) => total + parseFloat(item.amount), 0);
          }

          callback(null, data);
        }
      ],

      (err, res) => {
        if(err) {
          callback(err, null);
        } else {
          callback(null, res)
        }
      });
    } catch (err) {
      console.log(err)
      callback(err, null);
    }
  }


  // Cedrix
  loadModel.mtpGroupSalesmanReport= ({ salespersonRoleId, orderStatus, startDate, endDate }, sessionId, callback) => {
    try {
      let userDoc = [], orderDoc = [];

      async.waterfall([
        // get salesperson
        (callback) => {
          let query = `
          SELECT firstName || " " || lastName AS fullName, customerCode 
          FROM ${config.db.bucket} 
          WHERE roleId = '${salespersonRoleId}' AND docType = 'USER'`;

          const options = {
            headers : {'Accept': 'application/json', 'Cookie': sessionId},
            url     : config.public.n1ql_url,
            method  : 'POST',
            body    : {statement: query}
          };

          request(options, (err, res) => {
            if (err) return callback(err, null);
            else if (res.statusCode >= 300) return callback(res, null);
            else {
              userDoc = res.body.results;
              callback(null, 'ok');
            }
          });
        },

        // get order
        (result, callback) => {
          let query = `
          SELECT salesperson, orderItemStatus, SUBSTR(materialCode,0, 3) AS materialCode, dateCreated, amount, quantity, customerCode
          FROM ${config.db.bucket} 
          WHERE orderItemStatus = '${orderStatus}'
          AND dateCreated BETWEEN '${startDate}' AND '${endDate}' 
          AND docType = 'ORDER'`;

          const options = {
            headers : {'Accept': 'application/json', 'Cookie': sessionId},
            url     : config.public.n1ql_url,
            method  : 'POST',
            body    : {statement: query}
          };

          request(options, (err, res) => {
            if (err) return callback(err, null);
            else if (res.statusCode >= 300) return callback(res, null);
            else {
              orderDoc = res.body.results;
              callback(null, 'ok');
            }
          });
        },

        // combine
        (result, callback) => {
          let orders, psrOrder, tbrOrder, othersOrder;
          let salespersonDoc = []

          for (let i in userDoc) {
            orders = orderDoc.filter(item => item.salesperson[0] == userDoc[i].customerCode); // get saleseperson order
            psrOrder = orders.filter(item => item.materialCode == 'PSR'); // get PSR on order
            tbrOrder = orders.filter(item => item.materialCode == 'TBR'); // get TBR on order
            othersOrder = orders.filter(item => item.materialCode != 'PSR' && item.materialCode != 'TBR'); // get Others on order

            userDoc[i].psrTotal = psrOrder.reduce((total, item) => !isNaN(item.quantity) ? parseInt(total) + parseInt(item.quantity ): parseInt(total), 0);
            userDoc[i].tbrTotal = tbrOrder.reduce((total, item) => !isNaN(item.quantity) ? parseInt(total) + parseInt(item.quantity ): parseInt(total), 0);
            userDoc[i].othersTotal = othersOrder.reduce((total, item) => !isNaN(item.quantity) ? parseInt(total) + parseInt(item.quantity ): parseInt(total), 0);

            salespersonDoc.push({
              'customerCode'    : userDoc[i].customerCode,
              'salespersonName' : userDoc[i].fullName,
              'PSR'             : userDoc[i].psrTotal,
              'TBR'             : userDoc[i].tbrTotal,
              'Others'          : userDoc[i].othersTotal
            });
          }

          callback(null, salespersonDoc)
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


// } 

loadModel.loadMaterialNote = (sessionId, callback) => {
  try {
    var materialDoc = [], noteDoc = {}, stockDoc = [], storingReportDoc = [], materialGroupConversionDoc = [];

    async.waterfall([
      // get material
      (callback) => {
        const options = {
          headers : {'Accept': 'application/json', 'Cookie': sessionId},
          url     : config.public.url + '_design/BST_MATERIAL/_view/all',
          method  : 'GET'
        };

        request(options, (err, res) => {
          if (err) {
            console.log(err);
            return callback(err, null);
          } else if (res.statusCode >= 300) {
            return callback(res, null);
          } else {
            materialDoc = mapToResultValue(res);
            callback(null, 'ok');
          }
        });
      },

      // get notes
      (result, callback) => {
        const query = `
        SELECT RAW note
        FROM ${config.db.bucket}
        USE KEYS 'MATERIAL::NOTE'`;

        const options = {
          headers : {'Accept': 'application/json', 'Cookie': sessionId},
          url     : config.public.n1ql_url,
          method  : 'POST',
          body    : {statement: query}
        };

        request(options, (err, res) => {
          if (err) return callback(err, null);
          else if (res.statusCode >= 300) return callback(res, null);
          else {
            noteDoc = res.body.results[0];
            callback(null, 'ok');
          }
        });
      },

      // get stock
      (result, callback) => {
        const options = {
          headers : {'Accept': 'application/json', 'Cookie': sessionId},
          url     : config.public.url + '_design/BST_STOCK/_view/all',
          method  : 'GET'
        };

        request(options, (err, res) => {
          if (err) {
            console.log(err);
            return callback(err, null);
          } else if (res.statusCode >= 300) {
            return callback(res, null);
          } else {
            stockDoc = mapToResultValue(res);
            callback(null, 'ok');
          }
        });
      },

      // get group conversion
      (result, callback) => {
        const options = {
          headers : {'Accept': 'application/json', 'Cookie': sessionId},
          url     : config.public.url + '_design/BST_DISCOUNT/_view/byMaterialGroupConversion',
          method  : 'GET'
        };

        request(options, (err, res) => {
          if (err) {
            console.log(err);
            return callback(err, null);
          } else if (res.statusCode >= 300) {
            return callback(res, null);
          } else {
            materialGroupConversionDoc = mapToResultValue(res);
            callback(null, 'ok');
          }
        });
      },

      // combination
      (result, callback) => {
        // material-stock relation 1-1
        for (let i in materialDoc) materialDoc[i].individualStock = stockDoc.find((item) => item.materialCode == materialDoc[i].materialCode);
        materialDoc.sort((a, b) => parseInt(b.individualStock.totalStock) - parseInt(a.individualStock.totalStock));

        let foundStocks = {};
        for (let i in materialDoc) {
          let sizePattern = `${materialDoc[i].size} ${materialDoc[i].oldMaterialNumber}`;

          // stocks
          let materials;
          if (foundStocks[sizePattern]) { // stock already recorder
            materials = foundStocks[sizePattern];
          } else { // stock not on record, record stock
            materials = materialDoc.filter(item => materialDoc[i].size == item.size && materialDoc[i].oldMaterialNumber == item.oldMaterialNumber);
            foundStocks[sizePattern] = materials;
          }

          let stocks = [];
          for (let j in materials) stocks.push(materials[j].individualStock);
          materialDoc[i].stocks = stocks;

          // block
          if (noteDoc[sizePattern]) materialDoc[i].note = noteDoc[sizePattern];
            
          // matgroup
          let groupConversion = materialGroupConversionDoc.find((item) => item.materialGroup == materialDoc[i].materialGroup);
          materialDoc[i].materialGroup = (groupConversion) ? groupConversion.materialGroup : 'Others';
        }

        callback(null, 'ok');
      }
    ],

    (err, res) => {
      if (err) return callback(err, null);
      else callback(null, materialDoc);
    });
  } catch (err) {
    return callback(err, null);
  }
}

loadModel.loadMaterialBlock = (sessionId, callback) => {
  try {
    var materialDoc = [], materialBlock = {}, stockDoc = [], storingReportDoc = [], materialGroupConversionDoc = [];

    async.waterfall([
      // get material
      (callback) => {
        const options = {
          headers : {'Accept': 'application/json', 'Cookie': sessionId},
          url     : config.public.url + '_design/BST_MATERIAL/_view/all',
          method  : 'GET'
        };

        request(options, (err, res) => {
          if (err) {
            console.log(err);
            return callback(err, null);
          } else if (res.statusCode >= 300) {
            return callback(res, null);
          } else {
            materialDoc = mapToResultValue(res);
            callback(null, 'ok');
          }
        });
      },

      // get block normal
      (result, callback) => {
        const query = `
        SELECT RAW block
        FROM ${config.db.bucket}
        USE KEYS 'BLOCK::NORMAL'`;

        const options = {
          headers : {'Accept': 'application/json', 'Cookie': sessionId},
          url     : config.public.n1ql_url,
          method  : 'POST',
          body    : {statement: query}
        };

        request(options, (err, res) => {
          if (err) return callback(err, null);
          else if (res.statusCode >= 300) return callback(res, null);
          else {
            let block = res.body.results[0];
            for (let i in block) { // loop on block material
              if (typeof block[i] == 'object') { // if not blocked to all
                let customer = [];
                for (let j in block[i]) customer.push({ customerCode : j, name1 : block[i][j] });
                block[i] = customer;
              }

              materialBlock[i] = { blockType: 'normal', customer: block[i] };
            }

            callback(null, 'ok');
          }
        });
      },

      // get block date
      (result, callback) => {
        const query = `
        SELECT RAW blockDate
        FROM ${config.db.bucket}
        USE KEYS 'BLOCK::DATE'`;

        const options = {
          headers : {'Accept': 'application/json', 'Cookie': sessionId},
          url     : config.public.n1ql_url,
          method  : 'POST',
          body    : {statement: query}
        };

        request(options, (err, res) => {
          if (err) return callback(err, null);
          else if (res.statusCode >= 300) return callback(res, null);
          else {
            let blockdate = res.body.results[0];

            for (let i in blockdate) { // loop on date keys
              for (let j in blockdate[i].block) { // loop on block materials
                if (typeof blockdate[i].block[j] == 'object') { // if not blocked to all
                  let customer = [];
                  for (let k in blockdate[i].block[j]) customer.push({ customerCode : k, name1 : blockdate[i].block[j][k] });
                  blockdate[i].block[j] = customer;
                }

                materialBlock[j] = {
                  blockType: 'date',
                  startDate: blockdate[i].startDate,
                  endDate: blockdate[i].endDate,
                  customer: blockdate[i].block[j]
                };
              }
            }

            callback(null, 'ok');
          }
        });
      },

      // get stock
      (result, callback) => {
        const options = {
          headers : {'Accept': 'application/json', 'Cookie': sessionId},
          url     : config.public.url + '_design/BST_STOCK/_view/all',
          method  : 'GET'
        };

        request(options, (err, res) => {
          if (err) {
            console.log(err);
            return callback(err, null);
          } else if (res.statusCode >= 300) {
            return callback(res, null);
          } else {
            stockDoc = mapToResultValue(res);
            callback(null, 'ok');
          }
        });
      },

      // get group conversion
      (result, callback) => {
        const options = {
          headers : {'Accept': 'application/json', 'Cookie': sessionId},
          url     : config.public.url + '_design/BST_DISCOUNT/_view/byMaterialGroupConversion',
          method  : 'GET'
        };

        request(options, (err, res) => {
          if (err) {
            console.log(err);
            return callback(err, null);
          } else if (res.statusCode >= 300) {
            return callback(res, null);
          } else {
            materialGroupConversionDoc = mapToResultValue(res);
            callback(null, 'ok');
          }
        });
      },

      // combination
      (result, callback) => {
        // material-stock relation 1-1
        for (let i in materialDoc) materialDoc[i].individualStock = stockDoc.find((item) => item.materialCode == materialDoc[i].materialCode);
        materialDoc.sort((a, b) => parseInt(b.individualStock.totalStock) - parseInt(a.individualStock.totalStock));

        let foundStocks = {};
        for (let i in materialDoc) {
          let sizePattern = `${materialDoc[i].size} ${materialDoc[i].oldMaterialNumber}`;

          // stocks
          let materials;
          if (foundStocks[sizePattern]) { // stock already recorder
            materials = foundStocks[sizePattern];
          } else { // stock not on record, record stock
            materials = materialDoc.filter((item) => materialDoc[i].size == item.size && materialDoc[i].oldMaterialNumber == item.oldMaterialNumber);
            foundStocks[sizePattern] = materials;
          }

          let stocks = [];
          for (let j in materials) stocks.push(materials[j].individualStock);
          materialDoc[i].stocks = stocks;

          // block
          if (materialBlock[sizePattern]) {
            materialDoc[i].isBlock = true;
            materialDoc[i].blockType = materialBlock[sizePattern].blockType;
            materialDoc[i].customer = materialBlock[sizePattern].customer;
            if (materialDoc[i].blockType == 'date') {
              materialDoc[i].blockStartDate = materialBlock[sizePattern].startDate;
              materialDoc[i].blockEndDate = materialBlock[sizePattern].endDate;
            }
          }

          // matgroup
          // let groupConversion = materialGroupConversionDoc.find((item) => item.materialGroup == materialDoc[i].materialGroup);
          // materialDoc[i].materialGroup = (groupConversion) ? groupConversion.materialGroup : 'Others';
        }

        callback(null, 'ok');
      }
    ],

     (err, res) => {
      if (err) return callback(err, null);
      else callback(null, materialDoc);
    });
  } catch (err) {
    return callback(err, null);
  }
}


module.exports.loadModel = loadModel;