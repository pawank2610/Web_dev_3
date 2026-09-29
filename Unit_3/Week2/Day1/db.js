//step1 import modules

const mongoose = require("mongoose");

//step2 connection building
const connection = mongoose.connect("mongodb://127.0.0.1:27017/Spiderman")

//step3 Making structure
const userSchema = new mongoose.Schema({
    name:String,
    age:Number,

});

//step4 Making model
const userModel = mongoose.model("user",userSchema);

//ste5 Export module  for using in 1.js
module.exports = {connection,userModel};

