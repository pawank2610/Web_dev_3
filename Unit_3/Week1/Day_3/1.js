// Step 1: Import Mongoose
const mongoose = require("mongoose");

// Step 2: Create Schema (Blueprint / Structure)
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  age: Number,
  password: String,
});

// Step 3: Create Model
const userModel = mongoose.model("user", userSchema);

// Step 4: Connect to MongoDB
const main = async () => {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/BabuSona");
    console.log("DB Connected");

    // Step 5: Insert 4 students
    const students = await userModel.insertMany([
      {
        name: "Rahul",
        email: "rahul@gmail.com",
        age: 20,
        password: "rahul123",
      },
      {
        name: "Bhavya",
        email: "bhavya@gmail.com",
        age: 21,
        password: "bhavya123",
      },
      {
        name: "Aman",
        email: "aman@gmail.com",
        age: 19,
        password: "aman123",
      },
      {
        name: "Pawan",
        email: "pawan@example.com",
        age: 22,
        password: "example123",
      },
    ]);

    //step7 update function
    const user2= await userModel.updateOne(
    { name: "Pawan" },
    { age: 23 }
);

    console.log("Students Added:");
    console.log(students);
  } catch (error) {
    console.log("Error:", error.message);
  } finally {
    // Step 6: Disconnect
    // await mongoose.disconnect();
    // console.log("DB Disconnected");
  }
};

main();
