import axios from 'axios';
import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = [
  '#3b82f6',
  '#0ea5e9',
  '#f97316',
  '#22c55e',
  '#8b5cf6',
  '#ec4899',
  '#f43f5e',
  '#a855f7',
];

const CourseDonutChart = () => {
  const [courseCategoryData, setData] = useState<any[]>([]);

  useEffect(() => {
    axios.get('/data/AdminData/ChartData/CourseDonutChartData.json').then(res => setData(res.data));
  }, []);
  const total = courseCategoryData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg h-full flex flex-col items-center justify-between gap-8">
      <div className="w-full text-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Course Catalog</h2>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between w-full gap-8">
        {/* Legend */}
        <div className="text-sm text-gray-600 space-y-3 max-w-xs">
          {courseCategoryData.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <span className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
              <span className="text-base font-medium">{item.name}</span>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="w-full md:w-72 h-72 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={courseCategoryData}
                dataKey="value"
                nameKey="name"
                innerRadius="50%"
                outerRadius="85%"
                startAngle={90}
                endAngle={-270}
                stroke="none"
                isAnimationActive
              >
                {courseCategoryData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>

              <Tooltip
                formatter={(value: number, name: string) => [`${value} Courses`, name]}
                contentStyle={{
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  backgroundColor: '#FFFFFF',
                  color: '#000',
                  borderRadius: '8px',
                  padding: '6px 12px',
                }}
              />

              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-xl font-semibold text-gray-800"
              >
                {total} Course
              </text>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default CourseDonutChart;
