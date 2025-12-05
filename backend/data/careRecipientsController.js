import { CareRecipient } from "../models/careRecipients.model.js";
import { isValidArray, isValidID, isValidString } from '../utils/validation.utils.js';
import { Membership } from "../models/memberShip.model.js";

//Data Functions

//Create Care Recipient
export const createCareRecipient = async (groupId, userId, dob, primaryCondition, notes, emergencyContacts) => {
    try {
        if (!groupId || !userId) {
            throw new Error("groupId and userId are required to create a care recipient");
        }

        groupId = isValidID(groupId);
        userId = isValidID(userId);

        //need to check the date format coming from frontend
        let dobDate = null;
        if (dob) {
            const parsed = new Date(dob);
            if (isNaN(parsed.getTime())) {
                throw new Error("Invalid date format for dob");
            }
            dobDate = parsed;
        }

        if (primaryCondition) {
            primaryCondition = isValidString(primaryCondition, "primaryCondition");
        }
        if (notes) {
            notes = isValidString(notes, "notes");
        }

        let formattedContacts = [];
        if (emergencyContacts) {
            if (!Array.isArray(emergencyContacts)) {
                throw new Error("emergencyContacts must be an array");
            }

            formattedContacts = emergencyContacts.map((contact, index) => {
                if (!contact || typeof contact !== "object") {
                    throw new Error(
                        `Emergency contact at index ${index} must be an object`
                    );
                }

                const { name, phone, relation } = contact;

                if (!name || typeof name !== "string" || name.trim().length === 0) {
                    throw new Error(
                        `Emergency contact at index ${index} is missing a valid name`
                    );
                }

                if (!phone || typeof phone !== "string" || phone.trim().length === 0) {
                    throw new Error(
                        `Emergency contact at index ${index} is missing a valid phone`
                    );
                }

                const cleaned = {
                    name: name.trim(),
                    phone: phone.trim(),
                };

                if (relation && typeof relation === "string" && relation.trim().length) {
                    cleaned.relation = relation.trim();
                }

                return cleaned;
            });
        }

        const existing = await CareRecipient.findOne({ groupId, userId }).lean();
        if (existing) {
            throw new Error(
                "Care recipient already exists for this user in this group"
            );
        }

        const newRecipient = await CareRecipient.create({
            groupId,
            userId,
            dob: dobDate,
            primaryCondition,
            notes,
            emergencyContacts: formattedContacts,
        });

        try {
            const updateResult = await Membership.updateOne(
                {
                    groupId,
                    userId,
                    role: "careRecipient",
                    // optional guard if you only want to flip from required:
                    // onboardingStatus: "required",
                },
                {
                    $set: { onboardingStatus: "completed" },
                }
            );

            if (updateResult.matchedCount === 0) {
                console.warn(
                    `No Membership found to update onboardingStatus for careRecipient: userId=${userId}, groupId=${groupId}`
                );
            }
        } catch (err) {
            console.error(
                "Failed to update onboardingStatus for careRecipient membership:",
                err
            );
        }

        return newRecipient;

    } catch (error) {
        throw new Error("Error creating care recipient: " + error.message);
    }
};

//Get Care Recipient by ID
export const getCareRecipientById = async (careRecipientId) => {
    try {
        if (!careRecipientId || !isValidID(careRecipientId)) {
            throw new Error("Invalid or missing careRecipientId");
        }

        const recipient = await CareRecipient.findById(careRecipientId).populate("userId", "firstName lastName");

        if (!recipient) {
            throw new Error("Care recipient not found");
        }

        return recipient;
    } catch (error) {
        throw new Error("Error fetching care recipient: " + error.message);
    }


};

