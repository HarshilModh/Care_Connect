import memberShipModel from "../models/memberShip.model.js";
import  FamilyGroup  from "../models/familyGroups.model.js";
import User from "../models/user.model.js";
import { isValidID } from "../utils/validation.utils.js";


//need to update role values in create and update functions
//Data Functions
//Create Membership


//role string [enum: owner, caregiver, family]
// status string [enum: active, pending, removed]


export const createMembership = async (groupId, userId, role , status, permissions) => {
  try {
    if (!groupId || !userId){
        throw new Error("Group ID and User ID are required");
    }
    if (!isValidID(groupId)) {
        throw new Error("Invalid group ID");
    }
    if (!isValidID(userId)) {
        throw new Error("Invalid user ID");
    }

    const validRoles = ["owner", "caregiver", "family", "readonly"];
    const validStatuses = ["active", "pending", "removed"];
    if (!validRoles.includes(role)) throw new Error("Invalid role value");
    if (!validStatuses.includes(status)) throw new Error("Invalid status value");

    if (permissions && typeof permissions !== "object") {
      throw new Error("Permissions must be an object");
    }

    const [group, user, existing] = await Promise.all([
      FamilyGroup.findById(groupId).lean(),
      User.findById(userId).lean(),
      Membership.findOne({ groupId, userId }).lean()
    ]);
    if (!group) {
        throw new Error("Family group not found");
    }
    if (!user) {
        throw new Error("User not found");
    }
    if (existing) {
        throw new Error("Membership already exists for this user in the group");
    }

    const created = await memberShipModel.create({
      groupId,
      userId,
      role,
      status,
      permissions: permissions || {}
    });
    return created.toObject();
  } catch (error) {
    throw new Error("Error creating membership: " + error.message);
  }
};

export const getMembershipById = async (membershipId) => {
  try {
    if (!membershipId){
        throw new Error("Membership ID is required");
    }
    if (!isValidID(membershipId)) {
        throw new Error("Invalid membership ID");
    }
    const membership = await memberShipModel.findById(membershipId).lean();
    return membership;
  } catch (error) {
    throw new Error("Error fetching membership: " + error.message);
  }
};

// prefer soft delete  keep this only if you truly want a hard delete
export const deleteMembership = async (membershipId) => {
  try {
    if (!membershipId) {
        throw new Error("Membership ID is required");
    }
    if (!isValidID(membershipId)) {
        throw new Error("Invalid membership ID");
    }
    await memberShipModel.findByIdAndDelete(membershipId);
    return { message: "Membership deleted successfully" };
  } catch (error) {
    throw new Error("Error deleting membership: " + error.message);
  }
};

//Update Membership
export const updateMembership = async (membershipId, groupId, userId, role, status, permissions,) => {
    try {
        if(!membershipId){
            throw new Error('Membership ID is required');
        }
        if(!isValidID(membershipId)){
            throw new Error('Invalid membership ID');
        }
        const updateData = {};
        if(groupId){
            if(!isValidID(groupId)){
                throw new Error('Invalid group ID');
            }
            updateData.groupId = groupId;
        }
        if(userId){
            if(!isValidID(userId)){
                throw new Error('Invalid user ID');
            }
            updateData.userId = userId;
        }
        if(role){
            if(!['owner','caregiver','family'].includes(role)){
                throw new Error('Invalid role value');
            }
            updateData.role = role;
        }
        if(status){
            if(!['active','pending','removed'].includes(status)){
                throw new Error('Invalid status value');
            }
            updateData.status = status;
        }
        if(permissions){
            if(typeof permissions !== 'object'){
                throw new Error('Permissions must be an object');
            }
            for(const key in permissions){
                if(typeof permissions[key] !== 'boolean'){
                    throw new Error('Permission values must be boolean');
                }
            }
            updateData.permissions = permissions;
        }   
        if(Object.keys(updateData).length === 0){
            throw new Error('No valid fields to update');
        }
        const updatedMembership = await memberShipModel.findByIdAndUpdate(
            membershipId,
            updateData,
            { new: true }
        );
        return updatedMembership;
    } catch (error) {
        throw new Error('Error updating membership: ' + error.message);
    }
};



