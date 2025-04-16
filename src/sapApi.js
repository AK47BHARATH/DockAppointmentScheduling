import axios from "axios";
import https from 'https';

const BASE_URL = "/sap/opu/odata/sap/ZAKB_DOCK1_APPOINT_SRV/DockAppointment1Set";
const AUTH = {
  username: "",
  password: "",
};

const cert = `
-----BEGIN CERTIFICATE-----
MIID... (your certificate content)
-----END CERTIFICATE-----
`;

const agent = new https.Agent({
  ca: cert,
});

export const getAppointments = async () => {
  try {
    const response = await axios.get(BASE_URL, {
      auth: AUTH,
      httpsAgent: agent,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });
    const rawData = response.data.d.results || [];
    const mappedData = rawData.map(item => ({
      AppointmentID: item.Docno || '',
      TruckNumber: item.DbKey || '',
      LoadingPoint: item.Loadpoint || '',
      Carrier: item.Carrier || '',
      Mtr: item.Mtr || '',
      Driver: item.Driver || ''
    }));
    console.log('Mapped API Response:', mappedData);
    return { d: { results: mappedData } };
  } catch (error) {
    console.error('Get Appointments Error:', error);
    throw error;
  }
};