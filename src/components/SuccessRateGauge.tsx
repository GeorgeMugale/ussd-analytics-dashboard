import React, { useState, useEffect } from "react";
import {
  Activity,
  Signal,
  Clock,
  Users,
  MapPin,
  TrendingUp,
  TrendingDown,
  Zap,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Download,
  Settings,
  Loader,
} from "lucide-react";
import { api } from "../services/api";
import { LoaderCircle } from "lucide-react";

interface NetworkStats {
  name: string;
  rate: number;
  color: string;
  marketShare: number;
  totalTransactions: number;
}

interface MetricData {
  successRate: number;
  successfulTxns: number;
  failedTxns: number;
  avgResponseTime: number;
  activeSessions: number;
  topProvince: string;
  trend: number;
  peakHour: string;
}

export interface GaugeApiResponse {
  metrics: {
    successRate: number;
    successfulTxns: number;
    failedTxns: number;
    avgResponseTime: number;
    activeSessions: number;
    topProvince: string;
    trend: number;
    peakHour: string;
  };
  networks: {
    name: string;
    rate: number;
    marketShare: number;
    totalTransactions: number;
  }[];
}

const USSDGauge: React.FC = () => {
  const [metrics, setMetrics] = useState<MetricData>({
    successRate: 0,
    successfulTxns: 0,
    failedTxns: 0,
    avgResponseTime: 0,
    activeSessions: 0,
    topProvince: "NA",
    trend: 0,
    peakHour: "NA",
  });

  const networkColors: Record<string, string> = {
    MTN: "#3B82F6", // Blue
    Airtel: "#EF4444", // Red (Airtel brand color)
    Zamtel: "#10B981", // Green (Zamtel brand color)
  };

  const fetchGaugeData = async () => {
    try {
      const result = await api.getSuccessRate(selectedPeriod);

      if (result) {
        const data: GaugeApiResponse = result as any;

        setMetrics(data.metrics);

        // Map backend data to frontend structure with colors
        const formattedNetworks = data.networks.map((n) => ({
          ...n,
          color: networkColors[n.name] || "#6B7280", // Default gray
        }));
      } else {
        alert("Error fetching");
      }

      // Note: You'll need to update your 'networks' state type or setter
      // if you haven't defined a setNetworks state yet.
      // Assuming you convert 'networks' const to state:
      // setNetworks(formattedNetworks);
    } catch (error) {
      console.error("Failed to fetch gauge stats", error);
    }
  };

  const [isLive, setIsLive] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<"24h" | "7d" | "30d">(
    "30d"
  );

  const networks: NetworkStats[] = [
    {
      name: "MTN Zambia",
      rate: 95.1,
      color: "#3B82F6",
      marketShare: 45.5,
      totalTransactions: 10658,
    },
    {
      name: "Airtel Zambia",
      rate: 93.8,
      color: "#8B5CF6",
      marketShare: 42.0,
      totalTransactions: 9850,
    },
    {
      name: "Zamtel",
      rate: 91.5,
      color: "#F59E0B",
      marketShare: 12.5,
      totalTransactions: 2943,
    },
  ];

  // Replaces the simulation useEffect
  useEffect(() => {
    // Initial fetch
    fetchGaugeData();

    if (!isLive) return;

    // Poll every 5 seconds if live
    const interval = setInterval(fetchGaugeData, 5000);

    return () => clearInterval(interval);
  }, [isLive, selectedPeriod]);

  const getStatusInfo = (rate: number) => {
    if (rate >= 95)
      return {
        status: "Excellent",
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        icon: CheckCircle,
      };
    if (rate >= 90)
      return {
        status: "Good",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        icon: Activity,
      };
    if (rate >= 85)
      return {
        status: "Fair",
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200",
        icon: AlertTriangle,
      };
    return {
      status: "Poor",
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      icon: XCircle,
    };
  };

  const statusInfo = getStatusInfo(metrics.successRate);
  const StatusIcon = statusInfo.icon;

  // Calculate gauge rotation (0% = -135deg, 100% = 135deg)
  const gaugeRotation = -135 + (metrics.successRate / 100) * 270;

  // Calculate arc dash offset for circular progress
  const circumference = 2 * Math.PI * 45;
  const progressOffset =
    circumference - (metrics.successRate / 100) * circumference + 200;

  // Calculate the constants for a 270-degree gauge
  const radius = 45;
  const gaugeAngle = 270; // only want to use 270 degrees of the circle
  const maxOffset = circumference * (gaugeAngle / 360); // The length of the arc (75% of circle)

  // Calculate current progress based on the 270-degree constraint
  // If rate is 100%, show maxOffset. If 0%, show 0.
  const currentOffset = maxOffset - (metrics.successRate / 100) * maxOffset;
  const strokeDashoffset = currentOffset + (circumference - maxOffset); // Add the empty gap to the offset

  // Needle Rotation Logic (remains similar but needs precise CSS alignment)
  // -135deg is start (0%), +135deg is end (100%)
  const needleRotation = -40 + (metrics.successRate / 100) * 270;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50   p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white  rounded-2xl shadow-xl p-6 border border-gray-200 ">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  USSD Analytics Dashboard
                </h1>
              </div>
              <p className="text-gray-600 ">
                Monitoring transaction success rates across Zambian networks
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={selectedPeriod}
                onChange={(e) =>
                  setSelectedPeriod(e.target.value as "24h" | "7d" | "30d")
                }
                className="bg-gray-50  border border-gray-300  rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500 "
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>

              <button
                onClick={() => setIsLive(!isLive)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                  isLive
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    isLive ? "bg-green-500 animate-pulse" : "bg-gray-400"
                  }`}
                />
                {isLive ? "Live" : "Paused"}
              </button>

              <button className="p-2 hover:bg-gray-100  rounded-xl transition-colors">
                <Download className="w-5 h-5 text-gray-600 " />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Gauge Card */}
          <div className="lg:col-span-2 bg-white  rounded-2xl shadow-xl p-8 border border-gray-200 ">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 ">
                Success Rate Monitor
              </h2>
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-xl ${statusInfo.bgColor} ${statusInfo.borderColor} border`}
              >
                <StatusIcon className={`w-5 h-5 ${statusInfo.color}`} />
                <span className={`font-bold ${statusInfo.color}`}>
                  {statusInfo.status}
                </span>
              </div>
            </div>
            {/* Advanced Circular Gauge */}
            <div className="relative w-80 h-80 mx-auto mb-8">
              {/* SVG: Rotate 135deg so the "gap" is at the bottom */}
              <svg
                className="w-full h-full transform rotate-[135deg]"
                viewBox="0 0 100 100"
              >
                {/* Grey Background Track (Only 270 degrees) */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${maxOffset} ${circumference}`} // Draw 75%, Skip 25%
                />

                {/* Gradient Definition */}
                <defs>
                  <linearGradient
                    id="gaugeGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop offset="0%" stopColor="#ef4444" />{" "}
                    {/* Red at start */}
                    <stop offset="50%" stopColor="#eab308" />{" "}
                    {/* Yellow middle */}
                    <stop offset="100%" stopColor="#22c55e" />{" "}
                    {/* Green at end */}
                  </linearGradient>
                </defs>

                {/* Coloured Progress Arc */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke="url(#gaugeGradient)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  // This makes the stroke dashed: [length of dash, length of gap]
                  strokeDasharray={`${maxOffset} ${circumference}`}
                  // This pushes the dash back to hide the part haven't reached yet
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>

              {/* Center Text (Unchanged) */}
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="text-center mt-8">
                  {" "}
                  {/* Added mt-8 to push text down away from needle */}
                  <div className="text-5xl font-bold text-gray-900 mb-1">
                    {metrics.successRate.toFixed(1)}%
                  </div>
                  <div className="text-gray-500 font-medium text-sm">
                    Success Rate
                  </div>
                </div>
              </div>

              {/* Needle Overlay */}
              {/* remove the rotation from the div and apply it purely via style to avoid conflicts */}
              <div
                className="absolute inset-0 transition-transform duration-1000 ease-out"
                style={{ transform: `rotate(${needleRotation}deg)` }}
              >
                {/* The Needle itself: A line starting from center (top-1/2) extending upwards */}
                {/* rotate the internal container -90deg so 0deg = pointing up */}
                <div
                  className="absolute top-1/2 left-1/2 w-32 h-1 -ml-32 origin-right"
                  style={{ transform: "rotate(90deg) translateX(50%)" }}
                ></div>
              </div>

              {/* SIMPLIFIED NEEDLE IMPLEMENTATION */}
              <div
                className="absolute top-0 left-0 w-full h-full pointer-events-none flex items-center justify-center"
                style={{
                  transform: `rotate(${needleRotation}deg)`,
                  transition: "transform 1s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                {/* Needle Container - Points UP by default at 0deg rotation */}
                <div className="h-[50%] w-1 bg-transparent flex flex-col justify-end pb-8">
                  {/* The visible needle tip */}
                  <div className="w-1 h-24 bg-gray-800 rounded-t-full relative">
                    <div className="absolute -top-1 -left-[3px] w-2.5 h-2.5 bg-red-500 rounded-full shadow-md"></div>
                  </div>
                </div>
              </div>

              {/* Center Dot cap */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-gray-800 border-2 border-white shadow-lg z-20" />
            </div>
            );
            {/* Transaction Breakdown */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50   p-6 rounded-xl border border-green-200 ">
                <div className="flex items-start justify-between mb-2">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100  text-green-700 ">
                    {(
                      (metrics.successfulTxns /
                        (metrics.successfulTxns + metrics.failedTxns)) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                </div>
                <div className="text-3xl font-bold text-green-700  mb-1">
                  {metrics.successfulTxns?.toLocaleString()}
                </div>
                <div className="text-sm text-green-600  font-medium">
                  Successful Transactions
                </div>
                <div className="mt-3 w-full bg-green-200  rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        (metrics.successfulTxns /
                          (metrics.successfulTxns + metrics.failedTxns)) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-orange-50   p-6 rounded-xl border border-red-200 ">
                <div className="flex items-start justify-between mb-2">
                  <XCircle className="w-6 h-6 text-red-600" />
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-red-100  text-red-700 ">
                    {(
                      (metrics.failedTxns /
                        (metrics.successfulTxns + metrics.failedTxns)) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                </div>
                <div className="text-3xl font-bold text-red-700  mb-1">
                  {metrics.failedTxns?.toLocaleString()}
                </div>
                <div className="text-sm text-red-600  font-medium">
                  Failed Transactions
                </div>
                <div className="mt-3 w-full bg-red-200  rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        (metrics.failedTxns /
                          (metrics.successfulTxns + metrics.failedTxns)) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Side Stats */}
          <div className="space-y-6">
            {/* Quick Metrics */}
            <div className="bg-white  rounded-2xl shadow-xl p-6 border border-gray-200 ">
              <h3 className="text-lg font-bold text-gray-900  mb-4">
                Quick Metrics
              </h3>
              <div className="space-y-4">
                <div className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-cyan-50   rounded-xl">
                  <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center mr-3">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-600 ">
                      Avg Response
                    </div>
                    <div className="text-2xl font-bold text-gray-900 ">
                      {metrics.avgResponseTime?.toFixed(1)}s
                    </div>
                  </div>
                </div>

                <div className="flex items-center p-4 bg-gradient-to-r from-purple-50 to-pink-50   rounded-xl">
                  <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center mr-3">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-600 ">
                      Active Sessions
                    </div>
                    <div className="text-2xl font-bold text-gray-900 ">
                      {metrics.activeSessions}
                    </div>
                  </div>
                </div>

                <div className="flex items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50   rounded-xl">
                  <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center mr-3">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-600 ">
                      Top Province
                    </div>
                    <div className="text-xl font-bold text-gray-900 ">
                      {metrics.topProvince}
                    </div>
                  </div>
                </div>

                <div className="flex items-center p-4 bg-gradient-to-r from-orange-50 to-amber-50   rounded-xl">
                  <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center mr-3">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-600 ">
                      Peak Hour
                    </div>
                    <div className="text-xl font-bold text-gray-900 ">
                      {metrics.peakHour}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Network Breakdown */}
        <div className="bg-white  rounded-2xl shadow-xl p-6 border border-gray-200 ">
          <h2 className="text-xl font-bold text-gray-900  mb-6">
            Network Provider Performance
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {networks.map((network, index) => (
              <div
                key={index}
                className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-white   p-6 rounded-xl border border-gray-200  hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: network.color }}
                    />
                    <h3 className="font-bold text-gray-900 ">{network.name}</h3>
                  </div>
                  <Signal className="w-5 h-5 text-gray-400" />
                </div>

                <div className="mb-4">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-4xl font-bold text-gray-900 ">
                      {network.rate}%
                    </span>
                    <span className="text-sm text-gray-500">success rate</span>
                  </div>
                  <div className="w-full bg-gray-200  rounded-full h-3">
                    <div
                      className="h-3 rounded-full transition-all duration-500"
                      style={{
                        width: `${network.rate}%`,
                        backgroundColor: network.color,
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 ">
                  <div>
                    <div className="text-xs text-gray-500  mb-1">
                      Market Share
                    </div>
                    <div className="text-lg font-bold text-gray-900 ">
                      {network.marketShare}%
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500  mb-1">
                      Transactions
                    </div>
                    <div className="text-lg font-bold text-gray-900 ">
                      {network.totalTransactions?.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500  text-sm space-y-1 pb-4">
          <p>
            Real-time USSD analytics for Zambian telecommunications networks
          </p>
          <p className="text-xs">
            Data updates every 3 seconds when live mode is enabled
          </p>
        </div>
      </div>
    </div>
  );
};

export default USSDGauge;
