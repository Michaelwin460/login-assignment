const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String
    },

    signupPasswordHash: {
      type: String
    },

    otp: {
      type: String
    },

    otpExpires: {
      type: Date
    },

    verified: {
      type: Boolean,
      default: false
    },

    otpAttempts: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model("User", userSchema);
