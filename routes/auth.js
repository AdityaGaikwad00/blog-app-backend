const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

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

module.exports = router;
