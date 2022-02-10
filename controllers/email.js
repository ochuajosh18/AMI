var express = require('express'), 
    bodyParser = require("body-parser"), 
    router = express.Router(), 
    request = require('request'), 
    request = require('request').defaults({json: true}),
    httpProxy = require('http-proxy'),
    fs = require('fs'),
    path = require('path'),
    formidable = require('formidable'),
    emailModel = require("../models/email").emailModel



router.post("/sendCustomerInvite", function(req,res){
	emailModel.sendCustomerInvite(req.body, function(error, result){
  	if(error) {
      return res.send(error);
    } else {
      res.send (result);
    }
	});
});


router.post("/sendSalespersonInvite", function(req,res){
  emailModel.sendSalespersonInvite(req.body, function(error, result){
    if(error) {
      return res.send(error);
    } else {
      res.send (result);
    }
  });
});



router.post("/sendEmail", function(req,res){
  emailModel.sendEmail(req.body, function(error, result){
    if(error) {
      return res.send(error);
    } else {
      res.send (result);
    }
  });
});

router.post("/sendTemplateContent/:sessionId",function(req,res){
  console.log("hey")
  var sessionId = req.params.sessionId
  emailModel.sendTemplateContent(req.body,sessionId, function(error, result){
    if(error) {
      return res.send(error);
    } else {
      res.send (result);
    }
  });
})


router.post("/sendOrder", function(req,res){
  emailModel.sendOrder(req.body, function(error, result){
    if(error) {
      return res.send(error);
    } else {
      res.send (result);
    }
  });
});



router.post("/sendBackOrder", function(req,res){
  emailModel.sendBackOrder(req.body, function(error, result){
    if(error) {
      return res.send(error);
    } else {
      res.send (result);
    }
  });
});



router.post("/sendRejectOrder", function(req,res){
  emailModel.sendRejectOrder(req.body, function(error, result){
    if(error) {
      return res.send(error);
    } else {
      res.send (result);
    }
  });
});



router.post("/sendRejectBackOrder", function(req,res){
  emailModel.sendRejectBackOrder(req.body, function(error, result){
    if(error) {
      return res.send(error);
    } else {
      res.send (result);
    }
  });
});



router.post("/emailOrders", function(req,res){
  emailModel.emailOrders(req.body, function(error, result){
    if(error) {
      return res.send(error);
    } else {
      res.send (result);
    }
  });
});


router.post("/emailRejectedOrders", function(req,res){
  emailModel.emailRejectedOrders(req.body, function(error, result){
    if(error) {
      return res.send(error);
    } else {
      res.send (result);
    }
  });
});



module.exports = router