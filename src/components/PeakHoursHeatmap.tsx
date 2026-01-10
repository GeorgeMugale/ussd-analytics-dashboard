import React, { useState, useEffect, useRef } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  TooltipProps,
} from "recharts";
import {
  Clock,
  Calendar,
  TrendingUp,
  Lightbulb,
  Settings,
  Zap,
  Users,
  Moon,
  Sun,
  AlertCircle,
  Download,
  Activity,
} from "lucide-react";
import {
  CustomTooltipProps,
  exportAsCSV,
  exportAsPDF,
  showExportDialog,
} from "./utils";
import { api } from "../services/api";
import LoaderOverlay from "./LoaderOverlay";

interface HeatmapCell {
  day: string;
  hour: string;
  value: number;
  intensity: number;
  isPeak: boolean;
}

interface HourlyData {
  hour: string;
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
  [key: string]: any;
}

interface DayStats {
  day: string;
  total: number;
  peak: number;
  peakHour: string;
  isWeekend: boolean;
}

// Define types for your insights
interface InsightItem {
  icon: React.ElementType;
  title: string;
  description: string;
  colorClass: string; // e.g., "bg-green-50 text-green-600"
}

// Helper to calculate insights dynamically
const generateDynamicInsights = (data: HeatmapCell[]): InsightItem[] => {
  if (data.length === 0) return [];

  // 1. Find Global Peak Hour (Time of day with highest volume across all days)
  const hourlyTotals: Record<string, number> = {};
  data.forEach((cell) => {
    hourlyTotals[cell.hour] = (hourlyTotals[cell.hour] || 0) + cell.value;
  });
  const peakHour = Object.entries(hourlyTotals).reduce((a, b) =>
    a[1] > b[1] ? a : b
  )[0];

  // 2. Find Busiest Day
  const dailyTotals: Record<string, number> = {};
  data.forEach((cell) => {
    dailyTotals[cell.day] = (dailyTotals[cell.day] || 0) + cell.value;
  });
  const busiestDay = Object.entries(dailyTotals).reduce((a, b) =>
    a[1] > b[1] ? a : b
  );

  // 3. Find Quietest Window (for maintenance)
  const quietestHour = Object.entries(hourlyTotals).reduce((a, b) =>
    a[1] < b[1] ? a : b
  )[0];

  // 4. Analyze Weekend vs Weekday
  const weekendVol = data
    .filter((c) => ["Saturday", "Sunday"].includes(c.day))
    .reduce((sum, c) => sum + c.value, 0);
  const weekdayVol = data
    .filter((c) => !["Saturday", "Sunday"].includes(c.day))
    .reduce((sum, c) => sum + c.value, 0);
  const weekendAvg = weekendVol / 2;
  const weekdayAvg = weekdayVol / 5;

  return [
    {
      icon: TrendingUp,
      title: "Peak Hours",
      description: `Highest consistent network activity observed at ${peakHour} across all networks.`,
      colorClass: "bg-green-50 text-green-600",
    },
    {
      icon: Calendar,
      title: `${busiestDay[0]} Pattern`,
      description: `${
        busiestDay[0]
      } is the busiest day with ${busiestDay[1].toLocaleString()} total sessions.`,
      colorClass: "bg-blue-50 text-blue-600",
    },
    {
      icon: Moon,
      title: "Lowest Activity",
      description: `Traffic is lowest at ${quietestHour}, ideal for scheduled downtime.`,
      colorClass: "bg-purple-50 text-purple-600",
    },
    {
      icon: Sun,
      title: "Weekend vs Weekday",
      description:
        weekendAvg > weekdayAvg
          ? "Weekend volume exceeds weekday averages."
          : "Weekdays see higher volume than weekends.",
      colorClass: "bg-orange-50 text-orange-600",
    },
  ];
};

