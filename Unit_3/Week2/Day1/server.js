
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const studentRoutes = require("./routes/students");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

// Home route
app.get("/", (req, res) => {
  res.json({
    message: "Web Development Server is running!",
    port: PORT,
  });
});

// Check MongoDB connection
app.get("/api/health/db", (req, res) => {
  const connected = mongoose.connection.readyState === 1;

  res.status(connected ? 200 : 503).json({
    database: "MongoDB Atlas",
    status: connected ? "connected" : "disconnected",
  });
});

// Student routes
app.use("/api/students", studentRoutes);

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.message);

  if (err.code === 11000) {
    return res.status(409).json({
      message: "This email already exists.",
    });
  }

  res.status(500).json({
    message: "Something went wrong on the server.",
  });
});

// Connect database, then start server
async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
}

startServer();
