import { useEffect, useState } from "react";
import API from "../api";
import "./Enrollment.css";

export default function Enrollment() {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    API.get("/students")
      .then((res) => setStudents(res.data))
      .catch(() => setError("Failed to load students."));
    API.get("/courses")
      .then((res) => setCourses(res.data))
      .catch(() => setError("Failed to load courses."));
  }, []);

  const fetchEnrollments = async (sid) => {
    try {
      const res = await API.get(`/enrollments/${sid}`);
      setEnrollments(res.data);
    } catch {
      setEnrollments([]);
    }
  };

  const handleStudentChange = (e) => {
    const sid = e.target.value;
    setStudentId(sid);
    setCourseId("");
    setError("");
    setSuccess("");
    if (sid) fetchEnrollments(sid);
    else setEnrollments([]);
  };

  const enroll = async () => {
    if (!studentId || !courseId) {
      setError("Please select both a student and a course");
      return;
    }
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await API.post("/enrollments", {
        student_id: studentId,
        course_id: courseId,
      });
      setSuccess("Student enrolled successfully");
      setCourseId("");
      await fetchEnrollments(studentId);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to enroll student.");
    } finally {
      setLoading(false);
    }
  };

  const unenroll = async (cid) => {
    if (!window.confirm("Remove this enrollment?")) return;
    setError("");
    setSuccess("");
    try {
      await API.delete("/enrollments", {
        data: { student_id: studentId, course_id: cid },
      });
      setSuccess("Enrollment removed");
      await fetchEnrollments(studentId);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove enrollment.");
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h3>Enroll Student</h3>

        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}

        <select value={studentId} onChange={handleStudentChange}>
          <option value="">Select Student</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          value={courseId}
          onChange={(e) => { setCourseId(e.target.value); setError(""); }}
        >
          <option value="">Select Course</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>

        <button className="enroll-btn" onClick={enroll} disabled={loading}>
          {loading ? "Enrolling..." : "Enroll"}
        </button>
      </div>

      {studentId && enrollments.length > 0 && (
        <div className="list">
          <h4>Current Enrollments</h4>
          {enrollments.map((c) => (
            <div className="card row" key={c.id}>
              <div>
                <strong>{c.title}</strong>
                <p>{c.credits} credits</p>
              </div>
              <button className="delete" onClick={() => unenroll(c.id)}>
                Unenroll
              </button>
            </div>
          ))}
        </div>
      )}

      {studentId && enrollments.length === 0 && (
        <p className="empty">No enrollments yet for this student.</p>
      )}
    </div>
  );
}