//Update Care Recipient
export const updateCareRecipient = async (careRecipientId, updateData) => {
    try {
        if (!careRecipientId || !isValidID(careRecipientId)) {
            throw new Error("Invalid or missing careRecipientId");
        }
        if (!updateData || typeof updateData !== "object") {
            throw new Error("Update data must be a valid object");
        }

        const { dob, primaryCondition, notes, emergencyContacts } = updateData;
        const updates = {};

        if (dob !== undefined) {
            if (dob === null || dob === "") {
                // allow clearing dob
                updates.dob = null;
            } else {
                const parsed = new Date(dob);
                if (isNaN(parsed.getTime())) {
                    throw new Error("Invalid date format for dob");
                }
                updates.dob = parsed;
            }
        }

        if (primaryCondition !== undefined) {
            if (primaryCondition === null || primaryCondition === "") {
                updates.primaryCondition = undefined;
            } else {
                updates.primaryCondition = isValidString(
                    primaryCondition,
                    "primaryCondition"
                );
            }
        }

        if (notes !== undefined) {
            if (notes === null || notes === "") {
                updates.notes = undefined; // effectively remove
            } else {
                updates.notes = isValidString(notes, "notes");
            }
        }

        if (emergencyContacts !== undefined) {
            if (emergencyContacts === null) {
                // allow wiping all contacts
                updates.emergencyContacts = [];
            } else {
                if (!Array.isArray(emergencyContacts)) {
                    throw new Error("emergencyContacts must be an array");
                }

                updates.emergencyContacts = emergencyContacts.map((contact, index) => {
                    if (!contact || typeof contact !== "object") {
                        throw new Error(
                            `Emergency contact at index ${index} must be an object`
                        );
                    }

                    const { name, phone, relation } = contact;

                    if (!name || typeof name !== "string" || name.trim().length === 0) {
                        throw new Error(
                            `Emergency contact at index ${index} is missing a valid name`
                        );
                    }

                    if (!phone || typeof phone !== "string" || phone.trim().length === 0) {
                        throw new Error(
                            `Emergency contact at index ${index} is missing a valid phone`
                        );
                    }

                    const cleaned = {
                        name: name.trim(),
                        phone: phone.trim(),
                    };

                    if (relation && typeof relation === "string" && relation.trim().length) {
                        cleaned.relation = relation.trim();
                    }

                    return cleaned;
                });
            }
        }

        if (Object.keys(updates).length === 0) {
            throw new Error("No valid fields to update");
        }

        const updatedRecipient = await CareRecipient.findByIdAndUpdate(
            careRecipientId,
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!updatedRecipient) {
            throw new Error("Care recipient not found");
        }

        return updatedRecipient;
    } catch (error) {
        throw new Error("Error updating care recipient: " + error.message);
    }
};

//Delete Care Recipient
export const deleteCareRecipient = async (careRecipientId) => {
    try {
        if (!careRecipientId) {
            throw new Error("careRecipientId is required");
        }

        if (!isValidID(careRecipientId)) {
            throw new Error("Invalid careRecipientId");
        }

        await CareRecipient.findByIdAndDelete(careRecipientId);

        return { message: "Care recipient deleted successfully" };
    } catch (error) {
        throw new Error("Error deleting care recipient: " + error.message);
    }
};

//Get All Care Recipients
export const getAllCareRecipients = async () => {
    try {
        const recipients = await CareRecipient.find();
        if (!recipients || recipients.length === 0) {
            throw new Error("No care recipients found");
        }
        return recipients;
    } catch (error) {
        throw new Error("Error fetching care recipients: " + error.message);
    }
};

//Get Care Recipients by Group ID
export const getCareRecipientsByGroupId = async (groupId) => {
    try {
        if (!groupId || !isValidID(groupId)) {
            throw new Error("Invalid or missing groupId");
        }

        const recipients = await CareRecipient.find({ groupId }).populate("userId", "firstName lastName");
        if (!recipients || recipients.length === 0) {
            throw new Error("No care recipients found for this group");
        }
        return recipients;
    } catch (error) {
        throw new Error("Error fetching care recipients by groupId: " + error.message);
    }
};

//Get Care Recipients by User ID
export const getCareRecipientsByUserId = async (userId) => {
    try {
        if (!userId || !isValidID(userId)) {
            throw new Error("Invalid or missing userId");
        }

        const recipients = await CareRecipient.find({ userId });

        if (!recipients || recipients.length === 0) {
            throw new Error("No care recipients found");
        }

        return recipients;

    } catch (error) {
        throw new Error("Error fetching care recipients by userId: " + error.message);
    }
};

//Search Care Recipients
export const searchCareRecipients = async (searchTerm) => {
    try {
        if (!searchTerm) {
            throw new Error("Search term is required");
        }

        const cleanedTerm = isValidString(searchTerm, "searchTerm");

        const regex = new RegExp(cleanedTerm, "i");

        const recipients = await CareRecipient.find({
            $or: [
                { primaryCondition: regex },
                { notes: regex },
                { "emergencyContacts.name": regex },
                { "emergencyContacts.relation": regex }
            ]
        });

        if (!recipients || recipients.length === 0) {
            throw new Error("No care recipients found matching the search term");
        }

        return recipients;
    } catch (error) {
        throw new Error("Error searching care recipients: " + error.message);
    }
};

