import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  Area,
  AreaChart,
  BarChart,
  Bar,
  ComposedChart,
  Brush,
  TooltipProps,
  Cell,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Download,
  Zap,
  Activity,
  DollarSign,
} from "lucide-react";
import { api } from "../services/api";

// Type definitions
// types.ts

export interface ChartDataPoint {
  date: string; // formatted label (e.g., "10:00" or "Oct 24")
  fullDate: string; // ISO string for sorting/logic
  dayOfWeek: string; // "Mon", "Tue", etc.
  hour?: number; // 0-23 (only needed for 24h view)

  // Service Breakdowns (Counts)
  total: number;
  electricity: number;
  water: number;
  airtime: number;
  mobileMoney: number;
  banking: number;

  // Performance Metrics
  avgSessionTime: number; // in seconds
  successRate: number; // percentage (0-100)
  revenue: number; // total transaction volume or commission
  failedTransactions: number;
  peakConcurrentUsers: number;
}

// Your fetch function return type
export type DashboardResponse = ChartDataPoint[];

interface SummaryMetrics {
  totalTransactions: number;
  avgTransactions: number;
  peakDay: { date: string; value: number };
  revenueTotal: number;
  trend: number;
  successRate: number;
  growthRate: number;
}

export interface CustomTooltipProps<T> extends TooltipProps<number, string> {
  active?: boolean;
  payload?: Array<{
    payload: T;
  }>;
  label?: string;
}

export type TimeRange = "24h" | "7d" | "30d" | "90d";
type ChartType = "area" | "line" | "bar" | "composed";
type ViewMode = "daily" | "hourly";

