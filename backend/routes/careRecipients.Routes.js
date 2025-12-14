import express from "express";
import {
  createCareRecipient,
  getCareRecipientById,
  getAllCareRecipients,
  getCareRecipientsByGroupId,
  getCareRecipientsByUserId,
  updateCareRecipient,
  deleteCareRecipient,
  searchCareRecipients,
  getCareRecipientsByPrimaryCondition,
} from "../data/careRecipientsController.js";
import { requireAuth } from "../middlewares/auth.js";
const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const recipients = await getAllCareRecipients();
    return res.status(200).json(recipients);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
router.post("/", requireAuth, async (req, res) => {
  try {
    const { groupId, userId, dob, primaryCondition, notes, emergencyContacts } =
      req.body;
    if (!groupId || !userId || !dob || !primaryCondition) {
      return res.status(400).json({
        error: "groupId, userId, dob, and primaryCondition are required",
      });
    }
    const newRecipient = await createCareRecipient(
      groupId,
      userId,
      dob,
      primaryCondition,
      notes,
      emergencyContacts
    );

    return res.status(201).json(newRecipient);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get("/group/:groupId", requireAuth, async (req, res) => {
  try {
    const { groupId } = req.params;
    if (!groupId) {
      return res.status(400).json({ error: "groupId is required" });
    }
    console.log("Fetching care recipients for groupId:", groupId);

    const recipients = await getCareRecipientsByGroupId(groupId);
    console.log("Recipients found:", recipients);
    return res.status(200).json(recipients);
  } catch (error) {
    console.error("Error in /group/:groupId route:", error);
    return res.status(500).json({ error: error.message });
  }
});

router.get("/user/:userId", requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }
    const recipients = await getCareRecipientsByUserId(userId);
    console.log("recipients", recipients);

    return res.status(200).json(recipients);
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
    const recipients = await searchCareRecipients(term);

    return res.status(200).json(recipients);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get("/condition/:condition", requireAuth, async (req, res) => {
  try {
    const { condition } = req.params;
    if (!condition) {
      return res.status(400).json({ error: "condition is required" });
    }
    const recipients = await getCareRecipientsByPrimaryCondition(condition);

    return res.status(200).json(recipients);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "id is required" });
    }
    const recipient = await getCareRecipientById(id);
    console.log("Recipient: ", recipient);

    return res.status(200).json(recipient);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
router.put("/:id", requireAuth, async (req, res) => {
  try {
    console.log("Update request body:", req.body);
    const { id } = req.params;
    const updateData = req.body;
    if (!id) {
      return res.status(400).json({ error: "id is required" });
    }
    const updatedRecipient = await updateCareRecipient(id, updateData);

    return res.status(200).json(updatedRecipient);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "id is required" });
    }
    const result = await deleteCareRecipient(id);

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
