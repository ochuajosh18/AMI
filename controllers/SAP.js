var express = require('express'),
		bodyParser = require("body-parser"),
		router = express.Router()
		SAPModel = require("../models/SAP").SAPModel;

// normalsales
router.post("/createOrder", function(req, res) {
  SAPModel.createOrder(req.body, function(error, result) {
    if(error) {
      return res.send(error);
    } else {
      res.send (result);
    }
  });
});



router.post("/releaseSalesOrder/:salesOrderNo", function(req, res) {
  SAPModel.releaseSalesOrder(req.params.salesOrderNo, function(error, result) {
    if(error) {
      return res.send(error);
    } else {
      res.send (result);
    }
  });
});



router.post("/stockStatus/:materialCode/:storageLocation", function(req, res) {
  SAPModel.stockStatus(req.params.materialCode, req.params.storageLocation, function(error, result) {
    if(error) {
      return res.send(error);
    } else {
      res.send (result);
    }
  });
});



router.post("/creditLimit/:customerCode", function(req, res) {
  SAPModel.creditLimit(req.params.customerCode, function(error, result) {
    if(error) {
      return res.send(error);
    } else {
      res.send (result);
    }
  });
});



router.post("/overduePayment/:customerCode", function(req, res) {
  SAPModel.overduePayment(req.params.customerCode, function(error, result) {
    if(error) {
      return res.send(error);
    } else {
      res.send (result);
    }
  });
});


module.exports = router;