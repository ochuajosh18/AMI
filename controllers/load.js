const express = require('express');
const router = express.Router();
const loadModel = require('../models/load').loadModel;

router.get("/document/:viewType/:viewName/:sessionId", (req, res) => {
  const { viewType, viewName, sessionId } = req.params;
  loadModel.loadAll(viewType, viewName, sessionId, (error, result) => {
    (error) ? res.send(error) : res.send(result);
  });
});

router.get("/document/:viewType/:viewName/:key/:sessionId", (req, res) => {
  const { viewType, viewName, key, sessionId } = req.params;
  loadModel.loadDocsByKeyModel(viewType, viewName, key, sessionId, (error, result) => {
    (error) ? res.send(error) : res.send(result);
  });
});

router.get("/document/:viewType/:viewName/:key1/:key2/:sessionId", (req, res) => {
  const { viewType, viewName, key1, key2, sessionId } = req.params;
  loadModel.loadDocsBy2KeyModel(viewType, viewName, key1, key2, sessionId, (error, result) => {
    (error) ? res.send(error) : res.send(result);
  });
});

router.get("/document/:id", (req, res) => {
  const { id } = req.params;
  loadModel.loadDocsByIdModel(id, (error, result) => {
    (error) ? res.send(error) : res.send(result);
  });
});

router.get("/itemCode/:orderType", (req, res) => {
  var { orderType } = req.params;
  loadModel.loadItemCode(orderType, (error, result) => {
    (error) ? res.send(error) : res.send(result);
  });
});

router.get("/combine/customer_user/:viewType/:viewName/:sessionId", (req, res) => {
  const { viewType, viewName, sessionId } = req.params;

  loadModel.newloadDocs_Customer_User(viewType, viewName, sessionId, (error, result) => {
    (error) ? res.send(error) : res.send(result);
  });
});

/* AMI 2 */

router.get("/orderDocument/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  loadModel.loadOrder(sessionId, (error, result) => {
    (error) ? res.send(error) : res.send(result);
  });
});

router.get("/loadNormalOrder/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  loadModel.loadNormalOrder(sessionId, (error, result) => {
    (error) ? res.send(error) : res.send(result);
  });
});

router.get("/loadNormalOrder2/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  loadModel.loadNormalOrder2(sessionId, (error, result) => {
    (error) ? res.send(error) : res.send(result);
  });
});

router.get("/loadSpecialOrder/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  loadModel.loadSpecialOrder(sessionId, (error, result) => {
    (error) ? res.send(error) : res.send(result);
  });
});

router.get("/loadCreditExceedOverdueOrder/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  loadModel.loadCreditExceedOverdueOrder(sessionId, (error, result) => {
    (error) ? res.send(error) : res.send(result);
  });
});

router.get("/orderDocument2/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  loadModel.loadOrder2(sessionId, (error, result) => {
    (error) ? res.send(error) : res.send(result);
  });
});

router.get("/orderDocument3/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  loadModel.loadOrder3(sessionId, (error, result) => {
    (error) ? res.send(error) : res.send(result);
  });
});

router.get("/backorderDocument/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  loadModel.loadBackorder(sessionId, (error, result) => {
    (error) ? res.send(error) : res.send(result);
  });
});

router.get("/backorderDocument2/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  loadModel.loadBackorder2(sessionId, (error, result) => {
    (error) ? res.send(error) : res.send(result);
  });
});

router.get("/materialDocument/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  loadModel.loadMaterial(sessionId, (error, result) => {
    (error) ? res.send(error) : res.send(result);
  });
});

router.get("/loadCustomerUser_WithoutAccount/:partnerType/:role/:sessionId", (req, res) => {
  const { partnerType, role, sessionId } = req.params;
  loadModel.loadCustomerUser_WithoutAccount(partnerType, role, sessionId, (error, result) => {
    (error) ? res.send(error) : res.send(result);
  });
});

router.get("/loadUser_NotCustomer_NotSaleperson/:role1/:role2/:sessionId", (req, res) => {
  const { role1, role2, sessionId } = req.params;
  loadModel.loadUser_NotCustomer_NotSaleperson(role1, role2, sessionId, (error, result) => {
    (error) ? res.send(error) : res.send(result);
  });
});

