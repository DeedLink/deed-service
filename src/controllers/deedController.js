import Deed from "../models/Deed.js";
import { ethers } from "ethers";
import asyncHandler from "express-async-handler";

export const createDeed = async (req, res) => {
   console.log("Request Body:", req.body);
  try {
    const deed = await Deed.create(req.body);
    res.status(201).json(deed);
  } catch (error) {
    console.error("Error creating deed:", error);
    res.status(400).json({ message: "Error creating deed", error });
  }
};

export const getDeeds = async (_req, res) => {
  try {
    const deeds = await Deed.find();
    res.json(deeds);
  } catch (error) {
    res.status(500).json({ message: "Error fetching deeds", error });
  }
};

export const getDeedById = async (req, res) => {
  try {
    const deed = await Deed.findById(req.params.id);
    if (!deed) return res.status(404).json({ message: "Deed not found" });
    res.json(deed);
  } catch (error) {
    res.status(500).json({ message: "Error fetching deed", error });
  }
};

export const updateDeed = async (req, res) => {
  try {
    const deed = await Deed.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!deed) return res.status(404).json({ message: "Deed not found" });
    res.json({status: 200, deed });
  } catch (error) {
    res.status(400).json({ message: "Error updating deed", error });
  }
};

export const deleteDeed = async (req, res) => {
  try {
    const deed = await Deed.findByIdAndDelete(req.params.id);
    if (!deed) return res.status(404).json({ message: "Deed not found" });
    res.json({ message: "Deed deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting deed", error });
  }
};

export const getDeedsBySurveyWalletAddress = async (req, res) => {
  try {
    const { surveyWalletAddress } = req.params;
    const deeds = await Deed.find({ surveyAssigned: surveyWalletAddress, tokenId: { $exists: true, $ne: null } });
    if (deeds.length === 0) {
      return res.status(404).json({ message: "No deeds found for this survey wallet address" });
    }
    res.json(deeds);
  } catch (error) {
    res.status(500).json({ message: "Error fetching deeds", error });
  }
};

export const setTokenId = async (req, res) => {
  try {
    const { deedNumber, tokenId } = req.body;

    if (!deedNumber || !tokenId) {
      return res.status(400).json({ message: "deedNumber and tokenId are required" });
    }

    const deed = await Deed.findOneAndUpdate(
      { deedNumber },
      { tokenId },
      { new: true }
    );

    if (!deed) {
      return res.status(404).json({ message: "Deed not found" });
    }

    res.status(200).json({
      message: "Token ID set successfully",
      deed
    });
  } catch (error) {
    console.error("Error setting token ID:", error);
    res.status(500).json({ message: "Error setting token ID", error });
  }
};

export const updatesurveyPlanNumber = async (req, res) => {
  try {
    const { id } = req.params;
    const { surveyPlanNumber } = req.body;

    if (!surveyPlanNumber) {
      return res.status(400).json({ message: "surveyPlanNumber is required" });
    }

    const deed = await Deed.findByIdAndUpdate(
      id,
      { surveyPlanNumber },
      { new: true }
    );

    if (!deed) {
      return res.status(404).json({ message: "Deed not found" });
    }

    res.status(200).json({
      message: "Survey number updated successfully",
      deed,
    });
  } catch (error) {
    console.error("Error updating survey number:", error);
    res.status(500).json({ message: "Error updating survey number", error });
  }
};

// Signaturing process, I include this for all type of signaturing to be able.
export const addSign = asyncHandler(async (req, res) => {
  const { id, type } = req.params;
  const { signature } = req.body;
  const user = req.user;

  if (!['survey', 'notary'].includes(type)) {
    res.status(400);
    throw new Error("Invalid signing type. Must be 'survey' or 'notary'");
  }

  const deed = await Deed.findById(id);
  if (!deed) {
    res.status(404);
    throw new Error("Deed not found");
  }

  const signedField = `${type}SignedBy`;
  if (deed[signedField]) {
    res.status(400);
    throw new Error(`Deed already signed by ${type}`);
  }

  const messageHash = ethers.utils.hashMessage(JSON.stringify(deed.content));

  const recoveredAddress = ethers.utils.verifyMessage(messageHash, signature);
  if (recoveredAddress.toLowerCase() !== user.walletAddress.toLowerCase()) {
    res.status(401);
    throw new Error("Invalid signature");
  }

  deed[`${type}Signature`] = signature;
  deed[signedField] = user.walletAddress;
  await deed.save();

  res.status(200).json({
    message: `Deed signed successfully by ${type}`,
    deed: {
      id: deed._id,
      content: deed.content,
      surveySignature: deed.surveySignature,
      surveySignedBy: deed.surveySignedBy,
      notarySignature: deed.notarySignature,
      notarySignedBy: deed.notarySignedBy,
    },
  });
});
