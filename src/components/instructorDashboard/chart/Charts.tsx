import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from 'recharts';

const dailyQuestions = [
  { day: 'Mon', count: 12, prev: 9 },
  { day: 'Tue', count: 18, prev: 14 },
  { day: 'Wed', count: 9, prev: 12 },
  { day: 'Thu', count: 22, prev: 16 },
  { day: 'Fri', count: 15, prev: 13 },
  { day: 'Sat', count: 7, prev: 6 },
  { day: 'Sun', count: 5, prev: 8 },
];

const statusBreakdown = [
  { name: 'Unread', value: 8 },
  { name: 'Pending', value: 12 },
  { name: 'Resolved', value: 54 },
];

const sourceBreakdown = [
  { name: 'WEB', value: 48 },
  { name: 'FB', value: 16 },
  { name: 'Email', value: 10 },
];

const avgResponseByReviewer = [
  { name: 'Dung', mins: 18 },
  { name: 'Huyen', mins: 26 },
  { name: 'Kong', mins: 40 },
  { name: 'Son', mins: 55 },
];

const topHelpers = [
  { name: 'Dung', replies: 42 },
  { name: 'Kong', replies: 37 },
  { name: 'Huyen', replies: 18 },
  { name: 'Hoa', replies: 12 },
];

const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6']; 

// ===== Small stat tiles =====
const StatTile = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <div className="rounded-lg border border-slate-200 bg-white p-4">
    <div className="text-xs text-slate-500">{label}</div>
    <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
    {sub ? <div className="mt-1 text-xs text-slate-500">{sub}</div> : null}
  </div>
);

// ===== Main component =====
export default function DashboardAnalytics() {
  const totalThisWeek = dailyQuestions.reduce((s, d) => s + d.count, 0);
  const totalPrevWeek = dailyQuestions.reduce((s, d) => s + d.prev, 0);
  const delta = totalThisWeek - totalPrevWeek;
  const deltaSign = delta >= 0 ? '+' : '';

  const resolved = statusBreakdown.find(x => x.name === 'Resolved')?.value ?? 0;
  const total = statusBreakdown.reduce((s, x) => s + x.value, 0);
  const resolveRate = total ? Math.round((resolved / total) * 100) : 0;

  return (
    <section className="px-4 pt-4">
      {/* Tiles */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile
          label="Q&A this week"
          value={String(totalThisWeek)}
          sub={`${deltaSign}${delta} vs last week`}
        />
        <StatTile
          label="Processing rate"
          value={`${resolveRate}%`}
          sub={`${resolved}/${total} resolved`}
        />
        <StatTile label="Most source" value="WEB" sub="48 questions" />
        <StatTile label="Fastest response" value="18 minutes" sub="by Dung" />
      </div>

      {/* Charts grid */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Line: Questions per day */}
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="mb-2 text-sm font-semibold text-slate-700">
            Number of questions per day
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyQuestions} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="prev"
                  name="Tuần trước"
                  stroke="#94a3b8"
                  dot={false}
                />
                <Line type="monotone" dataKey="count" name="Tuần này" stroke="#3b82f6" dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie: Status breakdown */}
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="mb-2 text-sm font-semibold text-slate-700">Processing status</div>
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={statusBreakdown}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  className="focus:outline-none"
                  innerRadius={55}
                >
                  {statusBreakdown.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar: Avg response time by reviewer */}
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="mb-2 text-sm font-semibold text-slate-700">Average response time</div>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart
                data={avgResponseByReviewer}
                margin={{ left: 8, right: 8, top: 8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis unit="m" />
                <Tooltip />
                <Bar dataKey="mins" name="Phút" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie: Sources */}
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="mb-2 text-sm font-semibold text-slate-700 ">Question source</div>
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={sourceBreakdown}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={90}
                  innerRadius={50}
                  className="focus:outline-none"
                >
                  {sourceBreakdown.map((_, i) => (
                    <Cell key={i} fill={COLORS[(i + 3) % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Horizontal bar: Top helpers */}
        <div className="rounded-lg border border-slate-200 bg-white p-3 lg:col-span-2">
          <div className="mb-2 text-sm font-semibold text-slate-700">Top response</div>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart
                data={topHelpers}
                layout="vertical"
                margin={{ left: 24, right: 16, top: 8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={80} />
                <Tooltip />
                <Bar
                  dataKey="replies"
                  name="Number of replies"
                  fill="#6366f1"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
