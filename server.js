require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
const Blog = require("./models/Blog");

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "dev_only_secret_change_me";
  console.warn("Warning: JWT_SECRET missing in .env, using a development value.");
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());                                          // lets a frontend on another port (Live Server) call this API
app.use(express.json());                                  // lets us read JSON request bodies
app.use(express.static(path.join(__dirname, "public")));  // serves the frontend pages

app.use("/api/auth", require("./routes/auth"));
app.use("/api/blogs", require("./routes/blogs"));

// Unknown route
app.use((req, res) => res.status(404).json({ message: "Route not found." }));

// Adds 3 sample posts the first time, so the Home page is not empty
async function seedBlogs() {
  if ((await Blog.countDocuments()) > 0) return;
  await Blog.insertMany([
    { title: "Getting started with HTML", category: "Technology", author: "InkWell Team", date: "2026-10-01",
      content: "HTML is the skeleton of every web page. Learn tags, headings, links and forms before anything else." },
    { title: "Why CSS Flexbox matters", category: "Technology", author: "InkWell Team", date: "2026-10-05",
      content: "Flexbox makes it easy to align items in a row or column and build layouts that adapt to any screen." },
    { title: "How to prepare for your first internship", category: "Career", author: "InkWell Team", date: "2026-10-10",
      content: "Be curious, ask questions, finish small tasks well, and document everything you learn along the way." }
  ]);
  console.log("Sample blogs added.");
}

// Start the server only after MongoDB is connected
connectDB().then(async () => {
  await seedBlogs();
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
});
