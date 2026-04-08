const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const logger = require("./logger");
const { register, httpRequestDuration, httpRequestTotal } = require("./metrics");

const authRoutes = require("./routes/auth");
const studentRoutes = require("./routes/students");
const courseRoutes = require("./routes/courses");
const enrollmentRoutes = require("./routes/enrollments");
const authMiddleware = require("./middleware/auth");

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:3000"];

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// HTTP request logging — JSON format so log aggregators can parse it
app.use(
  morgan("combined", {
    stream: { write: (msg) => logger.info(msg.trim()) },
  })
);

// Record request duration and count for Prometheus
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on("finish", () => {
    const labels = {
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode,
    };
    end(labels);
    httpRequestTotal.inc(labels);
  });
  next();
});

// Prometheus scrape endpoint — public so Prometheus can reach it without auth
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

app.get("/health", (req, res) => res.json({ status: "ok" }));

// Public routes
app.use("/auth", authRoutes);

// Protected routes
app.use("/students", authMiddleware, studentRoutes);
app.use("/courses", authMiddleware, courseRoutes);
app.use("/enrollments", authMiddleware, enrollmentRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error({ message: err.message, stack: err.stack });
  res.status(500).json({ message: "Internal server error" });
});

app.listen(5000, () => {
  logger.info("Server running on port 5000");
});
