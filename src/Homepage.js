import React from "react";
import { useNavigate } from "react-router-dom";
import "./Homepage.css";

const Homepage = () => {
  const navigate = useNavigate();

  const goToDockScheduler = () => {
    navigate("/DockScheduler");
  };

  const goToAppointmentPage = () => {
    navigate("/appointments");
  };
  

  return (
    <div className="homepage-container">
      <div className="homepage-content">
        <h1>Welcome to the Dock Appointment System</h1>
        <p>Manage your dock appointments efficiently.</p>
        <button className="btn-navigate" onClick={goToDockScheduler}>
          Go to Dock Scheduler
        </button>
        <button className="btn-navigate" onClick={goToAppointmentPage}>
          Go to Appointment Page
        </button>
      </div>
    </div>
  );
};

export default Homepage;
