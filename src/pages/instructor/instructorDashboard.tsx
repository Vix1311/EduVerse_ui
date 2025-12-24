import DashboardAnalytics from '@/components/instructorDashboard/chart/Charts';
import { FaQuestionCircle, FaBook } from 'react-icons/fa';
import { NavLink, Outlet } from 'react-router-dom';

function SideItem({
  to,
  label,
  icon: Icon,
}: {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium',
          isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100',
        ].join(' ')
      }
      aria-label={label}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </NavLink>
  );
}

export default function InstructorDashboard() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-64 shrink-0 border-r border-slate-200 bg-white">
        <div className="px-4 py-4 border-b border-slate-200">
          <div className="text-lg font-semibold text-slate-900">Instructor</div>
          <div className="text-xs text-slate-500">Dashboard</div>
        </div>

        <nav className="p-2">
          <SideItem to="/QnA" label="Q&A" icon={FaQuestionCircle} />
          <SideItem to="/add-course" label="Add Course" icon={FaBook} />
          <SideItem to="/add-quiz" label="Add Quiz" icon={FaBook} />
        </nav>
      </aside>
      
      <main className="flex-1 min-w-0">
        <DashboardAnalytics />
        <Outlet />
      </main>
    </div>
  );
}
