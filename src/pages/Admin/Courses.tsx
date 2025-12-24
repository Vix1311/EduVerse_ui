import CourseTable from "../../components/Admin/CourseTable";
import Header from "../../components/Admin/Header";
import Sidebar from "../../components/Admin/Sidebar";


const Courses = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Header />
        <div className="p-6">
          <CourseTable />
        </div>
      </main>
    </div>
  );
};

export default Courses;