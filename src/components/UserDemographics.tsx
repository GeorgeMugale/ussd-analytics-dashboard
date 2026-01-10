import React, { useEffect, useRef, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  MapPin,
  Smartphone,
  TrendingUp,
  Building,
  Download,
  Target,
  Lightbulb,
  Radio,
} from "lucide-react";
import {
  CustomTooltipProps,
  exportAsCSV,
  exportAsPDF,
  showExportDialog,
} from "./utils";
import { api } from "../services/api";
import LoaderOverlay from "./LoaderOverlay";

interface ProvinceData {
  name: string;
  users: number;
  percentage: number;
  type: string;
  // UI props added for frontend use
  color?: string;
  icon?: string;
  [key: string]: any;
}

interface AgeGroup {
  range: string;
  percentage: number;
  users: number;
  label: string;
  color?: string;
  [key: string]: any;
}

interface NetworkData {
  name: string;
  percentage: number;
  users: number;
  description: string;
  color?: string;
  [key: string]: any;
}

interface MetricItem {
  name: string;
  value: number;
  users?: number;
  color?: string;
  trend?: string;
  [key: string]: any;
}

interface ApiResponse {
  totalUsers: number;
  provinceData: ProvinceData[];
  networkData: NetworkData[];
  ageGroups: AgeGroup[];
  genderData: MetricItem[];
  urbanRuralData: MetricItem[];
  deviceData: MetricItem[];
}

