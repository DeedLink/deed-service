import Deed from "../models/Deed.js";
import { ethers } from "ethers";
import asyncHandler from "express-async-handler";

export const createDeed = async (req, res) => {
  try {
    const deed = await Deed.create(req.body);
    res.status(201).json(deed);
  } catch (error) {
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
    res.json(deed);
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

// Signaturing process, I include this for all type of signaturing ti be able.
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
