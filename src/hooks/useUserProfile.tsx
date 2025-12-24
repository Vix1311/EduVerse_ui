import { AppDispatch } from '@/core/store/store';
import { fetchUserProfile, selectUser } from '@/core/store/user.slice';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

export const useUserProfile = () => {
  const user = useSelector(selectUser);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(fetchUserProfile());
  }, [dispatch]);

  return user;
};
