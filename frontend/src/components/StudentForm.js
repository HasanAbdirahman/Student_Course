import { useEffect, useState } from "react";
import API from "../api";
import "./StudentForm.css";

export default function StudentForm() {
  const [students, setStudents] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [editingId, setEditingId] = useState(null);

  const fetchStudents = async () => {
    const res = await API.get("/students");
    setStudents(res.data);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await API.put(`/students/${editingId}`, { name, email });
    } else {
      await API.post("/students", { name, email });
    }
    resetForm();
    fetchStudents();
  };

  const editStudent = (student) => {
    setName(student.name);
    setEmail(student.email);
    setEditingId(student.id);
  };

  const deleteStudent = async (id) => {
    if (window.confirm("Delete this student?")) {
      await API.delete(`/students/${id}`);
      fetchStudents();
    }
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setEditingId(null);
  };

  return (
    <div className="container">
      <form onSubmit={submit} className="card">
        <h3>{editingId ? "Edit Student" : "Add Student"}</h3>

        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
        {students.map((s) => (
          <div className="card row" key={s.id}>
            <div>
              <strong>{s.name}</strong>
              <p>{s.email}</p>
            </div>
            <div className="actions">
              <button className="edit" onClick={() => editStudent(s)}>
                Edit
              </button>
              <button className="delete" onClick={() => deleteStudent(s.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
