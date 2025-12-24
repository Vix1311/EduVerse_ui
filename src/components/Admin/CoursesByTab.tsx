import { JSX, useEffect, useState } from 'react';
import { Flame, Star, Crown } from 'lucide-react';
import axios from 'axios';

const iconMap: Record<string, JSX.Element> = {
  flame: <Flame className="w-7 h-7" />,
  star: <Star className="w-7 h-7" />,
};

type Tab = {
  key: string;
  type: string;
  label: string;
  icon: string;
};

type Course = {
  title: string;
  trainer: string;
  published: string;
  enrolled: string;
  price: string;
};

const CourseByTabs = () => {
  const [tabData, setTabData] = useState<Record<string, Course[]>>({});
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTab, setActiveTab] = useState<string>('most-popular-paid');

  useEffect(() => {
    axios('/data/AdminData/CourseByTabsData/CourseByTabsTabData.json').then(res =>
      setTabData(res.data),
    );

    axios('/data/AdminData/CourseByTabsData/CourseByTabsTabsData.json').then(res =>
      setTabs(res.data),
    );
  }, []);

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      {/* Tabs */}
      <div className="flex gap-10 border-b border-gray-200 mb-6">
        {tabs.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex flex-col items-center px-4 pb-2 transition ${
                isActive ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'
              }`}
            >
              {isActive && <Crown className="w-4 h-4 text-orange-400 absolute -top-3" />}
              <div className="flex items-center gap-2">
                <span className={`${isActive ? 'text-blue-600' : 'text-gray-300'}`}>
                  {iconMap[tab.icon]}
                </span>
                <span className="text-base font-semibold">{tab.label}</span>
              </div>
              <span className="text-sm mt-1 text-gray-500">{tab.type}</span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-2 font-medium">Course Title</th>
              <th className="px-4 py-2 font-medium">Trainer</th>
              <th className="px-4 py-2 font-medium">Published on</th>
              <th className="px-4 py-2 font-medium">Enrolled</th>
              <th className="px-4 py-2 font-medium">Price</th>
              <th className="px-4 py-2 text-right font-medium">•••</th>
            </tr>
          </thead>
          <tbody>
            {tabData[activeTab]?.map((course, idx) => (
              <tr key={idx} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 text-blue-600">{course.title}</td>
                <td className="px-4 py-3">{course.trainer}</td>
                <td className="px-4 py-3">{course.published}</td>
                <td className="px-4 py-3">{course.enrolled}</td>
                <td className="px-4 py-3">{course.price}</td>
                <td className="px-4 py-3 text-right text-gray-400 text-xl">•••</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center mt-4 text-sm">
        <select
          title="date"
          className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-600"
        >
          <option>Last 7 days</option>
          <option>Last 30 days</option>
          <option>All time</option>
        </select>
        <button className="text-blue-600 hover:underline">All Courses →</button>
      </div>
    </div>
  );
};

export default CourseByTabs;
