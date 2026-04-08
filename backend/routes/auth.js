const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_in_production";
const TOKEN_EXPIRY = "8h";

// REGISTER
router.post("/register", async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || typeof username !== "string" || username.trim().length === 0) {
      return res.status(400).json({ message: "Username is required" });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const [existing] = await db.query(
      "SELECT id FROM users WHERE username = ?",
      [username.trim()]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: "Username already taken" });
    }

    const hashed = await bcrypt.hash(password, 10);
    await db.query("INSERT INTO users (username, password) VALUES (?, ?)", [
      username.trim(),
      hashed,
    ]);

    res.status(201).json({ message: "Account created. You can now log in." });
  } catch (err) {
    next(err);
  }
});

// LOGIN
router.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    const [rows] = await db.query("SELECT * FROM users WHERE username = ?", [
      username.trim(),
    ]);
    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    res.json({ token, username: user.username });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
