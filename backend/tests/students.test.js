const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");

jest.mock("../db", () => ({ query: jest.fn() }));
jest.mock("../logger", () => ({ info: jest.fn(), error: jest.fn() }));

const db = require("../db");
const authMiddleware = require("../middleware/auth");
const studentRoutes = require("../routes/students");

const JWT_SECRET = "dev_secret_change_in_production";

// Helper: generate a token for a given user id
const token = (id) =>
  jwt.sign({ id, username: `user${id}` }, JWT_SECRET);

const app = express();
app.use(express.json());
app.use("/students", authMiddleware, studentRoutes);

describe("GET /students", () => {
  it("returns all students", async () => {
    db.query.mockResolvedValueOnce([[{ id: 1, name: "Alice", email: "alice@test.com", user_id: 1 }], null]);

    const res = await request(app)
      .get("/students")
      .set("Authorization", `Bearer ${token(1)}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe("Alice");
  });

  it("returns 401 without a token", async () => {
    const res = await request(app).get("/students");
    expect(res.status).toBe(401);
  });
});

describe("POST /students", () => {
  it("creates a student and returns 201", async () => {
    db.query
      .mockResolvedValueOnce([[], null])               // no duplicate email
      .mockResolvedValueOnce([{ insertId: 1 }, null]); // insert

    const res = await request(app)
      .post("/students")
      .set("Authorization", `Bearer ${token(1)}`)
      .send({ name: "Alice", email: "alice@test.com" });

    expect(res.status).toBe(201);
  });

  it("returns 409 if email already exists", async () => {
    db.query.mockResolvedValueOnce([[{ id: 2 }], null]); // duplicate found

    const res = await request(app)
      .post("/students")
      .set("Authorization", `Bearer ${token(1)}`)
      .send({ name: "Alice", email: "alice@test.com" });

    expect(res.status).toBe(409);
  });

  it("returns 400 if name is missing", async () => {
    const res = await request(app)
      .post("/students")
      .set("Authorization", `Bearer ${token(1)}`)
      .send({ email: "alice@test.com" });

    expect(res.status).toBe(400);
  });

  it("returns 400 if email is invalid", async () => {
    const res = await request(app)
      .post("/students")
      .set("Authorization", `Bearer ${token(1)}`)
      .send({ name: "Alice", email: "not-an-email" });

    expect(res.status).toBe(400);
  });
});

describe("PUT /students/:id", () => {
  it("updates own record and returns 200", async () => {
    db.query
      .mockResolvedValueOnce([[{ user_id: 1 }], null]) // ownership check
      .mockResolvedValueOnce([[], null])               // no duplicate email
      .mockResolvedValueOnce([{ affectedRows: 1 }, null]); // update

    const res = await request(app)
      .put("/students/1")
      .set("Authorization", `Bearer ${token(1)}`)
      .send({ name: "Alice Updated", email: "alice@test.com" });

    expect(res.status).toBe(200);
  });

  it("returns 403 when editing another user's record", async () => {
    db.query.mockResolvedValueOnce([[{ user_id: 2 }], null]); // owned by user 2

    const res = await request(app)
      .put("/students/1")
      .set("Authorization", `Bearer ${token(1)}`) // logged in as user 1
      .send({ name: "Alice", email: "alice@test.com" });

    expect(res.status).toBe(403);
  });

  it("returns 404 if student does not exist", async () => {
    db.query.mockResolvedValueOnce([[], null]); // not found

    const res = await request(app)
      .put("/students/99")
      .set("Authorization", `Bearer ${token(1)}`)
      .send({ name: "Alice", email: "alice@test.com" });

    expect(res.status).toBe(404);
  });
});

describe("DELETE /students/:id", () => {
  it("deletes own record and returns 204", async () => {
    db.query
      .mockResolvedValueOnce([[{ user_id: 1 }], null]) // ownership check
      .mockResolvedValueOnce([{ affectedRows: 1 }, null]); // delete

    const res = await request(app)
      .delete("/students/1")
      .set("Authorization", `Bearer ${token(1)}`);

    expect(res.status).toBe(204);
  });

  it("returns 403 when deleting another user's record", async () => {
    db.query.mockResolvedValueOnce([[{ user_id: 2 }], null]); // owned by user 2

    const res = await request(app)
      .delete("/students/1")
      .set("Authorization", `Bearer ${token(1)}`); // logged in as user 1

    expect(res.status).toBe(403);
  });

  it("returns 404 if student does not exist", async () => {
    db.query.mockResolvedValueOnce([[], null]);

    const res = await request(app)
      .delete("/students/99")
      .set("Authorization", `Bearer ${token(1)}`);

    expect(res.status).toBe(404);
  });
});
