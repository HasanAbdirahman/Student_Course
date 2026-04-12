const express = require("express");
const router = express.Router();
const db = require("../db");

// CREATE enrollment
router.post("/", async (req, res, next) => {
  try {
    const { student_id, course_id } = req.body;

    if (!student_id || !course_id) {
      return res.status(400).json({ message: "student_id and course_id are required" });
    }

    // Verify both records exist
    const [[student]] = await db.query("SELECT id FROM students WHERE id = ?", [student_id]);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const [[course]] = await db.query("SELECT id FROM courses WHERE id = ?", [course_id]);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Prevent duplicate enrollment
    const [existing] = await db.query(
      "SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?",
      [student_id, course_id]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: "Student is already enrolled in this course" });
    }

    await db.query(
      "INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)",
      [student_id, course_id]
    );
    res.sendStatus(201);
  } catch (err) {
    next(err);
  }
});

// GET courses by student
router.get("/:studentId", async (req, res, next) => {
  try {
    const { studentId } = req.params;

    const [[student]] = await db.query("SELECT id FROM students WHERE id = ?", [studentId]);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const [rows] = await db.query(
      `SELECT courses.id, courses.title, courses.credits
       FROM enrollments
       JOIN courses ON enrollments.course_id = courses.id
       WHERE enrollments.student_id = ?`,
      [studentId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// DELETE enrollment
router.delete("/", async (req, res, next) => {
  try {
    const { student_id, course_id } = req.body;

    if (!student_id || !course_id) {
      return res.status(400).json({ message: "student_id and course_id are required" });
    }

    const [result] = await db.query(
      "DELETE FROM enrollments WHERE student_id = ? AND course_id = ?",
      [student_id, course_id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Enrollment not found" });
    }
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
