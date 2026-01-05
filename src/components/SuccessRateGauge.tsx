import React, { useState, useEffect } from 'react';
import { 
  Activity, Signal, Clock, Users, MapPin, TrendingUp, 
  TrendingDown, Zap, CheckCircle, XCircle, AlertTriangle,
  RefreshCw, Download, Settings
} from 'lucide-react';

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

const USSDGaugeDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<MetricData>({
    successRate: 94.2,
    successfulTxns: 23451,
    failedTxns: 1441,
    avgResponseTime: 1.2,
    activeSessions: 342,
    topProvince: 'Lusaka',
    trend: 2.3,
    peakHour: '10:00 AM'
  });

  const [isLive, setIsLive] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'24h' | '7d' | '30d'>('30d');

  const networks: NetworkStats[] = [
    { name: 'MTN Zambia', rate: 95.1, color: '#3B82F6', marketShare: 45.5, totalTransactions: 10658 },
    { name: 'Airtel Zambia', rate: 93.8, color: '#8B5CF6', marketShare: 42.0, totalTransactions: 9850 },
    { name: 'Zamtel', rate: 91.5, color: '#F59E0B', marketShare: 12.5, totalTransactions: 2943 }
  ];

  // Simulate live updates
  useEffect(() => {
    if (!isLive) return;
    
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        successRate: 92 + Math.random() * 4,
        activeSessions: 300 + Math.floor(Math.random() * 100),
        avgResponseTime: 1.0 + Math.random() * 0.5
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, [isLive]);

  const getStatusInfo = (rate: number) => {
    if (rate >= 95) return { 
      status: 'Excellent', 
      color: 'text-green-600', 
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      icon: CheckCircle 
    };
    if (rate >= 90) return { 
      status: 'Good', 
      color: 'text-blue-600', 
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      icon: Activity 
    };
    if (rate >= 85) return { 
      status: 'Fair', 
      color: 'text-yellow-600', 
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      icon: AlertTriangle 
    };
    return { 
      status: 'Poor', 
      color: 'text-red-600', 
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      icon: XCircle 
    };
  };

  const statusInfo = getStatusInfo(metrics.successRate);
  const StatusIcon = statusInfo.icon;

  // Calculate gauge rotation (0% = -135deg, 100% = 135deg)
  const gaugeRotation = -135 + (metrics.successRate / 100) * 270;
  
  // Calculate arc dash offset for circular progress
  const circumference = 2 * Math.PI * 45;
  const progressOffset = circumference - (metrics.successRate / 100) * circumference;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
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
              <p className="text-gray-600 dark:text-gray-400">
                Monitoring transaction success rates across Zambian networks
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <select 
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as '24h' | '7d' | '30d')}
                className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500 dark:text-white"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
              
              <button 
                onClick={() => setIsLive(!isLive)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                  isLive 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                {isLive ? 'Live' : 'Paused'}
              </button>
              
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
                <Download className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Gauge Card */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Success Rate Monitor
              </h2>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${statusInfo.bgColor} ${statusInfo.borderColor} border`}>
                <StatusIcon className={`w-5 h-5 ${statusInfo.color}`} />
                <span className={`font-bold ${statusInfo.color}`}>{statusInfo.status}</span>
              </div>
            </div>

            {/* Advanced Circular Gauge */}
            <div className="relative w-80 h-80 mx-auto mb-8">
              {/* SVG Circular Progress */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle 
                  cx="50" 
                  cy="50" 
                  r="45" 
                  fill="none" 
                  stroke="#E5E7EB" 
                  strokeWidth="8"
                />
                
                {/* Gradient definition */}
                <defs>
                  <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="50%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#8B5CF6" />
                  </linearGradient>
                </defs>
                
                {/* Progress arc with gradient */}
                <circle 
                  cx="50" 
                  cy="50" 
                  r="45" 
                  fill="none" 
                  stroke="url(#gaugeGradient)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={progressOffset}
                  className="transition-all duration-1000 ease-out"
                />
                
                {/* Tick marks */}
                {[0, 25, 50, 75, 100].map((tick) => {
                  const angle = -135 + (tick / 100) * 270;
                  const radians = (angle * Math.PI) / 180;
                  const x1 = 50 + 42 * Math.cos(radians);
                  const y1 = 50 + 42 * Math.sin(radians);
                  const x2 = 50 + 38 * Math.cos(radians);
                  const y2 = 50 + 38 * Math.sin(radians);
                  
                  return (
                    <line
                      key={tick}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#94A3B8"
                      strokeWidth="2"
                      transform="rotate(90 50 50)"
                    />
                  );
                })}
              </svg>

              {/* Center content */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl font-bold bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    {metrics.successRate.toFixed(1)}%
                  </div>
                  <div className="text-gray-500 dark:text-gray-400 font-medium">Success Rate</div>
                  <div className="flex items-center justify-center gap-2 mt-3">
                    {metrics.trend > 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                    <span className={`text-sm font-semibold ${metrics.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {metrics.trend > 0 ? '+' : ''}{metrics.trend}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Needle indicator */}
              <div 
                className="absolute top-1/2 left-1/2 w-32 h-1 origin-left transition-transform duration-1000 ease-out"
                style={{ transform: `translate(-50%, -50%) rotate(${gaugeRotation}deg)` }}
              >
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-500 to-orange-500 absolute right-0 -top-1 shadow-lg" />
                <div className="h-1 bg-gradient-to-r from-gray-800 to-red-500 rounded-full" />
              </div>

              {/* Center dot */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-gray-800 dark:bg-white shadow-lg" />
            </div>

            {/* Transaction Breakdown */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl border border-green-200 dark:border-green-800">
                <div className="flex items-start justify-between mb-2">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">
                    {((metrics.successfulTxns / (metrics.successfulTxns + metrics.failedTxns)) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="text-3xl font-bold text-green-700 dark:text-green-400 mb-1">
                  {metrics.successfulTxns.toLocaleString()}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                  Successful Transactions
                </div>
                <div className="mt-3 w-full bg-green-200 dark:bg-green-900/40 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(metrics.successfulTxns / (metrics.successfulTxns + metrics.failedTxns)) * 100}%` }}
                  />
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 p-6 rounded-xl border border-red-200 dark:border-red-800">
                <div className="flex items-start justify-between mb-2">
                  <XCircle className="w-6 h-6 text-red-600" />
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">
                    {((metrics.failedTxns / (metrics.successfulTxns + metrics.failedTxns)) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="text-3xl font-bold text-red-700 dark:text-red-400 mb-1">
                  {metrics.failedTxns.toLocaleString()}
                </div>
                <div className="text-sm text-red-600 dark:text-red-400 font-medium">
                  Failed Transactions
                </div>
                <div className="mt-3 w-full bg-red-200 dark:bg-red-900/40 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(metrics.failedTxns / (metrics.successfulTxns + metrics.failedTxns)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Side Stats */}
          <div className="space-y-6">
            {/* Quick Metrics */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Quick Metrics
              </h3>
              <div className="space-y-4">
                <div className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl">
                  <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center mr-3">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Response</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {metrics.avgResponseTime.toFixed(1)}s
                    </div>
                  </div>
                </div>

                <div className="flex items-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl">
                  <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center mr-3">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Sessions</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {metrics.activeSessions}
                    </div>
                  </div>
                </div>

                <div className="flex items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
                  <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center mr-3">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Top Province</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {metrics.topProvince}
                    </div>
                  </div>
                </div>

                <div className="flex items-center p-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl">
                  <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center mr-3">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Peak Hour</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {metrics.peakHour}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Network Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Network Provider Performance
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {networks.map((network, index) => (
              <div 
                key={index}
                className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: network.color }}
                    />
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      {network.name}
                    </h3>
                  </div>
                  <Signal className="w-5 h-5 text-gray-400" />
                </div>

                <div className="mb-4">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      {network.rate}%
                    </span>
                    <span className="text-sm text-gray-500">success rate</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                    <div 
                      className="h-3 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${network.rate}%`,
                        backgroundColor: network.color
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Market Share</div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {network.marketShare}%
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Transactions</div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {network.totalTransactions.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 dark:text-gray-400 text-sm space-y-1 pb-4">
          <p>Real-time USSD analytics for Zambian telecommunications networks</p>
          <p className="text-xs">Data updates every 3 seconds when live mode is enabled</p>
        </div>
      </div>
    </div>
  );
};

export default USSDGaugeDashboard;