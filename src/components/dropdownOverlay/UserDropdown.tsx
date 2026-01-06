import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUserProfile } from '@/hooks/useUserProfile';
import defaultAvatar from '@/assets/icons/user.png';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/core/store/store';
import { fetchCategories } from '@/redux/slices/category.slice';
import { logoutUser } from '@/core/store/user.slice';
import { toast } from 'react-toastify';
import { disconnectSocket } from '@/core/services/socket-client';

interface UserDropdownProps {
  onLogout: () => void;
  onClose?: () => void;
}

const UserDropdown: React.FC<UserDropdownProps> = ({ onLogout, onClose }) => {
  const user = useUserProfile();

  const navigate = useNavigate();

  const dispatch = useDispatch<AppDispatch>();
  const categories = useSelector((state: RootState) => state.category.categories);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const handleLogout = async () => {
    setTimeout(() => {
      navigate('/');
    }, 1000);
    disconnectSocket();
    await onLogout();
    onClose?.();
  };

  const avatarUrl = user?.avatar
    ? user.avatar.startsWith('http')
      ? user.avatar
      : `http://localhost:8080/${user.avatar}`
    : defaultAvatar;

  if (!user) return null;

  const getAllRoles = (userFromStore: any): string[] => {
    const normalizeRolesAny = (val: any): string[] => {
      const toList = (x: any): any[] => {
        if (!x) return [];
        if (Array.isArray(x)) return x;
        if (typeof x === 'string') {
          try {
            const parsed = JSON.parse(x);
            if (Array.isArray(parsed)) return parsed;
          } catch {}
          return x.split(/[,\s]+/).filter(Boolean);
        }
        if (typeof x === 'object' && x?.name) return [x.name];
        return [];
      };
      return [
        ...new Set(
          toList(val)
            .map((r: any) =>
              typeof r === 'string'
                ? r.trim().toLowerCase()
                : String(r?.name ?? '')
                    .trim()
                    .toLowerCase(),
            )
            .filter(Boolean),
        ),
      ];
    };

    const userLocal = (() => {
      try {
        return JSON.parse(localStorage.getItem('user') || 'null');
      } catch {
        return null;
      }
    })();

    let tokenRoles: string[] = [];
    const token = localStorage.getItem('access_token');
    if (token?.includes('.')) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        tokenRoles = normalizeRolesAny(payload?.roles ?? payload?.role ?? payload?.scope);
      } catch {}
    }

    const storeRoles = normalizeRolesAny(userFromStore?.roles);
    const localRoles = normalizeRolesAny(userLocal?.roles ?? userLocal?.role);

    return [...new Set([...storeRoles, ...localRoles, ...tokenRoles])];
  };

  const getAllRoleIds = (userFromStore: any): number[] => {
    const ids: number[] = [];

    if (userFromStore?.role?.id) ids.push(Number(userFromStore.role.id));
    if (Array.isArray(userFromStore?.roles)) {
      for (const r of userFromStore.roles) {
        if (typeof r === 'number') ids.push(r);
        else if (typeof r === 'object' && r?.id) ids.push(Number(r.id));
      }
    }

    const ridCache = Number(localStorage.getItem('role_id') || NaN);
    if (Number.isFinite(ridCache)) ids.push(ridCache);

    try {
      const userLocal = JSON.parse(localStorage.getItem('user') || 'null');
      if (userLocal?.role?.id) ids.push(Number(userLocal.role.id));
      if (Array.isArray(userLocal?.roles)) {
        for (const r of userLocal.roles) {
          if (typeof r === 'number') ids.push(r);
          else if (typeof r === 'object' && r?.id) ids.push(Number(r.id));
        }
      }
    } catch {}

    const token = localStorage.getItem('access_token');
    if (token?.includes('.')) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const add = (x: any) => {
          if (!x) return;
          if (typeof x === 'number') ids.push(x);
          else if (typeof x === 'object' && x?.id) ids.push(Number(x.id));
          else if (Array.isArray(x)) x.forEach(add);
        };
        add(payload?.role);
        add(payload?.roles);
        add(payload?.roleId);
      } catch {}
    }

    return [...new Set(ids.filter(n => Number.isFinite(n)))];
  };

  const isInstructor = (user: any) => {
    const ids = getAllRoleIds(user);
    if (ids.includes(2)) return true;
    const names = getAllRoles(user);
    return names.includes('instructor') || names.includes('teacher');
  };

  const isAdmin = (user: any) => {
    const ids = getAllRoleIds(user);
    if (ids.includes(5)) return true;
    const names = getAllRoles(user);
    return names.includes('admin');
  };

  const canSeeDashboardInstructor = (user: any) => isInstructor(user);
  const canSeeDashboardAdmin = (user: any) => isAdmin(user);

  return (
    <div
      className={`z-50 bg-white shadow-lg rounded-lg ${
        window.innerWidth < 768
          ? 'fixed inset-0 w-full h-full p-4 overflow-y-auto'
          : 'absolute top-[calc(100%+12px)] right-0 w-72 '
      }`}
    >
      {/* Bridge */}
      <div
        className="fixed"
        style={{
          top: '48px',
          right: '100px',
          width: '120px',
          height: '80px',
          zIndex: 40,
          pointerEvents: 'auto',
        }}
      />

      <div className="absolute -top-2 right-3.5 w-0 h-0 border-l-[8px] border-r-[8px] border-b-[8px] border-l-transparent border-r-transparent border-b-white" />
      <div className="max-h-screen md:max-h-[80vh] overflow-y-auto px-4 pt-4 relative">
        <div className="md:hidden flex justify-end mb-2">
          <button onClick={onClose} className="text-gray-600 text-2xl">
            &times;
          </button>
        </div>
        <div className="flex items-center gap-3 -mx-4 px-4 py-4 border-b">
          <img
            src={avatarUrl}
            alt="User avatar"
            className="w-10 h-10 rounded-full object-cover cursor-pointer"
            onError={e => (e.currentTarget.src = defaultAvatar)}
          />
          <div className="flex flex-col">
            <p className="font-semibold">{user.full_name}</p>
            <p className="text-gray-500 text-sm truncate max-w-[150px]">{user.email}</p>
          </div>
        </div>
        <div className="flex flex-col -mx-4 border-b">
          <Link
            to="/my-learning"
            className="block w-full px-4 py-3 hover:bg-purple-100 hover:text-purple-600"
          >
            My learning
          </Link>
          <Link to="/cart" className="block w-full px-4 py-3 hover:bg-purple-100">
            My cart
          </Link>
          <Link
            to="/my-learning/wishlish"
            className="block w-full px-4 py-3 hover:bg-purple-100 hover:text-purple-600"
          >
            Wishlist
          </Link>
          {canSeeDashboardInstructor(user) && (
            <Link
              to="/instructor-dashboard"
              className="block w-full px-4 py-3 hover:bg-purple-100 hover:text-purple-600"
            >
              Dashboard
            </Link>
          )}
          {canSeeDashboardAdmin(user) && (
            <Link
              to="/admin/dashboard"
              className="block w-full px-4 py-3 hover:bg-purple-100 hover:text-purple-600"
            >
              Dashboard
            </Link>
          )}
        </div>

        <div className="flex flex-col -mx-4 border-b">
          <Link
            to="/messages"
            className="block w-full px-4 py-3 hover:bg-purple-100 hover:text-purple-600 "
          >
            Messages
          </Link>
        </div>
        {/* (Mobile) Categories */}
        <div className="block md:hidden -mx-4 border-b">
          <details className="group">
            <summary className="cursor-pointer py-2 px-4 hover:bg-purple-100 hover:text-purple-600 font-medium">
              Categories
            </summary>
            <div className="pl-6 -2">
              {categories.map(c => (
                <Link
                  key={c.name}
                  to={c.link}
                  className="block py-1 px-4 hover:text-purple-600 my-2"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </details>
        </div>
        {/* <div className="flex flex-col -mx-4 border-b">
          <Link
            to="/purchase-history"
            className="block w-full px-4 py-3 hover:bg-purple-100 hover:text-purple-600"
          >
            Purchase history
          </Link>
        </div> */}
        <div className="flex flex-col -mx-4 border-b">
          <Link
            to="/edit-profile"
            className="block w-full px-4 py-3 hover:bg-purple-100 hover:text-purple-600"
          >
            Edit profile
          </Link>
        </div>
        <div className="flex flex-col -mx-4">
          <button
            onClick={handleLogout}
            className="block w-full px-4 py-3 text-left appearance-none bg-transparent hover:text-purple-600 hover:bg-purple-100 hover:rounded-b-lg"
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDropdown;