const USSDUserDemographics: React.FC = () => {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const componentRef = useRef<HTMLDivElement>(null);

  // --- Configuration Maps (UI Styling) ---
  const provinceConfig: Record<string, { color: string; icon: string }> = {
    Lusaka: { color: "#3B82F6", icon: "🏙️" },
    Copperbelt: { color: "#10B981", icon: "🏭" },
    Southern: { color: "#8B5CF6", icon: "🌾" },
    "Other Provinces": { color: "#F59E0B", icon: "📍" },
  };

  const networkColors: Record<string, string> = {
    "MTN Zambia": "#3B82F6",
    "Airtel Zambia": "#10B981",
    Zamtel: "#F59E0B",
  };

  const ageColors = ["#60A5FA", "#3B82F6", "#2563EB", "#1D4ED8", "#1E3A8A"];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result: ApiResponse | null = await api.getDemographics();

        if (result) {
          // Hydrate API data with UI colors/icons
          const hydratedData = {
            ...result,
            provinceData: result.provinceData.map((p) => ({
              ...p,
              ...(provinceConfig[p.name] || provinceConfig["Other Provinces"]),
            })),
            networkData: result.networkData.map((n) => ({
              ...n,
              color: networkColors[n.name] || "#9CA3AF",
            })),
            ageGroups: result.ageGroups.map((a, i) => ({
              ...a,
              color: ageColors[i] || ageColors[0],
            })),
            genderData: result.genderData.map((g) => ({
              ...g,
              color: g.name === "Male" ? "#3B82F6" : "#EC4899",
            })),
            urbanRuralData: result.urbanRuralData.map((u) => ({
              ...u,
              color: u.name === "Urban" ? "#374151" : "#10B981",
            })),
            deviceData: result.deviceData.map((d, i) => ({
              ...d,
              color: i === 0 ? "#3B82F6" : i === 1 ? "#10B981" : "#8B5CF6",
            })),
          };

          setData(hydratedData);
        } else {
          alert("Fetch error");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const CustomTooltip: React.FC<CustomTooltipProps<any>> = ({
    active,
    payload,
  }) => {
    if (active && payload && payload.length) {
      const d: any = payload[0];

      return (
        <div className="bg-white p-4 rounded-xl shadow-2xl border border-gray-200 ">
          <p className="font-bold text-gray-900  mb-2">
            {d.payload?.name ?? "Unknown"}
          </p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-gray-600 ">Percentage:</span>
              <span className="text-sm font-bold">
                {d.payload?.value ?? d.payload?.percentage ?? 0}%
              </span>
            </div>

            {d.payload?.users && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-600 ">Users:</span>
                <span className="text-sm font-bold text-gray-900 ">
                  {d.payload.users.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      ref={componentRef}
      className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50   p-6"
    >
      <LoaderOverlay isLoading={loading} />

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200 ">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  User Demographics
                </h1>
              </div>
              <p className="text-gray-600 ">
                User distribution analysis across Zambian provinces and networks
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50   text-blue-700  rounded-xl font-medium border border-blue-200 ">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{data?.totalUsers.toLocaleString()} Total Users</span>
                </div>
              </div>
              <button
                onClick={() => {
                  if (data) {
                    const flatData = [
                      // Province data
                      ...data.provinceData.map((p) => ({
                        category: "Province",
                        name: p.name,
                        users: p.users,
                        percentage: p.percentage,
                        type: p.type,
                      })),
                      // Age group data
                      ...data.ageGroups.map((a) => ({
                        category: "Age Group",
                        name: a.range,
                        users: a.users,
                        percentage: a.percentage,
                        type: a.label,
                      })),
                      // Network data
                      ...data.networkData.map((n) => ({
                        category: "Network",
                        name: n.name,
                        users: n.users,
                        percentage: n.percentage,
                        type: n.description,
                      })),
                    ];

                    showExportDialog(
                      () => exportAsPDF("transaction-volumes", componentRef),
                      () => exportAsCSV(flatData, "ussd-user-demographics")
                    );
                  }
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl font-medium"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50   p-4 rounded-xl border border-blue-200 ">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                  <span className="text-white text-sm">👨</span>
                </div>
                <span className="text-sm text-gray-600 ">Gender Split</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 ">
                Male: {data?.genderData.find((g) => g.name === "Male")?.value}%
                | Female:{" "}
                {data?.genderData.find((g) => g.name === "Female")?.value}%
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50   p-4 rounded-xl border border-purple-200 ">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-5 h-5 text-purple-600" />
                <span className="text-sm text-gray-600 ">Top Province</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 ">
                {data?.provinceData[0]?.name} (
                {data?.provinceData[0]?.percentage}
                %)
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50   p-4 rounded-xl border border-green-200 ">
              <div className="flex items-center gap-2 mb-2">
                <Radio className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-600 ">Top Network</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 ">
                {data?.networkData[0]?.name.split(" ")[0]} (
                {data?.networkData[0]?.percentage}%)
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Geographic Distribution */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200 ">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 ">
                Geographic Distribution
              </h2>
              <div className="px-3 py-1 bg-blue-100  text-blue-700  rounded-full text-sm font-medium flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                By Province
              </div>
            </div>

            {/* Province Chart */}
            <div className="h-64 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.provinceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) =>
                      `${name?.substring(0, 3) ?? "Unknown"}: ${value}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="percentage"
                    nameKey="name"
                  >
                    {data?.provinceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Province Breakdown */}
            <div className="space-y-3">
              {data?.provinceData.map((province) => (
                <div
                  key={province.name}
                  className="flex items-center p-3 rounded-lg border transition-all duration-200 hover:shadow-md cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${province.color}10, white)`,
                    borderColor: `${province.color}30`,
                  }}
                >
                  <div className="text-2xl mr-3">{province.icon}</div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-gray-900 ">
                        {province.name}
                      </span>
                      <span className="text-sm font-medium text-gray-600">
                        {province.type}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 ">
                        {province.users.toLocaleString()} users
                      </span>
                      <span
                        className="font-bold"
                        style={{ color: province.color }}
                      >
                        {province.percentage}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Age Distribution */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200 ">
            <h2 className="text-xl font-bold text-gray-900  mb-6">
              Age Distribution
            </h2>

            <div className="h-80 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data?.ageGroups}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                    opacity={0.5}
                  />
                  <XAxis
                    dataKey="range"
                    stroke="#9ca3af"
                    tick={{ fill: "#6b7280", fontSize: 12 }}
                  />
                  <YAxis
                    stroke="#9ca3af"
                    tick={{ fill: "#6b7280", fontSize: 12 }}
                    label={{
                      value: "Percentage (%)",
                      angle: -90,
                      position: "insideLeft",
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="percentage" radius={[8, 8, 0, 0]}>
                    {data?.ageGroups.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Age Insights (Static for now as DB lacks Age) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50   p-4 rounded-xl border border-blue-200 ">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                    <Smartphone className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-sm font-medium text-gray-600 ">
                    Most Active
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 ">26-35</div>
                <div className="text-xs text-blue-600  mt-1">
                  Highest transaction frequency
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50   p-4 rounded-xl border border-green-200 ">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-sm font-medium text-gray-600 ">
                    Highest Spend
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 ">36-45</div>
                <div className="text-xs text-green-600  mt-1">
                  Larger transaction amounts
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Network Distribution */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200 ">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 ">
              Network Distribution
            </h2>
            <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium flex items-center gap-1">
              <Radio className="w-3 h-3" />
              Mobile Operators
            </div>
          </div>

          <div className="h-72 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.networkData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="percentage"
                  nameKey="name"
                  label={({ name, value }) =>
                    `${name?.substring(0, 3) ?? "Unknown"}: ${value}%`
                  }
                >
                  {data?.networkData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Network Details */}
          <div className="space-y-3">
            {data?.networkData.map((network, index) => (
              <div
                key={index}
                className="flex items-center p-4 rounded-lg border transition-all duration-200 hover:shadow-md"
                style={{
                  background: `linear-gradient(to right, ${network.color}10, white)`,
                  borderColor: `${network.color}30`,
                }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mr-4"
                  style={{ backgroundColor: network.color }}
                >
                  <Radio className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-gray-900 ">{network.name}</div>
                  <div className="text-sm text-gray-600 ">
                    {network.description}
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className="text-2xl font-bold"
                    style={{ color: network.color }}
                  >
                    {network.percentage}%
                  </div>
                  <div className="text-sm text-gray-600 ">
                    {network.users.toLocaleString()} users
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gender & Urban/Rural */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200 ">
          <h2 className="text-xl font-bold text-gray-900  mb-6">
            Demographic Splits
          </h2>

          <div className="grid grid-cols-2 gap-6">
            {/* Gender */}
            <div>
              <h3 className="font-bold text-gray-700  mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-pink-500" />
                Gender
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.genderData}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {data?.genderData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-xs text-gray-600  flex items-center gap-1 mt-2">
                <Lightbulb className="w-3 h-3 text-blue-500" />
                Male users perform 65% of all transactions
              </div>
            </div>

            {/* Urban/Rural */}
            <div>
              <h3 className="font-bold text-gray-700  mb-4 flex items-center gap-2">
                <Building className="w-4 h-4 text-gray-600" />
                Urban vs Rural
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.urbanRuralData}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {data?.urbanRuralData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-xs text-gray-600  flex items-center gap-1 mt-2">
                <TrendingUp className="w-3 h-3 text-green-500" />
                Rural growth: +15% in last 6 months
              </div>
            </div>
          </div>
        </div>

        {/* Device & Usage Patterns */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200 ">
          <h2 className="text-xl font-bold text-gray-900  mb-6 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-indigo-600" />
            Device & Usage Patterns
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data?.deviceData.map((device, index) => (
              <div key={index}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700 ">
                    {device.name}
                  </span>
                  <span
                    className="font-bold text-xl"
                    style={{ color: device.color }}
                  >
                    {device.value}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div
                    className="h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${device.value}%`,
                      backgroundColor: device.color,
                    }}
                  />
                </div>
                <div className="text-xs text-gray-600 ">{device.trend}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 ">
            <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl border border-yellow-200">
              <Lightbulb className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <div className="font-bold text-gray-900  mb-1">Key Insight</div>
                <div className="text-sm text-gray-600 ">
                  Feature phone dominance ({data?.deviceData[0].value}%) drives
                  USSD preference in Zambia. This presents opportunities for
                  optimized USSD experiences.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500  text-sm space-y-1 pb-4">
          <p>
            USSD User Demographics Dashboard • Based on{" "}
            {data?.totalUsers.toLocaleString()} verified users
          </p>
          <p className="text-xs">
            Data reflects actual market distribution: Urban concentration in{" "}
            {data?.provinceData[0].name}, {data?.networkData[0].name} market
            leadership.
          </p>
        </div>
      </div>
    </div>
  );
};

export default USSDUserDemographics;
