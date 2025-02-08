
import mongoose, { Schema } from "mongoose";

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    default: null,
    unique: true,
    sparse: true, 
},
  googleId: {
    type: String
  },
 
createdAt: {
    type: Date,
    default: Date.now
},
  password: {
    type: String    // Required false is default, no need to specify
  },
 isBlocked : {
    type: Boolean,
    default: false
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
 

  referCode: {
    type: String,
    trim: true
  },
  redeemedby: {
    type: Boolean,
    default: false
  },

},{timestamps:true});

// Add compound index for faster searches
// userSchema.index({ email: 1, googleId: 1 });

const User = mongoose.model("User", userSchema);
export default User;                                    