// Helper to calculate recommendations dynamically
const generateDynamicRecommendations = (data: HeatmapCell[]): InsightItem[] => {
  if (data.length === 0) return [];

  // Recalc logical variables for recommendations
  const hourlyTotals: Record<string, number> = {};
  data.forEach(
    (c) => (hourlyTotals[c.hour] = (hourlyTotals[c.hour] || 0) + c.value)
  );
  const peakHour = Object.entries(hourlyTotals).reduce((a, b) =>
    a[1] > b[1] ? a : b
  )[0];
  const quietestHour = Object.entries(hourlyTotals).reduce((a, b) =>
    a[1] < b[1] ? a : b
  )[0];

  return [
    {
      icon: Zap,
      title: "Server Scaling",
      description: `Auto-scale infrastructure capacity specifically during ${peakHour} to handle load spikes.`,
      colorClass: "bg-blue-50 text-blue-600",
    },
    {
      icon: AlertCircle,
      title: "Maintenance Window",
      description: `Schedule strictly during ${quietestHour} to impact the fewest users.`,
      colorClass: "bg-yellow-50 text-yellow-600",
    },
    {
      icon: Users,
      title: "Support Allocation",
      description: `Align support shift changes to ensure maximum coverage during ${peakHour}.`,
      colorClass: "bg-green-50 text-green-600",
    },
  ];
};

