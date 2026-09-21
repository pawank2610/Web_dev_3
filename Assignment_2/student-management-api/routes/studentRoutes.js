const express = require("express");
const router = express.Router();

const students = require("../data/students");

function getNextId() {
  if (students.length === 0) {
    return 1;
  }
  let maxId = 0;
  for (let i = 0; i < students.length; i++) {
    if (students[i].id > maxId) {
      maxId = students[i].id;
    }
  }
  return maxId + 1;
}

router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    count: students.length,
    data: students,
  });
});

router.get("/:id", (req, res) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      message: "Student id must be a number",
    });
  }

  const student = students.find((s) => s.id === id);

  if (!student) {
    return res.status(404).json({
      success: false,
      message: "Student not found with id " + id,
    });
  }

  res.status(200).json({
    success: true,
    data: student,
  });
});

router.post("/", (req, res) => {
  const { name, course, age } = req.body;

  if (!name || !course) {
    return res.status(400).json({
      success: false,
      message: "Please provide both name and course",
    });
  }

  const newStudent = {
    id: getNextId(),
    name: name,
    course: course,
    age: age ? Number(age) : null,
  };

  students.push(newStudent);

  res.status(201).json({
    success: true,
    message: "Student created successfully",
    data: newStudent,
  });
});

router.put("/:id", (req, res) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      message: "Student id must be a number",
    });
  }

  const student = students.find((s) => s.id === id);

  if (!student) {
    return res.status(404).json({
      success: false,
      message: "Student not found with id " + id,
    });
  }

  const { name, course, age } = req.body;

  if (!name && !course && !age) {
    return res.status(400).json({
      success: false,
      message: "Please send name, course or age to update",
    });
  }

  if (name) student.name = name;
  if (course) student.course = course;
  if (age) student.age = Number(age);

  res.status(200).json({
    success: true,
    message: "Student updated successfully",
    data: student,
  });
});

router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      message: "Student id must be a number",
    });
  }

  const index = students.findIndex((s) => s.id === id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: "Student not found with id " + id,
    });
  }

  const deletedStudent = students.splice(index, 1)[0];

  res.status(200).json({
    success: true,
    message: "Student deleted successfully",
    data: deletedStudent,
  });
});

module.exports = router;
