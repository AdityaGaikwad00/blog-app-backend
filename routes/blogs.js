const express = require("express");
const requireAuth = require("../middleware/auth");
const { readDB, writeDB } = require("../utils/db");

const router = express.Router();

// GET /api/blogs  (public: all blogs, newest first)
router.get("/", (req, res) => {
  const { blogs } = readDB();
  res.json([...blogs].reverse());
});

// GET /api/blogs/mine  (logged-in user's blogs)
router.get("/mine", requireAuth, (req, res) => {
  const { blogs } = readDB();
  res.json(blogs.filter((b) => b.userId === req.user.id).reverse());
});

// POST /api/blogs  (logged-in users create a blog)
router.post("/", requireAuth, (req, res) => {
  const { title, category, content } = req.body;

  if (!title || title.trim().length < 3) return res.status(400).json({ message: "Title must be at least 3 characters." });
  if (!content || content.trim().length < 20) return res.status(400).json({ message: "Write at least 20 characters of content." });

  const db = readDB();
  const blog = {
    id: Date.now(),
    title: title.trim(),
    category: category || "Technology",
    content: content.trim(),
    author: req.user.name,
    userId: req.user.id,
    date: new Date().toISOString().slice(0, 10)
  };
  db.blogs.push(blog);
  writeDB(db);

  res.status(201).json({ message: "Blog published.", blog });
});

module.exports = router;
