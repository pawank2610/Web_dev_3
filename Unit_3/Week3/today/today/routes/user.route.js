const express = require("express");

const userRouter = express.Router();

userRouter.post("/register", (req, res) => {
    // Logic for register
  res.send({ msg: "New user Created successfully" });
});


userRouter.post("/login", (req, res) => {
    // Logic for login
  res.send({ msg: "Login success" });
});

module.exports = {userRouter}