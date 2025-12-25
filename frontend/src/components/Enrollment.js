import { useEffect, useState } from "react";
import API from "../api";

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
    await API.post("/enrollments", {
      student_id: studentId,
      course_id: courseId,
    });
    alert("Enrolled successfully");
  };

  return (
    <div>
      <h3>Enroll Student</h3>
      <select onChange={(e) => setStudentId(e.target.value)}>
        <option>Select Student</option>
        {students.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <select onChange={(e) => setCourseId(e.target.value)}>
        <option>Select Course</option>
        {courses.map((c) => (
          <option key={c.id} value={c.id}>
            {c.title}
          </option>
        ))}
      </select>
      <button onClick={enroll}>Enroll</button>
    </div>
  );
}
