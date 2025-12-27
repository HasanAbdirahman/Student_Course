import { useEffect, useState } from "react";
import API from "../api";
import "./Course.css";

export default function CourseForm() {
  const [courses, setCourses] = useState([]);
  const [title, setTitle] = useState("");
  const [credits, setCredits] = useState("");
  const [editingId, setEditingId] = useState(null);

  const fetchCourses = async () => {
    const res = await API.get("/courses");
    setCourses(res.data);
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await API.put(`/courses/${editingId}`, { title, credits });
    } else {
      await API.post("/courses", { title, credits });
    }
    resetForm();
    fetchCourses();
  };

  const editCourse = (course) => {
    setTitle(course.title);
    setCredits(course.credits);
    setEditingId(course.id);
  };

  const deleteCourse = async (id) => {
    if (window.confirm("Delete this course?")) {
      await API.delete(`/courses/${id}`);
      fetchCourses();
    }
  };

  const resetForm = () => {
    setTitle("");
    setCredits("");
    setEditingId(null);
  };

  return (
    <div className="container">
      <form onSubmit={submit} className="card">
        <h3>{editingId ? "Edit Course" : "Add Course"}</h3>

        <input
          placeholder="Course Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <input
          placeholder="Credits"
          type="number"
          value={credits}
          onChange={(e) => setCredits(e.target.value)}
          required
        />

        <div className="actions">
          <button type="submit">{editingId ? "Update" : "Add"}</button>
          {editingId && (
            <button type="button" className="cancel" onClick={resetForm}>
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
            <div className="actions">
              <button className="edit" onClick={() => editCourse(c)}>
                Edit
              </button>
              <button className="delete" onClick={() => deleteCourse(c.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
