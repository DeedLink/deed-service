import express from "express";
import {
  createDeed,
  getDeeds,
  getDeedById,
  updateDeed,
  deleteDeed,
  addSign,
  getDeedsBySurveyWalletAddress,
  setTokenId,
  updatesurveyPlanNumber,
  getDeedsByOwnerWalletAddress,
  getDeedsByNotaryWalletAddress,
  getDeedsByIVSLWalletAddress,
  updateValuation,
  getDeedByDeedNumber,
  addTransactionToDeed,
  updateOwnerAddress,
  updateFullOwnerAddress,
  insertPlan,
  getPlans,
  updateDeedOwners,
  getNearbyLandSales,
  updateDeedLocationFromPlan,
  getDeedForQR
} from "../controllers/deedController.js";
import {
  generateQRCode,
  checkPermissions,
  updatePermissions,
  deleteQRCode,
  getMyQRCodes,
  getQRCodesByDeed
} from "../controllers/deedQRController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/plans", protect, getPlans);
router.get("/:deedId/nearby-sales", protect, getNearbyLandSales);
router.put("/deed/:deedNumber/update-location", updateDeedLocationFromPlan);

router.get("/qr/:qrId/permissions", checkPermissions);
router.get("/qr/:qrId/deed", getDeedForQR);
router.post("/qr/generate", protect, generateQRCode);
router.put("/qr/:qrId/permissions", protect, updatePermissions);
router.delete("/qr/:qrId", protect, deleteQRCode);
router.get("/qr/my-codes", protect, getMyQRCodes);
router.get("/qr/deed/:deedId", protect, getQRCodesByDeed);

router.get("/surveyor/:surveyWalletAddress", protect, getDeedsBySurveyWalletAddress);
router.get("/notary/:notaryWalletAddress", protect, getDeedsByNotaryWalletAddress);
router.get("/ivsl/:ivslWalletAddress", protect, getDeedsByIVSLWalletAddress);
router.post("/ivsl/:id", protect, updateValuation);
router.put("/:id/owners", protect, updateDeedOwners);
router.get("/owner/:ownerWalletAddress", protect, getDeedsByOwnerWalletAddress);
router.post("/set-token", setTokenId);
router.put("/update-survey-number/:id", updatesurveyPlanNumber);

router.get("/",protect, getDeeds);
router.get("/:id",protect, getDeedById);
router.get("/deed/:deedNumber", protect, getDeedByDeedNumber);
router.post("/:deedId/transaction", addTransactionToDeed);
router.put("/update-owner/:tokenId", updateOwnerAddress);
router.put("/update-full-owner/:tokenId", updateFullOwnerAddress);

router.post("/", protect, createDeed);
router.put("/:id", protect, updateDeed);
router.delete("/:id", protect, deleteDeed);

router.post("/:id/sign/:type", protect, addSign);

// Later added need to be tested
router.post("/:id/plan", protect, insertPlan)

export default router;
