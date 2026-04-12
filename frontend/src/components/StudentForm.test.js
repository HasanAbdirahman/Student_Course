import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import StudentForm from "./StudentForm";
import API from "../api";

jest.mock("../api", () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

const mockStudents = [
  { id: 1, name: "Alice", email: "alice@test.com", user_id: 1 },
  { id: 2, name: "Bob",   email: "bob@test.com",   user_id: 2 },
];

describe("StudentForm component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem("userId", "1"); // logged in as user 1
    API.get.mockResolvedValue({ data: mockStudents });
  });

  it("renders the add student form", async () => {
    render(<StudentForm />);
    expect(screen.getByPlaceholderText("Name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add/i })).toBeInTheDocument();
  });

  it("displays all students", async () => {
    render(<StudentForm />);
    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("Bob")).toBeInTheDocument();
    });
  });

  it("shows edit and delete only for the logged-in user's own record", async () => {
    render(<StudentForm />);
    await waitFor(() => screen.getByText("Alice"));

    const editButtons = screen.getAllByRole("button", { name: /edit/i });
    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });

    // Only one edit/delete pair — for Alice (user_id: 1), not Bob (user_id: 2)
    expect(editButtons).toHaveLength(1);
    expect(deleteButtons).toHaveLength(1);
  });

  it("populates form when edit is clicked", async () => {
    render(<StudentForm />);
    await waitFor(() => screen.getByText("Alice"));

    fireEvent.click(screen.getByRole("button", { name: /edit/i }));

    expect(screen.getByPlaceholderText("Name").value).toBe("Alice");
    expect(screen.getByPlaceholderText("Email").value).toBe("alice@test.com");
  });

  it("submits a new student", async () => {
    API.post.mockResolvedValueOnce({});

    render(<StudentForm />);
    fireEvent.change(screen.getByPlaceholderText("Name"), { target: { value: "Carol" } });
    fireEvent.change(screen.getByPlaceholderText("Email"), { target: { value: "carol@test.com" } });
    fireEvent.click(screen.getByRole("button", { name: /add/i }));

    await waitFor(() => {
      expect(API.post).toHaveBeenCalledWith("/students", {
        name: "Carol",
        email: "carol@test.com",
      });
    });
  });

  it("shows error message when submission fails", async () => {
    API.post.mockRejectedValueOnce({
      response: { data: { message: "A student with this email already exists" } },
    });

    render(<StudentForm />);
    fireEvent.change(screen.getByPlaceholderText("Name"), { target: { value: "Alice" } });
    fireEvent.change(screen.getByPlaceholderText("Email"), { target: { value: "alice@test.com" } });
    fireEvent.click(screen.getByRole("button", { name: /add/i }));

    await waitFor(() => {
      expect(screen.getByText("A student with this email already exists")).toBeInTheDocument();
    });
  });
});
