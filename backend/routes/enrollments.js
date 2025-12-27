const express = require("express");
const router = express.Router();
const db = require("../db");

// CREATE enrollment
router.post("/", (req, res) => {
  const { student_id, course_id } = req.body;

  db.query(
    "INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)",
    [student_id, course_id],
    (err) => {
      if (err) return res.status(500).json(err);
      res.sendStatus(201);
    }
  );
});

// GET courses by student
router.get("/:studentId", (req, res) => {
  const sql = `
    SELECT courses.id, courses.title, courses.credits
    FROM enrollments
    JOIN courses ON enrollments.course_id = courses.id
    WHERE enrollments.student_id = ?
  `;

  db.query(sql, [req.params.studentId], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

// DELETE enrollment
router.delete("/", (req, res) => {
  const { student_id, course_id } = req.body;

  db.query(
    "DELETE FROM enrollments WHERE student_id = ? AND course_id = ?",
    [student_id, course_id],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.sendStatus(204);
    }
  );
});

module.exports = router;
