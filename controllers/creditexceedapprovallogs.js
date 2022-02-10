const express = require('express');
const router = express.Router();
const creditExceedApprovalLogsModel = require('../models/creditexceedapprovallogs').creditExceedApprovalLogsModel;

// Credit Exceed Approval Logs
router.post('/loadCreditExceedApprovalLogs_ByDate', (req, res) => {
	creditExceedApprovalLogsModel.loadCreditExceedApprovalLogs_ByDate(req.body, (error, result) => {
		(error) ? res.status(500).json(error) : res.send(result);
	});
});

module.exports = router;