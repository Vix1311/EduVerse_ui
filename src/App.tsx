import { useEffect, useRef, useState } from 'react';
import useRoutesElements from '@/hooks/useRouterElement';
import ScrollToTop from './components/scrollToTop/ScrollToTop';
// import FeedbackWidget from './components/feedback/Feedback';
import { RootState } from './core/store/store';
import { useSelector } from 'react-redux';
import LoaderOverlay from './components/loader/LoaderOverlay';
import { useNavigate, useLocation } from 'react-router-dom';

function App() {
  const routerDom = useRoutesElements();
  const loading = useSelector((state: RootState) => state.ui.loading);
  const [showLoader, setShowLoader] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Minimum display time for loader
  const MIN_LOADING_TIME = 1500;
  const loaderStartTimeRef = useRef<number | null>(null);

  // useEffect to manage the visibility of a loader with a minimum display time
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    let accessToken = params.get('accessToken') || params.get('access_token');
    let refreshToken = params.get('refreshToken') || params.get('refresh_token');

    if (!accessToken || !refreshToken) {
      const hash = location.hash.startsWith('#') ? location.hash.slice(1) : location.hash;
      if (hash) {
        const hashParams = new URLSearchParams(hash);
        accessToken =
          accessToken || hashParams.get('accessToken') || hashParams.get('access_token');
        refreshToken =
          refreshToken || hashParams.get('refreshToken') || hashParams.get('refresh_token');
      }
    }

    if (accessToken && refreshToken) {
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      localStorage.setItem('isLoggedIn', 'true');


      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  useEffect(() => {
    if (loading) {
      // When loading starts, show the loader and store the start time
      setShowLoader(true);
      loaderStartTimeRef.current = Date.now();
    } else if (showLoader) {
      // When loading finishes and the loader is currently shown:
      const startTime = loaderStartTimeRef.current ?? Date.now();
      const now = Date.now();
      const elapsedBeforeDelay = now - startTime;

      // Calculate the remaining time to ensure loader stays visible for at least MIN_LOADING_TIME
      const remainingTime = Math.max(MIN_LOADING_TIME - elapsedBeforeDelay, 0);

      // Set a timeout to hide the loader after the remaining time
      const timer = setTimeout(() => {
        setShowLoader(false);
        loaderStartTimeRef.current = null;
      }, remainingTime);

      // Clear timeout if the effect re-runs before timer finishes
      return () => clearTimeout(timer);
    }
  }, [loading, showLoader]);
  return (
    <>
      <ScrollToTop />
      {routerDom}
      {showLoader && <LoaderOverlay />}

    </>
  );
}

export default App;
