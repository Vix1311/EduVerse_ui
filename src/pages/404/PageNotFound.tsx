import NotFound from '@/components/404/NotFound';
import { useLocation } from 'react-router-dom';

const NotFoundRedirect = () => {
  const location = useLocation();

  const isValidPath = (path: string) => {
    const validPaths = [
      '/',
      '/course-list',
      '/about',
      '/dashboard',
      '/courses',
      '/course/:id',
      '/login',
      '/register',
      '/courses/new',
      '/users',
      '/contact',
      '/services',
      '/cart',
      '/messages',
      '/verify-otp',
      '/profile',
    ];

    return validPaths.some(validPath => {
      const regex = new RegExp(`^${validPath.replace(/:\w+/g, '\\w+')}$`);
      return regex.test(path);
    });
  };

  return isValidPath(location.pathname) ? null : <NotFound />;
};

export default NotFoundRedirect;