//Count Care Recipients
export const countCareRecipients = async () => {
    try {
        const total = await CareRecipient.countDocuments({});
        if (total === 0) {
            throw new Error("No care recipients found");
        }
        return total
    } catch (error) {
        throw new Error("Error counting care recipients: " + error.message);
    }
};

//Get Recent Care Recipients
export const getRecentCareRecipients = async (limit) => {
    try {
        const limitNum = parseInt(limit, 10) || 10;

        if (limitNum < 1 || limitNum > 100) {
            throw new Error("Limit must be between 1 and 100");
        }

        const recipients = await CareRecipient.find()
            .sort({ createdAt: -1 })
            .limit(limitNum);

        if (!recipients || recipients.length === 0) {
            throw new Error("No recent care recipients found");
        }

        return recipients
    } catch (error) {
        throw new Error("Error fetching recent care recipients: " + error.message);
    }
};

//Get Care Recipients by Primary Condition
export const getCareRecipientsByPrimaryCondition = async (condition) => {
    try {
        if (!condition) {
            throw new Error("Condition is required");
        }

        const cleanedCondition = isValidString(condition, "condition");

        const recipients = await CareRecipient.find({
            primaryCondition: { $regex: new RegExp(cleanedCondition, "i") }
        });

        if (!recipients || recipients.length === 0) {
            throw new Error("No care recipients found with this primary condition");
        }

        return recipients;
    } catch (error) {
        throw new Error("Error fetching care recipients by primary condition: " + error.message)
    }
};

//Get Care Recipients with Emergency Contacts
export const getCareRecipientsWithEmergencyContacts = async () => {
    try {
        const recipients = await CareRecipient.find({
            "emergencyContacts.0": { $exists: true }
        });

        if (!recipients || recipients.length === 0) {
            throw new Error("No care recipients found with emergency contacts");
        }

        return recipients;


    } catch (error) {
        throw new Error("Error fetching care recipients with emergency contacts: " + error.message)
    }
};

//Get Care Recipients by DOB Range
export const getCareRecipientsByDOBRange = async (startDate, endDate) => {
    try {
        if (!startDate || !endDate) {
            throw new Error("Both startDate and endDate are required");
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            throw new Error("Invalid date format for startDate or endDate");
        }

        if (start > end) {
            throw new Error("startDate must be before or equal to endDate");
        }

        const recipients = await CareRecipient.find({
            dob: { $gte: start, $lte: end }
        });

        if (!recipients || recipients.length === 0) {
            throw new Error("No care recipients found in this DOB range");
        }

        return recipients;
    } catch (error) {
        throw new Error("Error fetching care recipients by DOB range: " + error.message)
    }
};

//Update Care Recipient Emergency Contacts
export const updateCareRecipientEmergencyContacts = async (careRecipientId, emergencyContacts) => {
    try {
        if (!careRecipientId || !isValidID(careRecipientId)) {
            throw new Error("Invalid or missing careRecipientId");
        }

        let contactsToSave = [];

        if (emergencyContacts === null) {
            // Explicitly clear all contacts
            contactsToSave = [];
        } else {
            if (!Array.isArray(emergencyContacts)) {
                throw new Error("emergencyContacts must be an array or null");
            }
            contactsToSave = emergencyContacts.map((contact, index) => {
                if (!contact || typeof contact !== "object") {
                    throw new Error(
                        `Emergency contact at index ${index} must be an object`
                    );
                }

                const { name, phone, relation } = contact;

                if (!name || typeof name !== "string" || name.trim().length === 0) {
                    throw new Error(
                        `Emergency contact at index ${index} is missing a valid name`
                    );
                }

                if (!phone || typeof phone !== "string" || phone.trim().length === 0) {
                    throw new Error(
                        `Emergency contact at index ${index} is missing a valid phone`
                    );
                }

                const cleaned = {
                    name: name.trim(),
                    phone: phone.trim(),
                };

                if (relation && typeof relation === "string" && relation.trim().length) {
                    cleaned.relation = relation.trim();
                }

                return cleaned;
            });
        }

        const updatedRecipient = await CareRecipient.findByIdAndUpdate(
            careRecipientId,
            { $set: { emergencyContacts: contactsToSave } },
            { new: true, runValidators: true }
        );

        if (!updatedRecipient) {
            throw new Error("Care recipient not found");
        }

        return updatedRecipient;

    } catch (error) {
        throw new Error("Error updating care recipient emergency contacts: " + error.message)
    }
};

