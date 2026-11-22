require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const connectDB = require("./config/db");
const Blog = require("./models/Blog");

const isProd = process.env.NODE_ENV === "production";

// In production a real secret is mandatory. The development fallback is only for your own computer.
if (!process.env.JWT_SECRET) {
  if (isProd) {
    console.error("JWT_SECRET is required in production. Set it in your hosting dashboard.");
    process.exit(1);
  }
  process.env.JWT_SECRET = "dev_only_secret_change_me";
  console.warn("Warning: JWT_SECRET missing in .env, using a development value.");
}

const app = express();
const PORT = process.env.PORT || 5000;

app.set("trust proxy", 1); // hosting platforms (Render) put a proxy in front of the app

// Security headers. "upgrade-insecure-requests" is switched off locally so http://localhost keeps working.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "upgrade-insecure-requests": isProd ? [] : null
      }
    }
  })
);
app.use(cors());                                          // lets a frontend on another port (Live Server) call this API
app.use(express.json({ limit: "100kb" }));                // reads JSON bodies, and refuses very large ones
app.use(express.static(path.join(__dirname, "public")));  // serves the frontend pages

// Health check: hosting platforms and you can open /health to see if the server is alive
app.get("/health", (req, res) => res.json({ status: "ok", uptime: Math.round(process.uptime()) }));

// Brute-force protection: limits login and register attempts per IP address
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again in a few minutes." }
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

app.use("/api/auth", require("./routes/auth"));
app.use("/api/blogs", require("./routes/blogs"));

// Unknown API route -> JSON. Unknown page -> friendly 404 page.
app.use("/api", (req, res) => res.status(404).json({ message: "Route not found." }));
app.use((req, res) => res.status(404).sendFile(path.join(__dirname, "public", "404.html")));

// Last safety net: bad JSON and unexpected errors never crash the server or leak details
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") return res.status(400).json({ message: "Invalid JSON in request." });
  if (err.type === "entity.too.large") return res.status(413).json({ message: "Request is too large." });
  console.error(err);
  res.status(500).json({ message: "Something went wrong on the server." });
});

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

module.exports = app; // exported so the app can be tested without a database

// Start only when run with "node server.js", and only after MongoDB is connected
if (require.main === module) {
  connectDB().then(async () => {
    await seedBlogs();
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  });
}
