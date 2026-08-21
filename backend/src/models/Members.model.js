import mongoose from "mongoose";

const memberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },

  role: {
    type: String,
    enum: [
      "member",
      "inventory_manager",
      "coordinator",
    ],
    default: "member",
  },

  active: {
    type: Boolean,
    default: true,
  },

  joinedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Member", memberSchema);