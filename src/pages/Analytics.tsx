import {  useState } from "react";
import Dashboard, { DashboardItem } from "../components/DashboardLayout";
import USSDPeakHoursHeatmap from "../components/PeakHoursHeatmap";
import USSDRevenueTrends from "../components/RevenueTrends";
import SuccessRageGauge from "../components/SuccessRateGauge";
import TransactionVolumeChart from "../components/TransactionVolumeChart";
import USSDUserDemographics from "../components/UserDemographics";
import { BarChart3, Gauge, TrendingUp, Clock, Users } from "lucide-react";

const tabs = [
 "transaction-volume",
"success-rate",
 "revenue-trends",
  "peak-hours",
 "user-demographics",
];

const getInitialTab = () => {
  const hash = window.location.hash.replace("#", "");
  return tabs.includes(hash) ? hash : "transaction-volume";
};

const AnalyticsPage = () => {
  const [activeId, setActiveId] = useState(getInitialTab);

  return (
    <>
      <Dashboard
        title="Analytics"
        defaultActiveId={activeId}
        onSetActive={(id: string) => {
          window.location.hash = id;
        }}
      >
        <DashboardItem
          icon={<BarChart3 className="w-5 h-5" />}
          title="Transaction Volume"
          id={"transaction-volume"}
        >
          <TransactionVolumeChart />
        </DashboardItem>
        <DashboardItem
          icon={<Gauge className="w-5 h-5" />}
          title="Success Rates"
          id={"success-rate"}
        >
          <SuccessRageGauge />
        </DashboardItem>
        <DashboardItem
          icon={<TrendingUp className="w-5 h-5" />}
          title="Revenue Trends"
          id={"revenue-trends"}
        >
          <USSDRevenueTrends />
        </DashboardItem>
        <DashboardItem
          icon={<Clock className="w-5 h-5" />}
          title="Peak Hours"
          id={"peak-hours"}
        >
          <USSDPeakHoursHeatmap />
        </DashboardItem>
        <DashboardItem
          icon={<Users className="w-5 h-5" />}
          title="User Demographics"
          id={"user-demographics"}
        >
          <USSDUserDemographics />
        </DashboardItem>
      </Dashboard>
    </>
  );
};

export default AnalyticsPage;
