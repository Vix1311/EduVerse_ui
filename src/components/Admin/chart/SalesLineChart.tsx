import axios from 'axios';
import { useEffect, useState } from 'react';
import { TooltipProps } from 'recharts';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
} from 'recharts';

// Tooltip custom
const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border px-3 py-2 rounded shadow text-sm text-gray-700">
        <p className="font-medium">
          {payload[0].payload.day || payload[0].payload.month || payload[0].payload.year}
        </p>
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

const SalesLineChart = () => {
  const [range, setRange] = useState<'week' | 'month' | 'year'>('month');
  const [data, setData] = useState<{ [key in 'week' | 'month' | 'year']?: any[] }>({});

  useEffect(() => {
    axios.get('/data/AdminData/ChartData/SalesLineChartData.json').then(res => setData(res.data));
  }, []);
  return (
    <div className="bg-white p-4 rounded-xl shadow-md h-full flex flex-col">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-md font-semibold text-gray-800">Revenue</h3>
        <select
          title="time"
          value={range}
          onChange={e => setRange(e.target.value as 'week' | 'month' | 'year')}
          className="text-sm text-gray-600 border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="week">Last Week</option>
          <option value="month">Last Month</option>
          <option value="year">Last Year</option>
        </select>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data[range]}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={range === 'week' ? 'day' : range === 'month' ? 'month' : 'year'} />
          <YAxis />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="sales"
            stroke="#2563eb"
            activeDot={{ r: 8 }}
            strokeWidth={2}
          />
          <Area type="monotone" dataKey="sales" stroke="#2563eb" fill="#2563eb" fillOpacity={0.1} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SalesLineChart;
