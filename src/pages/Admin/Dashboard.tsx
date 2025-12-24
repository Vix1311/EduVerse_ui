import Sidebar from "../../components/Admin/Sidebar";
import Header from "../../components/Admin/Header";
import OverviewStats from "../../components/Admin/OverviewStats";
import CourseByTabs from "../../components/Admin/CoursesByTab";
import CourseBarChart from "../../components/Admin/chart/CourseBarChart";
import CourseDonutChart from "../../components/Admin/chart/CourseDonutChart";
import SalesLineChart from "../../components/Admin/chart/SalesLineChart"; 
import OrderList from "../../components/Admin/OrderList"; 
import CommentBarChart from "../../components/Admin/chart/CommentBarChart"; 
import DashboardHighlight from "../../components/Admin/DashboardHighlight";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from "chart.js";
import AgeDistributionChart from "../../components/Admin/chart/AgeDistributionChart";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const Dashboard = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Header />
        <div className="p-6 space-y-6">
          <OverviewStats />
          <div className="mt-6">
            <SalesLineChart /> 
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            <div className="md:col-span-2">
              <CourseBarChart />
            </div>
            <div className="md:col-span-1">
              <CourseDonutChart />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-stretch">
            <div className="md:col-span-1">
              <OrderList />
            </div>
            <div className="md:col-span-2">
              <CommentBarChart />
            </div>
            <div className="md:col-span-1">
              <AgeDistributionChart />
            </div>
          </div>

          <CourseByTabs />
          <DashboardHighlight />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
