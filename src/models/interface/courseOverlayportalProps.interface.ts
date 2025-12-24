export interface CourseOverlayPortalProps {
  position: { top: number; left: number; width: number };
  content: React.ReactNode;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onTouchStart?: () => void;
  onTouchEnd?: () => void;
  direction?: "left" | "right";
}
