// Step -1 import module
const express = require("express");
const { connection, userModel } = require("./db");

// Step -2 building application via express
const app = express();

app.use(express.json());

// Step -4 Making API
// API
app.get("/", (req, res) => {
  res.send({ msg: "Welcome to my application" });
});

// GET Route: for Read all user document
app.get("/read", async (req, res) => {
  try {
    const user = await userModel.find();
    res.send(user);
  } catch (error) {
    res.send({ msg: "Something went wrong" });
  }
});

// GET Route: for Read user document based upon ID
app.get("/read/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const user = await userModel.findById({ _id: id });
    res.send(user);
  } catch (error) {
    res.send({ msg: "Something went wrong" });
  }
});

// POST Route: for Creating user
app.post("/create", async (req, res) => {
  const payload = req.body;
  try {
    const newUser = new userModel(payload);
    await newUser.save();
    res.send({ msg: "New user Successfully" });
  } catch (error) {
    res.send({ msg: "Something went wrong" });
  }
});

// Step -3 Run app on 8080 port
app.listen(8080, async () => {
  try {
    // Step - 5 Connect server with DB
    await connection;
    console.log("DB Connected");
  } catch (error) {
    console.log(error);
  }
  console.log("Server started");
});
