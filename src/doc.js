import React, { useState, useEffect } from "react";
import "./DockScheduler.css";
import { createAppointment, getAppointments } from "./sapApi";

const DockScheduler = () => {
  const times = [
    "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM"
  ];
  const docks = ["Dock 1", "Dock 2", "Dock 3", "Dock 4", "Dock 5"];

  const [appointments, setAppointments] = useState({});
  const [bookingDate, setBookingDate] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupData, setPopupData] = useState({ dock: "", time: "", index: 0, status: "", idToCancel: "" });
  const [dropdownOptions, setDropdownOptions] = useState({
    Loadpoint: [],
    LpParent: [],
    Carrier: [],
    Mtr: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    Loadpoint: "",
    Transmeansid: "",
    LpParent: "",
    Carrier: "",
    Mtr: "",
    Driver: "",
    search: "",
    searchId: ""
  });

  const removeLeadingZeros = (str) => {
    return String(parseInt(str, 10));
  };

  useEffect(() => {
    const loadDropdownValues = async () => {
      try {
        const sapData = await getAppointments();
        const results = sapData.d.results || [];

        const uniqueValues = {
          Loadpoint: [...new Set(results.map(item => item.LoadingPoint).filter(Boolean))],
          LpParent: [...new Set(results.map(item => item.LpParent || "SCU_AKWM").filter(Boolean))],
          Carrier: [...new Set(results.map(item => item.Carrier).filter(Boolean))],
          Mtr: [...new Set(results.map(item => item.Mtr).filter(Boolean))]
        };

        setDropdownOptions(uniqueValues);
        setLoading(false);
      } catch (err) {
        setError("Failed to load SAP dropdown values.");
        setLoading(false);
      }
    };
    loadDropdownValues();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSlotClick = (dock, time, index) => {
    if (!bookingDate) {
      alert("Please select a booking date!");
      return;
    }

    const key = `${bookingDate}-${dock}-${time}-${index}`;
    const bookingList = appointments[key] || [];

    const status = bookingList.length
      ? bookingList.map((b) => `Booked (${b.id})`).join(", ")
      : "Available";

    setPopupData({ dock, time, index, status, idToCancel: bookingList[0]?.id || "" });
    setShowPopup(true);
  };

  const handleConfirmBooking = async () => {
    const { dock, time, index } = popupData;
    const key = `${bookingDate}-${dock}-${time}-${index}`;

    const requiredFields = ["Loadpoint", "Transmeansid", "LpParent", "Carrier", "Mtr", "Driver"];
    for (const field of requiredFields) {
      if (!formData[field]) {
        alert(`Please enter a value for ${field.replace(/([A-Z])/g, " $1")}`);
        return;
      }
    }

    if (!bookingDate) {
      alert("Please select a booking date!");
      return;
    }

    const [year, month, day] = bookingDate.split("-");
    const timeParts = time.toUpperCase().split(/[: ]/);
    let hour = parseInt(timeParts[0], 10);
    const minutes = timeParts[1];
    const meridian = timeParts[2];

    if (meridian === "PM" && hour < 12) hour += 12;
    if (meridian === "AM" && hour === 12) hour = 0;
    const formattedHour = hour.toString().padStart(2, "0");

    const formattedDateTime = `${month}/${day}/${year} ${formattedHour}:${minutes}`;

    const payload = {
      LpParent: formData.LpParent,
      StartTime: formattedDateTime,
      FinishTime: formattedDateTime,
      Loadpoint: formData.Loadpoint,
      Transmeansid: formData.Transmeansid,
      Carrier: formData.Carrier,
      Mtr: formData.Mtr,
      Driver: formData.Driver
    };

    try {
      const result = await createAppointment(payload);
      let newId = result?.Docno || result?.DocNo || result?.DbKey;

      if (!newId || (typeof newId !== "string" && typeof newId !== "number")) {
        const sapData = await getAppointments();
        const newAppointment = sapData.d.results.find(
          item => item.StartTime === formattedDateTime && item.Driver === formData.Driver
        );
        newId = newAppointment?.AppointmentID;
        if (!newId) {
          alert(
            "Booking succeeded but SAP did not return a valid Docno. Check console logs for the SAP response and contact SAP support."
          );
          return;
        }
      }

      newId = removeLeadingZeros(newId);

      setAppointments((prev) => {
        const existing = prev[key] || [];
        return {
          ...prev,
          [key]: [...existing, { id: newId, driver: formData.Driver }]
        };
      });

      alert(`Appointment Booked! SAP ID: ${newId}`);
    } catch (error) {
      console.error("SAP API Error:", error);
      alert(`Failed to book appointment: ${error.message}`);
    }

    setShowPopup(false);
  };

  const handleCancelBooking = () => {
    const { dock, time, index, idToCancel } = popupData;
    const key = `${bookingDate}-${dock}-${time}-${index}`;
    setAppointments((prev) => {
      const updated = (prev[key] || []).filter((b) => b.id !== idToCancel);
      return {
        ...prev,
        [key]: updated
      };
    });
    alert(`Appointment ${idToCancel} canceled.`);
    setShowPopup(false);
  };

  if (loading) return <div>Loading SAP data...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="dock-scheduler">
      <header>
        <center><h1>Dock Appointment Scheduler</h1></center>
      </header>

      <section className="input-section">
        {["Loadpoint", "LpParent", "Carrier", "Mtr"].map((field) => (
          <div className="input-group" key={field}>
            <label>{field.replace(/([A-Z])/g, " $1")}</label>
            <select name={field} value={formData[field]} onChange={handleChange}>
              <option value="">Select {field.replace(/([A-Z])/g, " $1")}</option>
              {dropdownOptions[field].map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        ))}
        {["Transmeansid", "Driver"].map((field) => (
          <div className="input-group" key={field}>
            <label>{field.replace(/([A-Z])/g, " $1")}</label>
            <input
              type="text"
              name={field}
              placeholder={`Enter ${field.replace(/([A-Z])/g, " $1")}`}
              value={formData[field]}
              onChange={handleChange}
            />
          </div>
        ))}
        <div className="input-group">
          <label>Booking Date</label>
          <input
            type="date"
            value={bookingDate}
            onChange={(e) => setBookingDate(e.target.value)}
          />
        </div>
        <div className="input-group">
          <label>Search Dock/Time</label>
          <input
            type="text"
            name="search"
            placeholder="e.g., Dock 1 or 8:00 AM"
            value={formData.search}
            onChange={handleChange}
          />
        </div>
        <div className="input-group">
          <label>Search by Appointment ID</label>
          <input
            type="text"
            name="searchId"
            placeholder="e.g., 123"
            value={formData.searchId}
            onChange={handleChange}
          />
        </div>
        <button className="btn-show" onClick={() => setShowSchedule(true)}>
          Show Appointment Table
        </button>
      </section>

      {showSchedule && bookingDate && (
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
                      const key = `${bookingDate}-${dock}-${time}-0`;
                      const bookings = appointments[key] || [];
                      const status = bookings.length
                        ? bookings.map((b) => `Booked (${b.id})`).join(", ")
                        : "Available";

                      if (formData.searchId && !status.includes(formData.searchId)) return <td key={dock}></td>;

                      return (
                        <td key={dock}>
                          <div
                            className={`slot ${status.toLowerCase().includes("booked") ? "booked" : "available"}`}
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
                ? `Book ${popupData.dock} at ${popupData.time} on ${bookingDate}?`
                : `Cancel booking for ID ${popupData.idToCancel} at ${popupData.dock} on ${bookingDate}?`}
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
