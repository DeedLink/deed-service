import express from "express";
import {
  createDeed,
  getDeeds,
  getDeedById,
  updateDeed,
  deleteDeed,
  addSign,
  getDeedsBySurveyWalletAddress,
} from "../controllers/deedController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/",protect, getDeeds);
router.get("/:id",protect, getDeedById);
router.get("/surveyor/:surveyWalletAddress", protect, getDeedsBySurveyWalletAddress);

router.post("/", protect, createDeed);
router.put("/:id", protect, updateDeed);
router.delete("/:id", protect, deleteDeed);

router.post("/:id/sign/:type", protect, addSign);

export default router;
