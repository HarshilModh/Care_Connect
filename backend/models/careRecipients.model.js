import mongoose from "mongoose";

const careRecipientSchema = new mongoose.Schema({
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FamilyGroup',
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    dob: {
        type: Date,
        min: new Date('1900-01-01'),
        max: new Date(),
        default: null,
        required: false
    },
    primaryCondition: {
        type: String,
        trim: true,
        maxlength: 500,
        default: ''
    },
    notes: {
        type: String,
        trim: true,
        maxlength: 2000,
        default: ''
    },
    emergencyContacts: {
        type: [
            {
                name: { type: String, required: true, trim: true, maxlength: 100,match: [/^[a-zA-Z\s]+$/, 'Name must contain only letters and spaces.'] },
                phone: { type: String, required: true, trim: true, maxlength: 20,match: [/^(?=(?:.*\d){10,})\+?[0-9\s\-()]{10,20}$/, 'Use a valid phone number'] },
                relation: { type: String, required: false, trim: true, maxlength: 100,match: [/^[a-zA-Z\s]+$/, 'Relation must contain only letters and spaces.'] }
            }
        ],
        default: []
    }
}, { timestamps: true });

// prevent duplicate recipient entries per group
careRecipientSchema.index({ groupId: 1, userId: 1 }, { unique: true });

export const CareRecipient = mongoose.model('CareRecipient', careRecipientSchema);