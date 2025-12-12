import asyncHandler from "express-async-handler";
import DeedQRCode from "../models/DeedQRCode.js";
import Deed from "../models/Deed.js";

export const generateQRCode = asyncHandler(async (req, res) => {
  const { deedId, permissionType, allowedAddresses, encryptedData } = req.body;
  const ownerAddress = req.user?.walletAddress?.toLowerCase();

  if (!ownerAddress) {
    res.status(401);
    throw new Error("Unauthorized: No user info found");
  }

  if (!deedId || !permissionType || !encryptedData) {
    res.status(400);
    throw new Error("Missing required fields: deedId, permissionType, and encryptedData are required");
  }

  if (!["public", "restricted", "owner_only"].includes(permissionType)) {
    res.status(400);
    throw new Error("Invalid permissionType. Must be 'public', 'restricted', or 'owner_only'");
  }

  if (permissionType === "restricted" && (!allowedAddresses || !Array.isArray(allowedAddresses) || allowedAddresses.length === 0)) {
    res.status(400);
    throw new Error("allowedAddresses array is required when permissionType is 'restricted'");
  }

  const deed = await Deed.findById(deedId);
  if (!deed) {
    res.status(404);
    throw new Error("Deed not found");
  }

  const isOwner = deed.owners && deed.owners.some(
    (owner) => owner.address && owner.address.toLowerCase() === ownerAddress
  );

  if (!isOwner && req.user.role !== "admin" && req.user.role !== "registrar") {
    res.status(403);
    throw new Error("Forbidden: You are not an owner of this deed");
  }

  const normalizedAllowedAddresses = permissionType === "restricted" 
    ? allowedAddresses.map(addr => addr.toLowerCase())
    : [];

  const qrCode = await DeedQRCode.create({
    deedId,
    tokenId: deed.tokenId,
    deedNumber: deed.deedNumber,
    ownerAddress,
    permissionType,
    allowedAddresses: normalizedAllowedAddresses,
    encryptedData,
  });

  res.status(201).json({
    success: true,
    qrCode: {
      qrId: qrCode.qrId,
      deedId: qrCode.deedId,
      tokenId: qrCode.tokenId,
      deedNumber: qrCode.deedNumber,
      permissionType: qrCode.permissionType,
      allowedAddresses: qrCode.allowedAddresses,
      createdAt: qrCode.createdAt,
    },
    encryptedData: qrCode.encryptedData,
  });
});

export const checkPermissions = asyncHandler(async (req, res) => {
  const { qrId } = req.params;
  const scannerAddress = req.query.scannerAddress?.toLowerCase();

  if (!qrId) {
    res.status(400);
    throw new Error("qrId is required");
  }

  const qrCode = await DeedQRCode.findOne({ qrId });
  if (!qrCode) {
    res.status(404);
    throw new Error("QR code not found");
  }

  let hasAccess = false;
  let reason = "";

  if (qrCode.permissionType === "public") {
    hasAccess = true;
    reason = "Public QR code";
  } else if (qrCode.permissionType === "owner_only") {
    if (!scannerAddress) {
      hasAccess = false;
      reason = "Owner-only QR code requires wallet address";
    } else {
      const deed = await Deed.findById(qrCode.deedId);
      if (deed && deed.owners) {
        const isOwner = deed.owners.some(
          (owner) => owner.address && owner.address.toLowerCase() === scannerAddress
        );
        hasAccess = isOwner;
        reason = isOwner ? "You are an owner of this deed" : "You are not an owner of this deed";
      } else {
        hasAccess = false;
        reason = "Deed not found";
      }
    }
  } else if (qrCode.permissionType === "restricted") {
    if (!scannerAddress) {
      hasAccess = false;
      reason = "Restricted QR code requires wallet address";
    } else {
      hasAccess = qrCode.allowedAddresses.includes(scannerAddress);
      reason = hasAccess 
        ? "Your address is in the allowed list" 
        : "Your address is not in the allowed list";
    }
  }

  res.json({
    success: true,
    hasAccess,
    reason,
    permissionType: qrCode.permissionType,
    qrId: qrCode.qrId,
  });
});

export const getDeedForQR = asyncHandler(async (req, res) => {
  const { qrId } = req.params;
  const scannerAddress = req.query.scannerAddress?.toLowerCase();

  if (!qrId) {
    res.status(400);
    throw new Error("qrId is required");
  }

  const qrCode = await DeedQRCode.findOne({ qrId });
  if (!qrCode) {
    res.status(404);
    throw new Error("QR code not found");
  }

  let hasAccess = false;

  if (qrCode.permissionType === "public") {
    hasAccess = true;
  } else if (qrCode.permissionType === "owner_only") {
    if (scannerAddress) {
      const deed = await Deed.findById(qrCode.deedId);
      if (deed && deed.owners) {
        hasAccess = deed.owners.some(
          (owner) => owner.address && owner.address.toLowerCase() === scannerAddress
        );
      }
    }
  } else if (qrCode.permissionType === "restricted") {
    if (scannerAddress) {
      hasAccess = qrCode.allowedAddresses.includes(scannerAddress);
    }
  }

  if (!hasAccess) {
    res.status(403);
    throw new Error("Access denied: You do not have permission to view this deed");
  }

  const deed = await Deed.findById(qrCode.deedId);
  if (!deed) {
    res.status(404);
    throw new Error("Deed not found");
  }

  res.json({
    success: true,
    deed: deed.toObject(),
    qrCode: {
      qrId: qrCode.qrId,
      permissionType: qrCode.permissionType,
      createdAt: qrCode.createdAt,
    },
  });
});

