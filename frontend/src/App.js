import { useState } from "react";
import Login from "./components/Login";
import StudentForm from "./components/StudentForm";
import CourseForm from "./components/CourseForm";
import Enrollment from "./components/Enrollment";

function App() {
  const [username, setUsername] = useState(
    localStorage.getItem("username") || ""
  );

  const isLoggedIn = !!localStorage.getItem("token");

  const handleLogin = (name) => {
    setUsername(name);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setUsername("");
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 2rem", background: "white", boxShadow: "0 2px 6px rgba(0,0,0,0.08)" }}>
        <h1 style={{ margin: 0, fontSize: "1.3rem" }}>Student Course Enrollment System</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ color: "#7f8c8d", fontSize: "0.9rem" }}>
            Logged in as <strong>{username}</strong>
          </span>
          <button
            onClick={handleLogout}
            style={{ padding: "0.4rem 1rem", background: "#e74c3c", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ padding: "1.5rem 2rem" }}>
        <StudentForm />
        <CourseForm />
        <Enrollment />
      </div>
    </div>
  );
}

export default App;
