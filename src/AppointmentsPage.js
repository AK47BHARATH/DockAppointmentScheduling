import React, { useState, useEffect } from 'react';
import { getAppointments } from './sapApi';
import "./AppointmentsPage.css";

const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchAppointmentID, setSearchAppointmentID] = useState('');
  const [searchLoadingPoint, setSearchLoadingPoint] = useState('');

  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAppointments();
      console.log('Processed Response:', response);
      let results = response?.d?.results || [];
      console.log('Appointments Data:', results.map(item => ({
        AppointmentID: item.AppointmentID,
        LoadingPoint: item.LoadingPoint,
        Carrier: item.Carrier,
        Mtr: item.Mtr,
        Driver: item.Driver,
        StartTime: item.StartTime
      })));
      results = results.filter(item => item.AppointmentID);
      setAppointments(results);
      setFilteredAppointments(results);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Failed to fetch appointments. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    const filtered = appointments.filter(appointment => {
      const matchesAppointmentID = searchAppointmentID
        ? appointment.AppointmentID.toLowerCase().includes(searchAppointmentID.toLowerCase())
        : true;
      const matchesLoadingPoint = searchLoadingPoint
        ? appointment.LoadingPoint.toLowerCase().includes(searchLoadingPoint.toLowerCase())
        : true;
      return matchesAppointmentID && matchesLoadingPoint;
    });
    setFilteredAppointments(filtered);
  }, [searchAppointmentID, searchLoadingPoint, appointments]);

  return (
    <div>
      <h1>Appointments</h1>
      <button onClick={fetchAppointments} disabled={loading}>
        {loading ? 'Loading...' : 'Refresh Appointments'}
      </button>

      <div className="search-container">
        <input
          type="text"
          placeholder="Search by Appointment ID"
          value={searchAppointmentID}
          onChange={(e) => setSearchAppointmentID(e.target.value)}
        />
        <input
          type="text"
          placeholder="Search by Loading Point"
          value={searchLoadingPoint}
          onChange={(e) => setSearchLoadingPoint(e.target.value)}
        />
      </div>

      <div className="appointments-container">
        {loading && <p>Loading appointments...</p>}
        {error && <p className="error">{error}</p>}
        {!loading && !error && filteredAppointments.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Appointment ID</th>
                <th>Loading Point</th>
                <th>Carrier</th>
                <th>Means of Transport</th>
                <th>Driver</th>
                <th>Start Time</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.map((appointment) => (
                <tr key={appointment.AppointmentID}>
                  <td>{appointment.AppointmentID}</td>
                  <td>{appointment.LoadingPoint}</td>
                  <td>{appointment.Carrier || 'N/A'}</td>
                  <td>{appointment.Mtr || 'N/A'}</td>
                  <td>{appointment.Driver || 'N/A'}</td>
                  <td>{appointment.StartTime || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          !loading && !error && <p>No appointments found.</p>
        )}
      </div>
    </div>
  );
};

export default AppointmentsPage;