export const updatePermissions = asyncHandler(async (req, res) => {
  const { qrId } = req.params;
  const { permissionType, allowedAddresses } = req.body;
  const ownerAddress = req.user?.walletAddress?.toLowerCase();

  if (!ownerAddress) {
    res.status(401);
    throw new Error("Unauthorized: No user info found");
  }

  if (!permissionType) {
    res.status(400);
    throw new Error("permissionType is required");
  }

  if (!["public", "restricted", "owner_only"].includes(permissionType)) {
    res.status(400);
    throw new Error("Invalid permissionType. Must be 'public', 'restricted', or 'owner_only'");
  }

  if (permissionType === "restricted" && (!allowedAddresses || !Array.isArray(allowedAddresses) || allowedAddresses.length === 0)) {
    res.status(400);
    throw new Error("allowedAddresses array is required when permissionType is 'restricted'");
  }

  const qrCode = await DeedQRCode.findOne({ qrId });
  if (!qrCode) {
    res.status(404);
    throw new Error("QR code not found");
  }

  if (qrCode.ownerAddress.toLowerCase() !== ownerAddress && req.user.role !== "admin" && req.user.role !== "registrar") {
    res.status(403);
    throw new Error("Forbidden: You are not the owner of this QR code");
  }

  const normalizedAllowedAddresses = permissionType === "restricted" 
    ? allowedAddresses.map(addr => addr.toLowerCase())
    : [];

  qrCode.permissionType = permissionType;
  qrCode.allowedAddresses = normalizedAllowedAddresses;
  await qrCode.save();

  res.json({
    success: true,
    qrCode: {
      qrId: qrCode.qrId,
      deedId: qrCode.deedId,
      tokenId: qrCode.tokenId,
      deedNumber: qrCode.deedNumber,
      permissionType: qrCode.permissionType,
      allowedAddresses: qrCode.allowedAddresses,
      updatedAt: qrCode.updatedAt,
    },
  });
});

export const deleteQRCode = asyncHandler(async (req, res) => {
  const { qrId } = req.params;
  const ownerAddress = req.user?.walletAddress?.toLowerCase();

  if (!ownerAddress) {
    res.status(401);
    throw new Error("Unauthorized: No user info found");
  }

  const qrCode = await DeedQRCode.findOne({ qrId });
  if (!qrCode) {
    res.status(404);
    throw new Error("QR code not found");
  }

  if (qrCode.ownerAddress.toLowerCase() !== ownerAddress && req.user.role !== "admin" && req.user.role !== "registrar") {
    res.status(403);
    throw new Error("Forbidden: You are not the owner of this QR code");
  }

  await DeedQRCode.deleteOne({ qrId });

  res.json({
    success: true,
    message: "QR code deleted successfully",
  });
});

export const getMyQRCodes = asyncHandler(async (req, res) => {
  const ownerAddress = req.user?.walletAddress?.toLowerCase();

  if (!ownerAddress) {
    res.status(401);
    throw new Error("Unauthorized: No user info found");
  }

  const qrCodes = await DeedQRCode.find({ ownerAddress }).sort({ createdAt: -1 });

  res.json({
    success: true,
    qrCodes: qrCodes.map(qr => ({
      qrId: qr.qrId,
      deedId: qr.deedId,
      tokenId: qr.tokenId,
      deedNumber: qr.deedNumber,
      permissionType: qr.permissionType,
      allowedAddresses: qr.allowedAddresses,
      createdAt: qr.createdAt,
      updatedAt: qr.updatedAt,
    })),
  });
});

export const getQRCodesByDeed = asyncHandler(async (req, res) => {
  const { deedId } = req.params;
  const ownerAddress = req.user?.walletAddress?.toLowerCase();

  if (!ownerAddress) {
    res.status(401);
    throw new Error("Unauthorized: No user info found");
  }

  const deed = await Deed.findById(deedId);
  if (!deed) {
    res.status(404);
    throw new Error("Deed not found");
  }

  const isOwner = deed.owners && deed.owners.some(
    (owner) => owner.address && owner.address.toLowerCase() === ownerAddress
  );

  if (!isOwner && req.user.role !== "admin" && req.user.role !== "registrar") {
    res.status(403);
    throw new Error("Forbidden: You are not an owner of this deed");
  }

  const qrCodes = await DeedQRCode.find({ deedId }).sort({ createdAt: -1 });

  res.json({
    success: true,
    qrCodes: qrCodes.map(qr => ({
      qrId: qr.qrId,
      deedId: qr.deedId,
      tokenId: qr.tokenId,
      deedNumber: qr.deedNumber,
      permissionType: qr.permissionType,
      allowedAddresses: qr.allowedAddresses,
      createdAt: qr.createdAt,
      updatedAt: qr.updatedAt,
    })),
  });
});

