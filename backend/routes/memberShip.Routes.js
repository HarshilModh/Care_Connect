import mongoose from "mongoose";
import {
    createMembership, countMembershipsInGroup, deleteMembership, getActiveMemberships,
    getAllMemberships, getMembershipById, getMembershipsByRole, getMembershipsByGroupId,
    getMembershipsByUserId, getPendingMemberships
    , getRemovedMemberships, updateMembership,
    updateMembershipRole, updateMembershipStatus,
    createMultipleMemberships
}
    from "../data/memberShipController.js";
import { Membership } from "../models/memberShip.model.js";
import express from "express";
import { CareRecipient } from "../models/careRecipients.model.js";
const router = express.Router();


//Fix values
//role string [enum: owner, caregiver, family]
// status string [enum: active, pending, removed]


//Create Membership
router.post("/", async (req, res) => {
    try {
        let groupId = req.body.groupId;
        let userId = req.body.userId;
        let role = req.body.role
        let status = req.body.status
        let permissions = req.body.permissions || {};
        console.log("role", role);
        console.log("groupId", groupId);
        console.log("userId", userId);
        if (!groupId || !userId) {
            return res.status(400).json({ error: "Group ID and User ID are required" });
        }
        if (!role) {
            role = "family";
        }
        if (!status) {
            status = "pending";
        }
        if (!mongoose.Types.ObjectId.isValid(groupId)) {
            return res.status(400).json({ error: 'Invalid Group ID' });
        }
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: 'Invalid User ID' });
        }
        if (!["admin", "careGiver", "familyMember", "readonly", "careRecipient"].includes(role)) {
            return res.status(400).json({ error: "Invalid role value" });
        }
        if (!["active", "pending", "removed"].includes(status)) {
            return res.status(400).json({ error: "Invalid status value" });
        }
        if (permissions && typeof permissions !== "object") {
            return res.status(400).json({ error: "Permissions must be an object" });
        }

        //check if user is already in the group
        const isMember = await Membership.findOne({ groupId, userId });
        if (isMember) {
            return res.status(400).json({ error: "User is already a member of this group" });
        }
        const membershipData = {
            groupId,
            userId,
            role,
            status,
            permissions
        };
        const newMembership = await createMembership(membershipData);
        res.status(200).json(newMembership);
    } catch (error) {
        console.log(error);

        res.status(500).json({ error: error.message });
    }
});

//Create Multiple Memberships
router.post("/bulk", async (req, res) => {
    try {
        const memberships = req.body.memberships;
        console.log("memberships", memberships)
        if (!memberships || !Array.isArray(memberships) || memberships.length === 0) {
            return res.status(400).json({ error: "Memberships array is required" });
        }
        const validMemberships = [];
        for (const membership of memberships) {
            let { groupId, userId, role, status, permissions } = membership;
            if (!groupId || !userId) {
                return res.status(400).json({ error: "Group ID and User ID are required for each membership" });
            }
            if (!mongoose.Types.ObjectId.isValid(groupId)) {
                return res.status(400).json({ error: 'Invalid Group ID' });
            }
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(400).json({ error: 'Invalid User ID' });
            }
            if (!role) {
                role = "family";
            }
            if (!status) {
                status = "pending";
            }
            if (!["admin", "careGiver", "familyMember", "readonly", "careRecipient"].includes(role)) {
                return res.status(400).json({ error: "Invalid role value in one of the memberships" });
            }
            if (!["active", "pending", "removed"].includes(status)) {
                return res.status(400).json({ error: "Invalid status value in one of the memberships" });
            }
            if (permissions && typeof permissions !== "object") {
                return res.status(400).json({ error: "Permissions must be an object in one of the memberships" });
            }
            //check if user is already in the group
            const isMember = await Membership.findOne({ groupId, userId });
            if (isMember) {
                return res.status(400).json({ error: `User ${userId} is already a member of group ${groupId}` });
            }
            validMemberships.push({
                groupId,
                userId,
                role,
                status,
                permissions: permissions || {}
            });
        }

        const newMemberships = await createMultipleMemberships(validMemberships);
        res.status(200).json(newMemberships);
    } catch (error) {
        console.log(error);

        res.status(500).json({ error: error.message });
    }
});
//Get Memberships by User ID
router.get("/user/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: 'Invalid User ID' });
        }
        const memberships = await getMembershipsByUserId(userId);
        res.status(200).json(memberships);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
