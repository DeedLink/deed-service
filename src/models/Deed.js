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
    direction: {
      type: String,
      enum: ["North", "South", "East", "West"],
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
    signedby: { type: String, required: true },
    area: { type: Number, required: true },
    value: { type: Number, required: true },
    location: [locationPointSchema],
    sides: [sideSchema],
    deedNumber: { type: String, required: true, unique: true },
    landType: {
      type: String,
      enum: ["Paddy land", "Highland"],
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
      enum: ["Perches", "Acres", "Hectares"],
      default: "Perches",
    },
    surveyPlanNumber: { type: String },
    boundaries: { type: String },

    district: { type: String, required: true },
    division: { type: String, required: true },

    notaryName: { type: String, required: true },
    registrationDate: { type: Date, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Deed", deedSchema);
