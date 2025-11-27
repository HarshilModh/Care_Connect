import { CareGiver } from "../models/careGivers.model.js";
import { Membership } from "../models/memberShip.model.js";

import { isValidArray, isValidID, isValidString } from '../utils/validation.utils.js';

//Data Functions
//Create Care Giver
export const createCareGiver = async (userId, bio, experienceYears, skills, certifications, availability, rate) => {
    try {
        if (!userId || !isValidID(userId)) {
            throw new Error("Invalid or missing userId");
        }

        if (bio) {
            bio = isValidString(bio, "bio");
        }

        let experience = undefined;
        if (experienceYears !== undefined) {
            const parsed = Number(experienceYears);
            if (Number.isNaN(parsed) || parsed < 0) {
                throw new Error("experienceYears must be a non-negative number");
            }
            experience = parsed;
        }

        let skillsArray = undefined;
        if (skills !== undefined) {
            if (!Array.isArray(skills)) {
                throw new Error("skills must be an array");
            }
            skillsArray = skills
                .filter((s) => s !== null && s !== undefined)
                .map((s, index) => {
                    if (typeof s !== "string") {
                        throw new Error(`Skill at index ${index} must be a string`);
                    }
                    const cleaned = s.trim();
                    if (!cleaned) {
                        throw new Error(`Skill at index ${index} cannot be empty`);
                    }
                    return cleaned;
                });
        }

        let certificationsArray = undefined;
        if (certifications !== undefined) {
            if (!Array.isArray(certifications)) {
                throw new Error("certifications must be an array");
            }
            certificationsArray = certifications
                .filter((c) => c !== null && c !== undefined)
                .map((c, index) => {
                    if (typeof c !== "string") {
                        throw new Error(`Certification at index ${index} must be a string`);
                    }
                    const cleaned = c.trim();
                    if (!cleaned) {
                        throw new Error(`Certification at index ${index} cannot be empty`);
                    }
                    return cleaned;
                });
        }

        if (availability !== undefined) {
            if (
                typeof availability !== "object" ||
                availability === null
            ) {
                throw new Error("availability must be an object or array");
            }
        }

        let rateValue = undefined;
        if (rate !== undefined) {
            const parsedRate = Number(rate);
            if (Number.isNaN(parsedRate) || parsedRate < 0) {
                throw new Error("rate must be a non-negative number");
            }
            rateValue = parsedRate;
        }

        const existing = await CareGiver.findOne({ userId }).lean();
        if (existing) {
            throw new Error("Care giver profile already exists for this user");
        }

        const careGiver = await CareGiver.create({
            userId,
            bio,
            experienceYears: experience,
            skills: skillsArray,
            certifications: certificationsArray,
            availability,
            rate: rateValue,
        });

        // Once caregiver profile exists, onboarding is globally completed for all caregiver memberships
        await Membership.updateMany(
            {
                userId,
                role: "careGiver",
                onboardingStatus: "required",
            },
            {
                $set: { onboardingStatus: "completed" },
            }
        );

        return careGiver;

    } catch (error) {
        throw new Error("Error creating care giver: " + error.message);
    }
};

//Get Care Giver by ID
export const getCareGiverById = async (careGiverId) => {
    try {
        if (!careGiverId || !isValidID(careGiverId)) {
            throw new Error("Invalid or missing careGiverId");
        }

        const careGiver = await CareGiver.findById(careGiverId);

        if (!careGiver) {
            throw new Error("Care giver not found");
        }

        return careGiver;
    } catch (error) {
        throw new Error("Error fetching care giver: " + error.message);
    }
};

