const express = require("express");
const router = express.Router();
const db = require("../db");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(name, email) {
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return "Name is required";
  }
  if (name.trim().length > 255) {
    return "Name must be 255 characters or fewer";
  }
  if (!email || !EMAIL_RE.test(email)) {
    return "A valid email is required";
  }
  if (email.length > 255) {
    return "Email must be 255 characters or fewer";
  }
  return null;
}

// GET all students
router.get("/", async (req, res, next) => {
  try {
    const [rows] = await db.query("SELECT * FROM students ORDER BY id");
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// CREATE student
router.post("/", async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const error = validate(name, email);
    if (error) return res.status(400).json({ message: error });

    const [existing] = await db.query(
      "SELECT id FROM students WHERE email = ?",
      [email.trim()]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: "A student with this email already exists" });
    }

    await db.query(
      "INSERT INTO students (name, email) VALUES (?, ?)",
      [name.trim(), email.trim()]
    );
    res.sendStatus(201);
  } catch (err) {
    next(err);
  }
});

// UPDATE student
router.put("/:id", async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const { id } = req.params;

    const error = validate(name, email);
    if (error) return res.status(400).json({ message: error });

    const [duplicate] = await db.query(
      "SELECT id FROM students WHERE email = ? AND id != ?",
      [email.trim(), id]
    );
    if (duplicate.length > 0) {
      return res.status(409).json({ message: "Another student with this email already exists" });
    }

    const [result] = await db.query(
      "UPDATE students SET name = ?, email = ? WHERE id = ?",
      [name.trim(), email.trim(), id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.sendStatus(200);
  } catch (err) {
    next(err);
  }
});

// DELETE student
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const [result] = await db.query("DELETE FROM students WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
