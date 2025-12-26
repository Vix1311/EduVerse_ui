import axios from 'axios';
import { useEffect, useState } from 'react';
import { FaUserGraduate, FaChalkboardTeacher, FaBookOpen, FaDollarSign } from 'react-icons/fa';

const iconMap = {
  FaUserGraduate,
  FaChalkboardTeacher,
  FaBookOpen,
  FaDollarSign,
};
interface StatItem {
  icon: keyof typeof iconMap;
  border: string;
  value: string;
  label: string;
  change: string;
}

const OverviewStats = () => {
  const [stats, setStats] = useState<StatItem[]>([]);
  useEffect(() => {
    axios(' https://eduverseapi-production.up.railway.app/data/overviewStats.json').then(res => {
      setStats(res.data);
    });
  }, []);

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-x divide-gray-300">
        {stats.map((item, idx) => {
          const Icon = iconMap[item.icon];
          return (
            <div key={idx} className="flex flex-col items-center px-4">
              <div
                className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${item.border} mb-3`}
              >
                {Icon && <Icon className="h-6 w-6" />}
              </div>
              <h3 className="text-xl font-semibold text-gray-700">{item.value}</h3>
              <p className="text-sm text-gray-500">{item.label}</p>
              <p className="text-xs text-gray-400 mt-1">{item.change}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OverviewStats;
