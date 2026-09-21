// step -1
const express = require("express");
const fs = require("fs");
const cors = require("cors");

const { studentRouter } = require("./routes/student.route");
const { trainerRouter } = require("./routes/trainer.route");

// Step -2
const app = express();

// middleware  --> req.body --> parse
app.use(express.json());
app.use(cors());

app.use("/student", studentRouter);
app.use("/trainer", trainerRouter);

// step -3 Routes/Api
app.get("/", (req, res) => {
  res.send({ msg: "welcome to express server" });
});

app.get("/home", (req, res) => {
  res.send({ msg: "welcome to home Page" });
});

// GET API/ Read Route
app.get("/read", (req, res) => {
  const data = fs.readFileSync("./1.json", "utf-8");
  // console.log(data, typeof data);

  // converting json data ---- parse ----> js object
  const jsData = JSON.parse(data);
  console.log(jsData, typeof jsData);

  console.log(jsData.student);

  res.send({ data: jsData });
});

app.listen(8080, () => {
  console.log("Server started");
});