const TransactionVolumeChart: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>("90d");
  const [chartType, setChartType] = useState<ChartType>("area");
  const [viewMode, setViewMode] = useState<ViewMode>("daily");
  const [selectedService, setSelectedService] = useState<string>("all");
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [summaryMetrics, setSummaryMetrics] = useState<SummaryMetrics>({
    totalTransactions: 0,
    avgTransactions: 0,
    peakDay: { date: "", value: 0 },
    revenueTotal: 0,
    trend: 0,
    successRate: 0,
    growthRate: 0,
  });

  const ussdServices = [
    {
      value: "all",
      label: "All Services",
      color: "#8B5CF6",
      gradient: ["#8B5CF6", "#7C3AED"],
    },
    {
      value: "electricity",
      label: "Electricity",
      color: "#EF4444",
      gradient: ["#EF4444", "#DC2626"],
    },
    {
      value: "water",
      label: "Water Bills",
      color: "#06B6D4",
      gradient: ["#06B6D4", "#0891B2"],
    },
    {
      value: "airtime",
      label: "Airtime",
      color: "#F59E0B",
      gradient: ["#F59E0B", "#D97706"],
    },
    {
      value: "mobileMoney",
      label: "Mobile Money",
      color: "#10B981",
      gradient: ["#10B981", "#059669"],
    },
    {
      value: "banking",
      label: "Banking",
      color: "#6366F1",
      gradient: ["#6366F1", "#4F46E5"],
    },
  ];

  // Generate realistic data with trends
  const generateData = (): ChartDataPoint[] => {
    const data: ChartDataPoint[] = [];
    const now = new Date();

    const days =
      timeRange === "24h"
        ? 1
        : timeRange === "7d"
        ? 7
        : timeRange === "30d"
        ? 30
        : 90;
    const isHourly = timeRange === "24h";
    const points = isHourly ? 24 : days;

    for (let i = points; i >= 0; i--) {
      const date = new Date(now);

      if (isHourly) {
        date.setHours(date.getHours() - i);
      } else {
        date.setDate(date.getDate() - i);
      }

      const dayOfWeek = date.getDay();
      const hour = date.getHours();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const dayOfMonth = date.getDate();

      // Base volume with realistic patterns
      let baseVolume = 3000;

      // Time-based patterns
      if (isHourly) {
        // Hourly patterns: low at night, peaks at 10am and 7pm
        if (hour >= 0 && hour < 6) baseVolume *= 0.3;
        else if (hour >= 6 && hour < 9) baseVolume *= 0.7;
        else if (hour >= 9 && hour < 12) baseVolume *= 1.5;
        else if (hour >= 12 && hour < 14) baseVolume *= 1.3;
        else if (hour >= 14 && hour < 17) baseVolume *= 1.1;
        else if (hour >= 17 && hour < 20) baseVolume *= 1.6;
        else baseVolume *= 0.8;
      } else {
        if (!isWeekend) baseVolume += 2000;
        if (dayOfMonth === 1 || dayOfMonth === 15 || dayOfMonth === 30)
          baseVolume += 3000;
      }

      // Growth trend over time
      const growthFactor = 1 + ((points - i) / points) * 0.15;
      baseVolume *= growthFactor;

      // Seasonal patterns
      const month = date.getMonth();
      if (month >= 9 && month <= 11) baseVolume *= 1.2; // Hot season
      if (month >= 0 && month <= 2) baseVolume *= 0.9; // Rainy season

      // Random variation
      baseVolume += (Math.random() - 0.5) * baseVolume * 0.2;

      const electricity = Math.floor(baseVolume * 0.35);
      const water = Math.floor(baseVolume * 0.25);
      const airtime = Math.floor(baseVolume * 0.2);
      const mobileMoney = Math.floor(baseVolume * 0.15);
      const banking = Math.floor(baseVolume * 0.05);

      const total = electricity + water + airtime + mobileMoney + banking;
      const successRate = 87 + Math.random() * 8;
      const failedTransactions = Math.floor(total * (1 - successRate / 100));

      data.push({
        date: isHourly
          ? date.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
        fullDate: date.toISOString(),
        dayOfWeek: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dayOfWeek],
        hour: isHourly ? hour : undefined,
        total,
        electricity,
        water,
        airtime,
        mobileMoney,
        banking,
        avgSessionTime: Math.floor(Math.random() * 90) + 45,
        successRate,
        revenue: total * 0.15 + Math.random() * 50,
        failedTransactions,
        peakConcurrentUsers: Math.floor(total * 0.15 + Math.random() * 100),
      });
    }

    return data;
  };

  const calculateMetrics = (data: ChartDataPoint[]): SummaryMetrics => {
    if (data.length === 0) {
      return {
        totalTransactions: 0,
        avgTransactions: 0,
        peakDay: { date: "", value: 0 },
        revenueTotal: 0,
        trend: 0,
        successRate: 0,
        growthRate: 0,
      };
    }

    const totalTransactions = data.reduce((sum, d) => sum + d.total, 0);
    const avgTransactions = Math.round(totalTransactions / data.length);
    const peakDay = data.reduce(
      (max, d) => (d.total > max.total ? d : max),
      data[0]
    );
    const revenueTotal = data.reduce((sum, d) => sum + d.revenue, 0);
    const avgSuccessRate =
      data.reduce((sum, d) => sum + d.successRate, 0) / data.length;

    // Calculate trend
    const midpoint = Math.floor(data.length / 2);
    const firstHalf = data.slice(0, midpoint);
    const secondHalf = data.slice(midpoint);
    const firstAvg =
      firstHalf.reduce((sum, d) => sum + d.total, 0) / firstHalf.length;
    const secondAvg =
      secondHalf.reduce((sum, d) => sum + d.total, 0) / secondHalf.length;
    const trend = ((secondAvg - firstAvg) / firstAvg) * 100;

    // Growth rate (week over week)
    const recentWeek = data.slice(-7);
    const previousWeek = data.slice(-14, -7);
    const recentAvg =
      recentWeek.reduce((sum, d) => sum + d.total, 0) /
      Math.min(7, recentWeek.length);
    const previousAvg =
      previousWeek.reduce((sum, d) => sum + d.total, 0) /
      Math.min(7, previousWeek.length);
    const growthRate =
      previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0;

    return {
      totalTransactions,
      avgTransactions,
      peakDay: { date: peakDay.date, value: peakDay.total },
      revenueTotal: Math.round(revenueTotal),
      trend: Math.round(trend * 10) / 10,
      successRate: Math.round(avgSuccessRate * 10) / 10,
      growthRate: Math.round(growthRate * 10) / 10,
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.getTransactionVolume(
          timeRange,
          selectedService
        );
        const rawData: ChartDataPoint[] = response;

        // Set the data directly to state
        setChartData(rawData);

        // Recalculate metrics using existing client-side function
        setSummaryMetrics(calculateMetrics(rawData));
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      }
    };

    fetchData();
  }, [timeRange, selectedService]);

  const CustomTooltip: React.FC<CustomTooltipProps<ChartDataPoint>> = ({
    active,
    payload,
    label,
  }) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload as ChartDataPoint;

      return (
        <div className="bg-gradient-to-br from-white to-gray-50   p-4 rounded-xl shadow-2xl border border-gray-200  backdrop-blur-sm">
          <p className="font-bold text-gray-900  text-base mb-3">
            {label}
          </p>
          <div className="space-y-2">
            <div className="flex justify-between items-center gap-8 pb-2 border-b border-gray-200 ">
              <span className="text-gray-600 font-medium">
                Total:
              </span>
              <span className="font-bold text-xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {data.total?.toLocaleString()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 py-2">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-xs text-gray-600 ">
                  Electricity:
                </span>
                <span className="text-xs font-semibold text-gray-900  ml-auto">
                  {data.electricity?.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span className="text-xs text-gray-600 ">
                  Mobile:
                </span>
                <span className="text-xs font-semibold text-gray-900  ml-auto">
                  {data.mobileMoney?.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span className="text-xs text-gray-600 ">
                  Airtime:
                </span>
                <span className="text-xs font-semibold text-gray-900  ml-auto">
                  {data.airtime?.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                <span className="text-xs text-gray-600 ">
                  Water:
                </span>
                <span className="text-xs font-semibold text-gray-900  ml-auto">
                  {data.water?.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200 ">
              <div>
                <span className="text-xs text-gray-500 ">
                  Success Rate
                </span>
                <div className="flex items-center gap-1 mt-1">
                  <div className="w-full bg-gray-200  rounded-full h-1.5">
                    <div
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-1.5 rounded-full"
                      style={{ width: `${data.successRate}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-green-600 ">
                    {data.successRate?.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div>
                <span className="text-xs text-gray-500 ">
                  Revenue
                </span>
                <p className="text-sm font-bold text-gray-900  mt-1">
                  ZMW {data.revenue?.toFixed(0)}
                </p>
              </div>
            </div>
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
      data: chartData,
      margin: { top: 20, right: 30, left: 0, bottom: 20 },
    };

    const gradientDefs = (
      <defs>
        {ussdServices.map((service) => (
          <linearGradient
            key={service.value}
            id={`gradient-${service.value}`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0%" stopColor={service.color} stopOpacity={0.8} />
            <stop offset="95%" stopColor={service.color} stopOpacity={0.1} />
          </linearGradient>
        ))}
      </defs>
    );

    switch (chartType) {
      case "area":
        return (
          <AreaChart {...commonProps}>
            {gradientDefs}
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              opacity={0.3}
            />
            <XAxis
              dataKey="date"
              stroke="#9ca3af"
              tick={{ fill: "#6b7280", fontSize: 12 }}
              tickLine={{ stroke: "#e5e7eb" }}
            />
            <YAxis
              stroke="#9ca3af"
              tick={{ fill: "#6b7280", fontSize: 12 }}
              tickFormatter={formatYAxis}
              tickLine={{ stroke: "#e5e7eb" }}
            />
            <Tooltip content={<CustomTooltip />} />
            {selectedService === "all" ? (
              <>
                <Legend
                  wrapperStyle={{ paddingTop: "20px" }}
                  iconType="circle"
                />
                {ussdServices.slice(1).map((service) => (
                  <Area
                    key={service.value}
                    type="monotone"
                    dataKey={service.value}
                    stackId="1"
                    stroke={service.color}
                    fill={`url(#gradient-${service.value})`}
                    strokeWidth={2}
                    name={service.label}
                  />
                ))}
              </>
            ) : (
              <Area
                type="monotone"
                dataKey={selectedService}
                stroke={
                  ussdServices.find((s) => s.value === selectedService)?.color
                }
                fill={`url(#gradient-${selectedService})`}
                strokeWidth={3}
              />
            )}
            {chartData.length > 30 && (
              <Brush dataKey="date" height={30} stroke="#8B5CF6" />
            )}
          </AreaChart>
        );

      case "line":
        return (
          <LineChart {...commonProps}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              opacity={0.3}
            />
            <XAxis
              dataKey="date"
              stroke="#9ca3af"
              tick={{ fill: "#6b7280", fontSize: 12 }}
            />
            <YAxis
              stroke="#9ca3af"
              tick={{ fill: "#6b7280", fontSize: 12 }}
              tickFormatter={formatYAxis}
            />
            <Tooltip content={<CustomTooltip />} />
            {selectedService === "all" ? (
              <>
                <Legend iconType="line" />
                {ussdServices.slice(1).map((service) => (
                  <Line
                    key={service.value}
                    type="monotone"
                    dataKey={service.value}
                    stroke={service.color}
                    strokeWidth={2.5}
                    dot={{ r: 3, strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                    name={service.label}
                  />
                ))}
              </>
            ) : (
              <Line
                type="monotone"
                dataKey={selectedService}
                stroke={
                  ussdServices.find((s) => s.value === selectedService)?.color
                }
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2 }}
                activeDot={{ r: 7 }}
              />
            )}
            <ReferenceLine
              y={summaryMetrics.avgTransactions}
              stroke="#94a3b8"
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{
                value: `Avg: ${formatYAxis(summaryMetrics.avgTransactions)}`,
                position: "right",
                fill: "#64748b",
                fontSize: 12,
                fontWeight: 600,
              }}
            />
          </LineChart>
        );

      case "bar":
        return (
          <BarChart {...commonProps}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              opacity={0.3}
            />
            <XAxis
              dataKey="date"
              stroke="#9ca3af"
              tick={{ fill: "#6b7280", fontSize: 12 }}
            />
            <YAxis
              stroke="#9ca3af"
              tick={{ fill: "#6b7280", fontSize: 12 }}
              tickFormatter={formatYAxis}
            />
            <Tooltip content={<CustomTooltip />} />
            {selectedService === "all" ? (
              <>
                <Legend />
                {ussdServices.slice(1).map((service) => (
                  <Bar
                    key={service.value}
                    dataKey={service.value}
                    stackId="a"
                    fill={service.color}
                    name={service.label}
                    radius={[0, 0, 0, 0]}
                  />
                ))}
              </>
            ) : (
              <Bar
                dataKey={selectedService}
                fill={
                  ussdServices.find((s) => s.value === selectedService)?.color
                }
                radius={[8, 8, 0, 0]}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={`url(#gradient-${selectedService})`}
                  />
                ))}
              </Bar>
            )}
          </BarChart>
        );

      case "composed":
        return (
          <ComposedChart {...commonProps}>
            {gradientDefs}
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              opacity={0.3}
            />
            <XAxis
              dataKey="date"
              stroke="#9ca3af"
              tick={{ fill: "#6b7280", fontSize: 12 }}
            />
            <YAxis
              yAxisId="left"
              stroke="#9ca3af"
              tick={{ fill: "#6b7280", fontSize: 12 }}
              tickFormatter={formatYAxis}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#9ca3af"
              tick={{ fill: "#6b7280", fontSize: 12 }}
              domain={[80, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="total"
              fill="url(#gradient-all)"
              stroke="#8B5CF6"
              fillOpacity={0.6}
              strokeWidth={2}
              name="Total Transactions"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="successRate"
              stroke="#10B981"
              strokeWidth={2.5}
              dot={{ r: 3 }}
              name="Success Rate %"
            />
            <Bar
              yAxisId="left"
              dataKey="failedTransactions"
              fill="#EF4444"
              opacity={0.6}
              name="Failed"
              radius={[4, 4, 0, 0]}
            />
          </ComposedChart>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100   p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white  rounded-2xl shadow-xl p-6 border border-gray-200 ">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Transaction Analytics
                </h1>
              </div>
              <p className="text-gray-600 ">
                Real-time USSD transaction monitoring and insights
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                className="bg-gray-50  border border-gray-300  rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:border-purple-500  transition-all"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>

              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value as ChartType)}
                className="bg-gray-50  border border-gray-300  rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:border-purple-500  transition-all"
              >
                <option value="area">Area Chart</option>
                <option value="line">Line Chart</option>
                <option value="bar">Bar Chart</option>
                <option value="composed">Composed</option>
              </select>

              <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl font-medium">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium mb-1">
                  Total Volume
                </p>
                <p className="text-3xl font-bold mb-2">
                  {formatYAxis(summaryMetrics.totalTransactions)}
                </p>
                <div className="flex items-center gap-2">
                  {summaryMetrics.trend > 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span className="text-sm font-semibold">
                    {summaryMetrics.trend > 0 ? "+" : ""}
                    {summaryMetrics.trend}%
                  </span>
                </div>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Activity className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">
                  Success Rate
                </p>
                <p className="text-3xl font-bold mb-2">
                  {summaryMetrics.successRate.toFixed(1)}%
                </p>
                <div className="w-full bg-white/20 rounded-full h-2 mt-2">
                  <div
                    className="bg-white h-2 rounded-full transition-all duration-500"
                    style={{ width: `${summaryMetrics.successRate}%` }}
                  />
                </div>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Zap className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium mb-1">
                  Revenue
                </p>
                <p className="text-3xl font-bold mb-2">
                  ZMW {formatYAxis(summaryMetrics.revenueTotal)}
                </p>
                <p className="text-sm text-green-100">
                  Avg: ZMW{" "}
                  {Math.round(summaryMetrics.revenueTotal / chartData.length)}
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium mb-1">
                  Growth Rate
                </p>
                <p className="text-3xl font-bold mb-2">
                  {summaryMetrics.growthRate > 0 ? "+" : ""}
                  {summaryMetrics.growthRate}%
                </p>
                <p className="text-sm text-orange-100">Week over week</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Chart */}
        <div className="bg-white  rounded-2xl shadow-xl p-6 border border-gray-200 ">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <h2 className="text-xl font-bold text-gray-900 ">
              Transaction Volume Trends
            </h2>

            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="bg-gray-50  border border-gray-300  rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:border-purple-500 "
            >
              {ussdServices.map((service) => (
                <option key={service.value} value={service.value}>
                  {service.label}
                </option>
              ))}
            </select>
          </div>

          <div className="h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white  rounded-2xl shadow-xl p-6 border border-gray-200 ">
            <h3 className="font-bold text-gray-900  mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Key Insights
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 /50 rounded-xl">
                <span className="text-sm text-gray-600 ">
                  Peak Period
                </span>
                <span className="font-bold text-gray-900 ">
                  {summaryMetrics.peakDay.date}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 /50 rounded-xl">
                <span className="text-sm text-gray-600 ">
                  Peak Volume
                </span>
                <span className="font-bold text-gray-900 ">
                  {formatYAxis(summaryMetrics.peakDay.value)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 /50 rounded-xl">
                <span className="text-sm text-gray-600 ">
                  Daily Average
                </span>
                <span className="font-bold text-gray-900 ">
                  {formatYAxis(summaryMetrics.avgTransactions)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white  rounded-2xl shadow-xl p-6 border border-gray-200 ">
            <h3 className="font-bold text-gray-900  mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Service Distribution
            </h3>
            <div className="space-y-3">
              {ussdServices.slice(1).map((service) => {
                const total = chartData.reduce(
                  (sum, d) =>
                    sum + (d[service.value as keyof ChartDataPoint] as number),
                  0
                );
                const percentage =
                  (total / summaryMetrics.totalTransactions) * 100;
                return (
                  <div key={service.value}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">
                        {service.label}
                      </span>
                      <span className="text-sm font-bold text-gray-900 ">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200  rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: service.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionVolumeChart;
