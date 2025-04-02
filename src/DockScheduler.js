import React, { useState, useEffect } from "react";
import "./App.css";

const DockScheduler = () => {
  const times = [
    "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM"
  ];
  const docks = ["Dock 1", "Dock 2", "Dock 3", "Dock 4", "Dock 5"];

  const [appointments, setAppointments] = useState({});
  const [selectedDate, setSelectedDate] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
  
  const [formData, setFormData] = useState({
    dockingLocation: "",
    loadingPoint: "",
    purchaseOrder: "",
    vehicleType: "",
    vehicleId: "",
    capacity: 1,
    search: "",
    searchId: ""
  });

  useEffect(() => {
    document.body.classList.remove("dark", "light-mode");
    document.body.classList.add(theme === "dark" ? "dark" : "light-mode");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === "dark" ? "light" : "dark"));
  };

  const handleBooking = (dock, time, index) => {
    if (!selectedDate) {
      alert("Please select a date first!");
      return;
    }
    const key = `${selectedDate}-${dock}-${time}-${index}`;
    setAppointments(prev => {
      if (!prev[key] || prev[key] === "Available") {
        const newId = Math.floor(100 + Math.random() * 900);
        return { ...prev, [key]: `Booked (${newId})` };
      } else if (prev[key].startsWith("Booked")) {
        return { ...prev, [key]: "Completed ✅" };
      } else {
        return { ...prev, [key]: "Available" };
      }
    });
  };

  const handleChange = e => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value
    }));
  };

  return (
    <div className={`container ${theme}`}>
      <h1 className="title">Dock Appointment Scheduler</h1>

      <div className="theme-toggle">
        <button onClick={toggleTheme} className="btn-theme">
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
      </div>

      <div className="input-section">
        {["dockingLocation", "loadingPoint", "purchaseOrder", "vehicleType", "vehicleId"].map(field => (
          <div className="input-group" key={field}>
            <label>{field.replace(/([A-Z])/g, " $1").trim()}: </label>
            <input type="text" name={field} value={formData[field]} onChange={handleChange} />
          </div>
        ))}

        <div className="input-group">
          <label>Capacity (per dock):</label>
          <input type="number" name="capacity" value={formData.capacity} onChange={handleChange} min="1" />
        </div>

        <div className="input-group">
          <label>Search (Dock/Time):</label>
          <input type="text" name="search" placeholder="Search by dock/time..." value={formData.search} onChange={handleChange} />
        </div>

        <div className="input-group">
          <label>Search (Appointment ID):</label>
          <input type="text" name="searchId" placeholder="Search by appointment ID..." value={formData.searchId} onChange={handleChange} />
        </div>
      </div>

      <div className="btn-container">
        <input type="date" className="date-picker" onChange={e => setSelectedDate(e.target.value)} />
        <button onClick={() => setShowSchedule(true)} className="btn-show">
          Show Appointment Table
        </button>
      </div>

      {showSchedule && selectedDate && (
        <table className="dock-table">
          <thead>
            <tr>
              <th>Time</th>
              {docks.map(dock => <th key={dock}>{dock}</th>)}
            </tr>
          </thead>
          <tbody>
            {times
              .filter(time => time.toLowerCase().includes(formData.search.toLowerCase()))
              .map(time => (
                <tr key={time}>
                  <td>{time}</td>
                  {docks.map(dock => (
                    <td key={dock}>
                      {[...Array(formData.capacity || 1)].map((_, index) => {
                        const key = `${selectedDate}-${dock}-${time}-${index}`;
                        const status = appointments[key] || "Available";
                        if (formData.searchId && !status.includes(formData.searchId)) return null;
                        return (
                          <div key={key} className={`slot ${status.toLowerCase().split(" ")[0]}`} onClick={() => handleBooking(dock, time, index)}>
                            {status}
                          </div>
                        );
                      })}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DockScheduler;
