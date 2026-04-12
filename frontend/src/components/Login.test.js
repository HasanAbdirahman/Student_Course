import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Login from "./Login";
import API from "../api";

jest.mock("../api", () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

describe("Login component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it("renders the sign in form by default", () => {
    render(<Login onLogin={jest.fn()} />);
    expect(screen.getByRole("heading", { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Username")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
  });

  it("calls onLogin and stores token on successful login", async () => {
    const onLogin = jest.fn();
    API.post.mockResolvedValueOnce({
      data: { token: "fake-token", username: "alice", userId: 1 },
    });

    render(<Login onLogin={onLogin} />);
    fireEvent.change(screen.getByPlaceholderText("Username"), { target: { value: "alice" } });
    fireEvent.change(screen.getByPlaceholderText("Password"), { target: { value: "secret123" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(localStorage.getItem("token")).toBe("fake-token");
      expect(localStorage.getItem("username")).toBe("alice");
      expect(localStorage.getItem("userId")).toBe("1");
      expect(onLogin).toHaveBeenCalledWith("alice");
    });
  });

  it("shows an error message on failed login", async () => {
    API.post.mockRejectedValueOnce({
      response: { data: { message: "Invalid username or password" } },
    });

    render(<Login onLogin={jest.fn()} />);
    fireEvent.change(screen.getByPlaceholderText("Username"), { target: { value: "alice" } });
    fireEvent.change(screen.getByPlaceholderText("Password"), { target: { value: "wrong" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText("Invalid username or password")).toBeInTheDocument();
    });
  });

  it("switches to the register form", () => {
    render(<Login onLogin={jest.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /register/i }));
    expect(screen.getByRole("heading", { name: /create account/i })).toBeInTheDocument();
  });

  it("shows success message after registration", async () => {
    API.post.mockResolvedValueOnce({ data: { message: "Account created." } });

    render(<Login onLogin={jest.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /register/i }));
    fireEvent.change(screen.getByPlaceholderText("Username"), { target: { value: "bob" } });
    fireEvent.change(screen.getByPlaceholderText("Password"), { target: { value: "secret123" } });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/account created/i)).toBeInTheDocument();
    });
  });
});
