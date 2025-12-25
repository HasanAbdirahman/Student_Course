import { useState } from "react";
import API from "../api";

export default function StudentForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    await API.post("/students", { name, email });
    setName("");
    setEmail("");
  };

  return (
    <form onSubmit={submit}>
      <h3>Add Student</h3>
      <input
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button>Add</button>
    </form>
  );
}
