import React, { useState } from "react";
import "./DockScheduler.css";
import { createAppointment, getAppointments, getLoadingPoints } from "./sapApi";
import warehouseData from "./warehouses.json";

const DockScheduler = () => {
  const [warehouse, setWarehouse] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [showInitialForm, setShowInitialForm] = useState(true);
  const [docks, setDocks] = useState([]);
  const [times, setTimes] = useState([]);
  const [appointments, setAppointments] = useState({});
  const [showSchedule, setShowSchedule] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupData, setPopupData] = useState({ dock: "", time: "", index: 0, status: "", idToCancel: "" });
  const [formData, setFormData] = useState({
    PoRef: "",
    NoOfBox: "",
    Carrier: "",
    Mtr: "",
    Transmeansid: "",
    Driver: "",
    search: "",
    searchId: "",
    LpParent: "",
    Note: "",
  });
  console.log("Initial formData:", formData);
  const [dropdownOptions, setDropdownOptions] = useState({
    Carrier: [],
    Mtr: [],
    RLTYP: [],
    sapResults: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const removeLeadingZeros = (str) => {
    return String(parseInt(str, 10));
  };

  const generateTimeSlots = (interval) => {
    const slots = [];
    const startHour = 8;
    const endHour = 18;
    const intervalMinutes = parseInt(interval, 10);
    if (isNaN(intervalMinutes) || intervalMinutes <= 0) {
      console.error("Invalid TM Interval:", interval);
      return slots;
    }

    const minutesInDay = (endHour - startHour) * 60;
    for (let i = 0; i <= minutesInDay; i += intervalMinutes) {
      const totalMinutes = startHour * 60 + i;
      let hour = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      const meridian = hour >= 12 ? "PM" : "AM";
      hour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      const timeStr = `${hour}:${minutes.toString().padStart(2, "0")} ${meridian}`;
      slots.push(timeStr);
    }
    console.log("Generated time slots:", slots);
    return slots;
  };

  const handleShowAppointments = async () => {
    if (!warehouse || !bookingDate) {
      alert("Please select both warehouse and date!");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const selectedWarehouse = warehouseData.find((w) => w.Warehouse === warehouse);
      if (!selectedWarehouse) {
        throw new Error("Warehouse not found in configuration");
      }

      const lpParent = selectedWarehouse["DOCKING LOCATION"];
      const allowedLoadingPoints = selectedWarehouse["LoadingPoints"] || [];
      setFormData((prev) => {
        const updated = { ...prev, LpParent: lpParent };
        console.log("Updated formData with LpParent:", updated);
        return updated;
      });

      const sapDocks = await getLoadingPoints(lpParent);
      if (!sapDocks.length) {
        throw new Error(`No loading points found for Docking Location: ${lpParent}`);
      }

      const filteredDocks = allowedLoadingPoints.length
        ? sapDocks.filter((dock) => allowedLoadingPoints.includes(dock))
        : sapDocks;
      if (!filteredDocks.length) {
        throw new Error(
          `No valid loading points found for warehouse ${warehouse}. Check LoadingPoints in configuration.`
        );
      }
      setDocks(filteredDocks);

      const timeSlots = generateTimeSlots(selectedWarehouse["TM Interval"]);
      if (!timeSlots.length) {
        throw new Error("No time slots generated. Check TM Interval in warehouse configuration.");
      }
      setTimes(timeSlots);

      const sapData = await getAppointments(lpParent);
      const results = sapData.d.results || [];
      console.log("SAP appointments:", results);
      setDropdownOptions((prev) => ({ ...prev, sapResults: results }));

      const appointmentMap = {};
      results.forEach((item, idx) => {
        console.log(`Processing appointment ${idx}:`, item);
        if (!item.StartTime || !item.LoadingPoint) {
          console.warn(`Skipping appointment ${idx}: Missing StartTime or LoadingPoint`, item);
          return;
        }

        let [date, time] = item.StartTime.split(" ");
        if (!date || !time) {
          console.warn(`Skipping appointment ${idx}: Invalid StartTime format: ${item.StartTime}`);
          return;
        }

        const [month, day, year] = date.split("/");
        if (!month || !day || !year) {
          console.warn(`Skipping appointment ${idx}: Invalid date format: ${date}`);
          return;
        }
        const formattedDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
        if (formattedDate !== bookingDate) {
          return;
        }

        time = time.toUpperCase();
        let hour, minutes, meridian;
        if (time.includes("AM") || time.includes("PM")) {
          const timeParts = time.split(/[: ]/);
          if (timeParts.length < 3) {
            console.warn(`Skipping appointment ${idx}: Invalid time format: ${time}`);
            return;
          }
          hour = parseInt(timeParts[0], 10);
          minutes = timeParts[1].padStart(2, "0");
          meridian = timeParts[2];
        } else {
          const timeParts = time.split(":");
          if (timeParts.length < 2) {
            console.warn(`Skipping appointment ${idx}: Invalid time format: ${time}`);
            return;
          }
          hour = parseInt(timeParts[0], 10);
          minutes = timeParts[1].padStart(2, "0");
          meridian = hour >= 12 ? "PM" : "AM";
        }

        if (isNaN(hour) || !minutes || !meridian) {
          console.warn(`Skipping appointment ${idx}: Invalid time components: ${time}`);
          return;
        }

        if (meridian === "PM" && hour < 12) hour += 12;
        if (meridian === "AM" && hour === 12) hour = 0;
        const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
        const formattedTime = `${formattedHour}:${minutes} ${meridian}`;

        if (!timeSlots.includes(formattedTime)) {
          console.warn(
            `Skipping appointment ${idx}: Time slot ${formattedTime} not in generated slots`,
            timeSlots
          );
          return;
        }

        if (!filteredDocks.includes(item.LoadingPoint)) {
          console.warn(
            `Skipping appointment ${idx}: LoadingPoint ${item.LoadingPoint} not in filtered docks`,
            filteredDocks
          );
          return;
        }

        const key = `${formattedDate}-${item.LoadingPoint}-${formattedTime}-0`;
        appointmentMap[key] = appointmentMap[key] || [];
        appointmentMap[key].push({
          id: removeLeadingZeros(item.AppointmentID),
          driver: item.Driver || "Unknown",
          note: item.Note || "",
        });
      });

      console.log("Appointment map:", appointmentMap);
      setAppointments(appointmentMap);
      setShowInitialForm(false);
      setShowSchedule(true);
    } catch (err) {
      console.error("Error in handleShowAppointments:", err);
      setError(`Failed to load data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const bookAllTimeSlots = async () => {
    if (!bookingDate || !docks.length || !times.length) {
      alert("Cannot book slots: Missing date, docks, or times.");
      return;
    }

    setLoading(true);
    try {
      const [year, month, day] = bookingDate.split("-");
      for (const dock of docks) {
        for (const time of times) {
          const key = `${bookingDate}-${dock}-${time}-0`;
          if (appointments[key]?.length) {
            console.log(`Skipping already booked slot: ${key}`);
            continue;
          }

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
            Loadpoint: dock,
            Transmeansid: "DEFAULT_TRANSPORT",
            Carrier: "System",
            Mtr: "System",
            Driver: "Auto Booked",
            Note: "Auto-booked appointment",
          };
          console.log("Auto-booking payload:", payload);

          let result;
          try {
            result = await createAppointment(payload);
            console.log("Auto-booking SAP response:", result);
          } catch (apiError) {
            console.error("Auto-booking SAP error:", apiError, apiError.response);
            throw new Error(`Failed to create appointment: ${apiError.message}`);
          }

          let newId = result?.Docno;

          if (!newId) {
            const sapData = await getAppointments(formData.LpParent);
            const newAppointment = sapData.d.results.find(
              (item) => item.StartTime === formattedDateTime && item.Driver === payload.Driver
            );
            newId = newAppointment?.AppointmentID;
            if (!newId) {
              console.warn(`No appointment ID for ${key}`);
              continue;
            }
          }

          newId = removeLeadingZeros(newId);

          setAppointments((prev) => {
            const existing = prev[key] || [];
            const updated = {
              ...prev,
              [key]: [...existing, { id: newId, driver: payload.Driver, note: payload.Comments }],
            };
            console.log("Auto-booked appointments:", updated[key]);
            return updated;
          });

          console.log(`Booked appointment ${newId} for ${key}`);
        }
      }
      alert("All available time slots booked successfully!");
    } catch (error) {
      console.error("Error booking slots:", error);
      setError(`Failed to book slots: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleShowAppointmentsAndBook = async () => {
    await handleShowAppointments();
    if (!error && showSchedule) {
      await bookAllTimeSlots();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      console.log("Updated formData:", updated);
      return updated;
    });
  };

  const handleSlotClick = async (dock, time, index) => {
    if (!bookingDate) {
      alert("Please select a booking date!");
      return;
    }

    const key = `${bookingDate}-${dock}-${time}-${index}`;
    const bookingList = appointments[key] || [];
    const status = bookingList.length ? "Booked" : "Available";

    setPopupData({ dock, time, index, status, idToCancel: bookingList[0]?.id || "" });

    if (status === "Available") {
      const lpParent = formData.LpParent;
      const sapResults = dropdownOptions.sapResults || [];

      const filteredResults = sapResults.filter((item) => item.Lp_Parent === lpParent);

      const uniqueValues = {
        Carrier: [...new Set(filteredResults.map((item) => item.Carrier).filter(Boolean))],
        Mtr: [...new Set(filteredResults.map((item) => item.Mtr).filter(Boolean))],
        RLTYP: [...new Set(filteredResults.map((item) => item.RLTYP).filter(Boolean))],
        sapResults: sapResults,
      };

      setDropdownOptions(uniqueValues);
      setShowPopup(true);
    } else {
      const confirmCancel = window.confirm(
        `Cancel booking for ID ${bookingList[0].id} at ${dock} on ${bookingDate}?`
      );
      if (confirmCancel) {
        handleCancelBooking();
      }
    }
  };

  const handleConfirmBooking = async () => {
    const { dock, time, index } = popupData;
    const key = `${bookingDate}-${dock}-${time}-${index}`;

    const requiredFields = ["Transmeansid", "Driver"];
    for (const field of requiredFields) {
      if (!formData[field]) {
        alert(`Please enter a value for ${field.replace(/([A-Z])/g, " $1")}`);
        return;
      }
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
      Loadpoint: dock,
      Transmeansid: formData.Transmeansid,
      Carrier: formData.Carrier || "",
      Mtr: formData.Mtr || "",
      Driver: formData.Driver,
      RLTYP: formData.RLTYP || "",
      Note: formData.Note || "",
    };

    try {
      console.log("Booking payload:", payload);
      let result;
      try {
        result = await createAppointment(payload);
        console.log("SAP createAppointment response:", result);
      } catch (apiError) {
        console.error("SAP createAppointment error:", apiError, apiError.response);
        throw new Error(`Failed to create appointment: ${apiError.message}`);
      }

      let newId = result?.Docno || result?.AppointmentID;

      if (!newId) {
        console.log("No Docno or AppointmentID in response, fetching appointments...");
        const sapData = await getAppointments(formData.LpParent);
        console.log("Fetched appointments:", sapData.d.results);

        const normalizeTime = (timeStr) => {
          if (!timeStr) return "";
          const regex = /(\d{2})\/(\d{2})\/(\d{4})\s+(\d{1,2}):(\d{2})(\s*(AM|PM))?/i;
          const isoRegex = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/;
          let match = timeStr.match(regex) || timeStr.match(isoRegex);
          if (!match) return timeStr;

          let year, month, day, hour, minute, meridian;
          if (regex.test(timeStr)) {
            [, month, day, year, hour, minute, , meridian] = match;
            hour = parseInt(hour, 10);
            if (meridian) {
              if (meridian.toUpperCase() === "PM" && hour < 12) hour += 12;
              if (meridian.toUpperCase() === "AM" && hour === 12) hour = 0;
            }
            return `${month}/${day}/${year} ${hour.toString().padStart(2, "0")}:${minute}`;
          } else {
            [, year, month, day, hour, minute] = match;
            return `${month}/${day}/${year} ${hour}:${minute}`;
          }
        };

        const normalizedDateTime = normalizeTime(formattedDateTime);

        const newAppointment = sapData.d.results.find((item) => {
          const normalizedItemTime = normalizeTime(item.StartTime);
          const isTimeMatch = normalizedItemTime === normalizedDateTime;
          const isLoadpointMatch = item.LoadingPoint === dock;
          const isDriverMatch = item.Driver === formData.Driver;
          return isTimeMatch && isLoadpointMatch && isDriverMatch;
        });

        newId = newAppointment?.AppointmentID;
        if (!newId) {
          console.error("SAP createAppointment Response:", result);
          console.error("No matching appointment found for:", {
            formattedDateTime,
            normalizedDateTime,
            driver: formData.Driver,
            dock,
          });
          alert(
            "Booking may have succeeded in SAP, but no appointment number was returned. Please verify in SAP system or try again."
          );
          return;
        }
      }

      newId = removeLeadingZeros(newId);

      setAppointments((prev) => {
        const existing = prev[key] || [];
        const updated = {
          ...prev,
          [key]: [...existing, { id: newId, driver: formData.Driver, note: formData.Note }],
        };
        console.log("Updated appointments:", updated[key]);
        return updated;
      });

      console.log(`Booked appointment ${newId} for ${key}`);
      alert(`Appointment Booked! Appointment Number: ${newId}`);
    } catch (error) {
      console.error("SAP API Error:", error);
      alert(`Failed to book appointment: ${error.message}`);
    }

    setShowPopup(false);

    setFormData((prev) => {
      const reset = {
        ...prev,
        PoRef: "",
        NoOfBox: "",
        Carrier: "",
        Mtr: "",
        Transmeansid: "",
        Driver: "",
        RLTYP: "",
        Note: "",
      };
      console.log("Reset formData:", reset);
      return reset;
    });

    setDropdownOptions((prev) => ({ ...prev, Carrier: [], Mtr: [], RLTYP: [] }));
  };

  const handleCancelBooking = () => {
    const { dock, time, index, idToCancel } = popupData;
    const key = `${bookingDate}-${dock}-${time}-${index}`;
    setAppointments((prev) => {
      const updated = (prev[key] || []).filter((b) => b.id !== idToCancel);
      return {
        ...prev,
        [key]: updated,
      };
    });
    console.log(`Canceled appointment ${idToCancel} for ${key}`);
    alert(`Appointment ${idToCancel} canceled.`);
  };

  const sortedTimes = times;

  if (loading) return <div>Loading warehouse data...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="dock-scheduler">
      <header>
        <center>
          <h1>Dock Appointment Scheduler</h1>
        </center>
      </header>

      {showInitialForm && (
        <section className="initial-form">
          <div className="input-group">
            <label>Warehouse</label>
            <select value={warehouse} onChange={(e) => setWarehouse(e.target.value)}>
              <option value="">Select Warehouse</option>
              {warehouseData.map((wh) => (
                <option key={wh.Warehouse} value={wh.Warehouse}>
                  {wh.Warehouse}
                </option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <label>Booking Date</label>
            <input
              type="date"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
            />
          </div>
          <button className="btn-show" onClick={handleShowAppointmentsAndBook}>
            Show and Book All Appointments
          </button>
        </section>
      )}

      {showSchedule && bookingDate && (
        <div className="table-container">
          <table className="dock-table">
            <thead>
              <tr>
                <th>Time</th>
                {docks.map((dock) => (
                  <th key={dock}>{dock}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedTimes
                .filter((time) => time.toLowerCase().includes(formData.search.toLowerCase()))
                .map((time) => (
                  <tr key={time}>
                    <td>{time}</td>
                    {docks.map((dock) => {
                      const key = `${bookingDate}-${dock}-${time}-0`;
                      const bookings = appointments[key] || [];
                      const status = bookings.length ? "Booked" : "Available";

                      if (
                        formData.searchId &&
                        status === "Booked" &&
                        !bookings.some((b) => b.id.includes(formData.searchId))
                      ) {
                        return <td key={dock}></td>;
                      }

                      console.log(`Rendering slot ${key}: ${status}`);
                      return (
                        <td key={dock}>
                          <div
                            className={`slot ${status === "Booked" ? "booked" : "available"}`}
                            onClick={() => handleSlotClick(dock, time, 0)}
                          >
                            {status === "Available" ? (
                              <button className="book-btn">Available</button>
                            ) : (
                              "Booked"
                            )}
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
        <div className="booking-popup">
          <div className="booking-popup-content">
            <h3>Book Appointment for {popupData.dock} at {popupData.time}</h3>
            {console.log("Popup formData.Note:", formData.Note)}
            <div className="input-group">
              <label>PO Ref</label>
              <input
                type="text"
                name="PoRef"
                value={formData.PoRef}
                onChange={handleChange}
              />
            </div>
            <div className="input-group">
              <label>No of Boxes</label>
              <input
                type="text"
                name="NoOfBox"
                value={formData.NoOfBox}
                onChange={handleChange}
              />
            </div>
            <div className="input-group">
              <label>Carrier</label>
              {dropdownOptions.Carrier.length ? (
                <select name="Carrier" value={formData.Carrier} onChange={handleChange}>
                  <option value="">Select Carrier</option>
                  {dropdownOptions.Carrier.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  name="Carrier"
                  value={formData.Carrier}
                  onChange={handleChange}
                  placeholder="Enter Carrier"
                />
              )}
            </div>
            <div className="input-group">
              <label>MTR</label>
              {dropdownOptions.Mtr.length ? (
                <select name="Mtr" value={formData.Mtr} onChange={handleChange}>
                  <option value="">Select MTR</option>
                  {dropdownOptions.Mtr.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  name="Mtr"
                  value={formData.Mtr}
                  onChange={handleChange}
                  placeholder="Enter MTR"
                />
              )}
            </div>
            <div className="input-group">
              <label>Transport ID *</label>
              <input
                type="text"
                name="Transmeansid"
                value={formData.Transmeansid}
                onChange={handleChange}
                required
              />
            </div>
            <div className="input-group">
              <label>Driver *</label>
              <input
                type="text"
                name="Driver"
                value={formData.Driver}
                onChange={handleChange}
                required
              />
            </div>
            <div className="input-group">
              <label>Comments</label>
              <textarea
                name="Note"
                value={formData.Note}
                onChange={handleChange}
                rows="3"
                placeholder="Enter notes"
              />
            </div>
            <div className="popup-buttons">
              <button className="cancel-btn" onClick={() => setShowPopup(false)}>
                Cancel
              </button>
              <button className="save-btn" onClick={handleConfirmBooking}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DockScheduler;