//Get Care Recipients by Note Keyword
export const getCareRecipientsByNoteKeyword = async (keyword) => {
    try {
        if (!keyword) {
            throw new Error("Keyword is required");
        }

        const cleanedKeyword = isValidString(keyword, "keyword");

        const regex = new RegExp(cleanedKeyword, "i");
        const recipients = await CareRecipient.find({
            notes: regex,
        });

        if (!recipients || recipients.length === 0) {
            throw new Error("No care recipients found with this note keyword");
        }

        return recipients;

    } catch (error) {
        throw new Error("Error fetching care recipients by note keyword: " + error.message)
    }
};

//Get Care Recipients by Multiple Conditions
export const getCareRecipientsByMultipleConditions = async (conditions) => {
    try {
        if (!conditions || !Array.isArray(conditions) || conditions.length === 0) {
            throw new Error("conditions must be a non-empty array");
        }

        const cleanedConditions = conditions.map((cond, index) => {
            if (!cond) {
                throw new Error(`Condition at index ${index} is missing or invalid`);
            }
            return isValidString(cond, `condition[${index}]`);
        });

        const orClauses = cleanedConditions.map((cond) => ({
            primaryCondition: { $regex: new RegExp(cond, "i") },
        }));

        const recipients = await CareRecipient.find({
            $or: orClauses,
        });

        if (!recipients || recipients.length === 0) {
            throw new Error("No care recipients found for the given conditions");
        }

        return recipients;
    } catch (error) {
        throw new Error("Error fetching care recipients by multiple conditions: " + error.message);
    }
};

//Get Care Recipients by Age Range
export const getCareRecipientsByAgeRange = async (minAge, maxAge) => {
    try {
        if (minAge === undefined || maxAge === undefined) {
            throw new Error("Both minAge and maxAge are required");
        }

        const min = parseInt(minAge, 10);
        const max = parseInt(maxAge, 10);

        if (isNaN(min) || isNaN(max)) {
            throw new Error("minAge and maxAge must be valid numbers");
        }

        if (min < 0 || max < 0) {
            throw new Error("minAge and maxAge must be non-negative");
        }

        if (min > max) {
            throw new Error("minAge cannot be greater than maxAge");
        }

        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const day = now.getDate();

        const minDob = new Date(year - max, month, day);

        const maxDob = new Date(year - min, month, day);

        const recipients = await CareRecipient.find({
            dob: { $gte: minDob, $lte: maxDob },
        });

        if (!recipients || recipients.length === 0) {
            throw new Error("No care recipients found in this age range");
        }

        return recipients;
    } catch (error) {
        throw new Error("Error fetching care recipients by age range: " + error.message);
    }
};

//Get Care Recipients by Group and Condition
export const getCareRecipientsByGroupAndCondition = async (groupId, condition) => {
    try {
        if (!groupId || !isValidID(groupId)) {
            throw new Error("Invalid or missing groupId");
        }

        if (!condition) {
            throw new Error("Condition is required");
        }

        const cleanedCondition = isValidString(condition, "condition");

        const regex = new RegExp(cleanedCondition, "i");

        const recipients = await CareRecipient.find({
            groupId,
            primaryCondition: { $regex: regex },
        });

        if (!recipients || recipients.length === 0) {
            throw new Error("No care recipients found for this group with the given condition");
        }
        return recipients;

    } catch (error) {
        throw new Error("Error fetching care recipients by group and condition: " + error.message);
    }
};

//Get Care Recipients without Emergency Contacts
export const getCareRecipientsWithoutEmergencyContacts = async () => {
    try {
        const recipients = await CareRecipient.find({
            $or: [
                { emergencyContacts: { $exists: false } },
                { emergencyContacts: { $size: 0 } }
            ]
        });

        if (!recipients || recipients.length === 0) {
            throw new Error("No care recipients found without emergency contacts");
        }

        return recipients;
    } catch (error) {
        throw new Error("Error fetching care recipients without emergency contacts: " + error.message)
    }
};

//Get Care Recipients by User Name
export const getCareRecipientsByUserName = async (userName) => {
    try {
        if (!userName) {
            throw new Error("userName is required");
        }

        const cleanedName = isValidString(userName, "userName");
        const regex = new RegExp(cleanedName, "i");

        const recipients = await CareRecipient.find()
            .populate({
                path: "userId",
                select: "firstName lastName",
                match: {
                    $or: [
                        { firstName: { $regex: regex } },
                        { lastName: { $regex: regex } },
                    ],
                },
            });

        const filtered = recipients.filter((rec) => rec.userId);

        if (!filtered || filtered.length === 0) {
            throw new Error("No care recipients found for this user name");
        }

        return filtered;

    } catch (error) {
        throw new Error("Error fetching care recipients by user name: " + error.message);
    }
};
