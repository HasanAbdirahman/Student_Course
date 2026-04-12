const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");

jest.mock("../db", () => ({ query: jest.fn() }));
jest.mock("../logger", () => ({ info: jest.fn(), error: jest.fn() }));

const db = require("../db");
const authMiddleware = require("../middleware/auth");
const enrollmentRoutes = require("../routes/enrollments");

const JWT_SECRET = "dev_secret_change_in_production";

const token = (id) =>
  jwt.sign({ id, username: `user${id}` }, JWT_SECRET);

const app = express();
app.use(express.json());
app.use("/enrollments", authMiddleware, enrollmentRoutes);

describe("POST /enrollments", () => {
  it("enrolls a student in a course and returns 201", async () => {
    db.query
      .mockResolvedValueOnce([[{ id: 1 }], null])        // student exists
      .mockResolvedValueOnce([[{ id: 1 }], null])        // course exists
      .mockResolvedValueOnce([[], null])                 // no duplicate
      .mockResolvedValueOnce([{ insertId: 1 }, null]);   // insert

    const res = await request(app)
      .post("/enrollments")
      .set("Authorization", `Bearer ${token(1)}`)
      .send({ student_id: 1, course_id: 1 });

    expect(res.status).toBe(201);
  });

  it("returns 409 if already enrolled", async () => {
    db.query
      .mockResolvedValueOnce([[{ id: 1 }], null]) // student exists
      .mockResolvedValueOnce([[{ id: 1 }], null]) // course exists
      .mockResolvedValueOnce([[{ id: 5 }], null]); // duplicate found

    const res = await request(app)
      .post("/enrollments")
      .set("Authorization", `Bearer ${token(1)}`)
      .send({ student_id: 1, course_id: 1 });

    expect(res.status).toBe(409);
  });

  it("returns 404 if student does not exist", async () => {
    db.query.mockResolvedValueOnce([[undefined], null]); // student not found

    const res = await request(app)
      .post("/enrollments")
      .set("Authorization", `Bearer ${token(1)}`)
      .send({ student_id: 99, course_id: 1 });

    expect(res.status).toBe(404);
  });

  it("returns 400 if student_id or course_id is missing", async () => {
    const res = await request(app)
      .post("/enrollments")
      .set("Authorization", `Bearer ${token(1)}`)
      .send({ student_id: 1 });

    expect(res.status).toBe(400);
  });
});

describe("GET /enrollments/:studentId", () => {
  it("returns enrolled courses for a student", async () => {
    db.query
      .mockResolvedValueOnce([[{ id: 1 }], null]) // student exists
      .mockResolvedValueOnce([[{ id: 1, title: "Math", credits: 3 }], null]); // courses

    const res = await request(app)
      .get("/enrollments/1")
      .set("Authorization", `Bearer ${token(1)}`);

    expect(res.status).toBe(200);
    expect(res.body[0].title).toBe("Math");
  });

  it("returns 404 if student does not exist", async () => {
    db.query.mockResolvedValueOnce([[undefined], null]);

    const res = await request(app)
      .get("/enrollments/99")
      .set("Authorization", `Bearer ${token(1)}`);

    expect(res.status).toBe(404);
  });
});

describe("DELETE /enrollments", () => {
  it("removes an enrollment and returns 204", async () => {
    db.query.mockResolvedValueOnce([{ affectedRows: 1 }, null]);

    const res = await request(app)
      .delete("/enrollments")
      .set("Authorization", `Bearer ${token(1)}`)
      .send({ student_id: 1, course_id: 1 });

    expect(res.status).toBe(204);
  });

  it("returns 404 if enrollment does not exist", async () => {
    db.query.mockResolvedValueOnce([{ affectedRows: 0 }, null]);

    const res = await request(app)
      .delete("/enrollments")
      .set("Authorization", `Bearer ${token(1)}`)
      .send({ student_id: 1, course_id: 99 });

    expect(res.status).toBe(404);
  });
});
