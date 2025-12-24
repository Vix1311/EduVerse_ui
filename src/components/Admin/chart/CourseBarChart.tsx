import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  TooltipProps,
} from 'recharts';
import { useEffect, useState } from 'react';
import axios from 'axios';

const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border px-3 py-2 rounded shadow text-sm text-gray-700">
        <p className="font-medium">{payload[0].payload.day}</p>
        {payload.map((item, idx) => (
          <p key={idx} style={{ color: (item as any).fill }}>
            {item.name}: {item.value?.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const CourseBarChart = () => {
  const [range, setRange] = useState<'7d' | '30d' | '12m'>('7d');

  const [mockData, setData] = useState<{ [key in '7d' | '30d' | '12m']?: any[] }>({});

  useEffect(() => {
    axios
      .get('/data/AdminData/ChartData/CourseBarChartData.json')
      .then(res => setData(res.data));
  }, []);
  return (
    <div className="bg-white p-4 rounded-xl shadow-md h-full flex flex-col">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-md font-semibold text-gray-800">Course Enrollment</h3>
        <select
          title="time"
          value={range}
          onChange={e => setRange(e.target.value as '7d' | '30d' | '12m')}
          className="text-sm text-gray-600 border rounded px-2 py-1"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="12m">Last 12 months</option>
        </select>
      </div>

      <div className="text-sm text-gray-500 flex gap-4 mb-1 px-2">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-sky-300"></span> Free Course
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-600"></span> Paid Course
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-orange-300"></span> On sale Course
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={mockData[range]} barCategoryGap={10}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis tickFormatter={v => `${v / 1000}k`} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="free" fill="#38bdf8" name="Free Course" radius={[4, 4, 0, 0]} />
          <Bar dataKey="paid" fill="#2563eb" name="Paid Course" radius={[4, 4, 0, 0]} />
          <Bar dataKey="sale" fill="#fbbf24" name="On sale Course" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CourseBarChart;
