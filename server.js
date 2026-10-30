require("dotenv").config();
const express = require("express");
const cors = require("cors");

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "dev_only_secret_change_me";
  console.warn("Warning: JWT_SECRET missing in .env, using a development value.");
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());          // lets the frontend (Live Server, port 5500) call this API
app.use(express.json());  // lets us read JSON request bodies

app.get("/", (req, res) => res.json({ message: "InkWell API is running." }));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/blogs", require("./routes/blogs"));

// Unknown route
app.use((req, res) => res.status(404).json({ message: "Route not found." }));

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
