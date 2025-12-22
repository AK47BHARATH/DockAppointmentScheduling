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

// In-memory caches
const loadingPointsCache = {};
const carriersAndMtrsCache = {};

export const getAppointments = async (lpParent = null) => {
  try {
    const filter = lpParent ? `?$filter=Lp_Parent eq '${lpParent}'` : '';
    const response = await axios.get(`${BASE_URL}${filter}`, {
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
      Driver: item.Driver || '',
      StartTime: item.START_TIME || '',
      Lp_Parent: item.Lp_Parent || '',
    }));
    console.log('Mapped API Response:', mappedData);
    return { d: { results: mappedData } };
  } catch (error) {
    const errorMessage = error.response?.data?.error?.message?.value || error.message;
    console.error('Get Appointments Error:', errorMessage);
    throw new Error(`Failed to fetch appointments: ${errorMessage}`);
  }
};

export const createAppointment = async (data) => {
  try {
    const payload = {
      Lp_Parent: data.LpParent,
      START_TIME: data.StartTime,
      FINISH_TIME: data.FinishTime,
      Loadpoint: data.Loadpoint,
      Transmeansid: data.Transmeansid,
      Carrier: data.Carrier,
      Mtr: data.Mtr,
      Driver: data.Driver,
      Note: data.Note,
    };

    const response = await axios.post(BASE_URL, payload, {
      auth: AUTH,
      httpsAgent: agent,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
    });

    console.log("Appointment Created:", response.data);
    return response.data.d;
  } catch (error) {
    const errorMessage = error.response?.data?.error?.message?.value || error.message;
    console.error("Create Appointment Error:", errorMessage);
    throw new Error(`Failed to create appointment: ${errorMessage}`);
  }
};

export const getLoadingPoints = async (lpParent) => {
  try {
    if (loadingPointsCache[lpParent]) {
      console.log(`Returning cached docks for Lp_Parent=${lpParent}:`, loadingPointsCache[lpParent]);
      return loadingPointsCache[lpParent];
    }

    const filter = `?$filter=Lp_Parent eq '${lpParent}'`;
    const response = await axios.get(`${BASE_URL}${filter}`, {
      auth: AUTH,
      httpsAgent: agent,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    const rawData = response.data.d.results || [];
    const uniqueDocks = [...new Set(
      rawData
        .map(item => item.Loadpoint)
        .filter(Boolean)
    )];

    loadingPointsCache[lpParent] = uniqueDocks;
    console.log(`Fetched Docks for Lp_Parent=${lpParent}:`, uniqueDocks);
    return uniqueDocks;
  } catch (error) {
    const errorMessage = error.response?.data?.error?.message?.value || error.message;
    console.error(`Get Loading Points Error for Lp_Parent=${lpParent}:`, errorMessage);
    throw new Error(`Failed to fetch loading points from SAP: ${errorMessage}`);
  }
};

export const getCarriersAndMtrs = async (lpParent) => {
  try {
    if (carriersAndMtrsCache[lpParent]) {
      console.log(`Returning cached carriers and MTRs for Lp_Parent=${lpParent}:`, carriersAndMtrsCache[lpParent]);
      return carriersAndMtrsCache[lpParent];
    }

    const filter = `?$filter=Lp_Parent eq '${lpParent}'`;
    const response = await axios.get(`${BASE_URL}${filter}`, {
      auth: AUTH,
      httpsAgent: agent,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    const rawData = response.data.d.results || [];
    const uniqueCarriers = [...new Set(
      rawData
        .map(item => item.Carrier)
        .filter(value => value !== null && value !== undefined) // Allow empty strings
    )];
    const uniqueMtrs = [...new Set(
      rawData
        .map(item => item.Mtr)
        .filter(value => value !== null && value !== undefined)
    )];

    const result = {
      carriers: uniqueCarriers,
      mtrs: uniqueMtrs,
    };

    carriersAndMtrsCache[lpParent] = result;
    console.log(`Fetched Carriers and MTRs for Lp_Parent=${lpParent}:`, result);
    return result;
  } catch (error) {
    const errorMessage = error.response?.data?.error?.message?.value || error.message;
    console.error(`Get Carriers and MTRs Error for Lp_Parent=${lpParent}:`, errorMessage);
    throw new Error(`Failed to fetch carriers and MTRs from SAP: ${errorMessage}`);
  }
};

// Optional: Clear caches
export const clearCaches = () => {
  Object.keys(loadingPointsCache).forEach((key) => delete loadingPointsCache[key]);
  Object.keys(carriersAndMtrsCache).forEach((key) => delete carriersAndMtrsCache[key]);
  console.log('Caches cleared');
};
