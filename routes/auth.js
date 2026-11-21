const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Blog = require("../models/Blog");
const requireAuth = require("../middleware/auth");

const router = express.Router();
const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !name.trim()) return res.status(400).json({ message: "Enter your full name." });
    if (!email || !validEmail(email.trim())) return res.status(400).json({ message: "Enter a valid email address." });
    if (!password || password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters." });

    const cleanEmail = email.trim().toLowerCase();
    if (await User.findOne({ email: cleanEmail })) {
      return res.status(409).json({ message: "This email is already registered. Log in instead." });
    }

    const hashed = await bcrypt.hash(password, 10); // never store the plain password
    const user = await User.create({ name: name.trim(), email: cleanEmail, password: hashed });

    res.status(201).json({ message: "Registration successful.", user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: "This email is already registered. Log in instead." });
    console.error(err);
    res.status(500).json({ message: "Server error. Please try again." });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Enter your email and password." });

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    const match = user && (await bcrypt.compare(password, user.password));
    if (!match) return res.status(401).json({ message: "Email or password is incorrect." });

    const token = jwt.sign({ id: user._id, name: user.name, email: user.email }, process.env.JWT_SECRET, { expiresIn: "2h" });
    res.json({ message: "Login successful.", token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error. Please try again." });
  }
});

const makeToken = (u) => jwt.sign({ id: u._id, name: u.name, email: u.email }, process.env.JWT_SECRET, { expiresIn: "2h" });

// GET /api/auth/me  (PROFILE: who am I, plus my stats)
router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ message: "Account not found. Please log in again." });
    const blogs = await Blog.find({ user: user._id });
    const words = blogs.reduce((n, b) => n + b.content.split(/\s+/).length, 0);
    res.json({
      user: { id: user._id, name: user.name, email: user.email, bio: user.bio || "", createdAt: user.createdAt },
      stats: { posts: blogs.length, words }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load your profile." });
  }
});

// PUT /api/auth/me  (edit name and bio; the name is also updated on my blogs)
router.put("/me", requireAuth, async (req, res) => {
  try {
    const { name, bio } = req.body;
    if (!name || name.trim().length < 2) return res.status(400).json({ message: "Name must be at least 2 characters." });
    if (bio && bio.length > 200) return res.status(400).json({ message: "Bio can be at most 200 characters." });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ message: "Account not found. Please log in again." });
    user.name = name.trim();
    user.bio = (bio || "").trim();
    await user.save();
    await Blog.updateMany({ user: user._id }, { author: user.name });

    // The token holds the name, so we give the browser a fresh one
    res.json({ message: "Profile updated.", token: makeToken(user), user: { id: user._id, name: user.name, email: user.email, bio: user.bio } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not update your profile." });
  }
});

// PUT /api/auth/password  (change password: needs the current one)
router.put("/password", requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: "Enter your current and new password." });
    if (newPassword.length < 6) return res.status(400).json({ message: "New password must be at least 6 characters." });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ message: "Account not found. Please log in again." });
    if (!(await bcrypt.compare(currentPassword, user.password))) return res.status(401).json({ message: "Current password is incorrect." });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: "Password changed." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not change the password." });
  }
});

module.exports = router;
