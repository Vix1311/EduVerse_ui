// src/hooks/useUserRole.tsx
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/core/store/store';

type AppRole = 'admin' | 'instructor' | 'student';
type UseUserRole = { role: AppRole | null; loading: boolean };

export const useUserRole = (): UseUserRole => {
  const { data, loading } = useSelector((s: RootState) => s.userProfile);

  const cachedRoleId = Number(localStorage.getItem('role_id') || '');

  const role = useMemo<AppRole | null>(() => {
    if (loading) return null;

    const roleIdFromData =
      (data as any)?.role?.id ??
      (data as any)?.roleId ??
      (Array.isArray((data as any)?.roles) ? (data as any).roles[0] : undefined);

    const roleId =
      Number.isFinite(roleIdFromData) && roleIdFromData !== undefined
        ? Number(roleIdFromData)
        : Number.isFinite(cachedRoleId)
          ? cachedRoleId
          : undefined;

    if (roleId === 5) return 'admin';
    if (roleId === 2) return 'instructor';
    return 'student';
  }, [data, loading, cachedRoleId]);

  return { role, loading };
};
