// step -1
const express = require("express");
const fs = require("fs");

// Step -2
const trainerRouter = express.Router();

// GET API/ Read Route only for trainer
trainerRouter.get("/read", (req, res) => {
  const data = fs.readFileSync("./1.json", "utf-8");
  // console.log(data, typeof data);

  // converting json data ---- parse ----> js object
  const jsData = JSON.parse(data);
  console.log(jsData, typeof jsData);

  console.log(jsData.trainer);

  res.send({ data: jsData.trainer });
});

trainerRouter.post("/create", (req, res) => {
  const payload = req.body;
  console.log(payload); // {}

  const data = JSON.parse(fs.readFileSync("./1.json", "utf-8")); // {}

  const stdata = data.trainer; // []
  console.log(stdata); // [{},{},{}]
  stdata.push(payload); // new trainer record added in stdata array
  console.log(stdata); // [{},{},{},{}]

  data.trainer = stdata;

  fs.writeFileSync("./1.json", JSON.stringify(data));

  res.send({ msg: "New trainer Created successfully" });
});

trainerRouter.put("/update/:id", (req, res) => {
  const payload = req.body;
  console.log(payload);

  const id = req.params;
  console.log(id);

  const data = JSON.parse(fs.readFileSync("./1.json", "utf-8"));
  const stdata = data.trainer;
  console.log(stdata);

  const updatedData = stdata.map((el) => {
    if (el.id == req.params.id) {
      return payload;
    } else return el;
  });

  console.log(updatedData);
  data.trainer = updatedData;
  fs.writeFileSync("./1.json", JSON.stringify(data));

  res.send({ msg: "trainer record updated" });
});

trainerRouter.patch("/update/:id", (req, res) => {
  const payload = req.body;
  console.log(payload);

  const id = req.params;
  console.log(id);

  const data = JSON.parse(fs.readFileSync("./1.json", "utf-8"));
  const stdata = data.trainer;
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
  data.trainer = updatedData;
  fs.writeFileSync("./1.json", JSON.stringify(data));

  res.send({ msg: "trainer record updated" });
});

trainerRouter.delete("/delete/:id", (req, res) => {
  const id = req.params;
  console.log(id);

  const data = JSON.parse(fs.readFileSync("./1.json", "utf-8"));
  const stdata = data.trainer;
  console.log(stdata);

  const deleteData = stdata.filter((el) => el.id != req.params.id);

  console.log(deleteData);
  data.trainer = deleteData;
  fs.writeFileSync("./1.json", JSON.stringify(data));

  res.send({ msg: "trainer record deleted" });
});

module.exports = { trainerRouter };
