import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Label } from 'recharts';
import { useEffect, useState } from 'react';
import axios from 'axios';

const COLORS = ['#38bdf8', '#2563eb', '#fbbf24', '#10b981'];

const AgeDistributionChart = () => {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    axios
      .get('/data/AdminData/ChartData/AgeDistributionChartData.json')
      .then(res => setData(res.data));
  }, []);
  const totalStudents = data.reduce((acc, item) => acc + item.value, 0);

  return (
    <div className="w-full h-full flex justify-center items-center p-6 bg-white shadow-lg rounded-lg">
      <div className="w-full h-full max-w-3xl">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">
          Student Ratio by Age Group
        </h2>

        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius="80%"
              innerRadius="60%"
              fill="#8884d8"
              label
            >
              {data.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
              {/* Thêm tổng số học viên ở giữa biểu đồ tròn */}
              <Label
                value={totalStudents}
                position="center"
                className="text-xl font-bold text-gray-800"
              />
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>

        {/* Hiển thị tổng số học viên bên ngoài */}
        <div className="text-center mt-4 text-xl font-semibold text-gray-800">
          Total number of students: {totalStudents} Students
        </div>

        {/* Danh sách các nhóm độ tuổi */}
        <div className="flex justify-between text-sm text-gray-600 mt-4">
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-sky-300 mr-2"></span> 18-25 years old
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-blue-600 mr-2"></span> 26-35 years old
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-orange-300 mr-2"></span> 36-45 years old
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span> 46+ years old
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgeDistributionChart;
