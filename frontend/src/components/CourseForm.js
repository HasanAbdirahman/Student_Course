import { useState } from "react";
import API from "../api";

export default function CourseForm() {
  const [title, setTitle] = useState("");
  const [credits, setCredits] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    await API.post("/courses", { title, credits });
    setTitle("");
    setCredits("");
  };

  return (
    <form onSubmit={submit}>
      <h3>Add Course</h3>
      <input
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <input
        placeholder="Credits"
        value={credits}
        onChange={(e) => setCredits(e.target.value)}
      />
      <button>Add</button>
    </form>
  );
}
