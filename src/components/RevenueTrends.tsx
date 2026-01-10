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
  ComposedChart,
  Line,
  Area,
  AreaChart,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Zap,
  DollarSign,
  Activity,
  Download,
  AlertCircle,
  Wallet,
  Smartphone,
  Droplet,
  Signal,
} from "lucide-react";
import {
  CustomTooltipProps,
  exportAsCSV,
  exportAsPDF,
  showExportDialog,
  TimeRange,
} from "./utils";
import { api } from "../services/api";
import LoaderOverlay from "./LoaderOverlay";

interface RevenueDataPoint {
  date: string; // ISO String from backend
  dateLabel: string; // Generated in Frontend
  electricity: number;
  mobileMoney: number;
  airtime: number;
  water: number;
  total: number;
  isPeak: boolean; // Calculated in Frontend
  isHoliday: boolean; // Calculated in Frontend
  isProjected: boolean;
  growth?: number; // Calculated in Frontend
}

interface ServiceRevenue {
  name: string;
  value: number;
  color: string;
  icon: React.ComponentType<{
    className?: string;
    style?: React.CSSProperties;
  }>;
  percentage: number;
  trend: number;
}

type ChartType = "stacked" | "grouped" | "line" | "area";

// Define the shape of our dynamic insight cards
interface InsightCard {
  title: string;
  value: string; // The main stat (e.g., "Electricity")
  description: string;
  icon: React.ElementType;
  colorClass: string; // e.g., "bg-blue-50 border-blue-200"
  iconBgClass: string; // e.g., "bg-blue-500"
}

// 1. Helper to calculate Service Stats dynamically
const calculateServiceStats = (data: RevenueDataPoint[]): ServiceRevenue[] => {
  if (data.length === 0) return [];

  const totalRev = data.reduce((sum, d) => sum + d.total, 0);

  // Define metadata for services to preserve colors/icons
  const serviceMeta: Record<string, any> = {
    electricity: { name: "Electricity Tokens", color: "#3B82F6", icon: Zap },
    mobileMoney: { name: "Mobile Money", color: "#10B981", icon: Wallet },
    airtime: { name: "Airtime Sales", color: "#8B5CF6", icon: Smartphone },
    water: { name: "Water Bills", color: "#F59E0B", icon: Droplet },
  };

  return Object.keys(serviceMeta)
    .map((key) => {
      const meta = serviceMeta[key];
      const serviceTotal = data.reduce((sum, d) => sum + (d as any)[key], 0);

      // Calculate Trend (Simple logic: Last 3 days avg vs First 3 days avg)
      const startAvg =
        data.slice(0, 3).reduce((s, d) => s + (d as any)[key], 0) / 3 || 1;
      const endAvg =
        data.slice(-3).reduce((s, d) => s + (d as any)[key], 0) / 3 || 1;
      const trend = ((endAvg - startAvg) / startAvg) * 100;

      return {
        name: meta.name,
        value: serviceTotal,
        color: meta.color,
        icon: meta.icon,
        percentage: Math.round((serviceTotal / totalRev) * 100),
        trend: Math.round(trend * 10) / 10,
      };
    })
    .sort((a, b) => b.value - a.value); // Sort by highest revenue
};

// 2. Helper to generate Text Insights dynamically
const generateRevenueInsights = (
  data: RevenueDataPoint[],
  services: ServiceRevenue[]
): InsightCard[] => {
  if (data.length === 0 || services.length === 0) return [];

  // Insight A: Dominant Service
  const dominant = services[0]; // Already sorted by value in helper above

  // Insight B: Growth Star (Highest positive trend)
  const growthStar = [...services].sort((a, b) => b.trend - a.trend)[0];

  // Insight C: Salary Week Impact
  // Calculate total revenue during "Peak" days (15th-20th) vs Total
  const salaryWeekRev = data
    .filter((d) => d.isPeak)
    .reduce((sum, d) => sum + d.total, 0);
  const totalRev = data.reduce((sum, d) => sum + d.total, 0);
  const salaryWeekShare = Math.round((salaryWeekRev / totalRev) * 100);

  return [
    {
      title: "Market Dominance",
      value: dominant.name,
      description: `${dominant.name} contributes ${dominant.percentage}% of total revenue. Urban uptake is driving this volume.`,
      icon: dominant.icon,
      colorClass: "bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200",
      iconBgClass: "bg-blue-500",
    },
    {
      title: "Fastest Growth",
      value: `${growthStar.name} (+${growthStar.trend}%)`,
      description: `Highest growth trend observed. Adoption in Lusaka and Copperbelt is increasing daily volumes.`,
      icon: TrendingUp,
      colorClass:
        "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200",
      iconBgClass: "bg-green-500",
    },
    {
      title: "Salary Week Impact",
      value: `${salaryWeekShare}% of Volume`,
      description: `Days 15-20 (Salary Week) account for ${salaryWeekShare}% of total monthly revenue flows.`,
      icon: Signal,
      colorClass:
        "bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200",
      iconBgClass: "bg-purple-500",
    },
  ];
};

