import { logo } from '@/assets/images';
import CourseSidebar from '@/components/CoursePlayer/CourseSidebar';
import CourseTabs from '@/components/CoursePlayer/CourseTabs';
import CourseVideoPlayer from '@/components/CoursePlayer/CourseVideoPlayer';
import QuizModal from '@/components/CoursePlayer/QuizModal';
import LessonQuizModal from '@/components/CoursePlayer/LessonQuizModal';
import { useEffect, useRef, useState } from 'react';
import { FaArrowLeft } from 'react-icons/fa';
import { Link, useParams, useNavigate } from 'react-router-dom';

type QuizMode = 'take' | 'review';

const CoursePlayerPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [selectedLessonId, setSelectedLessonId] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [totalLessons, setTotalLessons] = useState<number>(0);
  const percentComplete =
    totalLessons === 0 ? 0 : Math.round((completedLessons.length / totalLessons) * 100);

  // module quiz modal
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizId, setQuizId] = useState<string | null>(null);
  const [quizModuleId, setQuizModuleId] = useState<string | null>(null);

  // lesson quiz modal
  const [showLessonQuizModal, setShowLessonQuizModal] = useState(false);
  const [lessonQuizId, setLessonQuizId] = useState<string | null>(null);
  const [lessonQuizLessonId, setLessonQuizLessonId] = useState<string | null>(null);

  const [scrollLocked, setScrollLocked] = useState(false);
  const [isLoadingNext, setIsLoadingNext] = useState(false);
  const [lastCompletedLessonId, setLastCompletedLessonId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const modalRef = useRef<HTMLDivElement>(null);

  const [mode, setMode] = useState<QuizMode>('take');
  const [reviewData, setReviewData] = useState<{
    questions: any[];
    userAnswers: Record<string, string | string[]>;
    correctAnswers: Record<string, string | string[]>;
    score?: number;
  } | null>(null);

  useEffect(() => {
    if ((showQuizModal || showLessonQuizModal) && modalRef.current) {
      modalRef.current.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [showQuizModal, showLessonQuizModal]);

  useEffect(() => {
    document.body.style.overflow = scrollLocked ? 'hidden' : 'auto';
  }, [scrollLocked]);

  if (!courseId) return <div>Course ID not found</div>;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 w-full p-2 bg-[#252641]">
        <div className="flex gap-3 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/my-learning">
              <div className="text-white text-lg pl-2">
                <FaArrowLeft />
              </div>
            </Link>
            <Link to="/">
              <div className="flex items-center">
                <img
                  src={logo}
                  alt="logo"
                  className="transition-all duration-300 h-8 border-l-2 pl-3"
                />
                <span className="text-xl ml-1 font-semibold text-white">E-Learning</span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2 text-white font-medium pr-0 md:pr-4">
            <div className="w-8 h-8 rounded-full border border-white flex items-center justify-center text-xs">
              {percentComplete}%
            </div>
            {completedLessons.length}/{totalLessons} lessons
            <button
              disabled={!selectedLessonId}
              onClick={() => {
                if (!selectedLessonId) return;
                navigate(`/qna/${courseId}/${selectedLessonId}`);
              }}
              className={`ml-3 px-3 py-1 rounded text-xs font-medium transition ${
                selectedLessonId
                  ? 'bg-amber-400 text-[#252641] hover:bg-amber-300'
                  : 'bg-gray-400 text-gray-200 cursor-not-allowed'
              }`}
            >
              Ask the instructor
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col lg:flex-row bg-white overflow-hidden relative">
        <div
          ref={modalRef}
          className={`flex-1 relative custom-scrollbar ${scrollLocked ? 'overflow-hidden' : 'overflow-y-auto'}`}
        >
          {/* Video */}
          <CourseVideoPlayer
            videoUrl={videoUrl}
            onVideoEnded={() => {
              if (!selectedLessonId) return;

              if (!completedLessons.includes(selectedLessonId)) {
                setCompletedLessons(prev => [...prev, selectedLessonId]);
              }
              setLastCompletedLessonId(selectedLessonId);
            }}
            isLoadingNext={isLoadingNext}
          />

          {/* Tabs (Overview / Quiz / ...) */}
          <div className="px-4">
            <CourseTabs
              courseId={courseId}
              currentLessonId={selectedLessonId}
              savedIds={savedIds}
              setSavedIds={setSavedIds}
              onStartQuiz={(id: string, moduleId: string | null) => {
                setQuizId(id);
                setQuizModuleId(moduleId);
                setMode('take');
                setReviewData(null);
                setShowQuizModal(true);
                setScrollLocked(true);
              }}
            />
          </div>

          {/* Module Quiz Modal overlay */}
          {showQuizModal && quizId && (
            <div className="absolute inset-0 z-50 flex justify-center items-start bg-black/40">
              <div className="bg-slate-100 w-full px-5 max-h-[100vh] overflow-hidden overscroll-contain custom-scrollbar relative">
                <QuizModal
                  quizId={quizId}
                  courseId={courseId}
                  moduleId={quizModuleId || ''}
                  mode={mode}
                  reviewData={reviewData}
                  onComplete={payload => {
                    setReviewData(payload);
                    setMode('review');
                  }}
                  onClose={() => {
                    setShowQuizModal(false);
                    setQuizId(null);
                    setQuizModuleId(null);
                    setScrollLocked(false);
                    setMode('take');
                    setReviewData(null);
                  }}
                  onOpen={() => setScrollLocked(true)}
                />
              </div>
            </div>
          )}

          {/* Lesson Quiz Modal overlay */}
          {showLessonQuizModal && lessonQuizId && lessonQuizLessonId && (
            <div className="absolute inset-0 z-50 flex justify-center items-start bg-black/40">
              <div className="bg-slate-100 w-full px-5 max-h-[100vh] overflow-hidden overscroll-contain custom-scrollbar relative">
                <LessonQuizModal
                  courseId={courseId}
                  lessonId={lessonQuizLessonId}
                  quizId={lessonQuizId}
                  onLessonCompleted={lid => {
                    if (!completedLessons.includes(lid)) {
                      setCompletedLessons(prev => [...prev, lid]);
                    }
                    setLastCompletedLessonId(lid);
                  }}
                  onClose={() => {
                    setShowLessonQuizModal(false);
                    setLessonQuizId(null);
                    setLessonQuizLessonId(null);
                    setScrollLocked(false);
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-[350px] border-t hidden lg:block border-l shadow-lg overflow-hidden">
          <div className="h-full overflow-y-auto custom-scrollbar">
            <CourseSidebar
              courseId={courseId}
              savedIds={savedIds}
              setSavedIds={setSavedIds}
              selectedLessonId={selectedLessonId}
              onSelectVideo={(url: string) => setVideoUrl(url)}
              onInitFirstVideo={(url, id) => {
                setVideoUrl(url);
                setSelectedLessonId(id);
              }}
              onSelectLessonId={id => setSelectedLessonId(id)}
              completedLessons={completedLessons}
              onTotalLessons={(count: number) => setTotalLessons(count)}
              setIsLoadingNext={setIsLoadingNext}
              lastCompletedLessonId={lastCompletedLessonId}
              showBookmark={true}
              onOpenLessonQuiz={({ lessonId, quizId }) => {
                setLessonQuizLessonId(lessonId);
                setLessonQuizId(quizId);
                setShowLessonQuizModal(true);
                setScrollLocked(true);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursePlayerPage;
