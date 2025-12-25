const express = require("express");
const cors = require("cors");

const studentRoutes = require("./routes/students");
const courseRoutes = require("./routes/courses");
const enrollmentRoutes = require("./routes/enrollments");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/students", studentRoutes);
app.use("/courses", courseRoutes);
app.use("/enrollments", enrollmentRoutes);

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
