import { useEffect, useState } from 'react';
import { FaEdit, FaTrash, FaEye, FaChevronRight, FaChevronLeft } from 'react-icons/fa';
import { AiOutlineReload } from 'react-icons/ai';
import { toast } from 'react-toastify';
import { Category } from '@/models/types/category.types';
import { formatDate } from '@/core/utils/date';
import Sidebar from '@/components/Admin/Sidebar';
import Header from '@/components/Admin/Header';
import { AppDispatch, RootState } from '@/core/store/store';
import { useDispatch, useSelector } from 'react-redux';
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  setPaging,
  updateCategory,
} from '@/redux/slices/adminSlices/category.slice';
import CategoryFormModal from '@/components/Admin/CategoryFormModal';

const CategoriesPage = () => {
  const [sortField, setSortField] = useState<keyof Category | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [openFormModal, setOpenFormModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [viewingCategory, setViewingCategory] = useState<Category | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const {
    items: categories,
    loading,
    page,
    limit,
    total,
    sort_by,
    sort_order,
    keyword,
  } = useSelector((state: RootState) => state.categories);

  useEffect(() => {
    dispatch(fetchCategories({ page, limit, sort_by, sort_order, keyword }));
  }, [dispatch, page, limit, sort_by, sort_order, keyword]);

  /* ================= Filters ================= */
  const [filters, setFilters] = useState({
    name: '',
    description: '',
    createdAt: '',
  });

  const handleFilterChange = (field: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleSort = (field: keyof Category) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const normalize = (v?: string) =>
    (v ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

  const filtered = categories
    .filter(cat => {
      const nameOk = normalize(cat.name).includes(normalize(filters.name));
      const descOk = normalize(cat.description).includes(normalize(filters.description));
      const dateOk = normalize(formatDate(cat.createdAt)).includes(normalize(filters.createdAt));
      return nameOk && descOk && dateOk;
    })
    .sort((a, b) => {
      if (!sortField) return 0;
      const aVal = (a as any)[sortField];
      const bVal = (b as any)[sortField];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return 0;
    });

  /* ================= Pagination ================= */
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages || p === page) return;
    dispatch(setPaging({ page: p }));
  };

  function getPages(totalN: number, current: number, siblingCount = 1): Array<number | '...'> {
    const totalPageNumbers = siblingCount * 2 + 5;
    if (totalPageNumbers >= totalN) return Array.from({ length: totalN }, (_, i) => i + 1);

    const left = Math.max(current - siblingCount, 1);
    const right = Math.min(current + siblingCount, totalN);
    const showLeftDots = left > 2;
    const showRightDots = right < totalN - 1;

    if (!showLeftDots && showRightDots) {
      const range = Array.from({ length: 3 + 2 * siblingCount }, (_, i) => i + 1);
      return [...range, '...', totalN];
    }

    if (showLeftDots && !showRightDots) {
      const range = Array.from(
        { length: 3 + 2 * siblingCount },
        (_, i) => totalN - (3 + 2 * siblingCount) + 1 + i,
      );
      return [1, '...', ...range];
    }

    return [
      1,
      '...',
      ...Array.from({ length: right - left + 1 }, (_, i) => left + i),
      '...',
      totalN,
    ];
  }

  const pages = getPages(totalPages, page);

  /* ================= Render ================= */
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Header />

        {/* Header actions */}
        <div className="px-6 pt-6 bg-white shadow">
          <div className="flex justify-between items-center">
            <button
              onClick={() => {
                setEditingCategory(null);
                setOpenFormModal(true);
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Add Category
            </button>

            <button
              onClick={() => dispatch(fetchCategories())}
              disabled={loading}
              className="bg-white border rounded w-10 h-10 flex items-center justify-center"
            >
              <AiOutlineReload className={`text-xl ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white shadow rounded-xl p-6">
          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th
                    onClick={() => handleSort('name')}
                    className="px-4 py-2 w-[25%] cursor-pointer"
                  >
                    Name
                  </th>
                  <th
                    onClick={() => handleSort('description')}
                    className="px-4 py-2 w-[45%] cursor-pointer"
                  >
                    Description
                  </th>
                  <th
                    onClick={() => handleSort('createdAt')}
                    className="px-4 py-2 w-[15%] cursor-pointer text-center"
                  >
                    Created At
                  </th>
                  <th className="px-4 py-2 w-[15%] text-center">Action</th>
                </tr>

                <tr className="bg-white">
                  <th className="px-4 py-2">
                    <input
                      value={filters.name}
                      onChange={e => handleFilterChange('name', e.target.value)}
                      className="w-full border rounded px-2 py-1"
                    />
                  </th>
                  <th className="px-4 py-2">
                    <input
                      value={filters.description}
                      onChange={e => handleFilterChange('description', e.target.value)}
                      className="w-full border rounded px-2 py-1"
                    />
                  </th>
                  <th className="px-4 py-2">
                    <input
                      value={filters.createdAt}
                      onChange={e => handleFilterChange('createdAt', e.target.value)}
                      className="w-full border rounded px-2 py-1"
                    />
                  </th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {filtered.map(cat => (
                  <tr key={cat.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">{cat.name}</td>
                    <td className="px-4 py-2">{cat.description}</td>
                    <td className="px-4 py-2 text-center">{formatDate(cat.createdAt)}</td>
                    <td className="px-4 py-2">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => setViewingCategory(cat)}
                          className="text-green-500 p-2 border rounded"
                        >
                          <FaEye size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setEditingCategory(cat);
                            setOpenFormModal(true);
                          }}
                          className="text-blue-500 p-2 border rounded"
                        >
                          <FaEdit size={14} />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(cat)}
                          className="text-red-500 p-2 border rounded"
                        >
                          <FaTrash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex justify-center bg-white py-4 gap-2">
          <button
            disabled={page === 1}
            onClick={() => goToPage(page - 1)}
            className="border px-3 h-[34px] rounded"
          >
            <FaChevronLeft />
          </button>

          {pages.map((p, i) =>
            p === '...' ? (
              <span key={i} className="px-2">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => goToPage(p)}
                className={`border px-3 h-[34px] rounded ${
                  page === p ? 'bg-blue-500 text-white' : 'bg-gray-200'
                }`}
              >
                {p}
              </button>
            ),
          )}

          <button
            disabled={page === totalPages}
            onClick={() => goToPage(page + 1)}
            className="border px-3 h-[34px] rounded"
          >
            <FaChevronRight />
          </button>
        </div>

        {/* Modals */}
        {openFormModal && (
          <CategoryFormModal
            open={openFormModal}
            onClose={() => setOpenFormModal(false)}
            editingCategory={editingCategory}
            onCreated={() => dispatch(fetchCategories({ page, limit, sort_by, sort_order }))}
          />
        )}

        {viewingCategory && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white p-6 rounded w-80">
              <h2 className="text-lg font-semibold mb-3 text-center">Category details</h2>
              <p>
                <strong>ID:</strong> {viewingCategory.id}
              </p>
              <p>
                <strong>Name:</strong> {viewingCategory.name}
              </p>
              <p>
                <strong>Created at:</strong> {formatDate(viewingCategory.createdAt)}
              </p>
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setViewingCategory(null)}
                  className="bg-gray-300 px-4 py-2 rounded"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {confirmDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white p-6 rounded w-80">
              <h2 className="text-lg font-semibold mb-4 text-center">Confirm deletion</h2>
              <p className="mb-4 text-center">
                Delete <strong>{confirmDelete.name}</strong>?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="bg-gray-300 px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      setDeleting(true);
                      await dispatch(deleteCategory(confirmDelete.id)).unwrap();
                      toast.success('Category deleted');
                      dispatch(fetchCategories({ page, limit }));
                    } catch {
                      toast.error('Delete failed');
                    } finally {
                      setDeleting(false);
                      setConfirmDelete(null);
                    }
                  }}
                  className="bg-red-500 text-white px-4 py-2 rounded"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CategoriesPage;
