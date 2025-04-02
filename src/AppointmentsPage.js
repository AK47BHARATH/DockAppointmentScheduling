import React, { useState } from 'react';
import { getAppointments } from './sapApi';
import "./App.css";

const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);

  const fetchAppointments = async () => {
    try {
      const response = await getAppointments();
      setAppointments(response?.d?.results || []);
    } catch (err) {
      console.error('Error fetching appointments:', err);
    }
  };

  return (
    <div>
      <h1>Appointments</h1>
      <button onClick={fetchAppointments}>Get Appointments</button>

      <div className="appointments-container">
        {appointments.length > 0 ? (
          <table border="1">
            <thead>
              <tr>
                <th>Appointment ID</th>
                <th>Truck Number</th>
                <th>Dock Location</th>
                <th>Loading Point</th>
                <th>Time Slot</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr key={appointment.AppointmentID}>
                  <td>{appointment.AppointmentID}</td>
                  <td>{appointment.TruckNumber}</td>
                  <td>{appointment.DockLocation}</td>
                  <td>{appointment.LoadingPoint}</td>
                  <td>{appointment.TimeSlot}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No appointments found.</p>
        )}
      </div>
    </div>
  );
};

export default AppointmentsPage;
