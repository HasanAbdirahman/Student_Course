const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", (req, res) => {
  db.query("SELECT * FROM courses", (err, result) => {
    if (err) return res.status(500).send(err);
    res.json(result);
  });
});

router.post("/", (req, res) => {
  const { title, credits } = req.body;
  db.query(
    "INSERT INTO courses (title, credits) VALUES (?, ?)",
    [title, credits],
    (err) => {
      if (err) return res.status(500).send(err);
      res.sendStatus(201);
    }
  );
});

module.exports = router;