const USSDRevenueTrends: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>("90d");
  const [chartType, setChartType] = useState<ChartType>("stacked");
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([]);
  const [loading, setLoading] = useState(false); // Add loading state if desired
  const componentRef = useRef<HTMLDivElement>(null);

  // Helper to detect specific business days (Moved from generate function)
  const enhanceDataPoint = (data: any, prevTotal: number) => {
    const dateObj = new Date(data.date);
    const dayOfMonth = dateObj.getDate();
    const month = dateObj.getMonth();

    // Logic: Peak is 15th-20th (Salary week)
    const isPeak = dayOfMonth >= 15 && dayOfMonth <= 20;

    // Logic: Holidays (Xmas or New Year)
    const isHoliday =
      (month === 11 && dayOfMonth >= 25 && dayOfMonth <= 31) ||
      (month === 0 && dayOfMonth === 1);

    // Logic: Growth % vs previous day
    const growth =
      prevTotal > 0 ? ((data.total - prevTotal) / prevTotal) * 100 : 0;

    return {
      ...data,
      dateLabel: dateObj.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      isPeak,
      isHoliday,
      isProjected: false, // You can set this to true if date === today
      growth: Math.round(growth * 10) / 10,
    };
  };

  useEffect(() => {
    const fetchRevenueData = async () => {
      setLoading(true);
      try {
        const result = await api.getRevenueTrends(timeRange);

        if (result) {
          // Process the raw data to add UI flags (Growth, Peak, etc.)
          const processedData: RevenueDataPoint[] = result.map(
            (item: any, index: number) => {
              const prevTotal =
                index > 0 ? result[index - 1].total : item.total;
              return enhanceDataPoint(item, prevTotal);
            }
          );

          setRevenueData(processedData);
        } else {
          alert("Error fetching");
        }
      } catch (error) {
        console.error("Failed to fetch revenue data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRevenueData();
  }, [timeRange]);

  const totalRevenue = revenueData.reduce((sum, d) => sum + d.total, 0);
  const avgDailyRevenue = Math.round(totalRevenue / (revenueData.length || 1));
  const peakDay = revenueData.reduce(
    (max, d) => (d.total > max.total ? d : max),
    revenueData[0] || { total: 0, dateLabel: "" }
  );

  const overallTrend =
    revenueData.length > 1
      ? ((revenueData[revenueData.length - 1].total - revenueData[0].total) /
          revenueData[0].total) *
        100
      : 0;

  const CustomTooltip: React.FC<CustomTooltipProps<RevenueDataPoint>> = ({
    active,
    payload,
    label,
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as RevenueDataPoint;

      return (
        <div className="bg-white  p-4 rounded-xl shadow-2xl border border-gray-200 ">
          <div className="flex items-center justify-between mb-3">
            <p className="font-bold text-gray-900 ">{label}</p>
            {data.isPeak && (
              <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full font-medium">
                Peak Week
              </span>
            )}
            {data.isHoliday && (
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                Holiday
              </span>
            )}
            {data.isProjected && (
              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full font-medium">
                Projected
              </span>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center pb-2 border-b border-gray-200 ">
              <span className="text-gray-600 font-medium">Total Revenue:</span>
              <span className="font-bold text-lg text-gray-900 ">
                ZMW {data.total.toLocaleString()}
              </span>
            </div>

            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-gray-600 ">{entry.name}:</span>
                </div>
                <span className="text-sm font-semibold text-gray-900 ">
                  ZMW {entry.value.toLocaleString()}
                </span>
              </div>
            ))}

            {data.growth !== undefined && (
              <div className="flex items-center justify-between pt-2 border-t border-gray-200 ">
                <span className="text-xs text-gray-500">Day-over-day:</span>
                <span
                  className={`text-xs font-bold flex items-center gap-1 ${
                    data.growth > 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {data.growth > 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {data.growth > 0 ? "+" : ""}
                  {data.growth}%
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const formatYAxis = (value: number): string => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return value.toString();
  };

  const renderChart = () => {
    const commonProps = {
      data: revenueData,
      margin: { top: 20, right: 30, left: 20, bottom: 20 },
    };

    switch (chartType) {
      case "stacked":
        return (
          <BarChart {...commonProps}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              opacity={0.5}
            />
            <XAxis
              dataKey="dateLabel"
              stroke="#9ca3af"
              tick={{ fill: "#6b7280", fontSize: 12 }}
            />
            <YAxis
              stroke="#9ca3af"
              tick={{ fill: "#6b7280", fontSize: 12 }}
              tickFormatter={formatYAxis}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar
              dataKey="electricity"
              stackId="a"
              fill="#3B82F6"
              name="Electricity"
            />
            <Bar
              dataKey="mobileMoney"
              stackId="a"
              fill="#10B981"
              name="Mobile Money"
            />
            <Bar dataKey="airtime" stackId="a" fill="#8B5CF6" name="Airtime" />
            <Bar
              dataKey="water"
              stackId="a"
              fill="#F59E0B"
              name="Water"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        );

      case "grouped":
        return (
          <BarChart {...commonProps}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              opacity={0.5}
            />
            <XAxis
              dataKey="dateLabel"
              stroke="#9ca3af"
              tick={{ fill: "#6b7280", fontSize: 12 }}
            />
            <YAxis
              stroke="#9ca3af"
              tick={{ fill: "#6b7280", fontSize: 12 }}
              tickFormatter={formatYAxis}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar
              dataKey="electricity"
              fill="#3B82F6"
              name="Electricity"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="mobileMoney"
              fill="#10B981"
              name="Mobile Money"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="airtime"
              fill="#8B5CF6"
              name="Airtime"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="water"
              fill="#F59E0B"
              name="Water"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        );

      case "line":
        return (
          <ComposedChart {...commonProps}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              opacity={0.5}
            />
            <XAxis
              dataKey="dateLabel"
              stroke="#9ca3af"
              tick={{ fill: "#6b7280", fontSize: 12 }}
            />
            <YAxis
              stroke="#9ca3af"
              tick={{ fill: "#6b7280", fontSize: 12 }}
              tickFormatter={formatYAxis}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="electricity"
              stroke="#3B82F6"
              strokeWidth={2.5}
              dot={{ r: 3 }}
              name="Electricity"
            />
            <Line
              type="monotone"
              dataKey="mobileMoney"
              stroke="#10B981"
              strokeWidth={2.5}
              dot={{ r: 3 }}
              name="Mobile Money"
            />
            <Line
              type="monotone"
              dataKey="airtime"
              stroke="#8B5CF6"
              strokeWidth={2.5}
              dot={{ r: 3 }}
              name="Airtime"
            />
            <Line
              type="monotone"
              dataKey="water"
              stroke="#F59E0B"
              strokeWidth={2.5}
              dot={{ r: 3 }}
              name="Water"
            />
          </ComposedChart>
        );

      case "area":
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient
                id="electricityGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="moneyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="airtimeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="waterGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              opacity={0.5}
            />
            <XAxis
              dataKey="dateLabel"
              stroke="#9ca3af"
              tick={{ fill: "#6b7280", fontSize: 12 }}
            />
            <YAxis
              stroke="#9ca3af"
              tick={{ fill: "#6b7280", fontSize: 12 }}
              tickFormatter={formatYAxis}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="electricity"
              stackId="1"
              stroke="#3B82F6"
              fill="url(#electricityGradient)"
              strokeWidth={2}
              name="Electricity"
            />
            <Area
              type="monotone"
              dataKey="mobileMoney"
              stackId="1"
              stroke="#10B981"
              fill="url(#moneyGradient)"
              strokeWidth={2}
              name="Mobile Money"
            />
            <Area
              type="monotone"
              dataKey="airtime"
              stackId="1"
              stroke="#8B5CF6"
              fill="url(#airtimeGradient)"
              strokeWidth={2}
              name="Airtime"
            />
            <Area
              type="monotone"
              dataKey="water"
              stackId="1"
              stroke="#F59E0B"
              fill="url(#waterGradient)"
              strokeWidth={2}
              name="Water"
            />
          </AreaChart>
        );
    }
  };

  const serviceRevenues = React.useMemo(
    () => calculateServiceStats(revenueData),
    [revenueData]
  );
  const insights = React.useMemo(
    () => generateRevenueInsights(revenueData, serviceRevenues),
    [revenueData, serviceRevenues]
  );

  return (
    <div
      ref={componentRef}
      className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50   p-6"
    >
      <LoaderOverlay isLoading={loading} />

      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white  rounded-2xl shadow-xl p-6 border border-gray-200 ">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Revenue Trends Dashboard
                </h1>
              </div>
              <p className="text-gray-600 ">
                Daily revenue from USSD transactions across Zambian networks
                (ZMW)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-green-100  text-green-700  rounded-xl font-medium">
                <TrendingUp className="w-4 h-4" />+{overallTrend.toFixed(1)}%
                growth
              </div>

              <button
                onClick={() =>
                  showExportDialog(
                    () => exportAsPDF("transaction-volumes", componentRef),
                    () =>
                      exportAsCSV(revenueData, "ussd-revenue-trends", [
                        { key: "date", label: "Date" },
                        { key: "dateLabel", label: "Date Label" },
                        {
                          key: "electricity",
                          label: "Electricity Revenue (ZMW)",
                        },
                        {
                          key: "mobileMoney",
                          label: "Mobile Money Revenue (ZMW)",
                        },
                        { key: "airtime", label: "Airtime Revenue (ZMW)" },
                        { key: "water", label: "Water Revenue (ZMW)" },
                        { key: "total", label: "Total Revenue (ZMW)" },
                        { key: "growth", label: "Growth (%)" },
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50   p-4 rounded-xl border border-blue-200 ">
              <div className="text-sm text-gray-600  mb-1">Total Revenue</div>
              <div className="text-3xl font-bold text-gray-900 ">
                ZMW {formatYAxis(totalRevenue)}
              </div>
              <div className="text-xs text-blue-600  mt-1">
                Last{" "}
                {timeRange === "7d"
                  ? "7 days"
                  : timeRange === "30d"
                  ? "30 days"
                  : timeRange === "90d"
                  ? "90 days"
                  : "year"}
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50   p-4 rounded-xl border border-green-200 ">
              <div className="text-sm text-gray-600  mb-1">Avg. Daily</div>
              <div className="text-3xl font-bold text-gray-900 ">
                ZMW {avgDailyRevenue.toLocaleString()}
              </div>
              <div className="text-xs text-green-600  mt-1">
                Consistent growth trend
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50   rounded-xl border border-purple-200 ">
              <div className="text-sm text-gray-600  mb-1">Peak Day</div>
              <div className="text-3xl font-bold text-gray-900 ">
                ZMW {peakDay.total.toLocaleString()}
              </div>
              <div className="text-xs text-purple-600  mt-1">
                {peakDay.dateLabel} (Salary week)
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white  rounded-2xl shadow-xl p-6 border border-gray-200 ">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900  mb-1">
                Daily Revenue Trends
              </h2>
              <p className="text-sm text-gray-600 ">
                Revenue breakdown by service type
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                className="bg-gray-50  border border-gray-300  rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500 "
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="ytd">Year to Date</option>
              </select>

              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value as ChartType)}
                className="bg-gray-50  border border-gray-300  rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500 "
              >
                <option value="stacked">Stacked Bar</option>
                <option value="grouped">Grouped Bar</option>
                <option value="line">Line Chart</option>
                <option value="area">Area Chart</option>
              </select>
            </div>
          </div>

          <div className="h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white  rounded-2xl shadow-xl p-6 border border-gray-200 ">
          <h2 className="text-xl font-bold text-gray-900  mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Revenue by Service Type
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {serviceRevenues.map((service, index) => {
              const Icon = service.icon;
              return (
                <div
                  key={index}
                  className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-white   p-6 rounded-xl border border-gray-200  hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${service.color}20` }}
                    >
                      <Icon
                        className="w-6 h-6"
                        style={{ color: service.color }}
                      />
                    </div>
                    <div
                      className={`flex items-center gap-1 text-sm font-bold ${
                        service.trend > 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {service.trend > 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      {service.trend > 0 ? "+" : ""}
                      {service.trend}%
                    </div>
                  </div>

                  <h3 className="text-sm font-medium text-gray-600  mb-2">
                    {service.name}
                  </h3>

                  <div className="text-2xl font-bold text-gray-900  mb-2">
                    ZMW {formatYAxis(service.value)}
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 ">Share:</span>
                    <span
                      className="font-bold"
                      style={{ color: service.color }}
                    >
                      {service.percentage}%
                    </span>
                  </div>

                  <div className="mt-3 w-full bg-gray-200  rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${service.percentage}%`,
                        backgroundColor: service.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Revenue Insights */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-purple-600" />
            Revenue Insights
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {insights.map((insight, index) => (
              <div
                key={index}
                className={`${insight.colorClass} p-5 rounded-xl border`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`w-10 h-10 rounded-full ${insight.iconBgClass} flex items-center justify-center`}
                  >
                    <insight.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-lg font-bold text-gray-900 leading-tight">
                    {insight.title}
                  </div>
                </div>
                <div className="font-semibold text-gray-900 mb-1">
                  {insight.value}
                </div>
                <p className="text-sm text-gray-600">{insight.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default USSDRevenueTrends;
