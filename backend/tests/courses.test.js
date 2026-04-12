const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");

jest.mock("../db", () => ({ query: jest.fn() }));
jest.mock("../logger", () => ({ info: jest.fn(), error: jest.fn() }));

const db = require("../db");
const authMiddleware = require("../middleware/auth");
const courseRoutes = require("../routes/courses");

const JWT_SECRET = "dev_secret_change_in_production";

const token = (id) =>
  jwt.sign({ id, username: `user${id}` }, JWT_SECRET);

const app = express();
app.use(express.json());
app.use("/courses", authMiddleware, courseRoutes);

describe("GET /courses", () => {
  it("returns all courses", async () => {
    db.query.mockResolvedValueOnce([[{ id: 1, title: "Math", credits: 3, user_id: 1 }], null]);

    const res = await request(app)
      .get("/courses")
      .set("Authorization", `Bearer ${token(1)}`);

    expect(res.status).toBe(200);
    expect(res.body[0].title).toBe("Math");
  });

  it("returns 401 without a token", async () => {
    const res = await request(app).get("/courses");
    expect(res.status).toBe(401);
  });
});

describe("POST /courses", () => {
  it("creates a course and returns 201", async () => {
    db.query.mockResolvedValueOnce([{ insertId: 1 }, null]);

    const res = await request(app)
      .post("/courses")
      .set("Authorization", `Bearer ${token(1)}`)
      .send({ title: "Math", credits: 3 });

    expect(res.status).toBe(201);
  });

  it("returns 400 if title is missing", async () => {
    const res = await request(app)
      .post("/courses")
      .set("Authorization", `Bearer ${token(1)}`)
      .send({ credits: 3 });

    expect(res.status).toBe(400);
  });

  it("returns 400 if credits are out of range", async () => {
    const res = await request(app)
      .post("/courses")
      .set("Authorization", `Bearer ${token(1)}`)
      .send({ title: "Math", credits: 99 });

    expect(res.status).toBe(400);
  });
});

describe("PUT /courses/:id", () => {
  it("updates own course and returns 200", async () => {
    db.query
      .mockResolvedValueOnce([[{ user_id: 1 }], null])   // ownership check
      .mockResolvedValueOnce([{ affectedRows: 1 }, null]); // update

    const res = await request(app)
      .put("/courses/1")
      .set("Authorization", `Bearer ${token(1)}`)
      .send({ title: "Advanced Math", credits: 4 });

    expect(res.status).toBe(200);
  });

  it("returns 403 when editing another user's course", async () => {
    db.query.mockResolvedValueOnce([[{ user_id: 2 }], null]); // owned by user 2

    const res = await request(app)
      .put("/courses/1")
      .set("Authorization", `Bearer ${token(1)}`) // logged in as user 1
      .send({ title: "Advanced Math", credits: 4 });

    expect(res.status).toBe(403);
  });

  it("returns 404 if course does not exist", async () => {
    db.query.mockResolvedValueOnce([[], null]);

    const res = await request(app)
      .put("/courses/99")
      .set("Authorization", `Bearer ${token(1)}`)
      .send({ title: "Math", credits: 3 });

    expect(res.status).toBe(404);
  });
});

describe("DELETE /courses/:id", () => {
  it("deletes own course and returns 204", async () => {
    db.query
      .mockResolvedValueOnce([[{ user_id: 1 }], null])
      .mockResolvedValueOnce([{ affectedRows: 1 }, null]);

    const res = await request(app)
      .delete("/courses/1")
      .set("Authorization", `Bearer ${token(1)}`);

    expect(res.status).toBe(204);
  });

  it("returns 403 when deleting another user's course", async () => {
    db.query.mockResolvedValueOnce([[{ user_id: 2 }], null]);

    const res = await request(app)
      .delete("/courses/1")
      .set("Authorization", `Bearer ${token(1)}`);

    expect(res.status).toBe(403);
  });

  it("returns 404 if course does not exist", async () => {
    db.query.mockResolvedValueOnce([[], null]);

    const res = await request(app)
      .delete("/courses/99")
      .set("Authorization", `Bearer ${token(1)}`);

    expect(res.status).toBe(404);
  });
});
