const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", (req, res) => {
  db.query("SELECT * FROM students", (err, result) => {
    if (err) return res.status(500).send(err);
    res.json(result);
  });
});

router.post("/", (req, res) => {
  const { name, email } = req.body;
  db.query(
    "INSERT INTO students (name, email) VALUES (?, ?)",
    [name, email],
    (err) => {
      if (err) return res.status(500).send(err);
      res.sendStatus(201);
    }
  );
});

module.exports = router;
