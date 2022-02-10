var express = require('express'),
		bodyParser = require("body-parser"),
		router = express.Router()
		createModel = require("../models/create").createModel;



router.post("/createDocument/:idPrefix", function(req, res) {
  createModel.createDocument(req.params.idPrefix, req.body, function(error, result) {
    if(error) {
      return res.send(error);
    } else {
      res.send (result);
    }
  });
});


router.post("/createDocument2/:id", function(req, res) {
  createModel.createDocument2(req.params.id, req.body, function(error, result) {
    if(error) {
      return res.send(error);
    } else {
      res.send (result);
    }
  });
});



router.post("/SAP/order", function(req, res) {
  createModel.createOrderOnSAP(req.body, function(error, result) {
    if(error) {
      return res.send(error);
    } else {
      res.send (result);
    }
  });
});



router.post("/SAP/releaseSalesOrderOnSAP/:salesOrderNo", function(req, res) {
  createModel.releaseSalesOrderOnSAP(req.params.salesOrderNo, function(error, result) {
    if(error) {
      return res.send(error);
    } else {
      res.send (result);
    }
  });
});










router.post("/createOrder", function(req, res) {

  createModel.createOrder(req.body, function(error, result) {

    if(error) {
      return res.send(error);
    } else {
      res.send (result);
    }

  });

});


router.post("/role/:idPrefix", function(req, res) {
  createModel.createRole(req.params.idPrefix, req.body, function(error, result) {

    if(error) {
      return res.send(error);
    } else {
      res.send (result);
    }

  });

});





/* AMI 2 */







module.exports = router;