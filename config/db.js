const mongoose = require("mongoose");

// Connects to MongoDB using the address stored in .env (MONGO_URI)
async function connectDB() {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is missing in .env. Add your MongoDB connection string.");
    process.exit(1);
  }
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected:", mongoose.connection.name);
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
