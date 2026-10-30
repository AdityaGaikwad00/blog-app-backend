const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { readDB, writeDB } = require("../utils/db");

const router = express.Router();
const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !name.trim()) return res.status(400).json({ message: "Enter your full name." });
  if (!email || !validEmail(email.trim())) return res.status(400).json({ message: "Enter a valid email address." });
  if (!password || password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters." });

  const db = readDB();
  const cleanEmail = email.trim().toLowerCase();
  if (db.users.some((u) => u.email === cleanEmail)) {
    return res.status(409).json({ message: "This email is already registered. Log in instead." });
  }

  const hashed = await bcrypt.hash(password, 10); // never store the plain password
  const user = { id: Date.now(), name: name.trim(), email: cleanEmail, password: hashed };
  db.users.push(user);
  writeDB(db);

  res.status(201).json({ message: "Registration successful.", user: { id: user.id, name: user.name, email: user.email } });
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Enter your email and password." });

  const db = readDB();
  const user = db.users.find((u) => u.email === email.trim().toLowerCase());
  const match = user && (await bcrypt.compare(password, user.password));
  if (!match) return res.status(401).json({ message: "Email or password is incorrect." });

  const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, process.env.JWT_SECRET, { expiresIn: "2h" });
  res.json({ message: "Login successful.", token, user: { id: user.id, name: user.name, email: user.email } });
});

module.exports = router;
