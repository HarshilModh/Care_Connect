import mongoose from 'mongoose';
import User from './user.model.js';

const familyGroupSchema = new mongoose.Schema({
    groupName: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        minlength: 2,
        maxlength: 100
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500,
        default: ''
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: {
      type: [ { type: mongoose.Schema.Types.ObjectId, ref: 'User' } ],
      default: []
    },
    //timezone support as family members can be from different regions
    timeZone: {
        type: String,
        default: 'UTC',
        match: [/^[A-Za-z_]+\/[A-Za-z_]+(?:\/[A-Za-z_]+)?$/, 'Use a valid IANA time zone like America/New_York']
    }
    //Visibility settings for family group
    ,  isPublic: {
      type: Boolean,
      default: false,
      index: true
    }
   
},{
    timestamps: true
});
// make creator a member automatically
familyGroupSchema.pre('save', function(next) {
  const id = this.createdBy?.toString();
  if (id && !this.members.some(m => m?.toString() === id)) {
    this.members.push(this.createdBy);
  }
  // de-dupe members just in case
  if (this.members?.length) {
    const seen = new Set();
    this.members = this.members.filter(m => {
      const s = m?.toString();
      if (seen.has(s)) return false;
      seen.add(s);
      return true;
    });
  }
  next();
}); 

export const FamilyGroup = mongoose.model('FamilyGroup', familyGroupSchema);