import Dashboard, { DashboardItem } from "../components/DashboardLayout";
import TransactionVolumeChart from "../components/TransactionVolumeChart";

const AnalyticsPage = () => {
  return (
    <>
      <Dashboard title="Analytics" defaultActiveId="tv">
        <DashboardItem
          icon={<></>}
          id="tv"
          title="Transaction Volume"
          description="shows transaction volume"
        >
          <TransactionVolumeChart />
        </DashboardItem>
      </Dashboard>
    </>
  );
};

export default AnalyticsPage;
