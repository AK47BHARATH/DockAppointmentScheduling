import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./login.css";

//<img src="/CherryBlossom-logon.jpg" alt="body" className="body" />

const Login = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate(); // Hook for navigation

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (credentials.username === "admin" && credentials.password === "password")
      
      {
      onLogin();
      navigate("/homepage"); // Redirect on success

    } else {
      setError("Invalid username or password");
    }
  };


  return (
    <div className="login-container">
      <img src="/CherryBlossom-logon.jpg" alt="Login Background" className="login-bg" />
      <h2>Dock Appointment Login</h2>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>Username:</label>
          <input type="text" name="username" value={credentials.username} onChange={handleChange} required />
        </div>
        <div className="input-group">
          <label>Password:</label>
          <input type="password" name="password" value={credentials.password} onChange={handleChange} required />
        </div>
        {error && <p className="error-message">{error}</p>}
        <button type="submit" className="btn-login">Login</button>
      </form>
    </div>
  );
};

export default Login;
