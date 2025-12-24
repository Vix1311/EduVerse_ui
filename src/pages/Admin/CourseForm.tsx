import Header from "../../components/Admin/Header";
import Sidebar from "../../components/Admin/Sidebar";

const CourseForm = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Header />
        <div className="p-6 max-w-2xl mx-auto bg-white shadow rounded-xl">
          <h2 className="text-xl font-semibold mb-4">Add/Edit Courses</h2>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Course name</label>
              <input title="name" className="w-full border rounded px-3 py-2" type="text" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Categories</label>
              <input title="categories" className="w-full border rounded px-3 py-2" type="text" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Price</label>
              <input title="number" className="w-full border rounded px-3 py-2" type="number" />
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Save
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CourseForm;