import express from "express";
import {
  createMedication,
  getGroupMedications,
  updateMedication,
  deleteMedication,
  recordDose,
  getMedicationById,
} from "../data/medicationController.js";
import { requireAuth, verifyFirebaseToken } from "../middlewares/auth.js";

const router = express.Router();

router.get("/group/:groupId", requireAuth, async (req, res) => {
  try {
    const { groupId } = req.params;

    if (!groupId) {
      return res.status(400).json({ error: "groupId parameter is required" });
    }

    const medications = await getGroupMedications(groupId);
    return res.status(200).json(medications);
  } catch (error) {
    console.error("Error getting medications for group:", error);
    return res.status(500).json({ error: error.message });
  }
});
//get medications by id
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "id parameter is required" });
    }

    const medication = await getMedicationById(id);
    return res.status(200).json(medication);
  } catch (error) {
    console.error("Error getting medication by id:", error);
    return res.status(500).json({ error: error.message });
  }
});
router.get("/", requireAuth, async (req, res) => {
  try {
    const { groupId } = req.query;

    if (!groupId) {
      return res
        .status(400)
        .json({ error: "groupId query parameter is required" });
    }

    const medications = await getGroupMedications(groupId);
    return res.status(200).json(medications);
  } catch (error) {
    console.error("Error listing medications:", error);
    return res.status(500).json({ error: error.message });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const {
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
      notes,
    } = req.body;
    if (
      !groupId ||
      !recipientId ||
      !createdBy ||
      !name ||
      !dosage ||
      !frequency ||
      !timesPerDay
    ) {
      return res.status(400).json({
        error:
          "groupId, recipientId, createdBy, name, dosage, frequency, and timesPerDay are required",
      });
    }
    const medication = await createMedication(
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
    );
    
    return res.status(201).json(medication);
  } catch (error) {
    console.error("Error creating medication:", error);
    return res.status(500).json({ error: error.message });
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { updaterId, ...updates } = req.body;
    if (!id) {
      return res
        .status(400)
        .json({ error: "Medication id parameter is required" });
    }

    if (!updaterId) {
      return res
        .status(400)
        .json({ error: "updaterId is required to update a medication" });
    }

    const medication = await updateMedication(id, updaterId, updates);
    return res.status(200).json(medication);
  } catch (error) {
    console.error("Error updating medication:", error);
    return res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { deleterId } = req.body;
    if (!id) {
      return res
        .status(400)
        .json({ error: "Medication id parameter is required" });
    }
    if (!deleterId) {
      return res
        .status(400)
        .json({ error: "deleterId is required to delete a medication" });
    }

    const medication = await deleteMedication(id, deleterId);
    return res.status(200).json(medication);
  } catch (error) {
    console.error("Error deleting medication:", error.message);

    if (error.statusCode === 403) {
      return res.status(403).json({ error: error.message });
    }

    return res.status(400).json({ error: error.message });
  }
});

router.post("/:id/record-dose", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { takenBy, takenAt } = req.body;
    if (!id) {
      return res
        .status(400)
        .json({ error: "Medication id parameter is required" });
    }
    
    if (!takenBy) {
      return res
        .status(400)
        .json({ error: "takenBy is required to record a dose" });
    }

    const medication = await recordDose(id, takenBy, takenAt);
    return res.status(200).json(medication);
  } catch (error) {
    console.error("Error recording medication dose:", error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
