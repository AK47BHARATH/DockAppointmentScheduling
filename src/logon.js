import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";

const Login = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();
 
  useEffect(() => {
    fetch("/logon.json") // if inside public folder
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .catch((err) => console.error("Failed to load users:", err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const isValidUser = users.some(
      (user) =>
        user.username === credentials.username &&
        user.password === credentials.password
    );

    if (isValidUser) {
      onLogin();
      navigate("/homepage");
    } else {
      setError("Invalid username or password");
    }
  };

  return (
    <div className="login-container">
     {/* <img src="/ark.jpg" alt="Ark Logo" className="logo" style={{ position: 'head',top:'100px'  , width: '170px' }} /> */}
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