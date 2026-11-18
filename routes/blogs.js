const express = require("express");
const mongoose = require("mongoose");
const requireAuth = require("../middleware/auth");
const Blog = require("../models/Blog");

const router = express.Router();

// GET /api/blogs  (public: all blogs, newest first)
router.get("/", async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.json(blogs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load blogs." });
  }
});

// GET /api/blogs/mine  (logged-in user's blogs)  -- must stay ABOVE /:id
router.get("/mine", requireAuth, async (req, res) => {
  try {
    const blogs = await Blog.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(blogs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load your blogs." });
  }
});

// GET /api/blogs/:id  (public: one blog, for the details page)
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: "Blog not found." });
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found." });
    res.json(blog);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load the blog." });
  }
});

// POST /api/blogs  (logged-in users create a blog)
router.post("/", requireAuth, async (req, res) => {
  try {
    const { title, category, content } = req.body;

    if (!title || title.trim().length < 3) return res.status(400).json({ message: "Title must be at least 3 characters." });
    if (!content || content.trim().length < 20) return res.status(400).json({ message: "Write at least 20 characters of content." });

    const blog = await Blog.create({
      title: title.trim(),
      category: category || "Technology",
      content: content.trim(),
      author: req.user.name,
      user: req.user.id
    });

    res.status(201).json({ message: "Blog published.", blog });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not publish the blog." });
  }
});

module.exports = router;