//Update Care Giver
export const updateCareGiver = async (careGiverId, updateData) => {
    try {
        if (!careGiverId || !isValidID(careGiverId)) {
            throw new Error("Invalid or missing careGiverId");
        }

        if (!updateData || typeof updateData !== "object") {
            throw new Error("Update data must be a valid object");
        }

        const {
            bio,
            experienceYears,
            skills,
            certifications,
            availability,
            rate,
        } = updateData;

        const updates = {};

        if (bio !== undefined) {
            if (bio === null || bio === "") {
                updates.bio = "";
            } else {
                updates.bio = isValidString(bio, "bio");
            }
        }

        if (experienceYears !== undefined) {
            if (experienceYears === null || experienceYears === "") {
                updates.experienceYears = undefined;
            } else {
                const parsed = Number(experienceYears);
                if (Number.isNaN(parsed) || parsed < 0) {
                    throw new Error("experienceYears must be a non-negative number");
                }
                updates.experienceYears = parsed;
            }
        }

        if (skills !== undefined) {
            if (skills === null) {
                updates.skills = [];
            } else {
                if (!Array.isArray(skills)) {
                    throw new Error("skills must be an array");
                }
                updates.skills = skills
                    .filter((s) => s !== null && s !== undefined)
                    .map((s, index) => {
                        if (typeof s !== "string") {
                            throw new Error(`Skill at index ${index} must be a string`);
                        }
                        const cleaned = s.trim();
                        if (!cleaned) {
                            throw new Error(`Skill at index ${index} cannot be empty`);
                        }
                        return cleaned;
                    });
            }
        }

        if (certifications !== undefined) {
            if (certifications === null) {
                updates.certifications = [];
            } else {
                if (!Array.isArray(certifications)) {
                    throw new Error("certifications must be an array");
                }
                updates.certifications = certifications
                    .filter((c) => c !== null && c !== undefined)
                    .map((c, index) => {
                        if (typeof c !== "string") {
                            throw new Error(
                                `Certification at index ${index} must be a string`
                            );
                        }
                        const cleaned = c.trim();
                        if (!cleaned) {
                            throw new Error(
                                `Certification at index ${index} cannot be empty`
                            );
                        }
                        return cleaned;
                    });
            }
        }

        if (availability !== undefined) {
            if (availability === null) {
                updates.availability = null;
            } else {
                if (typeof availability !== "object") {
                    throw new Error("availability must be an object or array");
                }
                updates.availability = availability;
            }
        }

        if (rate !== undefined) {
            if (rate === null || rate === "") {
                updates.rate = undefined;
            } else {
                const parsedRate = Number(rate);
                if (Number.isNaN(parsedRate) || parsedRate < 0) {
                    throw new Error("rate must be a non-negative number");
                }
                updates.rate = parsedRate;
            }
        }

        if (Object.keys(updates).length === 0) {
            throw new Error("No valid fields to update");
        }

        const updatedCareGiver = await CareGiver.findByIdAndUpdate(
            careGiverId,
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!updatedCareGiver) {
            throw new Error("Care giver not found");
        }

        return updatedCareGiver;
    } catch (error) {
        throw new Error("Error updating care giver: " + error.message);
    }
};

//Delete Care Giver
export const deleteCareGiver = async (careGiverId) => {
    try {
        if (!careGiverId) {
            throw new Error("careGiverId is required");
        }

        if (!isValidID(careGiverId)) {
            throw new Error("Invalid careGiverId");
        }

        await CareGiver.findByIdAndDelete(careGiverId);

        return { message: "Care giver deleted successfully" };
    } catch (error) {
        throw new Error("Error deleting care giver: " + error.message);
    }
};

//Get All Care Givers
export const getAllCareGivers = async () => {
    try {
        const careGivers = await CareGiver.find();

        if (!careGivers || careGivers.length === 0) {
            throw new Error("No care givers found");
        }

        return careGivers;
    } catch (error) {
        throw new Error("Error fetching care givers: " + error.message);
    }
};

//Get Care Givers by Skill
export const getCareGiversBySkill = async (skill) => {
    try {
        if (!skill) {
            throw new Error("Skill is required");
        }

        const cleanedSkill = isValidString(skill, "skill");
        const regex = new RegExp(cleanedSkill, "i");

        const careGivers = await CareGiver.find({
            skills: { $regex: regex },
        });

        if (!careGivers || careGivers.length === 0) {
            throw new Error("No care givers found with this skill");
        }

        return careGivers;
    } catch (error) {
        throw new Error("Error fetching care givers by skill: " + error.message);
    }
};

//Get Care Givers by Certification
export const getCareGiversByCertification = async (certification) => {
    try {
        if (!certification) {
            throw new Error("Certification is required");
        }

        const cleanedCertification = isValidString(
            certification,
            "certification"
        );
        const regex = new RegExp(cleanedCertification, "i");

        const careGivers = await CareGiver.find({
            certifications: { $regex: regex },
        });

        if (!careGivers || careGivers.length === 0) {
            throw new Error("No care givers found with this certification");
        }

        return careGivers;

    } catch (error) {
        throw new Error("Error fetching care givers by certification: " + error.message);
    }
};

