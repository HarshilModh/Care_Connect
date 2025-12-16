import mongoose from "mongoose";

const careGiverSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true
    },
    bio: {
        type: String,
        trim: true,
        minlength: 10,
        maxlength: 2000,
        default: '',
        // Bio can contain letters, numbers, spaces, and basic punctuation. but not special characters like <, >, {, } but not only numbers or special characters
        match: [/^(?!^[\d\s.,'"\-!?()]+$)[a-zA-Z0-9\s.,'"\-!?()]{10,2000}$/, 'Bio can contain letters, numbers, spaces, and basic punctuation, but not special characters like <, >, {, }, and cannot contain only numbers or special characters.'],
    },
    experienceYears: {
        type: Number,
        min: 0,
        default: 0
    },
    skills: {
        type: [String],
        default: [],
    },
    certifications: {
        type: [String],
        default: [],
    },
    availability: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    rate: {
        type: Number,
        min: 0,
        default: 0
    }
}, { timestamps: true });

// Clean up skills and certifications
careGiverSchema.pre("save", function(next) {
  if (Array.isArray(this.skills)) {
    this.skills = this.skills
      .map(s => (s || "").toString().trim().toLowerCase())
      .filter(Boolean);
    this.skills = Array.from(new Set(this.skills));
  }
  if (Array.isArray(this.certifications)) {
    this.certifications = this.certifications
      .map(s => (s || "").toString().trim())
      .filter(Boolean);
    this.certifications = Array.from(new Set(this.certifications));
  }
  next();
});

export const CareGiver = mongoose.model('CareGiver', careGiverSchema);