// Step - 1 Import modules
const express = require("express");
const { connection } = require("./db");
require("dotenv").config();

// Step - 2 Building application via express
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

// Step - 4 API Routes
app.get("/", (req, res) => {
  res.send({ msg: "Welcome to Lecture 32 Application" });
});

// Step - 3 Run app on 8080 port and Step - 5 Connect server with DB
app.listen(PORT, async () => {
  try {
    await connection;
    console.log("DB Connected successfully");
  } catch (error) {
    console.log("Error connecting to DB:", error);
  }
  console.log(`Server started and listening on port ${PORT}`);
});

module.exports = app;
