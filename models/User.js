const mongoose = require("mongoose");

// A "schema" describes what a user document looks like in MongoDB
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true } // stored hashed, never as plain text
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
