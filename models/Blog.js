const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, default: "Technology" },
    content: { type: String, required: true, trim: true },
    author: { type: String, required: true },                      // author's name, for display
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },   // who wrote it (empty for sample posts)
    date: { type: String, default: () => new Date().toISOString().slice(0, 10) }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Blog", blogSchema);