//Get Memberships by Group ID
router.get("/group/:groupId", async (req, res) => {
    try {
        const groupId = req.params.groupId;
        if (!groupId) {
            return res.status(400).json({ error: 'Group ID is required' });
        }
        if (!mongoose.Types.ObjectId.isValid(groupId)) {
            return res.status(400).json({ error: 'Invalid Group ID' });
        }
        const memberships = await getMembershipsByGroupId(groupId);
        res.status(200).json(memberships);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
//Update Membership Role
router.put("/:membershipId/role", async (req, res) => {
    try {
        const membershipId = req.params.membershipId;
        const role = req.body.role;
        if (!membershipId) {
            return res.status(400).json({ error: 'Membership ID is required' });
        }
        if (!role) {
            return res.status(400).json({ error: 'Role is required' });
        }
        if (!mongoose.Types.ObjectId.isValid(membershipId)) {
            return res.status(400).json({ error: 'Invalid Membership ID' });
        }
        if (!role || typeof role !== "string" || role.trim().length === 0) {
            return res.status(400).json({ error: 'Invalid role' });
        }
        if (!["admin", "careGiver", "familyMember", "readonly", "careRecipient"].includes(role)) {
            return res.status(400).json({ error: 'Role must be one of owner, caregiver, family' });
        }

        const updatedMembership = await updateMembershipRole(membershipId, role);
        res.status(200).json(updatedMembership);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
//Update Membership Status
router.put("/:membershipId/status", async (req, res) => {
    try {
        const membershipId = req.params.membershipId;
        const status = req.body.status;
        if (!membershipId) {
            return res.status(400).json({ error: 'Membership ID is required' });
        }
        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }
        if (!mongoose.Types.ObjectId.isValid(membershipId)) {
            return res.status(400).json({ error: 'Invalid Membership ID' });
        }
        if (!status || typeof status !== "string" || status.trim().length === 0) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        if (!["active", "pending", "removed"].includes(status)) {
            return res.status(400).json({ error: 'Status must be one of active, pending, removed' });
        }

        const updatedMembership = await updateMembershipStatus(membershipId, status);
        res.status(200).json(updatedMembership);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//Delete Membership
router.delete("/:membershipId", async (req, res) => {
    try {
        const membershipId = req.params.membershipId;
        if (!membershipId) {
            return res.status(400).json({ error: 'Membership ID is required' });
        }
        if (!mongoose.Types.ObjectId.isValid(membershipId)) {
            return res.status(400).json({ error: 'Invalid Membership ID' });
        }
        const deletedMembership = await deleteMembership(membershipId);
        res.status(200).json(deletedMembership);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//Count Memberships in Group
router.get("/group/:groupId/count", async (req, res) => {
    try {
        const groupId = req.params.groupId;
        if (!groupId) {
            return res.status(400).json({ error: 'Group ID is required' });
        }
        if (!mongoose.Types.ObjectId.isValid(groupId)) {
            return res.status(400).json({ error: 'Invalid Group ID' });
        }
        const count = await countMembershipsInGroup(groupId);
        res.status(200).json({ count });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//getActiveMemberships
router.get("/active", async (req, res) => {
    try {
        const memberships = await getActiveMemberships();
        res.status(200).json(memberships);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
//getPendingMemberships
router.get("/pending", async (req, res) => {
    try {
        const memberships = await getPendingMemberships();
        res.status(200).json(memberships);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
//getRemovedMemberships
router.get("/removed", async (req, res) => {
    try {
        const memberships = await getRemovedMemberships();
        res.status(200).json(memberships);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
//getAllMemberships
router.get("/", async (req, res) => {
    try {
        const memberships = await getAllMemberships();
        res.status(200).json(memberships);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
//Get Membership by ID
router.get("/:membershipId", async (req, res) => {
    try {
        const membershipId = req.params.membershipId;
        if (!membershipId) {
            return res.status(400).json({ error: 'Membership ID is required' });
        }
        if (!mongoose.Types.ObjectId.isValid(membershipId)) {
            return res.status(400).json({ error: 'Invalid Membership ID' });
        }
        const membership = await getMembershipById(membershipId);
        res.status(200).json(membership);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
//getMembershipsByRole  
router.get("/role/:role", async (req, res) => {
    try {
        const role = req.params.role;
        if (!role) {
            return res.status(400).json({ error: 'Role is required' });
        }
        if (!["admin", "careGiver", "familyMember", "readonly", "careRecipient"].includes(role)) {
            return res.status(400).json({ error: 'Role must be one of owner, caregiver, family' });
        }
        const memberships = await getMembershipsByRole(role);
        res.status(200).json(memberships);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
//updateMembership
router.put("/:membershipId", async (req, res) => {
    try {
        const membershipId = req.params.membershipId;
        let groupId = req.body.groupId;
        let userId = req.body.userId;
        let role = req.body.role;
        let status = req.body.status;
        let permissions = req.body.permissions;
        const updateData = {};
        if (groupId) {
            if (!mongoose.Types.ObjectId.isValid(groupId)) {
                return res.status(400).json({ error: 'Invalid Group ID' });
            }
            updateData.groupId = groupId;
        }
        if (userId) {
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(400).json({ error: 'Invalid User ID' });
            }
            updateData.userId = userId;
        }
        if (role) {
            if (!["admin", "careGiver", "familyMember", "readonly", "careRecipient"].includes(role)) {
                return res.status(400).json({ error: 'Role must be one of owner, caregiver, family' });
            }
            updateData.role = role;
        }
        if (status) {
            if (!["active", "pending", "removed"].includes(status)) {
                return res.status(400).json({ error: 'Status must be one of active, pending, removed' });
            }
            updateData.status = status;
        }
        if (permissions) {
            if (typeof permissions !== "object") {
                return res.status(400).json({ error: 'Permissions must be an object' });
            }
            updateData.permissions = permissions;
        }
        if (!membershipId) {
            return res.status(400).json({ error: 'Membership ID is required' });
        }
        if (!mongoose.Types.ObjectId.isValid(membershipId)) {
            return res.status(400).json({ error: 'Invalid Membership ID' });
        }
        const updatedMembership = await updateMembership(membershipId, updateData);
        res.status(200).json(updatedMembership);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//Export Router
export default router;

//all routes testing listed below
//http://localhost:3000/api/memberships/ (GET, POST)
//http://localhost:3000/api/memberships/bulk (POST)
//http://localhost:3000/api/memberships/user/:userId (GET)
//http://localhost:3000/api/memberships/group/:groupId (GET)
//http://localhost:3000/api/memberships/:membershipId/role (PUT)
//http://localhost:3000/api/memberships/:membershipId/status (PUT)
//http://localhost:3000/api/memberships/:membershipId (DELETE, GET, PUT)
//http://localhost:3000/api/memberships/group/:groupId/count (GET)
//http://localhost:3000/api/memberships/active (GET)
//http://localhost:3000/api/memberships/pending (GET)
//http://localhost:3000/api/memberships/removed (GET)
//http://localhost:3000/api/memberships/role/:role (GET)    