// customer
router.get("/loadUser_ByRole/:role/:roleDesc/:sessionId", (req, res) => {
  const { role, roleDesc, sessionId } = req.params;
  loadModel.loadUser_ByRole(role, roleDesc, sessionId, (error, result) => {
    (error) ? res.send(error) : res.send(result);
  });
});

/*
kael loadOrder_BySalesperson
*/
router.get("/loadOrder_BySalesPerson/:roleId/:orderItemStatus/:startDate/:endDate/:sessionId", (req, res) => {
  const { roleId, orderItemStatus, startDate, endDate, sessionId} = req.params;
  loadModel.loadOrder_BySalesPerson(roleId, orderItemStatus, startDate, endDate, sessionId, (error, result) => {
    (error) ? res.send(error) : res.send(result);
  });
});

router.get("/loadCustomer_ByPartnerType/:viewType/:viewName/:partnerType/:sessionId", (req, res) => {
  const { viewType, viewName, partnerType, sessionId } = req.params;
  loadModel.loadCustomer_ByPartnerType(viewType, viewName, partnerType, sessionId, (error, result) => {
    (error) ? res.send(error) : res.send(result);
  });
});

router.get("/loadCustomer_ByCustomerCode_ByPartnerType/:customerCode/:partnerType/:sessionId",function(req,res){
  const { customerCode, partnerType, sessionId } = req.params;
  loadModel.loadCustomer_ByCustomerCode_ByPartnerType(customerCode, partnerType, sessionId, function(error,result){
    (error) ? res.send(error) : res.send(result);
  });
});

// Cedrix
router.get("/loadPendingOrder_ExceedCreditLimit/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  loadModel.loadPendingOrder_ExceedCreditLimit(sessionId, (error, result) => {
    (error) ? res.send(error) : res.send(result);
  });
});

// Cedrix
router.get("/loadPendingOrder_ExceedOverduePayment/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  loadModel.loadPendingOrder_ExceedOverduePayment(sessionId, (error, result) => {
    (error) ? res.send(error) : res.send(result);
  });
});

// Cedrix
router.get("/loadDelivery_Report/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  loadModel.loadDelivery_Report(sessionId, (error, result) => {
    (error) ? res.send(error) : res.send(result);
  });
});

// Cedrix
router.get("/loadSelfCollection_Report/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  loadModel.loadSelfCollection_Report(sessionId, (error, result) => {
    (error) ? res.send(error) : res.send(result);
  });
});

router.get("/advanceUtility/loadOrderMaterialRelation", (req, res) => {
  loadModel.loadOrderMaterialRelation((error, result) => {
    (error) ? res.send(error) : res.send(result);
  });
});

router.get("/advanceUtility/loadAllOrders", (req, res) => {
  loadModel.loadAllOrders((error, result) => {
    (error) ? res.send(error) : res.send(result);
  });
});

router.get("/loadMaterialMasterData/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  loadModel.loadMaterialMasterData(sessionId, (error, result) => {
    (error) ? res.send(error) : res.send(result);
  });
});

router.get('/loadMaterialNote/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  loadModel.loadMaterialNote(sessionId, (error, result) => {
    (error) ? res.send(error) : res.send(result);
  });
});

router.get('/loadMaterialBlock/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  loadModel.loadMaterialBlock(sessionId, (error, result) => {
    (error) ? res.send(error) : res.send(result);
  });
});


// ~~ N1QL MARK
router.get('/getRoles/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  loadModel.getRoles(sessionId, (error, result) => {
    (error) ? res.send(error) : res.send(result);
  });
});

// Cedrix
router.get("/loadLog_ByDate/:date/:sessionId", (req, res) => {
  const { date, sessionId } = req.params;
  loadModel.loadLog_ByDate(date, sessionId, (error, result) => {
    (error) ? res.send(error) : res.send(result);
  });
});

// Cedrix
// customer
router.post("/loadCustomerSalesValue_ByDate/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  loadModel.loadCustomerSalesValue_ByDate(req.body, sessionId, (error, result) => {
    (error) ? res.send(error) : res.send(result);
  });
});

// Cedrix
router.post("/mtpGroupSalesmanReport/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  loadModel.mtpGroupSalesmanReport(req.body, sessionId, (error, result) => {
    (error) ? res.send(error) : res.send(result);
  });
});

module.exports = router;