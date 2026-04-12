const request = require("supertest");
const express = require("express");
const bcrypt = require("bcryptjs");

jest.mock("../db", () => ({ query: jest.fn() }));
jest.mock("../logger", () => ({ info: jest.fn(), error: jest.fn() }));

const db = require("../db");
const authRoutes = require("../routes/auth");

const app = express();
app.use(express.json());
app.use("/auth", authRoutes);

describe("POST /auth/register", () => {
  it("creates a new user and returns 201", async () => {
    db.query
      .mockResolvedValueOnce([[], null])           // no existing user
      .mockResolvedValueOnce([{ insertId: 1 }, null]); // insert

    const res = await request(app)
      .post("/auth/register")
      .send({ username: "alice", password: "secret123" });

    expect(res.status).toBe(201);
    expect(res.body.message).toMatch(/Account created/i);
  });

  it("returns 409 if username is taken", async () => {
    db.query.mockResolvedValueOnce([[{ id: 1 }], null]); // existing user found

    const res = await request(app)
      .post("/auth/register")
      .send({ username: "alice", password: "secret123" });

    expect(res.status).toBe(409);
  });

  it("returns 400 if username is missing", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ password: "secret123" });

    expect(res.status).toBe(400);
  });

  it("returns 400 if password is too short", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ username: "alice", password: "abc" });

    expect(res.status).toBe(400);
  });
});

describe("POST /auth/login", () => {
  it("returns a token on valid credentials", async () => {
    const hashed = await bcrypt.hash("secret123", 10);
    db.query.mockResolvedValueOnce([[{ id: 1, username: "alice", password: hashed }], null]);

    const res = await request(app)
      .post("/auth/login")
      .send({ username: "alice", password: "secret123" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.username).toBe("alice");
    expect(res.body.userId).toBe(1);
  });

  it("returns 401 for wrong password", async () => {
    const hashed = await bcrypt.hash("secret123", 10);
    db.query.mockResolvedValueOnce([[{ id: 1, username: "alice", password: hashed }], null]);

    const res = await request(app)
      .post("/auth/login")
      .send({ username: "alice", password: "wrongpass" });

    expect(res.status).toBe(401);
  });

  it("returns 401 if user does not exist", async () => {
    db.query.mockResolvedValueOnce([[], null]);

    const res = await request(app)
      .post("/auth/login")
      .send({ username: "ghost", password: "secret123" });

    expect(res.status).toBe(401);
  });

  it("returns 400 if credentials are missing", async () => {
    const res = await request(app).post("/auth/login").send({});
    expect(res.status).toBe(400);
  });
});
