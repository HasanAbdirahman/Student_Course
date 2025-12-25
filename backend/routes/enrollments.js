const express = require("express");
const router = express.Router();
const db = require("../db");

router.post("/", (req, res) => {
  const { student_id, course_id } = req.body;
  db.query(
    "INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)",
    [student_id, course_id],
    (err) => {
      if (err) return res.status(500).send(err);
      res.sendStatus(201);
    }
  );
});

router.get("/:studentId", (req, res) => {
  const sql = `
SELECT courses.title, courses.credits
FROM enrollments
JOIN courses ON enrollments.course_id = courses.id
WHERE enrollments.student_id = ?
`;
  db.query(sql, [req.params.studentId], (err, result) => {
    if (err) return res.status(500).send(err);
    res.json(result);
  });
});

module.exports = router;
