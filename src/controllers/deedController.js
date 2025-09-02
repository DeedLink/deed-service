import Deed from "../models/Deed.js";

export const createDeed = async (req, res) => {
  try {
    const deed = await Deed.create(req.body);
    res.status(201).json(deed);
  } catch (error) {
    res.status(400).json({ message: "Error creating deed", error });
  }
};

export const getDeeds = async (req, res) => {
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
