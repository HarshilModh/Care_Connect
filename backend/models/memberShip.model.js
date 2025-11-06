import mongoose from 'mongoose';
import User from './user.model.js';
import familyGroupSchema from './familyGroups.model.js';

const memberShipSchema = new mongoose.Schema({
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
    role: {
        type: String,
        enum: ['owner', 'caregiver', 'family', 'readonly'],
        default: 'readonly'
    },
    status: {
        type: String,
        enum: ['active', 'pending', 'removed'],
        default: 'pending'
    },
    permissions: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    joinedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const MemberShip = mongoose.model('MemberShip', memberShipSchema);
export default MemberShip;