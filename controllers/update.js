var express = require('express'),
		bodyParser = require("body-parser"),
		router = express.Router()
		updateModel = require("../models/update").updateModel; // use model



router.put("/updateDocument/:docId",function(req, res) {
  updateModel.updateDocument(req.params.docId, req.body, function(error, result) {
    if(error) {
      return res.send(error);
    } else {
      res.send (result);
    }
  });
});



// Cedrix
router.put("/updateDocumentArray/:docId",function(req, res) {
  updateModel.updateDocumentArray(req.params.docId, req.body, function(error, result) {
    if(error) {
      return res.send(error);
    } else {
      res.send (result);
    }
  });
});



router.put("/permission/:docId",function(req, res) {
  updateModel.updatePermission(req.params.docId, req.body, function(error, result) {
    if(error) {
      return res.send(error);
    } else {
      res.send (result);
    }
  });
});





















router.post("/document/:id/:rev", function(req, res) {
	var id = req.params.id,
      rev = req.params.rev;

  updateModel.updateDocument(id, rev, req.body, function(error, result) {

    if(error) {
      return res.send(error);
    } else {
      res.send (result);
    }

  });

});



router.post("/role/:id/:rev", function(req, res) {
  var id = req.params.id,
      rev = req.params.rev;

  updateModel.updateRole(id, rev, req.body, function(error, result) {

    if(error) {
      return res.send(error);
    } else {
      res.send (result);
    }

  });

});





router.put("/reduce/:docId/:deductQuantity",function(req, res) {
  var docId = req.params.docId,
      deductQuantity = req.params.deductQuantity;

  updateModel.updateReduceNumber(docId, deductQuantity, function(error, result) {

    if(error) {
      return res.send(error);
    } else {
      res.send (result);
    }

  });

});



router.put("/increase/:docId/:increaseQuantity",function(req, res) {
  var docId = req.params.docId,
      increaseQuantity = req.params.increaseQuantity;

  updateModel.updateIncreaseNumber(docId, increaseQuantity, function(error, result) {

    if(error) {
      return res.send(error);
    } else {
      res.send (result);
    }

  });

});




router.put("/cancelOrder",function(req, res) {
  var info = req.body;
  updateModel.cancelOrder(info, function(error, result) {

    if(error) {
      return res.send(error);
    } else {
      res.send (result);
    }

  });
});

router.put("/manageMaterialNote/:action", (req, res) => {
  updateModel.manageMaterialNote(req.body, req.params.action, (error, result) => {
    (error) ? res.send(error) : res.send(result);
  });
});

// materialblock
router.put("/manageMaterialBlock/:action", (req, res) => {
  updateModel.manageMaterialBlock(req.body, req.params.action, (error, result) => {
    (error) ? res.send(error) : res.send(result);
  });
});

module.exports = router;