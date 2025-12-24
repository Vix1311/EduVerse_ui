import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  listCourses,
  updateCourseStatus,
  softDeleteCourse,
  restoreCourse,
} from '@/redux/slices/courseForm.slice';
import { AiOutlineReload } from 'react-icons/ai';
import { AppDispatch, RootState } from '@/core/store/store';
import { Link } from 'react-router-dom';

const Badge: React.FC<{
  color?: 'gray' | 'green' | 'red' | 'yellow';
  children: React.ReactNode;
}> = ({ color = 'gray', children }) => {
  const colorMap: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-800',
    green: 'bg-emerald-100 text-emerald-700',
    red: 'bg-rose-100 text-rose-700',
    yellow: 'bg-amber-100 text-amber-700',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorMap[color]}`}
    >
      {children}
    </span>
  );
};

const StatusToggle: React.FC<{
  value: boolean;
  disabled?: boolean;
  onChange?: (next: boolean) => void;
}> = ({ value, disabled, onChange }) => {
  return (
    <button
      type="button"
      aria-pressed={value}
      aria-label={value ? 'Enabled' : 'Disabled'}
      onClick={() => {
        if (disabled) return;
        onChange && onChange(!value);
      }}
      className={`w-12 h-6 flex items-center rounded-full p-1 transition-all
        ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
        ${value ? 'bg-blue-500' : 'bg-gray-300'}`}
    >
      <div
        className={`w-5 h-5 bg-white rounded-full shadow-md transform duration-300
          ${value ? 'translate-x-6' : ''}`}
      />
    </button>
  );
};

export type AdminCourse = {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  categoryId?: number;
  categoryName?: string;
  price?: number;
  isFree?: boolean;
  isFeatured?: boolean;
  isPreorder?: boolean;
  previewDescription?: string;
  status: 'pending' | 'approved' | 'blacklisted';
  updatedAt?: number;
};

const PAGE_SIZE = 10;

const AdminCoursesPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    courses: rawCourses,
    loading,
    error,
  } = useSelector((state: RootState) => state.courseForm);

  // Basic UI state
  const [searchTitle, setSearchTitle] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'blacklisted'>(
    'all',
  );
  const [sortField, setSortField] = useState<'title' | 'categoryName' | 'price' | 'updatedAt'>(
    'updatedAt',
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [selectedCourse, setSelectedCourse] = useState<AdminCourse | null>(null);

  useEffect(() => {
    dispatch(listCourses());
  }, [dispatch]);

  // Map raw API items to AdminCourse
  const courses: AdminCourse[] = useMemo(() => {
    if (!Array.isArray(rawCourses)) return [];

    return rawCourses.map((c: any) => {
      const status = (String(c.status || '').toLowerCase() || 'pending') as
        | 'pending'
        | 'approved'
        | 'blacklisted';

      return {
        id: String(c.id ?? c.course_id ?? ''),
        title: c.title ?? c.name ?? 'Untitled',
        description: c.description ?? '',
        thumbnail: c.thumbnail ?? c.imageUrl ?? '',
        categoryId: c.categoryId ?? c.category_id,
        categoryName: c.categoryName ?? c.category_name ?? '',
        price: c.price != null ? Number(c.price) : undefined,
        isFree: !!c.isFree,
        isFeatured: !!c.isFeatured,
        isPreorder: !!c.isPreorder,
        previewDescription: c.previewDescription ?? c.shortDescription ?? '',
        status,
        updatedAt: c.updatedAt ? new Date(c.updatedAt).getTime() : undefined,
      };
    });
  }, [rawCourses]);

  useEffect(() => {
    if (!selectedCourse) return;
    const latest = courses.find(c => c.id === selectedCourse.id);
    if (latest) {
      setSelectedCourse(latest);
    } else {
      setSelectedCourse(null);
    }
  }, [courses, selectedCourse]);

  // Filtering
  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      const matchTitle = c.title.toLowerCase().includes(searchTitle.toLowerCase());
      const matchStatus = statusFilter === 'all' ? true : c.status === statusFilter;
      return matchTitle && matchStatus;
    });
  }, [courses, searchTitle, statusFilter]);

  // Sorting
  const sortedCourses = useMemo(() => {
    const sorted = [...filteredCourses];
    sorted.sort((a, b) => {
      const dir = sortOrder === 'asc' ? 1 : -1;

      if (sortField === 'price') {
        const av = a.price ?? 0;
        const bv = b.price ?? 0;
        return (av - bv) * dir;
      }

      if (sortField === 'updatedAt') {
        const av = a.updatedAt ?? 0;
        const bv = b.updatedAt ?? 0;
        return (av - bv) * dir;
      }

      const av = String(a[sortField] ?? '').toLowerCase();
      const bv = String(b[sortField] ?? '').toLowerCase();

      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
    return sorted;
  }, [filteredCourses, sortField, sortOrder]);

  // Pagination
  const total = sortedCourses.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = sortedCourses.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleToggleStatus = async (course: AdminCourse) => {
    const next = course.status === 'approved' ? 'pending' : 'approved';
    await dispatch(updateCourseStatus({ id: Number(course.id), status: next }) as any);
  };

  const handleSoftDelete = async (course: AdminCourse) => {
    if (!window.confirm(`Xoá mềm khoá học "${course.title}"?`)) return;
    await dispatch(softDeleteCourse({ id: Number(course.id) }) as any);
    dispatch(listCourses());
    setSelectedCourse(prev => (prev && prev.id === course.id ? null : prev));
  };

  const handleRestore = async (course: AdminCourse) => {
    await dispatch(restoreCourse({ id: Number(course.id) }) as any);
  };

  const handleBlacklist = async (course: AdminCourse) => {
    if (!window.confirm(`Đưa khoá học "${course.title}" vào blacklist?`)) return;
    await dispatch(updateCourseStatus({ id: Number(course.id), status: 'blacklisted' }) as any);
  };

  const formatDateTime = (ts?: number) => {
    if (!ts) return '-';
    const d = new Date(ts);
    return d.toLocaleString();
  };

  const getStatusBadge = (status: AdminCourse['status']) => {
    if (status === 'approved') return <Badge color="green">Approved</Badge>;
    if (status === 'pending') return <Badge color="yellow">Pending</Badge>;
    return <Badge color="red">Blacklisted</Badge>;
  };

  return (
    <div>
      {/* Header */}
      <header className="flex items-center justify-between border-b bg-white px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Course Management</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="bg-white hover:bg-gray-400 text-black rounded w-10 h-10 flex justify-center items-center border border-gray-300"
            onClick={() => dispatch(listCourses())}
          >
            <AiOutlineReload className={`text-xl ${loading ? 'animate-spin' : ''}`} />
          </button>

          <Link
            type="button"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            to="/add-course"
          >
            + New Course
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex flex-1 gap-4 overflow-x-hidden overflow-y-auto py-4">
        {/* Left: table */}
        <section className="flex-1 rounded-2xl bg-white shadow-sm min-h-[437px]">
          {/* Table header filters */}
          <div className="border-b p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span className="font-medium text-slate-700">Total:</span>
                <span>{total} courses</span>
              </div>
              {error && <span className="text-sm text-rose-600">{error}</span>}
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  Search by name
                </label>
                <input
                  type="text"
                  value={searchTitle}
                  onChange={e => {
                    setSearchTitle(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Nhập tên khoá học..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Status</label>
                <select
                  value={statusFilter}
                  onChange={e => {
                    setStatusFilter(e.target.value as any);
                    setPage(1);
                  }}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="blacklisted">Blacklisted</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Course</th>
                  <th
                    className="cursor-pointer px-4 py-3"
                    onClick={() => handleSort('categoryName')}
                  >
                    <span className="inline-flex items-center gap-1">
                      Category
                      {sortField === 'categoryName' && (
                        <span>{sortOrder === 'asc' ? '▲' : '▼'}</span>
                      )}
                    </span>
                  </th>
                  <th
                    className="cursor-pointer px-4 py-3 text-right"
                    onClick={() => handleSort('price')}
                  >
                    <span className="inline-flex items-center gap-1">
                      Price
                      {sortField === 'price' && <span>{sortOrder === 'asc' ? '▲' : '▼'}</span>}
                    </span>
                  </th>
                  <th className="px-4 py-3">Status</th>
                  <th className="cursor-pointer px-4 py-3" onClick={() => handleSort('updatedAt')}>
                    <span className="inline-flex items-center gap-1">
                      Updated
                      {sortField === 'updatedAt' && <span>{sortOrder === 'asc' ? '▲' : '▼'}</span>}
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                      Loading course list...
                    </td>
                  </tr>
                )}

                {!loading && pageItems.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                      No courses found.
                    </td>
                  </tr>
                )}

                {!loading &&
                  pageItems.map(course => (
                    <tr
                      key={course.id}
                      className="border-t border-slate-100 hover:bg-slate-50/60 cursor-pointer"
                      onClick={() => setSelectedCourse(course)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {course.thumbnail ? (
                            <img
                              src={course.thumbnail}
                              alt={course.title}
                              className="h-10 w-10 flex-shrink-0 rounded-md object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-slate-100 text-xs font-medium text-slate-500">
                              No img
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-slate-800 line-clamp-1">
                              {course.title}
                            </div>
                            <div className="mt-0.5 text-xs text-slate-500 line-clamp-1">
                              {course.previewDescription || course.description || 'No description'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-sm text-slate-600">
                        {course.categoryName || '-'}
                      </td>

                      <td className="px-4 py-3 text-right text-sm">
                        {course.isFree ? (
                          <Badge color="green">Free</Badge>
                        ) : course.price != null ? (
                          <span className="font-medium text-slate-800">
                            {course.price.toLocaleString()} đ
                          </span>
                        ) : (
                          <span className="text-slate-400">N/A</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          <StatusToggle
                            value={course.status === 'approved'}
                            disabled={course.status === 'blacklisted'}
                            onChange={() => handleToggleStatus(course)}
                          />
                        </div>
                      </td>

                      <td className="px-4 py-3 text-sm text-slate-600">
                        {formatDateTime(course.updatedAt)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-slate-500">
            <div>
              Page <span className="font-medium">{currentPage}</span> of{' '}
              <span className="font-medium">{totalPages}</span>
            </div>
            <div className="inline-flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="rounded-lg border border-slate-200 px-2 py-1 text-xs disabled:opacity-40"
              >
                Prev
              </button>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-slate-200 px-2 py-1 text-xs disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </section>

        {/* Right: detail panel */}
        <section className="hidden w-96 flex-shrink-0 flex-col overflow-hidden rounded-2xl bg-white shadow-sm lg:flex">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-800">Course Detail</h2>
            <p className="text-xs text-slate-500">
              Select a course from the table on the left to view details and perform actions.
            </p>
          </div>

          {selectedCourse ? (
            <div className="flex-1 space-y-4 overflow-y-auto p-4 text-sm">
              <div className="flex items-start gap-3">
                {selectedCourse.thumbnail ? (
                  <img
                    src={selectedCourse.thumbnail}
                    alt={selectedCourse.title}
                    className="h-16 w-16 flex-shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-500">
                    No img
                  </div>
                )}
                <div>
                  <h3 className="text-base font-semibold text-slate-900">{selectedCourse.title}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {selectedCourse.categoryName && (
                      <Badge color="gray">{selectedCourse.categoryName}</Badge>
                    )}
                    {selectedCourse.isFeatured && <Badge color="yellow">Featured</Badge>}
                    {selectedCourse.isPreorder && <Badge color="yellow">Pre-order</Badge>}
                    {selectedCourse.isFree && <Badge color="green">Free</Badge>}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Description
                </h4>
                <p className="whitespace-pre-wrap text-sm text-slate-700">
                  {selectedCourse.description || 'No description'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <div className="font-medium text-slate-500">Status</div>
                  <div>{getStatusBadge(selectedCourse.status)}</div>
                </div>
                <div className="space-y-1">
                  <div className="font-medium text-slate-500">Updated at</div>
                  <div className="text-slate-700">{formatDateTime(selectedCourse.updatedAt)}</div>
                </div>
                <div className="space-y-1">
                  <div className="font-medium text-slate-500">Price</div>
                  <div className="text-slate-700">
                    {selectedCourse.isFree
                      ? 'Free'
                      : selectedCourse.price != null
                        ? `${selectedCourse.price.toLocaleString()} đ`
                        : 'N/A'}
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50"
                  onClick={() => alert('Đi tới Course Form + Module Builder cho course này')}
                >
                  Open builder
                </button>

                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 font-medium text-emerald-700 hover:bg-emerald-100"
                  onClick={() => handleToggleStatus(selectedCourse)}
                >
                  Toggle status
                </button>

                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 font-medium text-rose-700 hover:bg-rose-100"
                  onClick={() => handleSoftDelete(selectedCourse)}
                >
                  Soft delete
                </button>

                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-100"
                  onClick={() => handleRestore(selectedCourse)}
                >
                  Restore
                </button>

                <button
                  type="button"
                  className="col-span-2 inline-flex items-center justify-center rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 font-medium text-rose-700 hover:bg-rose-100"
                  onClick={() => handleBlacklist(selectedCourse)}
                >
                  Blacklist
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center p-4 text-xs text-slate-400">
              No course selected.
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default AdminCoursesPage;
