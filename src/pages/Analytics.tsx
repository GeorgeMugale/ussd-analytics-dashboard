import Dashboard, { DashboardItem } from "../components/DashboardLayout";
import USSDGaugeDashboard from "../components/SuccessRateGauge";
import TransactionVolumeChart from "../components/TransactionVolumeChart";

const AnalyticsPage = () => {
  return (
    <>
      <Dashboard title="Analytics" defaultActiveId="ussd-gauge">
        <DashboardItem
          icon={<></>}
          id="transaction-volume"
          title="Transaction Volume"
          description="shows transaction volume"
        >
          <TransactionVolumeChart />
        </DashboardItem>
        <DashboardItem
          icon={<></>}
          id="ussd-gauge"
          title="Success Rate Gauge"
          description="shows Success Rate Gauge"
        >
          <USSDGaugeDashboard />
        </DashboardItem>
      </Dashboard>
    </>
  );
};

export default AnalyticsPage;
