import express from "express";
import {
  logVital,
  getVitalsHistory,
  getLatestVitalsByType,
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

export default router;
