import mongoose from "mongoose";



const taskSchema = new mongoose.Schema({
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FamilyGroup',
        required: true,
        index: true
    },
    recipientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CareRecipient',
        required: true,
        index: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    description: {
        type: String,
        trim: true,
        maxlength: 2000,
        default: ''
    },
    assignedTo: {
        type: [ { type: mongoose.Schema.Types.ObjectId, ref: 'User' } ],
        default: []
    },
    dueAt: {
        type: Date,
        required: false
    },
    timezone: {
        type: String,
        default: 'UTC',
        match: [/^[A-Za-z_]+\/[A-Za-z_]+(?:\/[A-Za-z_]+)?$/, 'Use a valid IANA time zone like America/New_York']
    },
    repeatRule: {
        type: String,
        trim: true,
        maxlength: 500,
        default: ''
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'missed'],
        default: 'pending',
        index: true
    },
    completedAt: {
        type: Date,
        required: false
    },
    type: {
        type: String,
        enum: ['task', 'medication', 'event', 'note'],
        default: 'task',
        index: true
    },
    notificationConfig: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    attachments: {
        type: [ { type: mongoose.Schema.Types.ObjectId, ref: 'Document' } ],
        default: []
    }
}, { timestamps: true });
// de-duplicate arrays
taskSchema.pre("save", function(next) {
  if (this.assignedTo?.length) {
    const unique = Array.from(new Set(this.assignedTo.map(id => id.toString())));
    this.assignedTo = unique.map(id => new mongoose.Types.ObjectId(id));
  }
  if (this.attachments?.length) {
    const unique = Array.from(new Set(this.attachments.map(id => id.toString())));
    this.attachments = unique.map(id => new mongoose.Types.ObjectId(id));
  }
  next();
});

export const Task = mongoose.model('Task', taskSchema);