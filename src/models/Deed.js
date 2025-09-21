import mongoose from "mongoose";

const tnxSchema = new mongoose.Schema(
  {
    from: { type: String, required: true },
    to: { type: String, required: true },
    amount: { type: Number, required: true },
    share: { type: Number, required: true },
    timestamp: { type: Number, required: true },
  },
  { _id: true }
);

const ownerSchema = new mongoose.Schema(
  {
    address: { type: String, required: true },
    share: { type: Number, required: true },
  },
  { _id: false }
);

const locationPointSchema = new mongoose.Schema(
  {
    longitude: { type: Number, required: true },
    latitude: { type: Number, required: true },
  },
  { _id: false }
);

const sideSchema = new mongoose.Schema(
  {
    North: { type: String, trim: true },
    South: { type: String, trim: true },
    East:  { type: String, trim: true },
    West:  { type: String, trim: true }
  },
  { _id: false }
);


const deedTypeSchema = new mongoose.Schema(
  {
    deedType: {
      type: String,
      enum: [
        "Power of Attorney",
        "Gift",
        "Sale",
        "Exchange",
        "Lease",
        "Mortgage",
        "Partition Deed",
        "Last Will",
        "Trust Deed",
        "Settlement Deed",
        "Declaration of Trust",
        "Agreement to Sell",
        "Conditional Transfer",
        "Transfer Deed",
        "Deed of Assignment",
        "Deed of Disclaimer",
        "Deed of Rectification",
        "Deed of Cancellation",
        "Deed of Surrender",
        "Deed of Release",
        "Deed of Nomination",
        "Affidavit",
        "Court Order / Judgment",
        "Other"
      ],
      required: true,
    },
    deedNumber: { type: String, required: true },
  },
  { _id: false }
);

const deedSchema = new mongoose.Schema(
  {
    title: [tnxSchema],
    owners: [ownerSchema],
    deedType: { type:deedTypeSchema, required: true },
    value: { type: Number, required: true },
    location: [locationPointSchema],
    sides: sideSchema,
    deedNumber: { type: String, required: true, unique: true },
    landType: {
      type: String,
      enum: ["Paddy land", "Highland", "Residential"],
      required: true,
    },
    timestamp: { type: Number, required: true },

    ownerFullName: { type: String, required: true },
    ownerNIC: { type: String, required: true },
    ownerAddress: { type: String, required: true },
    ownerPhone: { type: String, required: true },

    landTitleNumber: { type: String, required: true },
    landAddress: { type: String, required: true },
    landArea: { type: Number, required: true },
    landSizeUnit: {
      type: String,
      enum: ["Perches", "Acres", "Hectares", "Sqm", "Sqft"],
      default: "Perches",
    },
    surveyPlanNumber: { type: String },
    boundaries: { type: String },

    district: { type: String, required: true },
    division: { type: String, required: true },

    registrationDate: { type: Date, required: true },

    //Signaturing later added by me and, this can be changed.
    surveySignature: { type: String },
    surveyAssigned: { type: String },
    notarySignature: { type: String },
    notaryAssigned: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model("Deed", deedSchema);
