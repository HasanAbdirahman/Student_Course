import { useEffect, useState } from "react";
import API from "../api";
import "./StudentForm.css";

export default function StudentForm() {
  const currentUserId = Number(localStorage.getItem("userId"));
  const [students, setStudents] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchStudents = async () => {
    try {
      const res = await API.get("/students");
      setStudents(res.data);
    } catch {
      setError("Failed to load students. Please refresh.");
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (editingId) {
        await API.put(`/students/${editingId}`, { name, email });
      } else {
        await API.post("/students", { name, email });
      }
      resetForm();
      await fetchStudents();
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const editStudent = (student) => {
    setName(student.name);
    setEmail(student.email);
    setEditingId(student.id);
    setError("");
  };

  const deleteStudent = async (id) => {
    if (!window.confirm("Delete this student?")) return;
    setError("");
    try {
      await API.delete(`/students/${id}`);
      await fetchStudents();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete student.");
    }
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setEditingId(null);
    setError("");
  };

  return (
    <div className="container">
      <form onSubmit={submit} className="card">
        <h3>{editingId ? "Edit Student" : "Add Student"}</h3>

        {error && <p className="error">{error}</p>}

        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={loading}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
        {students.map((s) => (
          <div className="card row" key={s.id}>
            <div>
              <strong>{s.name}</strong>
              <p>{s.email}</p>
            </div>
            {s.user_id === currentUserId && (
              <div className="actions">
                <button className="edit" onClick={() => editStudent(s)}>
                  Edit
                </button>
                <button className="delete" onClick={() => deleteStudent(s.id)}>
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
