const express = require("express");
const router = express.Router();
const db = require("../db");

function validate(title, credits) {
  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return "Title is required";
  }
  if (title.trim().length > 255) {
    return "Title must be 255 characters or fewer";
  }
  const c = Number(credits);
  if (!Number.isInteger(c) || c < 1 || c > 20) {
    return "Credits must be a whole number between 1 and 20";
  }
  return null;
}

// GET all courses
router.get("/", async (req, res, next) => {
  try {
    const [rows] = await db.query("SELECT * FROM courses ORDER BY id");
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// CREATE course
router.post("/", async (req, res, next) => {
  try {
    const { title, credits } = req.body;
    const error = validate(title, credits);
    if (error) return res.status(400).json({ message: error });

    await db.query(
      "INSERT INTO courses (title, credits, user_id) VALUES (?, ?, ?)",
      [title.trim(), Number(credits), req.user.id]
    );
    res.sendStatus(201);
  } catch (err) {
    next(err);
  }
});

// UPDATE course
router.put("/:id", async (req, res, next) => {
  try {
    const { title, credits } = req.body;
    const { id } = req.params;

    const error = validate(title, credits);
    if (error) return res.status(400).json({ message: error });

    const [rows] = await db.query("SELECT user_id FROM courses WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ message: "Course not found" });
    if (rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: "You can only edit your own courses" });
    }

    await db.query(
      "UPDATE courses SET title = ?, credits = ? WHERE id = ?",
      [title.trim(), Number(credits), id]
    );
    res.sendStatus(200);
  } catch (err) {
    next(err);
  }
});

// DELETE course
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query("SELECT user_id FROM courses WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ message: "Course not found" });
    if (rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: "You can only delete your own courses" });
    }

    await db.query("DELETE FROM courses WHERE id = ?", [id]);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
