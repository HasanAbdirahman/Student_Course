import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CourseForm from "./CourseForm";
import API from "../api";

jest.mock("../api", () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

const mockCourses = [
  { id: 1, title: "Math",    credits: 3, user_id: 1 },
  { id: 2, title: "Physics", credits: 4, user_id: 2 },
];

describe("CourseForm component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem("userId", "1");
    API.get.mockResolvedValue({ data: mockCourses });
  });

  it("renders the add course form", async () => {
    render(<CourseForm />);
    await screen.findByText("Math"); // wait for initial fetch to settle
    expect(screen.getByPlaceholderText("Course Title")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Credits")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add/i })).toBeInTheDocument();
  });

  it("displays all courses", async () => {
    render(<CourseForm />);
    expect(await screen.findByText("Math")).toBeInTheDocument();
    expect(screen.getByText("Physics")).toBeInTheDocument();
  });

  it("shows edit and delete only for the logged-in user's own courses", async () => {
    render(<CourseForm />);
    await screen.findByText("Math");

    const editButtons = screen.getAllByRole("button", { name: /edit/i });
    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });

    // Only one edit/delete pair — for Math (user_id: 1), not Physics (user_id: 2)
    expect(editButtons).toHaveLength(1);
    expect(deleteButtons).toHaveLength(1);
  });

  it("populates form when edit is clicked", async () => {
    render(<CourseForm />);
    await screen.findByText("Math");

    fireEvent.click(screen.getByRole("button", { name: /edit/i }));

    expect(screen.getByPlaceholderText("Course Title").value).toBe("Math");
    expect(Number(screen.getByPlaceholderText("Credits").value)).toBe(3);
  });

  it("submits a new course", async () => {
    API.post.mockResolvedValueOnce({});
    render(<CourseForm />);
    await screen.findByText("Math");

    fireEvent.change(screen.getByPlaceholderText("Course Title"), { target: { value: "Chemistry" } });
    fireEvent.change(screen.getByPlaceholderText("Credits"), { target: { value: "3" } });
    fireEvent.click(screen.getByRole("button", { name: /add/i }));

    await waitFor(() => {
      expect(API.post).toHaveBeenCalledWith("/courses", {
        title: "Chemistry",
        credits: "3",
      });
    });
  });

  it("shows error message when submission fails", async () => {
    API.post.mockRejectedValueOnce({
      response: { data: { message: "Something went wrong. Please try again." } },
    });

    render(<CourseForm />);
    await screen.findByText("Math");

    fireEvent.change(screen.getByPlaceholderText("Course Title"), { target: { value: "Math" } });
    fireEvent.change(screen.getByPlaceholderText("Credits"), { target: { value: "3" } });
    fireEvent.click(screen.getByRole("button", { name: /add/i }));

    expect(await screen.findByText("Something went wrong. Please try again.")).toBeInTheDocument();
  });
});
