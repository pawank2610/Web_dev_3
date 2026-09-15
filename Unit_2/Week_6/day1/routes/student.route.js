// step -1
const express = require("express");
const fs = require("fs");

// Step -2
const studentRouter = express.Router();

// GET API/ Read Route only for student
studentRouter.get("/read", (req, res) => {
  const data = fs.readFileSync("./1.json", "utf-8");
  // console.log(data, typeof data);

  // converting json data ---- parse ----> js object
  const jsData = JSON.parse(data);
  console.log(jsData, typeof jsData);

  console.log(jsData.student);

  // res.send({ data: jsData.student });
  res.send("Hello world");
});

studentRouter.post("/create", (req, res) => {
  const payload = req.body;
  console.log(payload); // {}

  const data = JSON.parse(fs.readFileSync("./1.json", "utf-8")); // {}

  const stdata = data.student; // []
  console.log(stdata); // [{},{},{}]
  stdata.push(payload); // new student record added in stdata array
  console.log(stdata); // [{},{},{},{}]

  data.student = stdata;

  fs.writeFileSync("./1.json", JSON.stringify(data));

  res.send({ msg: "New student Created successfully" });
});

studentRouter.put("/update/:id", (req, res) => {
  const payload = req.body;
  console.log(payload);

  const id = req.params;
  console.log(id);

  const data = JSON.parse(fs.readFileSync("./1.json", "utf-8"));
  const stdata = data.student;
  console.log(stdata);

  const updatedData = stdata.map((el) => {
    if (el.id == req.params.id) {
      return payload;
    } else return el;
  });

  console.log(updatedData);
  data.student = updatedData;
  fs.writeFileSync("./1.json", JSON.stringify(data));

  res.send({ msg: "student record updated" });
});

studentRouter.patch("/update/:id", (req, res) => {
  const payload = req.body;
  console.log(payload);

  const id = req.params;
  console.log(id);

  const data = JSON.parse(fs.readFileSync("./1.json", "utf-8"));
  const stdata = data.student;
  console.log(stdata);

  const updatedData = stdata.map((el) => {
    if (el.id == req.params.id) {
      return { ...el, ...payload };

      // const el = {
      //   id: 6,
      //   name: "Rahul",
      //   age: 20,
      // };

      // const payload = {
      //   age: 21,
      // };

      // { "id": 6,
      //   "name": "Rahul",
      //   "age": 21,}
    } else return el;
  });

  console.log(updatedData);
  data.student = updatedData;
  fs.writeFileSync("./1.json", JSON.stringify(data));

  res.send({ msg: "student record updated" });
});

studentRouter.delete("/delete/:id", (req, res) => {
  const id = req.params;
  console.log(id);

  const data = JSON.parse(fs.readFileSync("./1.json", "utf-8"));
  const stdata = data.student;
  console.log(stdata);

  const deleteData = stdata.filter((el) => el.id != req.params.id);

  console.log(deleteData);
  data.student = deleteData;
  fs.writeFileSync("./1.json", JSON.stringify(data));

  res.send({ msg: "student record deleted" });
});

module.exports = { studentRouter };
