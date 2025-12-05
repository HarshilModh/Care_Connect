import express from "express";
import { createCareRecipient, getCareRecipientById, getAllCareRecipients, getCareRecipientsByGroupId, getCareRecipientsByUserId, updateCareRecipient, deleteCareRecipient, searchCareRecipients, getCareRecipientsByPrimaryCondition, } from "../data/careRecipientsController.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const recipients = await getAllCareRecipients();
    return res.status(200).json(recipients);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});
router.post("/", async (req, res) => {
  try {
    const {
      groupId,
      userId,
      dob,
      primaryCondition,
      notes,
      emergencyContacts,
    } = req.body;

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
    return res.status(400).json({ error: error.message });
  }
});


router.get("/group/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params;

    const recipients = await getCareRecipientsByGroupId(groupId);

    return res.status(200).json(recipients);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});


router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const recipients = await getCareRecipientsByUserId(userId);
    console.log("recipients", recipients);

    return res.status(200).json(recipients);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});


router.get("/search", async (req, res) => {
  try {
    const { term } = req.query;

    const recipients = await searchCareRecipients(term);

    return res.status(200).json(recipients);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});


router.get("/condition/:condition", async (req, res) => {
  try {
    const { condition } = req.params;

    const recipients = await getCareRecipientsByPrimaryCondition(condition);

    return res.status(200).json(recipients);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});


router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const recipient = await getCareRecipientById(id);
    console.log("Recipient: ", recipient);

    return res.status(200).json(recipient);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});
router.put("/:id", async (req, res) => {
  try {
    console.log("Update request body:", req.body);
    const { id } = req.params;
    const updateData = req.body;

    const updatedRecipient = await updateCareRecipient(id, updateData);

    return res.status(200).json(updatedRecipient);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await deleteCareRecipient(id);

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

export default router;

