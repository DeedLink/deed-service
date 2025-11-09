import Deed from "../models/Deed.js";
import { ethers } from "ethers";
import asyncHandler from "express-async-handler";
import { fullDeedDirectTransaction, setTransactionWhenDeedCreated } from "../utils/externalAPI.js";

export const createDeed = async (req, res) => {
   console.log("Request Body:", req.body);
  try {
    const deed = await Deed.create(req.body);
    res.status(201).json(deed);
    if (deed && deed._id && deed.owners && deed.owners.length > 0) {
      const ownerWalletAddress = deed.owners[0].address;
      try {
        await setTransactionWhenDeedCreated(deed._id, ownerWalletAddress);
      } catch (transactionError) {
        console.error("Failed to set transaction after deed creation:", transactionError);
      }
    } else {
      console.warn("Deed created but missing ID or owners, skipping transaction setup.");
    }
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

export const getDeedByDeedNumber = async (req, res) => {
  try {
    const { deedNumber } = req.params;
    const walletAddress = req.user?.walletAddress?.toLowerCase();

    if (!walletAddress) {
      return res.status(401).json({ message: "Unauthorized: No user info found" });
    }

    const deed = await Deed.findOne({ deedNumber });
    if (!deed) {
      return res.status(404).json({ message: "Deed not found" });
    }

    const isOwner = deed.owners.some(
      (owner) => owner.address.toLowerCase() === walletAddress
    );

    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: You are not an owner of this deed" });
    }

    res.json(deed);
  } catch (error) {
    res.status(500).json({ message: "Error fetching deed by deed number", error });
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

export const getDeedsByNotaryWalletAddress = async (req, res) => {
  try {
    const { notaryWalletAddress } = req.params;
    const deeds = await Deed.find({ notaryAssigned: notaryWalletAddress, tokenId: { $exists: true, $ne: null } });
    if (deeds.length === 0) {
      return res.status(404).json({ message: "No deeds found for this notary wallet address" });
    }
    res.json(deeds);
  } catch (error) {
    res.status(500).json({ message: "Error fetching deeds", error });
  }
};

export const getDeedsByIVSLWalletAddress = async (req, res) => {
  try {
    const { ivslWalletAddress } = req.params;
    const deeds = await Deed.find({ ivslAssigned: ivslWalletAddress, tokenId: { $exists: true, $ne: null } });
    if (deeds.length === 0) {
      return res.status(404).json({ message: "No deeds found for this ivsl wallet address" });
    }
    res.json(deeds);
  } catch (error) {
    res.status(500).json({ message: "Error fetching deeds", error });
  }
};

export const updateValuation = async (req, res) => {
  try {
    const { id } = req.params;
    const { requestedValue, estimatedValue, isAccepted, mode } = req.body;

    const deed = await Deed.findById(id);
    if (!deed) {
      return res.status(404).json({ message: "Deed not found" });
    }

    const now = Date.now();

    // MODE: "request"
    if (mode === "request") {
      const newValuation = {
        requestedValue:
          typeof requestedValue !== "undefined" && requestedValue !== null
            ? Number(requestedValue)
            : null,
        estimatedValue: null,
        isAccepted: null,
        timestamp: now,
      };

      deed.valuation.push(newValuation);
      await deed.save();

      return res.status(200).json({
        message: "Requested valuation added",
        valuation: newValuation,
        deed,
      });
    }

    // MODE: "estimate"
    if (mode === "estimate") {
      const est =
        typeof estimatedValue !== "undefined" && estimatedValue !== null
          ? Number(estimatedValue)
          : null;

      if (deed.valuation && deed.valuation.length > 0) {
        const lastIndex = deed.valuation.length - 1;
        const last = deed.valuation[lastIndex];

        if (last.estimatedValue === null || typeof last.estimatedValue === "undefined") {
          last.estimatedValue = est;
          if (typeof isAccepted !== "undefined") last.isAccepted = isAccepted;
          await deed.save();

          return res.status(200).json({
            message: "Estimated value updated on last valuation",
            valuation: last,
            deed,
          });
        }
      }

      const newValuation = {
        requestedValue: null,
        estimatedValue: est,
        isAccepted: typeof isAccepted !== "undefined" ? isAccepted : null,
        timestamp: now,
      };

      deed.valuation.push(newValuation);
      await deed.save();

      return res.status(200).json({
        message: "Estimated valuation added as new record",
        valuation: newValuation,
        deed,
      });
    }

    // MODE: "estimate-requested"
    if (mode === "estimate-requested") {
      if (!deed.valuation || deed.valuation.length === 0) {
        return res.status(400).json({ message: "No previous valuation found to update" });
      }

      const lastIndex = deed.valuation.length - 1;
      const last = deed.valuation[lastIndex];

      const est =
        typeof estimatedValue !== "undefined" && estimatedValue !== null
          ? Number(estimatedValue)
          : null;

      last.estimatedValue = est;
      if (typeof isAccepted !== "undefined") last.isAccepted = isAccepted;
      last.timestamp = now;

      await deed.save();

      return res.status(200).json({
        message: "Latest valuation estimate updated (estimate-requested mode)",
        valuation: last,
        deed,
      });
    }

    // INVALID MODE
    return res.status(400).json({ message: "Invalid mode. Use 'request', 'estimate', or 'estimate-requested'." });
  } catch (error) {
    console.error("Error updating valuation:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getDeedsByOwnerWalletAddress = async (req, res) => {
  console.log(req.params);
  try {
    const { ownerWalletAddress } = req.params;
    const deeds = await Deed.find({
      owners: { $elemMatch: { address: ownerWalletAddress } },
      tokenId: { $exists: true, $ne: null }
    });

    if (deeds.length === 0) {
      return res.status(404).json({ message: "No deeds found for this owner's wallet address" });
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

    const deed = await Deed.findOneAndUpdate(
      { deedNumber: id },
      { $set: { surveyPlanNumber } },
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

  if (!["survey", "notary", "ivsl"].includes(type)) {
    res.status(400);
    throw new Error("Invalid signing type. Must be 'survey', 'notary' or 'ivsl'");
  }

  const deed = await Deed.findById(id);
  if (!deed) {
    res.status(404);
    throw new Error("Deed not found");
  }

  const signatureField = `${type}Signature`;

  const message = JSON.stringify(deed.tokenId);

  const recoveredAddress = ethers.verifyMessage(message, signature);

  if (!recoveredAddress || !deed.surveyAssigned) {
    res.status(400);
    throw new Error("Missing recovered address or user wallet address");
  }

  const assignedAddress =
    type === "survey"
      ? deed.surveyAssigned
      : type === "notary"
      ? deed.notaryAssigned
      : deed.ivslAssigned;

  if (recoveredAddress.toLowerCase() !== assignedAddress.toLowerCase()) {
    res.status(401);
    throw new Error("Invalid signature: Recovered address does not match assigned address");
  }

  deed[signatureField] = signature;
  await deed.save();

  res.status(200).json({
    message: `Deed signed successfully by ${type}`,
    deed: {
      id: deed._id,
      content: deed.content,
      surveySignature: deed.surveySignature,
      surveyAssigned: deed.surveyAssigned,
      notarySignature: deed.notarySignature,
      notaryAssigned: deed.notaryAssigned,
      ivslSignature: deed.ivslSignature,
      ivslAssigned: deed.ivslAssigned,
    },
  });
});

// Instert and Transaction Title
export const addTransactionToDeed = async (req, res) => {
  try {
    const { deedId } = req.params;
    const { from, to, amount, share } = req.body;

    if (!from || !to || !amount || !share) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const deed = await Deed.findById(deedId);
    if (!deed) {
      return res.status(404).json({ message: "Deed not found" });
    }

    const newTransaction = {
      from,
      to,
      amount,
      share,
      timestamp: Date.now(),
    };

    deed.title.push(newTransaction);
    await deed.save();

    res.status(200).json({
      message: "Transaction added successfully",
      deed,
    });
  } catch (error) {
    console.error("Error adding transaction:", error);
    res.status(500).json({
      message: "Server error while adding transaction",
      error: error.message,
    });
  }
};

// Update Owner Address
export const updateOwnerAddress = async (req, res) => {
  try {
    const { tokenId } = req.params;
    const { newOwnerAddress, newOwnerFullName, newOwnerNIC, newOwnerAddressDetail, newOwnerPhone } = req.body;

    console.log("Token ID:", tokenId);
    console.log("New Owner Address:", newOwnerAddress);

    if (!newOwnerAddress) {
      return res.status(400).json({ message: "New owner address is required" });
    }

    const deed = await Deed.findOne({ tokenId: tokenId });

    if (!deed) {
      return res.status(404).json({ message: "Deed not found for given tokenId" });
    }

    deed.ownerFullName = newOwnerFullName || "_unset_";
    deed.ownerNIC = newOwnerNIC || "_unset_";
    deed.ownerAddress = newOwnerAddressDetail || "_unset_";
    deed.ownerPhone = newOwnerPhone || "_unset_";

    if (Array.isArray(deed.owners) && deed.owners.length > 0) {
      deed.owners = [{ address: newOwnerAddress, share: 100 }];
    } else {
      deed.owners = [{ address: newOwnerAddress, share: 100 }];
    }

    await deed.save();

    res.status(200).json({
      message: "Owner address updated successfully",
      deed,
    });
  } catch (error) {
    console.error("Error updating owner address:", error);
    res.status(500).json({
      message: "Server error while updating owner address",
      error: error.message,
    });
  }
};

// Update Full Owner Address (with transaction)
export const updateFullOwnerAddress = async (req, res) => {
  try {
    const { tokenId } = req.params;
    const { newOwnerAddress, fromAddress, hash, amount, newOwnerFullName, newOwnerNIC, newOwnerAddressDetail, newOwnerPhone } = req.body;

    console.log("Token ID:", tokenId);
    console.log("New Owner Address:", newOwnerAddress);

    if (!newOwnerAddress) {
      return res.status(400).json({ message: "New owner address is required" });
    }

    const deed = await Deed.findOne({ tokenId });
    if (!deed) {
      return res.status(404).json({ message: "Deed not found for given tokenId" });
    }

    deed.owners = [{ address: newOwnerAddress, share: 100 }];
    deed.ownerFullName = newOwnerFullName || "_unset_";
    deed.ownerNIC = newOwnerNIC || "_unset_";
    deed.ownerAddress = newOwnerAddressDetail || "_unset_";
    deed.ownerPhone = newOwnerPhone || "_unset_";

    await deed.save();

    try {
      const transactionResponse = await fullDeedDirectTransaction(
        deed._id,
        fromAddress || "unknown",
        newOwnerAddress,
        hash || `hash_${Date.now()}`,
        amount || 0
      );

      console.log("Full Deed Transaction Created:", transactionResponse);
    } catch (txnError) {
      console.error("Error creating full deed transaction:", txnError);
    }

    res.status(200).json({
      message: "Full owner address updated successfully and transaction recorded",
      deed,
    });
  } catch (error) {
    console.error("Error updating full owner address:", error);
    res.status(500).json({
      message: "Server error while updating full owner address",
      error: error.message,
    });
  }
};

export const insertPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({ message: "planId is required" });
    }

    const newPlan = { planId, timestamp: Date.now() };

    const updatedDeed = await Deed.findByIdAndUpdate(
      id,
      { $push: { surveyPlans: newPlan } },
      { new: true }
    );

    if (!updatedDeed) {
      return res.status(404).json({ message: "Deed not found" });
    }

    res.status(200).json(updatedDeed);
  } catch (error) {
    console.error("Error adding survey plan:", error);
    res.status(500).json({
      message: "Error adding survey plan",
      error: error.message,
    });
  }
};

export const getPlans = async (req, res) => {
  try {
    const deeds = await Deed.find(
      {},
      {
        surveyPlanNumber: 1,
        surveyPlans: 1,
        tokenId: 1,
        deedNumber: 1,
        _id: 1,
      }
    );

    if (!deeds || deeds.length === 0) {
      return res.status(404).json({ message: "No deeds with plans found" });
    }

    res.status(200).json(deeds);
  } catch (error) {
    console.error("Error fetching plans:", error);
    res.status(500).json({
      message: "Error fetching plans",
      error: error.message,
    });
  }
};
