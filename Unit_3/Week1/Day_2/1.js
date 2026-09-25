// Unit 3 - Week 1 - Day 2: Express Server & Routing Basics
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.json());

// Load mock users data
const getUsersData = () => {
  const dataPath = path.join(__dirname, "../Day_1/1.json");
  if (fs.existsSync(dataPath)) {
    return JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  }
  return [];
};

// GET /users - Fetch all users
app.get("/users", (req, res) => {
  const users = getUsersData();
  res.status(200).json({ success: true, count: users.length, data: users });
});

// GET /users/:id - Fetch user by ID
app.get("/users/:id", (req, res) => {
  const users = getUsersData();
  const user = users.find((u) => u.id === parseInt(req.params.id));

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  res.status(200).json({ success: true, data: user });
});

// Server Initialization
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

module.exports = app;
