import express from "express";
import {
  logVital,
  getVitalsHistory,
  getLatestVitalsByType,
  deleteVitalById
} from "../data/vitalController.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const {
      groupId,
      userId,
      type,
      value,
      unit,
      recordedAt,
      notes,
    } = req.body;

    if (!groupId || !userId || !type || !value || !unit) {
      return res.status(400).json({
        error:
          "groupId, userId, type, value, and unit are required to log a vital",
      });
    }

    const vital = await logVital(
      groupId,
      userId,
      type,
      value,
      unit,
      recordedAt,
      notes
    );

    return res.status(201).json(vital);
  } catch (error) {
    console.error("Error logging vital:", error);
    return res.status(400).json({ error: error.message });
  }
});

router.get("/history", async (req, res) => {
  try {
    const { groupId, userId, type, from, to, rangeDays } = req.query;

    if (!groupId || !userId) {
      return res.status(400).json({
        error: "groupId and userId query parameters are required",
      });
    }

    const vitals = await getVitalsHistory(groupId, userId, {
      type,
      from,
      to,
      rangeDays,
    });

    return res.status(200).json(vitals);
  } catch (error) {
    console.error("Error fetching vitals history:", error);
    return res.status(400).json({ error: error.message });
  }
});

router.get("/latest", async (req, res) => {
  try {
    const { groupId, userId } = req.query;

    if (!groupId || !userId) {
      return res.status(400).json({
        error: "groupId and userId query parameters are required",
      });
    }

    const latest = await getLatestVitalsByType(groupId, userId);
    return res.status(200).json(latest);
  } catch (error) {
    console.error("Error fetching latest vitals:", error);
    return res.status(400).json({ error: error.message });
  }
});
router.delete("/:vitalId", async (req, res) => {
  try {
    const { vitalId } = req.params;
    const userId=req.body.userId;
    const groupId=req.body.groupId;
    if (!vitalId) {
      return res.status(400).json({
        error: "vitalId parameter is required",
      });
    }

    await deleteVitalById(vitalId, userId, groupId);
    return res.status(200).json({ message: "Vital deleted successfully" });
  } catch (error) {
    console.error("Error deleting vital:", error);
    return res.status(400).json({ error: error.message });
  }
});
export default router;
