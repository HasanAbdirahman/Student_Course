const express = require("express");
const router = express.Router();
const db = require("../db");

// GET all courses
router.get("/", (req, res) => {
  db.query("SELECT * FROM courses", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

// CREATE course
router.post("/", (req, res) => {
  const { title, credits } = req.body;
  db.query(
    "INSERT INTO courses (title, credits) VALUES (?, ?)",
    [title, credits],
    (err) => {
      if (err) return res.status(500).json(err);
      res.sendStatus(201);
    }
  );
});

// UPDATE course
router.put("/:id", (req, res) => {
  const { title, credits } = req.body;
  const { id } = req.params;

  db.query(
    "UPDATE courses SET title = ?, credits = ? WHERE id = ?",
    [title, credits, id],
    (err, result) => {
      if (err) return res.status(500).json(err);
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Course not found" });
      }
      res.sendStatus(200);
    }
  );
});

// DELETE course
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM courses WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Course not found" });
    }
    res.sendStatus(204);
  });
});

module.exports = router;
