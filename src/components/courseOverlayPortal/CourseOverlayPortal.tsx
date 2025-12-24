import { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { CourseOverlayPortalProps } from '@/models/interface/courseOverlayportalProps.interface';

const CourseOverlayPortal = ({
  position,
  content,
  onMouseEnter,
  onMouseLeave,
  onTouchStart,
  onTouchEnd,
  direction,
}: CourseOverlayPortalProps) => {
  const overlayRoot = document.getElementById('overlay-root');
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = `${position.top}px`;
    container.style.left = `${position.left}px`;
    container.style.width = `${position.width}px`;
    container.style.zIndex = '10';

    containerRef.current = container;
    overlayRoot?.appendChild(container);

    return () => {
      overlayRoot?.removeChild(container);
    };
  }, [position.top, position.left, position.width, overlayRoot]);

  return containerRef.current
    ? ReactDOM.createPortal(
        <div
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          className={`bg-white rounded-lg shadow-2xl p-6 border border-gray-400 relative
            ${direction === 'left' ? 'animate-slide-left' : 'animate-slide-right'}`}
        >
          <div
            className={`absolute top-4 w-0 h-0 border-t-[10px] border-b-[10px] border-transparent
            ${
              direction === 'right'
                ? 'left-[-10px] border-r-[10px] border-r-gray-300'
                : 'right-[-10px] border-l-[10px] border-l-gray-300'
            }`}
          />
          {content}
        </div>,
        containerRef.current,
      )
    : null;
};

export default CourseOverlayPortal;
