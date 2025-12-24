import './LoaderOverlay.css';
import Loader from './Loader';

const LoaderOverlay = () => {
  return (
    <div className="loader-overlay">
      <Loader />
    </div>
  );
};

export default LoaderOverlay;