//Search Care Givers
export const searchCareGivers = async (searchTerm) => {
    try {
        if (!searchTerm) {
            throw new Error("Search term is required");
        }

        const cleanedTerm = isValidString(searchTerm, "searchTerm");
        const regex = new RegExp(cleanedTerm, "i");

        const careGivers = await CareGiver.find({
            $or: [
                { bio: regex },
                { skills: { $regex: regex } },
                { certifications: { $regex: regex } },
            ],
        });

        if (!careGivers || careGivers.length === 0) {
            throw new Error("No care givers found matching the search term");
        }

        return careGivers;
    } catch (error) {
        throw new Error("Error searching care givers: " + error.message);
    }
};

//Get Available Care Givers
export const getAvailableCareGivers = async (dateRange) => {
    try {
        const careGivers = await CareGiver.find({
            availability: { $ne: {} },
        });

        if (!careGivers || careGivers.length === 0) {
            throw new Error("No available care givers found");
        }

        return careGivers;
    } catch (error) {
        throw new Error("Error fetching available care givers: " + error.message);
    }
};

//Get Care Givers by Rate Range
//if we implment marketplace
export const getCareGiversByRateRange = async (minRate, maxRate) => { };

//Count Care Givers
export const countCareGivers = async () => { };

//Get Recent Care Givers
export const getRecentCareGivers = async (limit) => {
    try {
        const limitNum = parseInt(limit, 10) || 10;

        if (limitNum < 1 || limitNum > 100) {
            throw new Error("Limit must be between 1 and 100");
        }

        const careGivers = await CareGiver.find()
            .sort({ createdAt: -1 })
            .limit(limitNum);

        if (!careGivers || careGivers.length === 0) {
            throw new Error("No recent care givers found");
        }

        return careGivers;
    } catch (error) {
        throw new Error("Error fetching recent care givers: " + error.message);
    }
};

//Get Care Givers with Specific Experience
//if we implemt maketplace
export const getCareGiversWithExperience = async (minYears) => {
    try {
        if (minYears === undefined || minYears === null) {
            throw new Error("minYears is required");
        }

        const min = Number(minYears);
        if (Number.isNaN(min)) {
            throw new Error("minYears must be a valid number");
        }
        if (min < 0) {
            throw new Error("minYears must be non-negative");
        }

        const careGivers = await CareGiver.find({
            experienceYears: { $gte: min },
        });

        if (!careGivers || careGivers.length === 0) {
            throw new Error("No care givers found with this minimum experience");
        }

        return careGivers;
    } catch (error) {
        throw new Error("Error fetching care givers with experience: " + error.message);
    }
};

//Get Care Givers by User ID
export const getCareGiverByUserId = async (userId) => {
    try {
        if (!userId || !isValidID(userId)) {
            throw new Error("Invalid or missing userId");
        }

        const careGiver = await CareGiver.findOne({ userId });

        if (!careGiver) {
            throw new Error("Care giver not found for this user");
        }

        return careGiver;
    } catch (error) {
        throw new Error("Error fetching care giver by userId: " + error.message);
    }
};

//Update Care Giver Availability
export const updateCareGiverAvailability = async (careGiverId, availability) => { };

//Get Top Rated Care Givers
//if we implemt maketplace
export const getTopRatedCareGivers = async (limit) => {
    try {
        const limitNum = parseInt(limit, 10) || 10;

        if (limitNum < 1 || limitNum > 100) {
            throw new Error("Limit must be between 1 and 100");
        }

        const careGivers = await CareGiver.find()
            .sort({ experienceYears: -1, createdAt: -1 })
            .limit(limitNum);

        if (!careGivers || careGivers.length === 0) {
            throw new Error("No care givers found");
        }

        return careGivers;
    } catch (error) {
        throw new Error("Error fetching top rated care givers: " + error.message);
    }
};

//Get Care Givers by Experience Range
export const getCareGiversByExperienceRange = async (minYears, maxYears) => {
    try {
        if (minYears === undefined || maxYears === undefined) {
            throw new Error("Both minYears and maxYears are required");
        }

        const min = Number(minYears);
        const max = Number(maxYears);

        if (Number.isNaN(min) || Number.isNaN(max)) {
            throw new Error("minYears and maxYears must be valid numbers");
        }

        if (min < 0 || max < 0) {
            throw new Error("minYears and maxYears must be non-negative");
        }

        if (min > max) {
            throw new Error("minYears cannot be greater than maxYears");
        }

        const careGivers = await CareGiver.find({
            experienceYears: { $gte: min, $lte: max },
        });

        if (!careGivers || careGivers.length === 0) {
            throw new Error("No care givers found in this experience range");
        }

        return careGivers;
    } catch (error) {
        throw new Error("Error fetching care givers by experience range: " + error.message)
    }
};

