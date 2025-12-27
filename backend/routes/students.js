const express = require("express");
const router = express.Router();
const db = require("../db");

// GET all students
router.get("/", (req, res) => {
  db.query("SELECT * FROM students", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

// CREATE student
router.post("/", (req, res) => {
  const { name, email } = req.body;
  db.query(
    "INSERT INTO students (name, email) VALUES (?, ?)",
    [name, email],
    (err) => {
      if (err) return res.status(500).json(err);
      res.sendStatus(201);
    }
  );
});

// UPDATE student
router.put("/:id", (req, res) => {
  const { name, email } = req.body;
  const { id } = req.params;

  db.query(
    "UPDATE students SET name = ?, email = ? WHERE id = ?",
    [name, email, id],
    (err, result) => {
      if (err) return res.status(500).json(err);
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.sendStatus(200);
    }
  );
});

// DELETE student
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM students WHERE id = ?", [id], (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.sendStatus(204);
  });
});

module.exports = router;
