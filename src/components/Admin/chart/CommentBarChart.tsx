import axios from 'axios';
import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from 'recharts';

const CommentBarChart = () => {
  const [timePeriod, setTimePeriod] = React.useState<'year' | 'month' | 'week'>('week');
  type ChartData = {
    year: any[];
    month: any[];
    week: any[];
  };
  const [data, setData] = useState<ChartData>({ year: [], month: [], week: [] });

  useEffect(() => {
    axios.get('/data/AdminData/ChartData/CommentBarChartData.json').then(res => setData(res.data));
  }, []);
  return (
    <div className="w-full p-6 h-full bg-white shadow-lg rounded-xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Number of Positive and Negative Comments
        </h2>
        <select
          title="time"
          value={timePeriod}
          onChange={e => setTimePeriod(e.target.value as 'year' | 'month' | 'week')}
          className="px-3 py-2 border rounded-md text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="year">Year</option>
          <option value="month">Month</option>
          <option value="week">Week</option>
        </select>
      </div>

      <ResponsiveContainer width="100%" height={500}>
        <BarChart data={data[timePeriod]} barCategoryGap={20}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: '#f1f5f9' }} />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Bar dataKey="positive" fill="#4caf50" name="Positive comments" radius={[6, 6, 0, 0]}>
            <LabelList dataKey="positive" position="top" formatter={(v: any) => v} />
          </Bar>
          <Bar dataKey="negative" fill="#f44336" name="Negative comments" radius={[6, 6, 0, 0]}>
            <LabelList dataKey="negative" position="top" formatter={(v: any) => v} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CommentBarChart;
