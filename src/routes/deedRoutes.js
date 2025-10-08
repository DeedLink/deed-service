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
} from "../controllers/deedController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/surveyor/:surveyWalletAddress", protect, getDeedsBySurveyWalletAddress);
router.get("/notary/:notaryWalletAddress", protect, getDeedsByNotaryWalletAddress);
router.get("/ivsl/:ivslWalletAddress", protect, getDeedsByIVSLWalletAddress);
router.post("/ivsl/:id", protect, updateValuation);
router.get("/owner/:ownerWalletAddress", protect, getDeedsByOwnerWalletAddress);
router.post("/set-token", setTokenId);
router.put("/update-survey-number/:id", updatesurveyPlanNumber);

router.get("/",protect, getDeeds);
router.get("/:id",protect, getDeedById);
router.get("/deed/:deedNumber", protect, getDeedByDeedNumber);

router.post("/", protect, createDeed);
router.put("/:id", protect, updateDeed);
router.delete("/:id", protect, deleteDeed);

router.post("/:id/sign/:type", protect, addSign);

export default router;
