import React, { useState } from "react";
import "./DockScheduler.css";

const DockScheduler = () => {
  const times = [
    "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM"
  ];
  const docks = ["Dock 1", "Dock 2", "Dock 3", "Dock 4", "Dock 5"];

  const [appointments, setAppointments] = useState({});
  const [selectedDate, setSelectedDate] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupData, setPopupData] = useState({ dock: "", time: "", index: 0, status: "" });

  const [formData, setFormData] = useState({
    dockingLocation: "",
    loadingPoint: "",
    purchaseOrder: "",
    vehicleType: "",
    vehicleId: "",
    search: "",
    searchId: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSlotClick = (dock, time, index) => {
    if (!selectedDate) {
      alert("Please select a date first!");
      return;
    }
    const key = `${selectedDate}-${dock}-${time}-${index}`;
    const status = appointments[key] || "Available";
    
    if (status === "Available" || status.startsWith("Booked")) {
      setPopupData({ dock, time, index, status });
      setShowPopup(true);
    } else if (status === "Completed ✅") {
      setAppointments((prev) => ({ ...prev, [key]: "Available" }));
    }
  };

  const handleConfirmBooking = () => {
    const { dock, time, index } = popupData;
    const key = `${selectedDate}-${dock}-${time}-${index}`;
    const newId = Math.floor(100 + Math.random() * 900);
    setAppointments((prev) => ({
      ...prev,
      [key]: `Booked (${newId})`
    }));
    setShowPopup(false);
    alert(`Appointment Booked! ID: ${newId}`);
  };

  const handleCancelBooking = () => {
    const { dock, time, index, status } = popupData;
    const key = `${selectedDate}-${dock}-${time}-${index}`;
    if (status.startsWith("Booked")) {
      setAppointments((prev) => ({
        ...prev,
        [key]: "Available"
      }));
      alert("Appointment Canceled!");
    }
    setShowPopup(false);
  };

  return (
    <div className="dock-scheduler">
      <header>
        <center><h1>Dock Appointment Scheduler</h1></center>
      </header>

      <section className="input-section">
        {["DockingLocation", "LoadingPoint", "PurchaseOrder", "VehicleType", "VehicleId"].map((field) => (
          <div className="input-group" key={field}>
            <label>{field.replace(/([A-Z])/g, " $1")}</label>
            <input type="text" name={field} value={formData[field]} onChange={handleChange} />
          </div>
        ))}
        <div className="input-group">
          <label>Search Dock/Time</label>
          <input type="text" name="search" placeholder="e.g., Dock 1 or 8:00 AM" value={formData.search} onChange={handleChange} />
        </div>
        <div className="input-group">
          <label>Search by Appointment ID</label>
          <input type="text" name="searchId" placeholder="e.g., 123" value={formData.searchId} onChange={handleChange} />
        </div>
        <div className="input-group">
          <label>Select Date</label>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
        </div>
        <button className="btn-show" onClick={() => setShowSchedule(true)}>
          Show Appointment Table
        </button>
      </section>

      {showSchedule && selectedDate && (
        <div className="table-container">
          <table className="dock-table">
            <thead>
              <tr>
                <th>Time</th>
                {docks.map((dock) => <th key={dock}>{dock}</th>)}
              </tr>
            </thead>
            <tbody>
              {times
                .filter((time) => time.toLowerCase().includes(formData.search.toLowerCase()))
                .map((time) => (
                  <tr key={time}>
                    <td>{time}</td>
                    {docks.map((dock) => {
                      const key = `${selectedDate}-${dock}-${time}-0`;
                      const status = appointments[key] || "Available";
                      if (formData.searchId && !status.includes(formData.searchId)) return <td key={dock}></td>;
                      return (
                        <td key={dock}>
                          <div
                            className={`slot ${status.toLowerCase().split(" ")[0]}`}
                            onClick={() => handleSlotClick(dock, time, 0)}
                          >
                            {status}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {showPopup && (
        <div className="small-popup">
          <div className="small-popup-content">
            <p>
              {popupData.status === "Available"
                ? `Book ${popupData.dock} at ${popupData.time}?`
                : `Cancel booking for ${popupData.dock} at ${popupData.time}?`}
            </p>
            <div className="popup-buttons">
              {popupData.status === "Available" ? (
                <>
                  <button onClick={handleConfirmBooking}>Confirm</button>
                  <button onClick={() => setShowPopup(false)}>Cancel</button>
                </>
              ) : (
                <>
                  <button onClick={handleCancelBooking}>Confirm Cancel</button>
                  <button onClick={() => setShowPopup(false)}>Back</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DockScheduler;