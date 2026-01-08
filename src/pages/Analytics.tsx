import Dashboard, { DashboardItem } from "../components/DashboardLayout";
import USSDRevenueTrends from "../components/RevenueTrends";
import USSDGauge from "../components/SuccessRateGauge";
import TransactionVolumeChart from "../components/TransactionVolumeChart";

const AnalyticsPage = () => {
  return (
    <>
      <Dashboard title="Analytics" defaultActiveId="ussd-revenue">
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
          <USSDGauge />
        </DashboardItem>

        <DashboardItem
          icon={<></>}
          id="ussd-revenue"
          title="USSD Revenue Trends"
          description="shows USSD Revenue Trends"
        >
          <USSDRevenueTrends />
        </DashboardItem>
      </Dashboard>
    </>
  );
};

export default AnalyticsPage;
