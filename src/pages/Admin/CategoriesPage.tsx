import { useEffect, useState } from 'react';
import { FaEdit, FaTrash, FaEye, FaChevronRight, FaChevronLeft } from 'react-icons/fa';
import { AiOutlineReload } from 'react-icons/ai';
import { toast } from 'react-toastify';
import { Category } from '@/models/types/category.types';
import { categoryService } from '@/core/services/category.service';
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
  const [confirmFormModal, setConfirmFormModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [viewingCategory, setViewingCategory] = useState<Category | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Category | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    description?: string;
  }>({});
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
    dispatch(fetchCategories({ page, limit, sort_by, sort_order, keyword: keyword || undefined }));
  }, [dispatch, page, limit, sort_by, sort_order, keyword]);

  // Search filters
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

  const validateForm = () => {
    const errors: { name?: string; description?: string } = {};
    if (!newCategoryName.trim()) {
      errors.name = 'Category name cannot be empty.';
    }
    if (!newCategoryDescription.trim()) {
      errors.description = 'Description cannot be empty.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddOrEdit = () => {
    if (!validateForm()) return;
    setConfirmFormModal(true);
  };

  const handleFormConfirm = async () => {
    try {
      if (editingCategory) {
        await dispatch(
          updateCategory({
            id: editingCategory.id,
            data: {
              name: newCategoryName.trim(),
              description: newCategoryDescription.trim(),
            },
          }),
        ).unwrap();

        toast.success('Category updated successfully');
      } else {
        await dispatch(
          createCategory({
            name: newCategoryName.trim(),
            description: newCategoryDescription.trim(),
          }),
        ).unwrap();

        toast.success('Category added successfully');
      }

      // Reset & reload
      dispatch(fetchCategories({ page, limit, sort_by, sort_order, keyword }));
      setNewCategoryName('');
      setNewCategoryDescription('');
      setEditingCategory(null);
      setOpenFormModal(false);
      setConfirmFormModal(false);
    } catch (err) {
      toast.error('Error saving category');
      console.error(err);
    }
  };

  // Open delete confirmation modal
  const handleDeleteCategory = (category: Category) => {
    setConfirmDelete(category);
  };

  // Confirm deletion
  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    try {
      setDeleting(true);
      await dispatch(deleteCategory(confirmDelete.id)).unwrap();
      toast.success('Category deleted successfully');
      dispatch(
        fetchCategories({ page, limit, sort_by, sort_order, keyword: keyword || undefined }),
      );
    } catch (e) {
      toast.error('Unable to delete category');
      console.error(e);
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
    }
  };

  const handleReload = () => {
    dispatch(fetchCategories());
    setFilters({ name: '', description: '', createdAt: '' });
    setSortField(null);
    setSortOrder('asc');
  };

  const normalize = (v?: string) =>
    (v ?? '')
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

  const filtered = categories
    .filter(cat => {
      const nameOk = normalize(cat.name).includes(normalize(filters.name));
      const descOk = normalize(cat.description).includes(normalize(filters.description));
      const createdStr = formatDate(cat.createdAt);
      const createdOk = normalize(createdStr).includes(normalize(filters.createdAt));
      return nameOk && descOk && createdOk;
    })
    .sort((a, b) => {
      if (!sortField) return 0;
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return 0;
    });

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages || p === page) return;
    dispatch(setPaging({ page: p }));
  };

  function getPages(totalN: number, current: number, siblingCount = 1): Array<number | '...'> {
    const totalPageNumbers = siblingCount * 2 + 5;
    if (totalPageNumbers >= totalN) return Array.from({ length: totalN }, (_, i) => i + 1);

    const leftSibling = Math.max(current - siblingCount, 1);
    const rightSibling = Math.min(current + siblingCount, totalN);
    const showLeftDots = leftSibling > 2;
    const showRightDots = rightSibling < totalN - 1;
    const firstPage = 1;
    const lastPage = totalN;

    if (!showLeftDots && showRightDots) {
      const leftRange = Array.from({ length: 3 + 2 * siblingCount }, (_, i) => i + 1);
      return [...leftRange, '...', lastPage];
    } else if (showLeftDots && !showRightDots) {
      const rightRange = Array.from(
        { length: 3 + 2 * siblingCount },
        (_, i) => lastPage - (3 + 2 * siblingCount) + 1 + i,
      );
      return [firstPage, '...', ...rightRange];
    } else {
      const middleRange = Array.from(
        { length: rightSibling - leftSibling + 1 },
        (_, i) => leftSibling + i,
      );
      return [firstPage, '...', ...middleRange, '...', lastPage];
    }
  }
  const pages = getPages(totalPages, page, 1);

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Header />
        <div className="px-6 pt-6 bg-white shadow">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => {
                  setEditingCategory(null);
                  setNewCategoryName('');
                  setOpenFormModal(true);
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                Add Category
              </button>
            </div>
            <div className="flex gap-2 items-center">
              <button
                title="click"
                onClick={handleReload}
                disabled={loading}
                className="bg-white hover:bg-gray-400 text-black rounded w-10 h-10 flex justify-center items-center"
              >
                <AiOutlineReload className={`text-xl ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-xl p-6">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th
                    onClick={() => handleSort('name')}
                    className="px-4 py-2 cursor-pointer w-[20%]"
                  >
                    Name
                  </th>
                  <th
                    onClick={() => handleSort('description')}
                    className="px-4 py-2 cursor-pointer w-[30%]"
                  >
                    Description
                  </th>
                  <th
                    onClick={() => handleSort('createdAt')}
                    className="px-4 py-2 cursor-pointer w-[15%]"
                  >
                    Created At
                  </th>
                  <th className="px-4 py-2 w-[10%]">Status</th>
                  <th className="px-4 py-2 w-[10%]">Action</th>
                </tr>
                <tr className="bg-white">
                  <th className="px-4 py-2 font-normal">
                    <input
                      title="123"
                      value={filters.name}
                      onChange={e => handleFilterChange('name', e.target.value)}
                      className="w-full border rounded px-2 py-1"
                    />
                  </th>
                  <th className="px-4 py-2 font-normal">
                    <input
                      title="123"
                      value={filters.description}
                      onChange={e => handleFilterChange('description', e.target.value)}
                      className="w-full border rounded px-2 py-1"
                    />
                  </th>
                  <th className="px-4 py-2 font-normal">
                    <input
                      title="123"
                      value={filters.createdAt}
                      onChange={e => handleFilterChange('createdAt', e.target.value)}
                      className="w-full border rounded px-2 py-1"
                    />
                  </th>
                  <th></th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(cat => (
                  <tr key={cat.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">{cat.name}</td>
                    <td className="px-4 py-2">{cat.description}</td>
                    <td className="px-4 py-2 justify-center items-center flex">
                      {formatDate(cat.createdAt)}
                    </td>
                    <td className="px-4 py-2">
                      <div
                        className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer ${
                          cat.isActive ? 'bg-blue-500' : 'bg-gray-300'
                        }`}
                        // onClick={() => toggleActive(cat.id)}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full shadow-md transform duration-300 ${
                            cat.isActive ? 'translate-x-6' : ''
                          }`}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-2 flex gap-2">
                      <button
                        title="click"
                        onClick={() => setViewingCategory(cat)}
                        className="text-green-500 p-2 border rounded shadow"
                      >
                        <FaEye size={14} />
                      </button>
                      <button
                        title="click"
                        onClick={() => {
                          setEditingCategory(cat);
                          setNewCategoryDescription(cat.description);
                          setOpenFormModal(true);
                        }}
                        className="text-blue-500 p-2 border rounded shadow"
                      >
                        <FaEdit size={14} />
                      </button>
                      <button
                        title="click"
                        onClick={() => handleDeleteCategory(cat)}
                        className="text-red-500 p-2 border rounded shadow"
                      >
                        <FaTrash size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="flex justify-center bg-white pb-4 items-center gap-2">
          <button
            title="Prev"
            disabled={page === 1}
            onClick={() => goToPage(page - 1)}
            className="border px-3 h-[34px] rounded flex items-center justify-center hover:bg-gray-200 disabled:opacity-50"
          >
            <FaChevronLeft />
          </button>

          {pages.map((p, idx) =>
            p === '...' ? (
              <span key={`dots-${idx}`} className="px-2 select-none">
                …
              </span>
            ) : (
              <button
                title={`Page ${p}`}
                key={p}
                onClick={() => goToPage(p)}
                className={`border px-3 h-[34px] rounded flex items-center justify-center ${
                  page === p ? 'bg-blue-500 text-white' : 'bg-gray-200'
                }`}
              >
                {p}
              </button>
            ),
          )}

          <button
            title="Next"
            disabled={page === totalPages}
            onClick={() => goToPage(page + 1)}
            className="border px-3 h-[34px] rounded flex items-center justify-center hover:bg-gray-200 disabled:opacity-50"
          >
            <FaChevronRight />
          </button>
        </div>

        {openFormModal && (
          <CategoryFormModal
            open={openFormModal}
            onClose={() => setOpenFormModal(false)}
            editingCategory={editingCategory}
            onCreated={() => {
              // reload
              dispatch(
                fetchCategories({
                  page,
                  limit,
                  sort_by,
                  sort_order,
                  keyword: keyword || undefined,
                }),
              );
            }}
          />
        )}

        {viewingCategory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded shadow-lg w-80">
              <h2 className="text-lg font-semibold text-center mb-4">Category details</h2>
              <div className="space-y-2">
                <p>
                  <strong>ID:</strong> {viewingCategory.id}
                </p>
                <p>
                  <strong>Name:</strong> {viewingCategory.name}
                </p>
                <p>
                  <strong>Created at:</strong> {formatDate(viewingCategory.createdAt)}
                </p>
                <p>
                  <strong>Status:</strong> {viewingCategory.isActive ? 'Active' : 'Inactive'}
                </p>
              </div>
              <div className="flex justify-end mt-4">
                <button
                  title="click"
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded shadow-lg w-80">
              <h2 className="text-lg font-semibold text-center mb-4">Confirm deletion</h2>
              <p className="text-center text-gray-700 mb-6">
                Are you sure you want to delete <strong>{confirmDelete.name}</strong>?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  title="click"
                  onClick={() => setConfirmDelete(null)}
                  className="bg-gray-300 px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  title="click"
                  onClick={handleDeleteConfirm}
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
