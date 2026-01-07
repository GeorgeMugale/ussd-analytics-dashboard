import { TimeRange } from "../components/TransactionVolumeChart";

const API_BASE = "http://localhost:3000/api/analytics"; // Node.js backend

async function request(path: string, options: any = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.token && { Authorization: `Bearer ${options.token}` }),
    },
    ...options,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "API request failed");
  }
  
  const response: any = await res.json();
  
  if (response.success){
	  return response.payload;
  }

  return null;
}

// Endpoint functions your components/pages will call
export const api = {
  getTransactionVolume: (range: TimeRange, service: string) =>
    request(`/transactions/volume/${range}/${service}`),
  getSuccessRate: () => request("/transactions/success-rate"),
  getPeakHours: () => request("/peak-hours"),
  getDemographics: () => request("/users/demographics"),
  getRevenueTrends: () => request("/revenue/trends"),
  getMenuNavigationFlow: () => request("/menu-flow"),
  getReport: (type: string | number) => request(`/reports/${type}`),
};
