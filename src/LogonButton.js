import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import authorizedUsers from "./authorizedUsers.json";

const LogonButton = ({ onButtonClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const username = location.state?.username || "";

  const [result, setResult] = useState(null); // "authorized" | "unauthorized" | null
  const [error, setError] = useState("");

  const handleClick = () => {
    try {
      if (!username) {
        throw new Error("Username not provided.");
      }

      const userList = authorizedUsers.users || [];
      const isAuthorized = userList.some(
        (user) => user.toLowerCase() === username.toLowerCase()
      );

      if (isAuthorized) {
        setResult("authorized");
        onButtonClick?.(); // Optional callback
        navigate("/homepage");
      } else {
        setResult("unauthorized");
        setError(`User "${username}" is not authorized.`);
      }
    } catch (err) {
      setResult("unauthorized");
      setError(err.message || "An error occurred during authorization.");
    }
  };

  return (
    <div className="logon-button-container">
      <h2>Welcome  {username || "Guest"}</h2>
      {/* <p>Click the button below to check if you're authorized:</p> */}
      <button className="proceed-button" onClick={handleClick}>
        DOCK APPOINTMENT
      </button>

      {result === "authorized" && (
        <p className="success-message">✅ You are authorized. Redirecting...</p>
      )}

      {result === "unauthorized" && (
        <p className="error-message">❌ Access Denied. {error}</p>
      )}
    </div>
  );
};

export default LogonButton;
