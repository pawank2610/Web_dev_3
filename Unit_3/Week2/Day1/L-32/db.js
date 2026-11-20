// Step - 1 Import modules
const mongoose = require("mongoose");
require("dotenv").config();

// Step - 2 Connection building
const mongoURL =
  process.env.MONGO_URL ||
  process.env.mongourl ||
  "mongodb://127.0.0.1:27017/l32_db";

const connection = mongoose.connect(mongoURL);

// Step - 5 Export module for using in 1.js / index.js
module.exports = { connection };
