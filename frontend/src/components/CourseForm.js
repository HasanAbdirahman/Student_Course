import { useEffect, useState } from "react";
import API from "../api";
import "./Course.css";

export default function CourseForm() {
  const currentUserId = Number(localStorage.getItem("userId"));
  const [courses, setCourses] = useState([]);
  const [title, setTitle] = useState("");
  const [credits, setCredits] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchCourses = async () => {
    try {
      const res = await API.get("/courses");
      setCourses(res.data);
    } catch {
      setError("Failed to load courses. Please refresh.");
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (editingId) {
        await API.put(`/courses/${editingId}`, { title, credits });
      } else {
        await API.post("/courses", { title, credits });
      }
      resetForm();
      await fetchCourses();
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const editCourse = (course) => {
    setTitle(course.title);
    setCredits(course.credits);
    setEditingId(course.id);
    setError("");
  };

  const deleteCourse = async (id) => {
    if (!window.confirm("Delete this course?")) return;
    setError("");
    try {
      await API.delete(`/courses/${id}`);
      await fetchCourses();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete course.");
    }
  };

  const resetForm = () => {
    setTitle("");
    setCredits("");
    setEditingId(null);
    setError("");
  };

  return (
    <div className="container">
      <form onSubmit={submit} className="card">
        <h3>{editingId ? "Edit Course" : "Add Course"}</h3>

        {error && <p className="error">{error}</p>}

        <input
          placeholder="Course Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          disabled={loading}
        />
        <input
          placeholder="Credits"
          type="number"
          min="1"
          max="20"
          value={credits}
          onChange={(e) => setCredits(e.target.value)}
          required
          disabled={loading}
        />

        <div className="actions">
          <button type="submit" disabled={loading}>
            {loading ? "Saving..." : editingId ? "Update" : "Add"}
          </button>
          {editingId && (
            <button type="button" className="cancel" onClick={resetForm} disabled={loading}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="list">
        {courses.map((c) => (
          <div className="card row" key={c.id}>
            <div>
              <strong>{c.title}</strong>
              <p>{c.credits} credits</p>
            </div>
            {c.user_id === currentUserId && (
              <div className="actions">
                <button className="edit" onClick={() => editCourse(c)}>
                  Edit
                </button>
                <button className="delete" onClick={() => deleteCourse(c.id)}>
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
