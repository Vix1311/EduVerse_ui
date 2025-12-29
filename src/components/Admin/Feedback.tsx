import { useEffect, useState } from 'react';
import { FaChevronLeft, FaChevronRight, FaTrash } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';

import type { AppDispatch, RootState } from '@/core/store/store';
import { deleteFeedback, FeedbackType, fetchAdminFeedbacks } from '@/redux/slices/feedback.slice';

// enum status giống backend
enum FeedbackStatus {
  Pending = 'Pending',
  Reviewed = 'Reviewed',
  Resolved = 'Resolved',
  Closed = 'Closed',
}

const FeedbackPage = () => {
  const dispatch = useDispatch<AppDispatch>();

  const { items, pagination, loading, error } = useSelector((state: RootState) => state.feedBack);

  const [page, setPage] = useState(1);
  const [feedbackTypeFilter, setFeedbackTypeFilter] = useState<FeedbackType | ''>('');
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | ''>('');

  useEffect(() => {
    dispatch(
      fetchAdminFeedbacks({
        page,
        take: 10,
        feedbackType: feedbackTypeFilter || '',
        status: statusFilter || '',
      }),
    );
  }, [dispatch, page, feedbackTypeFilter, statusFilter]);

  const handleDelete = (id: number) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return;
    dispatch(deleteFeedback(id))
      .unwrap()
      .then(() => toast.success('Deleting feedback successful'))
      .catch(() => toast.error('Deleting feedback failed'));
  };

  const totalPages = pagination?.totalPages ?? 1;
  const currentPage = pagination?.page ?? page;
  const pageSize = pagination?.limit ?? 10;

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="bg-white shadow rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4">Response list</h2>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-4 mb-4">
          {/* Feedback type */}
          <div className="flex flex-col">
            <span className="text-sm font-medium mb-1">Feedback type</span>
            <select
              value={feedbackTypeFilter}
              onChange={e => setFeedbackTypeFilter(e.target.value as FeedbackType | '')}
              className="border px-3 py-2 rounded min-w-[180px]"
            >
              {Object.values(FeedbackType).map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className="flex flex-col">
            <span className="text-sm font-medium mb-1">Status</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as FeedbackStatus | '')}
              className="border px-3 py-2 rounded min-w-[180px]"
            >
              {Object.values(FeedbackStatus).map(status => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              setFeedbackTypeFilter('');
              setStatusFilter('');
              setPage(1);
            }}
            className="self-end mb-[-4px] bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
          >
            Clear filter
          </button>
        </div>

        {loading && <p className="italic text-gray-500 mb-2">Loading...</p>}
        {error && <p className="text-red-500 mb-2">{error}</p>}

        {/* TABLE – style giống UserTable */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left border rounded">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2">#</th>
                <th className="px-4 py-2">User ID</th>
                <th className="px-4 py-2">Course ID</th>
                <th className="px-4 py-2">Title</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Created Date</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-800">
              {items.length > 0
                ? items.map((f, index) => (
                    <tr key={f.id} className="border-t hover:bg-gray-50 transition h-[50px]">
                      <td className="px-4 py-2">{(currentPage - 1) * pageSize + index + 1}</td>
                      <td className="px-4 py-2">{f.userId}</td>
                      <td className="px-4 py-2 text-xs">{f.courseId ?? '-'}</td>
                      <td className="px-4 py-2">{f.title}</td>
                      <td className="px-4 py-2">{f.feedbackType}</td>
                      <td className="px-4 py-2">{f.status}</td>
                      <td className="px-4 py-2">{new Date(f.createdAt).toLocaleString('vi-VN')}</td>
                      <td className="px-4 py-2 text-right">
                        <button
                          onClick={() => handleDelete(f.id)}
                          className="text-red-600 hover:underline"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))
                : !loading && (
                    <tr>
                      <td colSpan={8} className="px-4 py-4 text-center text-gray-500 italic">
                        No response received.
                      </td>
                    </tr>
                  )}
            </tbody>
          </table>
        </div>

        {/* Pagination – giữ nguyên nhưng cùng chiều rộng với table */}
        <div className="flex justify-center mt-6 gap-2">
          <button
            title="prev"
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="p-3 border rounded-full disabled:opacity-50"
          >
            <FaChevronLeft />
          </button>

          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`px-3 py-1 border rounded ${
                page === i + 1 ? 'bg-blue-500 text-white' : ''
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            title="next"
            disabled={page === totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            className="p-3 border rounded-full disabled:opacity-50"
          >
            <FaChevronRight />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;
