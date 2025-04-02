const express = require('express');
const axios = require('axios');
const cors = require('cors');
const dotenv = require('dotenv');
const { Sequelize, DataTypes } = require('sequelize');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// Enable CORS for all origins
app.use(cors({
  origin: 'http://localhost:3000', // Allow only this origin (change for production)
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true // Allow cookies and authorization headers
}));

// Database Connection (PostgreSQL)
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
});

// Dock Appointment Model
const Appointment = sequelize.define('Appointment', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  dock_number: { type: DataTypes.STRING, allowNull: false },
  appointment_time: { type: DataTypes.DATE, allowNull: false },
  status: { type: DataTypes.STRING, defaultValue: 'Scheduled' },
});

// Sync Database
sequelize.sync();

// Fetch Appointments
app.get('/api/appointments', async (req, res) => {
  const appointments = await Appointment.findAll();
  res.json(appointments);
});

// Create Appointment
app.post('/api/appointments', async (req, res) => {
  const { dock_number, appointment_time } = req.body;
  const newAppointment = await Appointment.create({ dock_number, appointment_time });
  res.json(newAppointment);
});

// SAP OData Integration (Fetch Data from SAP)
app.get('/api/sap/appointments', async (req, res) => {
  try {
    const response = await axios.get(`${process.env.SAP_ODATA_URL}/Appointments`, {
      headers: { Authorization: `Bearer ${process.env.SAP_TOKEN}` },
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));
