import mongoose from "mongoose";
import { Medication } from "../models/medication.model.js";
import { isValidID, isValidString } from "../utils/validation.utils.js";
import { assertActiveMember, assertRecipientInGroup } from "../utils/taskHelper.js";

const VALID_FREQUENCIES = ["daily", "weekly", "as_needed"];

export const createMedication = async (
  groupId,
  recipientId,
  createdBy,
  name,
  dosage,
  frequency,
  timesPerDay,
  instructions,
  refillDate,
  supplyCount,
  notes
) => {
  try {
    if (!groupId) {
      throw new Error("groupId is required to create a medication");
    }
    if (!recipientId) {
      throw new Error("recipientId is required to create a medication");
    }
    if (!createdBy) {
      throw new Error("createdBy is required to create a medication");
    }

    groupId = isValidID(groupId);
    recipientId = isValidID(recipientId);
    createdBy = isValidID(createdBy);

    name = isValidString(name, "name");

    if (dosage !== undefined && dosage !== null && dosage !== "") {
      dosage = isValidString(dosage, "dosage");
    } else {
      dosage = "";
    }

    if (instructions !== undefined && instructions !== null && instructions !== "") {
      instructions = isValidString(instructions, "instructions");
    } else {
      instructions = "";
    }

    if (notes !== undefined && notes !== null && notes !== "") {
      notes = isValidString(notes, "notes");
    } else {
      notes = "";
    }

    if (frequency === undefined || frequency === null || frequency === "") {
      frequency = "daily";
    }
    if (!VALID_FREQUENCIES.includes(frequency)) {
      throw new Error(
        `Invalid frequency value. Expected one of ${VALID_FREQUENCIES.join(", ")}`
      );
    }

    let normalizedTimesPerDay = null;
    if (timesPerDay !== undefined && timesPerDay !== null && timesPerDay !== "") {
      const num = Number(timesPerDay);
      if (Number.isNaN(num)) {
        throw new Error("timesPerDay must be a number");
      }
      if (num < 0 || num > 24) {
        throw new Error("timesPerDay must be between 0 and 24");
      }
      normalizedTimesPerDay = num;
    }

    let parsedRefillDate = null;
    if (refillDate) {
      const parsed = new Date(refillDate);
      if (Number.isNaN(parsed.getTime())) {
        throw new Error("Invalid refillDate");
      }
      parsedRefillDate = parsed;
    }

    let normalizedSupplyCount = null;
    if (supplyCount !== undefined && supplyCount !== null && supplyCount !== "") {
      const num = Number(supplyCount);
      if (Number.isNaN(num)) {
        throw new Error("supplyCount must be a number");
      }
      if (num < 0) {
        throw new Error("supplyCount cannot be negative");
      }
      normalizedSupplyCount = num;
    }

    const memberRole = await assertActiveMember(createdBy, groupId);
    if (memberRole !== "admin") {
      throw new Error(
        "User does not have permission to create medications in this group"
      );
    }

    await assertRecipientInGroup(recipientId, groupId);

    const medication = await Medication.create({
      name,
      dosage,
      frequency,
      timesPerDay: normalizedTimesPerDay,
      instructions,
      refillDate: parsedRefillDate,
      supplyCount: normalizedSupplyCount,
      groupId,
      recipientId,
      notes,
    });

    return medication;
  } catch (error) {
    throw new Error(`Error creating medication: ${error.message}`);
  }
};

export const getGroupMedications = async (groupId) => {
  try {
    if (!groupId) {
      throw new Error("groupId is required to list medications");
    }
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      throw new Error("Invalid groupId");
    }

    const medications = await Medication.find({ groupId, active: true })
      .populate("recipientId", "firstName lastName email")
      .sort({ name: 1, createdAt: -1 });

    return medications;
  } catch (error) {
    throw new Error(
      `Error fetching medications for group: ${error.message}`
    );
  }
};

