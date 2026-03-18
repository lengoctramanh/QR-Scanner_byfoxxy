const express = require("express");

const adminBrandRegistrationController = require("../controllers/adminBrandRegistrationController");

const router = express.Router();

router.get(
  "/brand-registration-requests",
  adminBrandRegistrationController.listRequests
);
router.get(
  "/brand-registration-requests/:requestId",
  adminBrandRegistrationController.getRequestDetail
);
router.post(
  "/brand-registration-requests/:requestId/create-account",
  adminBrandRegistrationController.createAccount
);
router.post(
  "/brand-registration-requests/:requestId/reject",
  adminBrandRegistrationController.rejectRequest
);

module.exports = router;