//Get Care Givers by Bio Keyword
export const getCareGiversByBioKeyword = async (keyword) => {
    try {
        if (!keyword) {
            throw new Error("Keyword is required");
        }

        const cleanedKeyword = isValidString(keyword, "keyword");
        const regex = new RegExp(cleanedKeyword, "i");

        const careGivers = await CareGiver.find({
            bio: regex,
        });

        if (!careGivers || careGivers.length === 0) {
            throw new Error("No care givers found with this bio keyword");
        }

        return careGivers;
    } catch (error) {
        throw new Error("Error fetching care givers by bio keyword: " + error.message);
    }
};

//Get Care Givers by Multiple Skills
export const getCareGiversByMultipleSkills = async (skills) => {
    try {
        if (!skills || !Array.isArray(skills) || skills.length === 0) {
            throw new Error("skills must be a non-empty array");
        }

        const cleanedSkills = skills.map((skill, index) => {
            if (!skill) {
                throw new Error(`Skill at index ${index} is missing or invalid`);
            }
            return isValidString(skill, `skill[${index}]`);
        });

        const orClauses = cleanedSkills.map((skill) => ({
            skills: { $regex: new RegExp(skill, "i") },
        }));

        const careGivers = await CareGiver.find({
            $or: orClauses,
        });

        if (!careGivers || careGivers.length === 0) {
            throw new Error("No care givers found for the given skills");
        }

        return careGivers;
    } catch (error) {
        throw new Error("Error fetching care givers by multiple skills: " + error.message);
    }
};

//Get Care Givers by Multiple Certifications
export const getCareGiversByMultipleCertifications = async (certifications) => {
    try {
        if (
            !certifications ||
            !Array.isArray(certifications) ||
            certifications.length === 0
        ) { throw new Error("certifications must be a non-empty array"); }

        const cleanedCertifications = certifications.map((cert, index) => {
            if (!cert) {
                throw new Error(`Certification at index ${index} is missing or invalid`);
            }
            return isValidString(cert, `certification[${index}]`);
        });

        const orClauses = cleanedCertifications.map((cert) => ({
            certifications: { $regex: new RegExp(cert, "i") },
        }));

        const careGivers = await CareGiver.find({
            $or: orClauses,
        });

        if (!careGivers || careGivers.length === 0) {
            throw new Error("No care givers found for the given certifications");
        }

        return careGivers;
    } catch (error) {
        throw new Error("Error fetching care givers by multiple certifications: " + error.message);
    }
};

//Get Care Givers by Skill or Certification
export const getCareGiversBySkillOrCertification = async (skill, certification) => {
    try {
        if (!skill && !certification) {
            throw new Error("At least one of skill or certification is required");
        }

        const orClauses = [];

        if (skill) {
            const cleanedSkill = isValidString(skill, "skill");
            const skillRegex = new RegExp(cleanedSkill, "i");
            orClauses.push({ skills: { $regex: skillRegex } });
        }

        if (certification) {
            const cleanedCertification = isValidString(
                certification,
                "certification"
            );
            const certRegex = new RegExp(cleanedCertification, "i");
            orClauses.push({ certifications: { $regex: certRegex } });
        }

        const careGivers = await CareGiver.find({
            $or: orClauses,
        });

        if (!careGivers || careGivers.length === 0) { throw new Error("No care givers found with the given skill or certification"); }

        return careGivers;
    } catch (error) {
        throw new Error("Error fetching care givers by skill or certification: " + error.message);
    }
};

//Get Care Givers by Skill and Certification
export const getCareGiversBySkillAndCertification = async (skill, certification) => {
    try {
        if (!skill) {
            throw new Error("Skill is required");
        }
        if (!certification) {
            throw new Error("Certification is required");
        }

        const cleanedSkill = isValidString(skill, "skill");
        const cleanedCertification = isValidString(
            certification,
            "certification"
        );

        const skillRegex = new RegExp(cleanedSkill, "i");
        const certRegex = new RegExp(cleanedCertification, "i");

        const careGivers = await CareGiver.find({
            skills: { $regex: skillRegex },
            certifications: { $regex: certRegex },
        });

        if (!careGivers || careGivers.length === 0) { throw new Error("No care givers found with the given skill and certification"); }

        return careGivers;

    } catch (error) {
        throw new Error("Error fetching care givers by skill and certification: " + error.message);
    }
};

