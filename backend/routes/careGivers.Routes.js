import express from "express";
import mongoose from "mongoose";
import { createCareGiver, getCareGiverById, getAllCareGivers, getCareGiverByUserId, updateCareGiver, deleteCareGiver, getCareGiversBySkill, getCareGiversByCertification, searchCareGivers, } from "../data/careGiverController.js";
import { requireAuth } from "../middlewares/auth.js";

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const careGivers = await getAllCareGivers();
    return res.status(200).json(careGivers);
  } catch (error) {
    return res.status(500).json({ error: error.message });
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
    return res.status(500).json({ error: error.message });
  }
});//need to check

router.get("/user/:userId", requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ error: "userId must be a valid ObjectId" });
    }

    const careGiver = await getCareGiverByUserId(userId);
    console.log("careGiver", careGiver)

    return res.status(200).json(careGiver);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get("/skill/:skill", requireAuth, async (req, res) => {
  try {
    const { skill } = req.params;
    if (!skill) {
      return res.status(400).json({ error: "skill is required" });
    }
    const careGivers = await getCareGiversBySkill(skill);

    return res.status(200).json(careGivers);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get("/certification/:certification", requireAuth, async (req, res) => {
  try {
    const { certification } = req.params;
    if (!certification) {
      return res.status(400).json({ error: "certification is required" });
    }
    const careGivers = await getCareGiversByCertification(certification);

    return res.status(200).json(careGivers);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get("/search", requireAuth, async (req, res) => {
  try {
    const { term } = req.query;
    if (!term) {
      return res.status(400).json({ error: "search term is required" });
    }
    const careGivers = await searchCareGivers(term);

    return res.status(200).json(careGivers);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get("/:careGiverId", requireAuth, async (req, res) => {
  try {
    const { careGiverId } = req.params;
    if (!careGiverId) {
      return res.status(400).json({ error: "careGiverId is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(careGiverId)) {
      return res
        .status(400)
        .json({ error: "careGiverId must be a valid ObjectId" });
    }

    const careGiver = await getCareGiverById(careGiverId);

    return res.status(200).json(careGiver);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
router.put("/:careGiverId", requireAuth, async (req, res) => {
  try {
    const { careGiverId } = req.params;
    const updateData = req.body;
    if (!careGiverId) {
      return res.status(400).json({ error: "careGiverId is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(careGiverId)) {
      return res
        .status(400)
        .json({ error: "careGiverId must be a valid ObjectId" });
    }

    const updatedCareGiver = await updateCareGiver(careGiverId, updateData);

    return res.status(200).json(updatedCareGiver);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
router.delete("/:careGiverId", requireAuth, async (req, res) => {
  try {
    const { careGiverId } = req.params;
    if (!careGiverId) {
      return res.status(400).json({ error: "careGiverId is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(careGiverId)) {
      return res
        .status(400)
        .json({ error: "careGiverId must be a valid ObjectId" });
    }

    const result = await deleteCareGiver(careGiverId);

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
