import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import Sidebar from '../../components/Admin/Sidebar';
import Header from '../../components/Admin/Header';
import UserTable from '../../components/Admin/UserTable';
import UserFilters from '../../components/Admin/UserFilters';
import UserFormModal from '../../components/Admin/UserFormModal';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/core/store/store';
import { fetchUsers } from '@/redux/slices/adminSlices/user.slice';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

export interface User {
  id: string;
  fullName: string;
  email: string;
  roleId: number;
  createdAt: string;
  isActive: boolean;
  isApproved?: boolean;
}

const formatDate = (input?: string | Date, useUTC = true) => {
  if (!input) return '';
  const d = input instanceof Date ? input : new Date(input);
  if (isNaN(d.getTime())) return '';
  const day = String(useUTC ? d.getUTCDate() : d.getDate()).padStart(2, '0');
  const month = String((useUTC ? d.getUTCMonth() : d.getMonth()) + 1).padStart(2, '0');
  const year = useUTC ? d.getUTCFullYear() : d.getFullYear();
  return `${day}/${month}/${year}`;
};

const Users = () => {
  const [openModal, setOpenModal] = useState(false);

  const [selectedRole, setSelectedRole] = useState('');
  const [searchField, setSearchField] = useState<'fullName' | 'email'>('fullName');
  const [searchValue, setSearchValue] = useState('');

  const dispatch = useDispatch<AppDispatch>();
  const { items, page, limit, total } = useSelector((s: RootState) => s.users);

  const [sortBy, setSortBy] = useState<'created_at' | 'full_name' | 'email'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const searchBy = useMemo(
    () => (searchField === 'fullName' ? 'full_name' : 'email') as 'full_name' | 'email',
    [searchField],
  );
  const [debouncedKeyword, setDebouncedKeyword] = useState('');

  const [extraRows, setExtraRows] = useState<User[]>([]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedKeyword(searchValue.trim()), 400);
    return () => clearTimeout(t);
  }, [searchValue]);

  useEffect(() => {
    dispatch(
      fetchUsers({
        page,
        limit,
        search_by: searchBy,
        sort_by: sortBy,
        sort_order: sortOrder,
        role: selectedRole || undefined,
        keyword: debouncedKeyword || undefined,
      } as any),
    );
  }, [dispatch, page, limit, searchBy, sortBy, sortOrder, selectedRole, debouncedKeyword]);

  const tableData: User[] = [
    ...extraRows,
    ...items
      .map<User>(u => ({
        id: String(u.id),
        fullName: u.fullname,
        email: u.email,
        roleId: Number(u.roleId ?? 1),
        createdAt: formatDate(u.createdAt),
        isActive: u.status === 'ACTIVE',
        isApproved: !!u.isApproved,
      }))
      .filter(u => {
        if (extraRows.some(x => x.id === u.id)) return false;

        if (!selectedRole) return true;

        if (selectedRole === 'student') return true; 
        if (selectedRole === 'instructor') return true; 
        return true;
      }),
  ];

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages || p === page) return;
    dispatch({ type: 'users/setPaging', payload: { page: p } });
  };

  function getPages(total: number, current: number, siblingCount = 1): Array<number | '...'> {
    const totalPageNumbers = siblingCount * 2 + 5;
    if (totalPageNumbers >= total) return Array.from({ length: total }, (_, i) => i + 1);

    const leftSibling = Math.max(current - siblingCount, 1);
    const rightSibling = Math.min(current + siblingCount, total);

    const showLeftDots = leftSibling > 2;
    const showRightDots = rightSibling < total - 1;
    const firstPage = 1;
    const lastPage = total;

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
        <div className="p-6 bg-white shadow rounded-xl ">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex gap-3 flex-wrap">
              <button
                className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                onClick={() => setOpenModal(true)}
              >
                <Plus size={16} />
                Add User
              </button>
            </div>

            <div className="flex gap-2 flex-wrap items-center">
              <select
                title="info"
                className="border px-3 py-1 rounded"
                value={searchField}
                onChange={e => setSearchField(e.target.value as 'fullName' | 'email')}
              >
                <option value="fullName">Full Name</option>
                <option value="email">Email</option>
              </select>

              <input
                type="text"
                placeholder="Enter keywords"
                className="border px-3 py-1 rounded w-[150px]"
                value={searchValue}
                onChange={e => setSearchValue(e.target.value)}
              />
            </div>
          </div>

          <UserFilters
            selectedRole={selectedRole}
            onSelectRole={role => setSelectedRole(role)}
            value={selectedRole}
            label="Vai trò"
          />

          <UserTable users={tableData} />

          <UserFormModal open={openModal} onClose={() => setOpenModal(false)} />

          <div className="mt-3 flex justify-center gap-2">
            <button
              className="border px-3 h-[34px] rounded disabled:opacity-50"
              disabled={page <= 1}
              onClick={() => goToPage(page - 1)}
              aria-label="Previous Page"
              title="Previous Page"
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
                  key={p}
                  onClick={() => goToPage(p)}
                  className={[
                    'border px-3 h-[34px] rounded',
                    p === page ? 'bg-blue-500 text-white border-blue-500' : 'hover:bg-gray-100',
                  ].join(' ')}
                  aria-current={p === page ? 'page' : undefined}
                >
                  {p}
                </button>
              ),
            )}

            <button
              className="border px-3 h-[34px] rounded disabled:opacity-50"
              disabled={page >= totalPages}
              onClick={() => goToPage(page + 1)}
              aria-label="Next Page"
              title="Next Page"
            >
              <FaChevronRight />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Users;
