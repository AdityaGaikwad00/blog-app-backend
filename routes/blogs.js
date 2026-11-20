const express = require("express");
const mongoose = require("mongoose");
const requireAuth = require("../middleware/auth");
const Blog = require("../models/Blog");

const router = express.Router();

// Makes user text safe to use inside a search pattern (so "." or "(" are treated as normal letters)
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Does this logged-in user own this blog? (sample posts have no owner, so nobody owns them)
const isOwner = (blog, user) => blog.user && String(blog.user) === String(user.id);

// GET /api/blogs            -> all blogs, newest first (public)
// GET /api/blogs?search=css -> only blogs whose title or content contains "css"
// GET /api/blogs?category=Travel -> only one category
router.get("/", async (req, res) => {
  try {
    const { search, category } = req.query;
    const filter = {};

    if (typeof category === "string" && category && category !== "All") {
      filter.category = category;
    }
    if (typeof search === "string" && search.trim()) {
      const pattern = new RegExp(escapeRegex(search.trim()), "i"); // "i" = ignore capital/small letters
      filter.$or = [{ title: pattern }, { content: pattern }];
    }

    const blogs = await Blog.find(filter).sort({ createdAt: -1 });
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

// GET /api/blogs/:id  (public: one blog, for the details page and the edit page)
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

// PUT /api/blogs/:id  (UPDATE: only the author can edit)
router.put("/:id", requireAuth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: "Blog not found." });

    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found." });
    if (!isOwner(blog, req.user)) return res.status(403).json({ message: "You can only edit your own blogs." });

    const { title, category, content } = req.body;
    if (!title || title.trim().length < 3) return res.status(400).json({ message: "Title must be at least 3 characters." });
    if (!content || content.trim().length < 20) return res.status(400).json({ message: "Write at least 20 characters of content." });

    blog.title = title.trim();
    blog.category = category || blog.category;
    blog.content = content.trim();
    await blog.save();

    res.json({ message: "Blog updated.", blog });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not update the blog." });
  }
});

// DELETE /api/blogs/:id  (DELETE: only the author can delete)
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: "Blog not found." });

    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found." });
    if (!isOwner(blog, req.user)) return res.status(403).json({ message: "You can only delete your own blogs." });

    await blog.deleteOne();
    res.json({ message: "Blog deleted." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not delete the blog." });
  }
});

module.exports = router;
