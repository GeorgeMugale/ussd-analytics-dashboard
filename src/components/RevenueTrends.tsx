import React, { useState, useEffect } from "react";
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
  TooltipProps,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Zap,
  DollarSign,
  Activity,
  Download,
  RefreshCw,
  AlertCircle,
  Wallet,
  Smartphone,
  Droplet,
  Signal,
} from "lucide-react";
import { CustomTooltipProps } from "./TransactionVolumeChart";

interface RevenueDataPoint {
  date: string;
  dateLabel: string;
  electricity: number;
  mobileMoney: number;
  airtime: number;
  water: number;
  total: number;
  isPeak: boolean;
  isHoliday: boolean;
  isProjected: boolean;
  growth?: number;
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

type TimeRange = "7d" | "30d" | "90d" | "ytd";
type ChartType = "stacked" | "grouped" | "line" | "area";

const USSDRevenueTrends: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [chartType, setChartType] = useState<ChartType>("stacked");
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([]);

  const generateRevenueData = (): RevenueDataPoint[] => {
    const data: RevenueDataPoint[] = [];
    const now = new Date();
    const days =
      timeRange === "7d"
        ? 7
        : timeRange === "30d"
        ? 30
        : timeRange === "90d"
        ? 90
        : 365;

    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      const dayOfWeek = date.getDay();
      const dayOfMonth = date.getDate();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isPeak = dayOfMonth >= 15 && dayOfMonth <= 20;
      const isHoliday =
        (date.getMonth() === 11 && dayOfMonth >= 25 && dayOfMonth <= 31) ||
        (date.getMonth() === 0 && dayOfMonth === 1);

      let baseRevenue = 40000;

      if (isPeak) baseRevenue *= 1.35;
      if (isWeekend && !isPeak) baseRevenue *= 0.85;
      if (isHoliday) baseRevenue *= 0.75;

      const growthFactor = 1 + ((days - i) / days) * 0.12;
      baseRevenue *= growthFactor;
      baseRevenue += (Math.random() - 0.5) * baseRevenue * 0.15;

      const electricity = baseRevenue * 0.45;
      const mobileMoney = baseRevenue * 0.3;
      const airtime = baseRevenue * 0.15;
      const water = baseRevenue * 0.1;

      const prevTotal = data[data.length - 1]?.total || baseRevenue;
      const growth = ((baseRevenue - prevTotal) / prevTotal) * 100;

      data.push({
        date: date.toISOString().split("T")[0],
        dateLabel: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        electricity: Math.round(electricity),
        mobileMoney: Math.round(mobileMoney),
        airtime: Math.round(airtime),
        water: Math.round(water),
        total: Math.round(baseRevenue),
        isPeak,
        isHoliday,
        isProjected: i === 0,
        growth: Math.round(growth * 10) / 10,
      });
    }

    return data;
  };

  useEffect(() => {
    setRevenueData(generateRevenueData());
  }, [timeRange]);

  const totalRevenue = revenueData.reduce((sum, d) => sum + d.total, 0);
  const avgDailyRevenue = Math.round(totalRevenue / (revenueData.length || 1));
  const peakDay = revenueData.reduce(
    (max, d) => (d.total > max.total ? d : max),
    revenueData[0] || { total: 0, dateLabel: "" }
  );

  const serviceRevenues: ServiceRevenue[] = [
    {
      name: "Electricity Tokens",
      value: revenueData.reduce((sum, d) => sum + d.electricity, 0),
      color: "#3B82F6",
      icon: Zap,
      percentage: 45,
      trend: 8.5,
    },
    {
      name: "Mobile Money",
      value: revenueData.reduce((sum, d) => sum + d.mobileMoney, 0),
      color: "#10B981",
      icon: Wallet,
      percentage: 30,
      trend: 12.3,
    },
    {
      name: "Airtime Sales",
      value: revenueData.reduce((sum, d) => sum + d.airtime, 0),
      color: "#8B5CF6",
      icon: Smartphone,
      percentage: 15,
      trend: -2.1,
    },
    {
      name: "Water Bills",
      value: revenueData.reduce((sum, d) => sum + d.water, 0),
      color: "#F59E0B",
      icon: Droplet,
      percentage: 10,
      trend: 5.2,
    },
  ];

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
              <span className="text-gray-600 font-medium">
                Total Revenue:
              </span>
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
                  <span className="text-sm text-gray-600 ">
                    {entry.name}:
                  </span>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50   p-6">
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
              <button className="p-2 hover:bg-gray-100  rounded-xl transition-colors">
                <RefreshCw className="w-5 h-5 text-gray-600 " />
              </button>
              <button className="p-2 hover:bg-gray-100  rounded-xl transition-colors">
                <Download className="w-5 h-5 text-gray-600 " />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50   p-4 rounded-xl border border-blue-200 ">
              <div className="text-sm text-gray-600  mb-1">
                Total Revenue
              </div>
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
              <div className="text-sm text-gray-600  mb-1">
                Avg. Daily
              </div>
              <div className="text-3xl font-bold text-gray-900 ">
                ZMW {avgDailyRevenue.toLocaleString()}
              </div>
              <div className="text-xs text-green-600  mt-1">
                Consistent growth trend
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50   rounded-xl border border-purple-200 ">
              <div className="text-sm text-gray-600  mb-1">
                Peak Day
              </div>
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
                    <span className="text-gray-500 ">
                      Share:
                    </span>
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

        <div className="bg-white  rounded-2xl shadow-xl p-6 border border-gray-200 ">
          <h2 className="text-xl font-bold text-gray-900  mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-purple-600" />
            Revenue Insights
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50   p-5 rounded-xl border border-blue-200 ">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div className="text-lg font-bold text-gray-900 ">
                  Electricity Dominance
                </div>
              </div>
              <p className="text-sm text-gray-600 ">
                Highest revenue contributor at 45%, peaks during salary weeks
                (15th-20th). Urban areas show 60% higher usage.
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50   p-5 rounded-xl border border-green-200 ">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <div className="text-lg font-bold text-gray-900 ">
                  Mobile Money Growth
                </div>
              </div>
              <p className="text-sm text-gray-600 ">
                Steady 12.3% growth trend. Highest adoption in Lusaka (48%) and
                Copperbelt (35%). Weekend usage increased 20%.
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50   p-5 rounded-xl border border-purple-200 ">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center">
                  <Signal className="w-5 h-5 text-white" />
                </div>
                <div className="text-lg font-bold text-gray-900 ">
                  Network Performance
                </div>
              </div>
              <p className="text-sm text-gray-600 ">
                MTN leads with 48% revenue share, followed by Airtel at 42% and
                Zamtel at 10%. Strong urban penetration.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center text-gray-500  text-sm space-y-1 pb-4">
          <p>USSD Revenue Analytics Dashboard for Zambian Telecommunications</p>
          <p className="text-xs">
            Peak revenue observed during salary weeks • Electricity tokens
            dominate at 45% of total revenue
          </p>
        </div>
      </div>
    </div>
  );
};

export default USSDRevenueTrends;
