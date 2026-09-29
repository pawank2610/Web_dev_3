// const express = require("express");
// const { connection, userModel } = require("./db");
// //  Building Application
// const app = express();

// // API-

// app.get("/", (req, res) => {
//   res.send({ msg: "Home Page" });
// });
// // Get rout- for read all user document
// app.get("/read", (req,res)=>{
//     try{
//         const user = await userModel.find();

//     }catch(error){
//         console.log(error);

//     }

// });

// app.listen(3000, async () => {
//   try {
//     await connection;
//     console.log("Connected to DB");
//   } catch (err) {
//     console.log(err);
//   }
//   console.log("Server is running on port 3000");
// });

const express = require("express");
const { connection, userModel } = require("./db");

// Building Application
const app = express();
app.use(express.json());

// Home Route
app.get("/", (req, res) => {
  res.send({ msg: "Home Page" });
});

// GET Route - Read all user documents
app.get("/read", async (req, res) => {
  try {
    const users = await userModel.find();

    res.send(users);
  } catch (error) {
    console.log(error);
    res.status(500).send({ msg: "Error fetching users" });
  }
});

// GET Route - Read a single user document
app.get("/read/:id", async (req, res) => {
  try {
    const user = await userModel.findById(req.params.id);
    res.send(user);
  } catch (error) {
    console.log(error);
    res.status(500).send({ msg: "Error fetching user" });
  }
});

// POST Route - Create a new user document
app.post("/create", async (req, res) => {
  try {
    const payload = req.body;
    const newUser = new userModel(payload);
    await newUser.save();
    res.send({ msg: "User created successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ msg: "Error creating user" });
  }
});

// Start Server
app.listen(5050, async () => {
  try {
    await connection;
    console.log("Connected to DB");
  } catch (err) {
    console.log(err);
  }

  console.log("Server is running on port 5050");
});