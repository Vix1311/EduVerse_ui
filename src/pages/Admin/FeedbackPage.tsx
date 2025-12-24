import FeedbackPage from "@/components/Admin/Feedback";
import Header from "../../components/Admin/Header";
import Sidebar from "../../components/Admin/Sidebar";


const Feedback = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Header />
        <div className="px-2">
          <FeedbackPage />
        </div>
      </main>
    </div>
  );
};

export default Feedback;