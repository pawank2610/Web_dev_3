// Step -1 import module
const mongoose = require("mongoose");

// Step -2 Connection bulding
const connection = mongoose.connect("mongodb://127.0.0.1:27017/spiderman");

// Step -3 Making structure 
const userSchema = new mongoose.Schema({
  name: String,
  age: Number,
});


// Step -4 Making Model
const userModel = mongoose.model("user",userSchema);

// Step -5 Export module for using in 1.js
module.exports = {connection, userModel};