import mongoose from "mongoose";
import { randomUUID } from "crypto";

const deedQRCodeSchema = new mongoose.Schema(
  {
    qrId: {
      type: String,
      required: true,
      unique: true,
      default: () => randomUUID(),
    },
    deedId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Deed",
      required: true,
    },
    tokenId: {
      type: Number,
    },
    deedNumber: {
      type: String,
      required: true,
    },
    ownerAddress: {
      type: String,
      required: true,
    },
    permissionType: {
      type: String,
      enum: ["public", "restricted", "owner_only"],
      required: true,
      default: "public",
    },
    allowedAddresses: {
      type: [String],
      default: [],
    },
    encryptedData: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

deedQRCodeSchema.index({ qrId: 1 });
deedQRCodeSchema.index({ deedId: 1 });
deedQRCodeSchema.index({ ownerAddress: 1 });

export default mongoose.model("DeedQRCode", deedQRCodeSchema);

