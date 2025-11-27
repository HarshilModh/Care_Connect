import express from "express";
import mongoose from "mongoose";
import { createCareGiver, getCareGiverById, getAllCareGivers, getCareGiverByUserId, updateCareGiver, deleteCareGiver, getCareGiversBySkill, getCareGiversByCertification, searchCareGivers, } from "../data/careGiverController.js";
import { requireAuth } from "../middlewares/auth.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const careGivers = await getAllCareGivers();
    return res.status(200).json(careGivers);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});
router.post("/", requireAuth, async (req, res) => {
  try {
    let {
      bio,
      experienceYears,
      skills,
      certifications,
      availability,
      rate,
    } = req.body;
    const userId = req.user._id.toString();
    console.log("userId", userId)

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ error: "userId must be a valid ObjectId" });
    }

    const careGiver = await createCareGiver(
      userId,
      bio,
      experienceYears,
      skills,
      certifications,
      availability,
      rate
    );

    return res.status(201).json(careGiver);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ error: "userId must be a valid ObjectId" });
    }

    const careGiver = await getCareGiverByUserId(userId);

    return res.status(200).json(careGiver);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.get("/skill/:skill", async (req, res) => {
  try {
    const { skill } = req.params;

    const careGivers = await getCareGiversBySkill(skill);

    return res.status(200).json(careGivers);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.get("/certification/:certification", async (req, res) => {
  try {
    const { certification } = req.params;

    const careGivers = await getCareGiversByCertification(certification);

    return res.status(200).json(careGivers);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.get("/search", async (req, res) => {
  try {
    const { term } = req.query;

    const careGivers = await searchCareGivers(term);

    return res.status(200).json(careGivers);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.get("/:careGiverId", async (req, res) => {
  try {
    const { careGiverId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(careGiverId)) {
      return res
        .status(400)
        .json({ error: "careGiverId must be a valid ObjectId" });
    }

    const careGiver = await getCareGiverById(careGiverId);

    return res.status(200).json(careGiver);
  } catch (error) {
    return res.status(404).json({ error: error.message });
  }
});
router.put("/:careGiverId", async (req, res) => {
  try {
    const { careGiverId } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(careGiverId)) {
      return res
        .status(400)
        .json({ error: "careGiverId must be a valid ObjectId" });
    }

    const updatedCareGiver = await updateCareGiver(careGiverId, updateData);

    return res.status(200).json(updatedCareGiver);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});
router.delete("/:careGiverId", async (req, res) => {
  try {
    const { careGiverId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(careGiverId)) {
      return res
        .status(400)
        .json({ error: "careGiverId must be a valid ObjectId" });
    }

    const result = await deleteCareGiver(careGiverId);

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

export default router;
