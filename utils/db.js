// A tiny "database" that keeps data in a JSON file (data/db.json).
// Later you can replace this file with MongoDB without changing the routes much.
const fs = require("fs");
const path = require("path");

const DB_FILE = path.join(__dirname, "..", "data", "db.json");

const seed = {
  users: [],
  blogs: [
    { id: 1, title: "Getting started with HTML", category: "Technology", author: "InkWell Team", userId: 0, date: "2026-10-01",
      content: "HTML is the skeleton of every web page. Learn tags, headings, links and forms before anything else." },
    { id: 2, title: "Why CSS Flexbox matters", category: "Technology", author: "InkWell Team", userId: 0, date: "2026-10-05",
      content: "Flexbox makes it easy to align items in a row or column and build layouts that adapt to any screen." },
    { id: 3, title: "How to prepare for your first internship", category: "Career", author: "InkWell Team", userId: 0, date: "2026-10-10",
      content: "Be curious, ask questions, finish small tasks well, and document everything you learn along the way." }
  ]
};

function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

module.exports = { readDB, writeDB };
