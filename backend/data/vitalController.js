import { Vital } from "../models/vital.model.js";
import { isValidID, isValidString } from "../utils/validation.utils.js";
import { assertActiveMember } from "../utils/taskHelper.js";

const VALID_VITAL_TYPES = ["bp", "heart_rate", "weight", "glucose", "temperature"];

export const logVital = async (
  groupId,
  userId,
  type,
  value,
  unit,
  recordedAt,
  notes
) => {
  try {
    if (!groupId) {
      throw new Error("groupId is required to log a vital");
    }
    if (!userId) {
      throw new Error("userId is required to log a vital");
    }
    if (!type) {
      throw new Error("type is required to log a vital");
    }
    if (!value) {
      throw new Error("value is required to log a vital");
    }
    if (!unit) {
      throw new Error("unit is required to log a vital");
    }

    groupId = isValidID(groupId);
    userId = isValidID(userId);

    if (!VALID_VITAL_TYPES.includes(type)) {
      throw new Error(
        `Invalid vital type. Expected one of: ${VALID_VITAL_TYPES.join(", ")}`
      );
    }

    value = isValidString(value, "value");
    unit = isValidString(unit, "unit");

    if (notes !== undefined && notes !== null && notes !== "") {
      notes = isValidString(notes, "notes");
    } else {
      notes = "";
    }

    let parsedRecordedAt = new Date();
    if (recordedAt) {
      const tmp = new Date(recordedAt);
      if (Number.isNaN(tmp.getTime())) {
        throw new Error("Invalid recordedAt date");
      }
      parsedRecordedAt = tmp;
    }

    await assertActiveMember(userId, groupId);

    const vital = await Vital.create({
      type,
      value,
      unit,
      userId,
      groupId,
      recordedAt: parsedRecordedAt,
      notes,
    });

    return vital;
  } catch (error) {
    throw new Error(`Error logging vital: ${error.message}`);
  }
};

export const getVitalsHistory = async (
  groupId,
  userId,
  options = {}
) => {
  try {
    if (!groupId) {
      throw new Error("groupId is required to get vitals history");
    }
    if (!userId) {
      throw new Error("userId is required to get vitals history");
    }

    groupId = isValidID(groupId);
    userId = isValidID(userId);

    const { type, from, to, rangeDays } = options;

    const query = {
      groupId,
      userId,
    };

    if (type) {
      if (!VALID_VITAL_TYPES.includes(type)) {
        throw new Error(
          `Invalid vital type. Expected one of: ${VALID_VITAL_TYPES.join(", ")}`
        );
      }
      query.type = type;
    }

    // Date range filter
    const recordedAtFilter = {};
    let haveDateFilter = false;

    if (from) {
      const fromDate = new Date(from);
      if (Number.isNaN(fromDate.getTime())) {
        throw new Error("Invalid 'from' date");
      }
      recordedAtFilter.$gte = fromDate;
      haveDateFilter = true;
    }

    if (to) {
      const toDate = new Date(to);
      if (Number.isNaN(toDate.getTime())) {
        throw new Error("Invalid 'to' date");
      }
      recordedAtFilter.$lte = toDate;
      haveDateFilter = true;
    }

    // If no explicit from/to but a rangeDays is provided, use that
    if (!haveDateFilter && rangeDays && Number(rangeDays) > 0) {
      const now = new Date();
      const days = Number(rangeDays);
      const fromDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      recordedAtFilter.$gte = fromDate;
      recordedAtFilter.$lte = now;
      haveDateFilter = true;
    }

    if (haveDateFilter) {
      query.recordedAt = recordedAtFilter;
    }

    const vitals = await Vital.find(query).sort({ recordedAt: 1 });

    return vitals;
  } catch (error) {
    throw new Error(`Error fetching vitals history: ${error.message}`);
  }
};

export const getLatestVitalsByType = async (groupId, userId) => {
  try {
    groupId = isValidID(groupId);
    userId = isValidID(userId);

    const latestByType = {};

    for (const t of VALID_VITAL_TYPES) {
      const doc = await Vital.findOne({
        groupId,
        userId,
        type: t,
      })
        .sort({ recordedAt: -1 })
        .lean();

      if (doc) {
        latestByType[t] = doc;
      }
    }

    return latestByType;
  } catch (error) {
    throw new Error(`Error fetching latest vitals: ${error.message}`);
  }
};
