var express = require('express'),
		bodyParser = require("body-parser"),
		router = express.Router()
		credentialModel = require("../models/credential").credentialModel; // use model



router.post("/loginUser", function(req, res) {
  credentialModel.loginUser(req.body, function(error, result) {
    if (error) {
      return res.send(error);
    } else {
      res.send(result);
    }
  });
});



router.post("/createUser", function(req, res) {
  credentialModel.createUser(req.body, function(error, result) {
    if(error) {
      return res.send(error);
    } else {
      res.send(result);
    }
  });
});



router.post("/updatePassword", function(req, res) {
  credentialModel.updatePassword(req.body, function(error,result){
    if(error) {
      return res.send(error);
    } else {
      res.send(result);
    }
  });
});


/*
invitation.js
*/
router.post("/createCustomerUserAccount", function(req, res) {
  credentialModel.createCustomerUserAccount(req.body, function(error, result) {
    if(error) {
      return res.send(error);
    } else {
      res.send(result);
    }
  });
});


/*
invitation.js
*/
router.post("/createSalespersonUserAccount", function(req, res) {
  credentialModel.createSalespersonUserAccount(req.body, function(error, result) {
    if(error) {
      return res.send(error);
    } else {
      res.send(result);
    }
  });
});


/*
user.js
*/
router.post("/updateSalesperson_CustomerMap/:referenceId", function(req, res) {
  credentialModel.updateSalesperson_CustomerMap(req.body, req.params.referenceId, function(error, result) {
    if(error) {
      return res.send(error);
    } else {
      res.send(result);
    }
  });
});






















router.post("/updateUser/:id/:rev", function(req, res) {
  var id = req.params.id;
  var rev = req.params.rev;

  credentialModel.updateUser(id, rev, req.body, function(error, result) {

    if(error) {
      return res.send(error);
    } else {
      res.send (result);
    }

  });

});






router.delete("/logout",function(req,res){
  var sessionId = req.body;
  credentialModel.logoutUser(sessionId,function(error,result){
    if(error){

        return res.send(error);
    }
    else{

         res.send("successful logout");
    }
  });
});


/* AMI 2 */










module.exports = router;