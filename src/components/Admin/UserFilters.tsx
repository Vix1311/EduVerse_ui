import axios from 'axios';
import { useEffect, useState } from 'react';

interface Props {
  selectedRole: string;
  onSelectRole: (role: string) => void;
  value?: string;
  label?: string;
}

type RoleOption = { value: string; label: string };

const normalizeRole = (value: string) => {
  if (!value) return '';
  return value.toLowerCase();
};

export default function UserFilters({ selectedRole, onSelectRole, label }: Props) {
  const [roles, setRoles] = useState<RoleOption[]>([]);

  useEffect(() => {
    axios('/data/AdminData/UserFiltersData/UserFiltersData.json').then(res => {
      setRoles(res.data as RoleOption[]);
    });
  }, []);

  return (
    <div className="w-full mb-3">
      <div className="flex w-full border-b overflow-x-auto">
        {roles.map(role => {
          const normalized = normalizeRole(role.value);
          const isActive = selectedRole === normalized;

          return (
            <button
              key={role.value}
              onClick={() => onSelectRole(normalized)}
              className={`flex-1 text-center py-2 px-2 text-sm font-medium border-b-2 transition-colors ${
                isActive
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-600 border-transparent hover:text-blue-500'
              }`}
            >
              {role.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
