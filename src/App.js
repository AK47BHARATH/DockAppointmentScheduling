import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import DockScheduler from "./DockScheduler";
import Login from "./logon";
import Homepage from "./Homepage";
import AppointmentsPage from "./AppointmentsPage";
import "./App.css";

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  return (
    <Router>
      <BodyClassManager />
      <Routes>
        <Route path="/" element={<Login onLogin={handleLogin} />} />
        <Route 
          path="/DockScheduler" 
          element={isLoggedIn ? <DockScheduler /> : <Navigate to="/" />} 
        />
        <Route 
          path="/homepage" 
          element={isLoggedIn ? <Homepage /> : <Navigate to="/" />} 
        />
        <Route 
          path="/appointments" 
          element={isLoggedIn ? <AppointmentsPage /> : <Navigate to="/" />} 
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
    } else if (location.pathname === "/DockScheduler") {
      document.body.classList.add("dock-bg");
    } else if (location.pathname === "/homepage") {
      document.body.classList.add("homepage-bg");
    } else if (location.pathname === "/appointments") {
      document.body.classList.add("appointments-bg");
    }
  }, [location]);

  return null;
};

export default App;