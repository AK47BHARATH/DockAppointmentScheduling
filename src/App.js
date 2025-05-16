import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import DockScheduler from "./DockScheduler";
import Login from "./logon";
import Homepage from "./Homepage";
import AppointmentsPage from "./AppointmentsPage";
import LogonButton from "./LogonButton";
import "./App.css";

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLogonButtonClicked, setIsLogonButtonClicked] = useState(false);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogonButtonClick = () => {
    setIsLogonButtonClicked(true);
  };

  return (
    <Router>
      <BodyClassManager />
      <Routes>
        <Route path="/" element={<Login onLogin={handleLogin} />} />
        <Route 
          path="/logonbutton" 
          element={isLoggedIn ? <LogonButton onButtonClick={handleLogonButtonClick} /> : <Navigate to="/" />} 
        />
        <Route 
          path="/homepage" 
          element={isLoggedIn && isLogonButtonClicked ? <Homepage /> : <Navigate to="/logonbutton" />} 
        />
        <Route 
          path="/DockScheduler" 
          element={isLoggedIn && isLogonButtonClicked ? <DockScheduler /> : <Navigate to="/logonbutton" />} 
        />
        <Route 
          path="/appointments" 
          element={isLoggedIn && isLogonButtonClicked ? <AppointmentsPage /> : <Navigate to="/logonbutton" />} 
        />
      </Routes>
    </Router>
  );
};

const BodyClassManager = () => {
  const location = useLocation();

  React.useEffect(() => {
    document.body.className = "";
    if (location.pathname === "/") {
      document.body.classList.add("login-bg");
    } else if (location.pathname === "/logonbutton") {
      document.body.classList.add("logonbutton-bg");
    } else if (location.pathname === "/homepage") {
      document.body.classList.add("homepage-bg");
    } else if (location.pathname === "/DockScheduler") {
      document.body.classList.add("dock-bg");
    } else if (location.pathname === "/appointments") {
      document.body.classList.add("appointments-bg");
    }
  }, [location]);

  return null;
};

export default App;