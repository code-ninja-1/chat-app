import { createContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useSnackbar } from "./SnackbarContext";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(localStorage.getItem("user") || null);
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();

  const login = async (username, password) => {
    try {
      const { data } = await axios.post("http://localhost:5000/login", { username, password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", data.username);
      setUser(data.username);
      navigate("/chat");
      showSnackbar("Login successful!", "info");
    } catch (error) {
      showSnackbar(error.response?.data?.message || "Login failed", "error");
    }
  };

  const register = async (username, password) => {
    try {
      await axios.post("http://localhost:5000/register", { username, password });
      showSnackbar("User registered successfully. Please log in.", "success");
      navigate("/login");
    } catch (error) {
      showSnackbar(error.response?.data?.message || "Registration failed", "error");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
    showSnackbar("Logged out successfully.", "info");
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
