import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
dotenv.config();

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    minlength: 2,
    maxlength: 50

  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    minlength: 2,
    maxlength: 50

  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address.']
  },
  phone: {
    type: String,
    trim: true,
    default: null
  },
  password: {
    type: String,
    required: true,
    trim: true,
    minlength: 6,
    maxlength: 128,
    match: [/(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number.']
    //demo Password Validation: 
  },
  needPasswordReset: {
    type: Boolean,
    default: false,

  },
  // role: {
  //   type: String,
  //   enum: ['admin', 'familyMember', 'careGiver', 'careRecipient'],
  //   default: 'familyMember'
  // },
  refreshToken: {
    type: String,
    default: null
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  googleId: {
    type: String,
    default: null
  },
  profilePicture: {
    type: String,
    default: null
  },
  uid: {
    type: String,
    default: null
  },
  displayName: {
    type: String,
    default: null
    // set firstname  as display name if not provided
  }

}, { timestamps: true });
// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});
// Method to compare password
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};
// JWT generation methods
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      role: this.role,
      firstName: this.firstName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};
// Generate Refresh Token
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      role: this.role,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

const User = mongoose.model("User", userSchema);

export default User;
// {
//     "firstName": "John",
//     "lastName": "Doe",
//     "email": "john.doe@example.com",
//     "password": "password123",
//     "confirmPassword": "password123"
// }