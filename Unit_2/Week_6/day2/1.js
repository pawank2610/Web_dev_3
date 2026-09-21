const express = require("express");
const multer = require("multer");

const app = express();

// Multer configuration
const upload = multer({ dest: "uploads/" });

// Home page
app.get("/", (req, res) => {
  res.send(`
        <form action="/photos/upload" method="post" enctype="multipart/form-data">
            <input type="file" name="photos" multiple>
            <button type="submit">Upload Photos</button>
        </form>
    `);
});

// Upload single file
app.post("/profile", upload.single("avatar"), (req, res) => {
  if (req.file) {
    console.log(req.file);
    res.send("File uploaded successfully");
  } else {
    res.send("No file uploaded");
  }
});

// Upload multiple files
app.post("/photos/upload", upload.array("photos", 12), (req, res) => {
  if (req.files && req.files.length > 0) {
    console.log(req.files);
    res.send(`${req.files.length} files uploaded successfully`);
  } else {
    res.send("No files uploaded");
  }
});

// Start server
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});