import axios from "axios";

const BASE_URL = "https://s4hana23.arkania.com:44300/sap/opu/odata/sap/ZAKB_DOCK_APPOINTMENT_SRV?$format=json";
const AUTH = {
  username: "bharathak",
  password: "Akbharath*1$23",
};

export const getAppointments = async () => {
  return axios.get(BASE_URL, { auth: AUTH });
};

export const createAppointment = async (appointmentData) => {
  return axios.post(BASE_URL, appointmentData, { auth: AUTH });
};

export const updateAppointment = async (id, updatedData) => {
  return axios.put(`${BASE_URL}('${id}')`, updatedData, { auth: AUTH });
};

export const deleteAppointment = async (id) => {
  return axios.delete(`${BASE_URL}('${id}')`, { auth: AUTH });
};
