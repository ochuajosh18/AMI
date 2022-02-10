var express = require('express'),
		bodyParser = require("body-parser"),
		router = express.Router()
		deleteModel = require("../models/delete").deleteModel; // use model



router.delete("/deleteChannel/:id", function(req, res) {
  deleteModel.deleteChannel(req.params.id, function(error, result) {
    if(error) {
      return res.send(error);
    } else {
      res.send (result);
    }
  });
});



router.delete("/document/:id", function(req, res) {
  deleteModel.deleteDocument(req.params.id, function(error, result) {
    if(error) {
      return res.send(error);
    } else {
      res.send (result);
    }
  });
});





module.exports = router;