//Get All Memberships
export const getAllMemberships = async () => {
    try {
        const memberships = await memberShipModel.find();
        return memberships;
    } catch (error) {
        throw new Error('Error fetching memberships: ' + error.message);
    }
};

//Get Memberships by User ID
export const getMembershipsByUserId = async (userId) => {
    try {
        if(!userId){
            throw new Error('User ID is required');
        }
        if(!isValidID(userId)){
            throw new Error('Invalid user ID');
        }
        const memberships = await memberShipModel.find({ userId });
        return memberships;
    } catch (error) {
        throw new Error('Error fetching memberships: ' + error.message);
    }   
};

//Get Memberships by Group ID
export const getMembershipsByGroupId = async (groupId) => {
    try {
        if(!groupId){
            throw new Error('Group ID is required');
        }
        if(!isValidID(groupId)){
            throw new Error('Invalid group ID');
        }
        const memberships = await memberShipModel.find({ groupId });
        return memberships;
    } catch (error) {
        throw new Error('Error fetching memberships: ' + error.message);
    }
};

//Update Membership Role
export const updateMembershipRole = async (membershipId, role) => {
    try {
        if(!membershipId){
            throw new Error('Membership ID is required');
        }
        if(!isValidID(membershipId)){
            throw new Error('Invalid membership ID');
        }
        if(!['owner','caregiver','family'].includes(role)){
            throw new Error('Invalid role value');
        }
        const updatedMembership = await memberShipModel.findByIdAndUpdate(
            membershipId,
            { role },
            { new: true }
        );
        return updatedMembership;
    } catch (error) {
        throw new Error('Error updating membership role: ' + error.message);
    }
};

//Update Membership Status
export const updateMembershipStatus = async (membershipId, status) => {
    try {
        if(!membershipId){
            throw new Error('Membership ID is required');
        }
        if(!isValidID(membershipId)){
            throw new Error('Invalid membership ID');
        }
        if(!['active','pending','removed'].includes(status)){
            throw new Error('Invalid status value');
        }
        const updatedMembership = await memberShipModel.findByIdAndUpdate(
            membershipId,
            { status },
            { new: true }
        );
        return updatedMembership;
    } catch (error) {
        throw new Error('Error updating membership status: ' + error.message);
    }
};

//Update Membership Permissions
export const updateMembershipPermissions = async (membershipId, permissions) => {
 
};

//Count Memberships in Group
export const countMembershipsInGroup = async (groupId) => {
    try {
        if(!groupId){
            throw new Error('Group ID is required');
        }
        if(!isValidID(groupId)){
            throw new Error('Invalid group ID');
        }
        const count = await memberShipModel.countDocuments({ groupId });
        return count;
    } catch (error) {
        throw new Error('Error counting memberships: ' + error.message);
    }
};

//Get Recent Memberships
export const getRecentMemberships = async (limit) => {

};

//Search Memberships
export const searchMemberships = async (searchTerm) => {};

//Get Memberships by Role
export const getMembershipsByRole = async (role) => {
    try{
        const members=await memberShipModel.find({role})
        return members
    }
    catch(error){
        throw new Error('Error fetching memberships by role: ' + error.message);
    }
};

//Get Active Memberships
export const getActiveMemberships = async () => {
    try{
        const activeMemberships = await memberShipModel.find({ status: 'active' });
        return activeMemberships;
    } catch (error) {
        throw new Error('Error fetching active memberships: ' + error.message);
    }
};

//Get Pending Memberships
export const getPendingMemberships = async () => {
    try{
        const pendingMemberships = await memberShipModel.find({ status: 'pending' });
        return pendingMemberships;
    } catch (error) {
        throw new Error('Error fetching pending memberships: ' + error.message);
    }
};

//Get Removed Memberships
export const getRemovedMemberships = async () => {
    try{
        const removedMemberships = await memberShipModel.find({ status: 'removed' });
        return removedMemberships;
    } catch (error) {
        throw new Error('Error fetching removed memberships: ' + error.message);
    }
};
//Get Memberships with Specific Permission
export const getMembershipsWithPermission = async (permissionKey, permissionValue) => {};
