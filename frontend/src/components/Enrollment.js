import { useEffect, useState } from "react";
import API from "../api";
import "./Enrollment.css";

export default function Enrollment() {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [courseId, setCourseId] = useState("");

  useEffect(() => {
    API.get("/students").then((res) => setStudents(res.data));
    API.get("/courses").then((res) => setCourses(res.data));
  }, []);

  const enroll = async () => {
    if (!studentId || !courseId) {
      alert("Please select both student and course");
      return;
    }

    await API.post("/enrollments", {
      student_id: studentId,
      course_id: courseId,
    });

    alert("Student enrolled successfully");
    setStudentId("");
    setCourseId("");
  };

  return (
    <div className="container">
      <div className="card">
        <h3>Enroll Student</h3>

        <select
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
        >
          <option value="">Select Student</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
          <option value="">Select Course</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>

        <button className="enroll-btn" onClick={enroll}>
          Enroll
        </button>
      </div>
    </div>
  );
}