export const updateMedication = async (medicationId, updaterId, updates = {}) => {
  try {
    if (!medicationId) {
      throw new Error("medicationId is required to update a medication");
    }
    if (!updaterId) {
      throw new Error("updaterId is required to update a medication");
    }

    if (!mongoose.Types.ObjectId.isValid(medicationId)) {
      throw new Error("Invalid medicationId");
    }
    updaterId = isValidID(updaterId);

    const medication = await Medication.findById(medicationId);
    if (!medication) {
      throw new Error("Medication not found");
    }

    const memberRole = await assertActiveMember(updaterId, medication.groupId);
    if (memberRole !== "admin") {
      throw new Error(
        "User does not have permission to update medications in this group"
      );
    }

    const {
      name,
      dosage,
      frequency,
      timesPerDay,
      instructions,
      refillDate,
      supplyCount,
      active,
      notes,
    } = updates;

    if (name !== undefined) {
      medication.name = isValidString(name, "name");
    }

    if (dosage !== undefined) {
      if (dosage === null || dosage === "") {
        medication.dosage = "";
      } else {
        medication.dosage = isValidString(dosage, "dosage");
      }
    }

    if (instructions !== undefined) {
      if (instructions === null || instructions === "") {
        medication.instructions = "";
      } else {
        medication.instructions = isValidString(instructions, "instructions");
      }
    }

    if (notes !== undefined) {
      if (notes === null || notes === "") {
        medication.notes = "";
      } else {
        medication.notes = isValidString(notes, "notes");
      }
    }

    if (frequency !== undefined) {
      if (!VALID_FREQUENCIES.includes(frequency)) {
        throw new Error(
          `Invalid frequency value. Expected one of ${VALID_FREQUENCIES.join(
            ", "
          )}`
        );
      }
      medication.frequency = frequency;
    }

    if (timesPerDay !== undefined) {
      if (timesPerDay === null || timesPerDay === "") {
        medication.timesPerDay = null;
      } else {
        const num = Number(timesPerDay);
        if (Number.isNaN(num)) {
          throw new Error("timesPerDay must be a number");
        }
        if (num < 0 || num > 24) {
          throw new Error("timesPerDay must be between 0 and 24");
        }
        medication.timesPerDay = num;
      }
    }

    if (refillDate !== undefined) {
      if (!refillDate) {
        medication.refillDate = null;
      } else {
        const parsed = new Date(refillDate);
        if (Number.isNaN(parsed.getTime())) {
          throw new Error("Invalid refillDate");
        }
        medication.refillDate = parsed;
      }
    }

    if (supplyCount !== undefined) {
      if (supplyCount === null || supplyCount === "") {
        medication.supplyCount = null;
      } else {
        const num = Number(supplyCount);
        if (Number.isNaN(num)) {
          throw new Error("supplyCount must be a number");
        }
        if (num < 0) {
          throw new Error("supplyCount cannot be negative");
        }
        medication.supplyCount = num;
      }
    }

    if (active !== undefined) {
      if (typeof active !== "boolean") {
        throw new Error("active must be a boolean");
      }
      medication.active = active;
    }

    const updatedMedication = await medication.save();
    return updatedMedication;
  } catch (error) {
    throw new Error(`Error updating medication: ${error.message}`);
  }
};

export const deleteMedication = async (medicationId, deleterId) => {
  try {
    if (!medicationId) {
      throw new Error("medicationId is required to delete a medication");
    }
    if (!deleterId) {
      throw new Error("deleterId is required to delete a medication");
    }

    if (!mongoose.Types.ObjectId.isValid(medicationId)) {
      throw new Error("Invalid medicationId");
    }
    deleterId = isValidID(deleterId);

    const medication = await Medication.findById(medicationId);
    if (!medication) {
      throw new Error("Medication not found");
    }

    const memberRole = await assertActiveMember(deleterId, medication.groupId);
    if (memberRole !== "admin") {
      throw new Error(
        "User does not have permission to delete medications in this group"
      );
    }

    medication.active = false;
    const updatedMedication = await medication.save();
    return updatedMedication;
  } catch (error) {
    throw new Error(`Error deleting medication: ${error.message}`);
  }
};


export const recordDose = async (medicationId, takenBy, takenAt) => {
  try {
    if (!medicationId) {
      throw new Error("medicationId is required to record a dose");
    }
    if (!takenBy) {
      throw new Error("takenBy is required to record a dose");
    }

    if (!mongoose.Types.ObjectId.isValid(medicationId)) {
      throw new Error("Invalid medicationId");
    }
    takenBy = isValidID(takenBy);

    const medication = await Medication.findById(medicationId);
    if (!medication) {
      throw new Error("Medication not found");
    }

    await assertActiveMember(takenBy, medication.groupId);

    if (
      typeof medication.supplyCount === "number" &&
      !Number.isNaN(medication.supplyCount) &&
      medication.supplyCount > 0
    ) {
      medication.supplyCount -= 1;
    }

    const updatedMedication = await medication.save();
    return updatedMedication;
  } catch (error) {
    throw new Error(`Error recording medication dose: ${error.message}`);
  }
};