const USSDPeakHoursHeatmap: React.FC = () => {
  const [heatmapData, setHeatmapData] = useState<HeatmapCell[]>([]);
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [dayStats, setDayStats] = useState<DayStats[]>([]);
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);
  const [loading, setLoading] = useState(true);
  const componentRef = useRef<HTMLDivElement>(null);

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const hours = [
    "00-02",
    "02-04",
    "04-06",
    "06-08",
    "08-10",
    "10-12",
    "12-14",
    "14-16",
    "16-18",
    "18-20",
    "20-22",
    "22-00",
  ];

  const fetchHeatmapData = async () => {
    try {
      const result = await api.getPeakHours();
      if (result) setHeatmapData(result);
    } catch (error) {
      console.error("Failed to load heatmap", error);
    } finally {
      setLoading(false);
    }
  };

  // Generate hourly comparison data
  const generateHourlyData = (): HourlyData[] => {
    const hourlyMap: { [key: string]: any } = {};

    heatmapData.forEach((cell) => {
      if (!hourlyMap[cell.hour]) {
        hourlyMap[cell.hour] = { hour: cell.hour };
      }
      hourlyMap[cell.hour][cell.day.toLowerCase()] = cell.value;
    });

    return hours.map((hour) => hourlyMap[hour]);
  };

  useEffect(() => {
    fetchHeatmapData();
  }, []);

  useEffect(() => {
    if (heatmapData.length > 0) {
      setHourlyData(generateHourlyData());
      setDayStats(calculateDayStats());
    }
  }, [heatmapData]);

  // Calculate day statistics
  const calculateDayStats = (): DayStats[] => {
    return days.map((day, index) => {
      const dayCells = heatmapData.filter((cell) => cell.day === day);
      const total = dayCells.reduce((sum, cell) => sum + cell.value, 0);
      const peakCell = dayCells.reduce(
        (max, cell) => (cell.value > max.value ? cell : max),
        dayCells[0]
      );

      return {
        day,
        total,
        peak: peakCell?.value || 0,
        peakHour: peakCell?.hour || "",
        isWeekend: index >= 5,
      };
    });
  };

  const getIntensityColor = (intensity: number): string => {
    const colors = [
      "#f3f4f6", // intensity 0
      "#dbeafe", // intensity 1
      "#93c5fd", // intensity 2
      "#3b82f6", // intensity 3
      "#1d4ed8", // intensity 4
      "#1e3a8a", // intensity 5
    ];
    return colors[intensity] || colors[0];
  };

  const getTextColor = (intensity: number): string => {
    return intensity >= 2 ? "#ffffff" : "#374151";
  };

  const totalSessions = heatmapData.reduce((sum, cell) => sum + cell.value, 0);
  const avgPerHour = Math.round(totalSessions / heatmapData.length);
  const peakCell = heatmapData.reduce(
    (max, cell) => (cell.value > max.value ? cell : max),
    heatmapData[0] || { value: 0 }
  );

  const CustomTooltip: React.FC<CustomTooltipProps<HourlyData>> = ({
    active,
    payload,
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-xl shadow-2xl border border-gray-200 ">
          <p className="font-bold text-gray-900  mb-2">
            {payload[0].payload.hour}
          </p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-gray-600 capitalize">
                    {entry.dataKey}:
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-900 ">
                  {entry.value?.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const insights = React.useMemo(
    () => generateDynamicInsights(heatmapData),
    [heatmapData]
  );
  const recommendations = React.useMemo(
    () => generateDynamicRecommendations(heatmapData),
    [heatmapData]
  );

  return (
    <div
      ref={componentRef}
      className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6"
    >
      <LoaderOverlay isLoading={loading} />
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200 ">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Peak Hours Analysis
                </h1>
              </div>
              <p className="text-gray-600 ">
                Transaction density by hour and day of week in Zambia
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50   text-green-700  rounded-xl font-medium border border-green-200 ">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  <span>Peak: {avgPerHour}</span>
                </div>
              </div>
              <button
                onClick={() =>
                  showExportDialog(
                    () => exportAsPDF("transaction-volumes", componentRef),
                    () =>
                      exportAsCSV(heatmapData, "ussd-peak-hours-heatmap", [
                        { key: "day", label: "Day" },
                        { key: "hour", label: "Hour" },
                        { key: "value", label: "Sessions" },
                        { key: "intensity", label: "Intensity Level" },
                        { key: "isPeak", label: "Is Peak Hour" },
                      ])
                  )
                }
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
              <div className="text-sm text-gray-600  mb-1">Total Sessions</div>
              <div className="text-3xl font-bold text-gray-900 ">
                {totalSessions.toLocaleString()}
              </div>
              <div className="text-xs text-blue-600  mt-1">Last 7 days</div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50   p-4 rounded-xl border border-purple-200 ">
              <div className="text-sm text-gray-600  mb-1">Peak Hour Avg</div>
              <div className="text-3xl font-bold text-gray-900 ">
                {peakCell.value?.toLocaleString()}/hr
              </div>
              <div className="text-xs text-purple-600  mt-1">
                {peakCell.day} {peakCell.hour}
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50   p-4 rounded-xl border border-green-200 ">
              <div className="text-sm text-gray-600  mb-1">Hourly Average</div>
              <div className="text-3xl font-bold text-gray-900 ">
                {avgPerHour.toLocaleString()}
              </div>
              <div className="text-xs text-green-600  mt-1">
                Across all hours
              </div>
            </div>
          </div>
        </div>

        {/* Heatmap */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200 ">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900  mb-1">
              Transaction Density Heatmap
            </h2>
            <p className="text-sm text-gray-600 ">
              Darker cells indicate higher USSD transaction volume
            </p>
          </div>

          {/* Heatmap Grid */}
          <div className="overflow-x-auto">
            <div className="min-w-max">
              {/* Hour Headers */}
              <div className="flex mb-2">
                <div className="w-32"></div>
                {hours.map((hour, index) => (
                  <div key={index} className="flex-1 min-w-[70px] text-center">
                    <div className="text-xs font-medium text-gray-500 ">
                      {hour}
                    </div>
                  </div>
                ))}
              </div>

              {/* Heatmap Rows */}
              {days.map((day, dayIndex) => {
                const isWeekend = dayIndex >= 5;
                return (
                  <div key={day} className="flex items-center mb-1">
                    {/* Day Label */}
                    <div
                      className={`w-32 pr-4 ${
                        isWeekend ? "bg-blue-50 " : ""
                      } rounded-l-lg`}
                    >
                      <div className="text-sm font-bold text-gray-900 ">
                        {day}
                      </div>
                      <div className="text-xs text-gray-500 ">
                        {isWeekend ? "Weekend" : "Work Day"}
                      </div>
                    </div>

                    {/* Cells */}
                    {hours.map((hour, hourIndex) => {
                      const cell = heatmapData.find(
                        (c) => c.day === day && c.hour === hour
                      );
                      if (!cell) return null;

                      return (
                        <div
                          key={`${day}-${hour}`}
                          className="flex-1 min-w-[70px] h-16 mx-0.5 rounded-lg cursor-pointer transition-all duration-200 hover:scale-110 hover:shadow-xl relative group"
                          style={{
                            backgroundColor: getIntensityColor(cell.intensity),
                          }}
                          onMouseEnter={() => setHoveredCell(cell)}
                          onMouseLeave={() => setHoveredCell(null)}
                        >
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span
                              className="text-xs font-bold"
                              style={{ color: getTextColor(cell.intensity) }}
                            >
                              {cell.value.toLocaleString()}
                            </span>
                          </div>

                          {/* Peak Indicator */}
                          {cell.isPeak && (
                            <div
                              className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                                isWeekend ? "bg-orange-500" : "bg-red-500"
                              }`}
                            />
                          )}

                          {/* Hover Tooltip */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                            <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-xl">
                              <div className="font-bold">
                                {day} {hour}
                              </div>
                              <div>{cell.value.toLocaleString()} sessions</div>
                              {cell.isPeak && (
                                <div className="text-yellow-400 mt-1">
                                  ⭐ Peak Hour
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center flex-wrap gap-4">
              <span className="text-sm font-medium text-gray-700 ">
                Transaction Intensity:
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  { intensity: 0, range: "0-200" },
                  { intensity: 1, range: "201-500" },
                  { intensity: 2, range: "501-1K" },
                  { intensity: 3, range: "1K-1.5K" },
                  { intensity: 4, range: "1.5K-1.8K" },
                  { intensity: 5, range: "1.8K+" },
                ].map(({ intensity, range }) => (
                  <div key={intensity} className="flex items-center gap-1">
                    <div
                      className="w-6 h-6 rounded border border-gray-300"
                      style={{ backgroundColor: getIntensityColor(intensity) }}
                    />
                    <span className="text-xs text-gray-600 ">{range}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <span className="text-sm text-gray-700 ">Weekday Peak</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full" />
                <span className="text-sm text-gray-700 ">Weekend Peak</span>
              </div>
            </div>
          </div>
        </div>

        {/* Hourly Comparison Chart */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200 ">
          <h2 className="text-xl font-bold text-gray-900  mb-6">
            Hourly Pattern Comparison
          </h2>

          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={hourlyData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e5e7eb"
                  opacity={0.5}
                />
                <XAxis
                  dataKey="hour"
                  stroke="#9ca3af"
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                />
                <YAxis
                  stroke="#9ca3af"
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="monday"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Monday"
                />
                <Line
                  type="monotone"
                  dataKey="tuesday"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Tuesday"
                />
                <Line
                  type="monotone"
                  dataKey="wednesday"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Wednesday"
                />
                <Line
                  type="monotone"
                  dataKey="thursday"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Thursday"
                />
                <Line
                  type="monotone"
                  dataKey="friday"
                  stroke="#EF4444"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  name="Friday"
                />
                <Line
                  type="monotone"
                  dataKey="saturday"
                  stroke="#06B6D4"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Saturday"
                />
                <Line
                  type="monotone"
                  dataKey="sunday"
                  stroke="#EC4899"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Sunday"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Key Insights */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              Key Insights
            </h3>
            <div className="space-y-4">
              {insights.map((item, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-3 rounded-lg ${
                    item.colorClass.split(" ")[0]
                  }`}
                >
                  <item.icon
                    className={`w-5 h-5 mt-0.5 ${
                      item.colorClass.split(" ")[1]
                    }`}
                  />
                  <div>
                    <div className="font-medium text-gray-900">
                      {item.title}
                    </div>
                    <div className="text-sm text-gray-600">
                      {item.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-600" />
              Recommendations
            </h3>
            <div className="space-y-4">
              {recommendations.map((item, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-3 rounded-lg ${
                    item.colorClass.split(" ")[0]
                  }`}
                >
                  <item.icon
                    className={`w-5 h-5 mt-0.5 ${
                      item.colorClass.split(" ")[1]
                    }`}
                  />
                  <div>
                    <div className="font-medium text-gray-900">
                      {item.title}
                    </div>
                    <div className="text-sm text-gray-600">
                      {item.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500  text-sm space-y-1 pb-4">
          <p>
            Based on {totalSessions.toLocaleString()} USSD sessions across MTN,
            Airtel, and Zamtel networks
          </p>
          <p className="text-xs">
            Data reflects typical Zambian usage patterns: Workday peaks, weekend
            relaxation, Friday salary spikes
          </p>
        </div>
      </div>
    </div>
  );
};

export default USSDPeakHoursHeatmap;
