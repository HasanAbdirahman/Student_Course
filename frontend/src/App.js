import StudentForm from "./components/StudentForm";
import CourseForm from "./components/CourseForm";
import Enrollment from "./components/Enrollment";

function App() {
  return (
    <div>
      <h1>Student Course Enrollment System</h1>
      <StudentForm />
      <CourseForm />
      <Enrollment />
    </div>
  );
}

export default App;
