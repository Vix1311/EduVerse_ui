import { useEffect, useRef, useState, useMemo } from 'react';
import {
  FaBookmark,
  FaChevronLeft,
  FaChevronRight,
  FaExclamation,
  FaStar,
  FaTimes,
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import Loader from '../loader/Loader';
import {
  CourseTabsProps,
  LessonCommentsById,
  RatingCounts,
  Review,
} from '@/models/interface/courseTabs.interface';
import QuizSection from './QuizSection';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/core/store/store';
import {
  deleteLessonComment,
  fetchCourseDetail,
  // fetchLessonCommentsByCourse,
  submitLessonComment,
} from '@/redux/slices/coursePlayer.slice';
import { submitCourseFeedback, FeedbackType } from '@/redux/slices/feedback.slice';
import { Globe } from 'lucide-react';
import CourseSidebar from './CourseSidebar';
import { fetchModuleQuizzesForStudy } from '@/redux/slices/moduleQuiz.slice';

const tabsBase = ['Overview', 'Notes', 'Announcements', 'Reviews', 'Learning tools', 'Quiz'];

const CourseTabs = ({
  courseId,
  currentLessonId,
  onStartQuiz,
  savedIds,
  setSavedIds,
}: CourseTabsProps & {
  savedIds: Set<string>;
  setSavedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
}) => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
  const tabRef = useRef<HTMLDivElement>(null);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [ratingCounts, setRatingCounts] = useState<RatingCounts>({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  });
  const [newReview, setNewReview] = useState<{ rating: string; comment: string }>({
    rating: '',
    comment: '',
  });
  const [hoveredRating, setHoveredRating] = useState(0);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user._id || user.user_id;

  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const reduxComments = useSelector((state: RootState) => state.coursePlayer.commentsByLesson);

  const [commentsByLesson, setCommentsByLesson] = useState<LessonCommentsById>({});

  // word count is reused for comment/report/feedback textareas
  const [wordCount, setWordCount] = useState(0);
  const [userHasCommented, setUserHasCommented] = useState(false);

  // feedback state
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackContent, setFeedbackContent] = useState('');
  const [feedbackTitle, setFeedbackTitle] = useState('');
  const [feedbackType, setFeedbackType] = useState<FeedbackType | ''>('');

  // redux
  const dispatch = useDispatch<AppDispatch>();
  const courseOverview = useSelector((state: RootState) => state.coursePlayer.courseDetail);
  const isLoading = useSelector((state: RootState) => state.coursePlayer.loading);
  const topics = useSelector((state: RootState) => state.coursePlayer.topics);

  // Initialize commentsByLesson from redux state
  useEffect(() => {
    if (reduxComments && Object.keys(reduxComments).length > 0) {
      setCommentsByLesson(reduxComments);
    }
  }, [reduxComments]);

  // Detect if the screen size is considered mobile (width < 1024)
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  
  useEffect(() => {
    if (commentsByLesson && Object.keys(commentsByLesson).length) {
      const all: Review[] = Object.values(commentsByLesson).flatMap(lesson => lesson.comments);
      setReviews(all);
    }
  }, [commentsByLesson]);

  // Fetch course details when component mounts 
  // useEffect(() => {
  //   dispatch(fetchCourseDetail(courseId));
  // }, [dispatch, courseId]);

  // Tính moduleId từ currentLessonId + topics
  const moduleId = useMemo(() => {
    if (!currentLessonId || !topics?.length) return null;

    for (const topic of topics as any[]) {
      if (!Array.isArray(topic.lessons)) continue;
      const found = topic.lessons.find((l: any) => String(l._id) === String(currentLessonId));
      if (found) {
        return topic.id || topic._id || topic.moduleId;
      }
    }

    return null;
  }, [topics, currentLessonId]);

  
  useEffect(() => {
    if (!courseId || !moduleId) return;

    dispatch(
      fetchModuleQuizzesForStudy({
        courseId,
        moduleId,
        skip: 0,
        take: 50,
      }),
    );
    console.log('Fetching quizzes for moduleId:', moduleId, courseId);
  }, [dispatch, courseId, moduleId]);

  // Handle review submission
  const handleSubmitReview = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (userHasCommented) {
      toast.error('You have already commented.');
      return;
    }

    if (!newReview.rating || !newReview.comment) {
      toast.error('Please fill in both rating and comment.');
      return;
    }

    if (!courseId || !currentLessonId) {
      toast.error('Missing course or lesson ID.');
      return;
    }

    try {
      await dispatch(
        submitLessonComment({
          courseId,
          lessonId: currentLessonId,
          comment: newReview.comment,
          rating: Number(newReview.rating),
        }),
      ).unwrap();

      toast.success('Review submitted successfully!');
      setNewReview({ rating: '', comment: '' });
      setUserHasCommented(true);
      setWordCount(0);

      const newComment: Review = {
        _id: 'temp_' + Date.now(),
        name: user.full_name || 'You',
        timeAgo: 'Just now',
        rating: Number(newReview.rating),
        comment: newReview.comment,
        is_positive: Number(newReview.rating) >= 4,
        user_id: userId,
        user_name: user.full_name || '',
      };

      setCommentsByLesson(prev => ({
        ...prev,
        [currentLessonId]: {
          ...(prev[currentLessonId] || { title: 'Lesson', comments: [] }),
          comments: [newComment, ...(prev[currentLessonId]?.comments || [])],
        },
      }));

      setReviews(prev => [newComment, ...prev]);
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review.');
    }
  };

  // Handle comment deletion
  const handleDeleteComment = async (commentId: string, lessonId: string) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      toast.error('You must be logged in to delete comments.');
      return;
    }

    try {
      dispatch(deleteLessonComment(commentId));

      toast.success('Comment deleted successfully');

      setCommentsByLesson(prev => {
        const oldLesson = prev[lessonId];
        if (!oldLesson) return prev;
        return {
          ...prev,
          [lessonId]: {
            ...oldLesson,
            comments: oldLesson.comments.filter(c => c._id !== commentId),
          },
        };
      });
      setReviews(prev => prev.filter(c => c._id !== commentId));
    } catch (error) {
      console.error('Failed to delete comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  // Calculate rating counts from reviews
  useEffect(() => {
    const defaultCounts: RatingCounts = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    if (reviews.length) {
      const counts: RatingCounts = reviews.reduce(
        (acc, review) => {
          acc[review.rating] = (acc[review.rating] || 0) + 1;
          return acc;
        },
        { ...defaultCounts },
      );

      setRatingCounts(counts);
    } else {
      setRatingCounts(defaultCounts);
    }
  }, [reviews]);

  const tabs = isMobile ? ['Course content', ...tabsBase] : tabsBase;

  // Scroll tabs left or right
  const scrollTabs = (direction: 'left' | 'right') => {
    if (!tabRef.current) return;

    const scrollAmount = direction === 'left' ? -150 : 150;
    const currentScroll = tabRef.current.scrollLeft;
    const maxScroll = tabRef.current.scrollWidth - tabRef.current.clientWidth;

    if (
      (direction === 'left' && currentScroll <= 0) ||
      (direction === 'right' && currentScroll >= maxScroll)
    ) {
      return;
    }

    tabRef.current.scrollTo({
      left: currentScroll + scrollAmount,
      behavior: 'smooth',
    });
  };

  // Handle report submission
  const handleSubmitReport = () => {
    const finalReason = reportReason === 'Other' ? otherReason : reportReason;

    if (!finalReason.trim()) {
      toast.error('Please select or enter a reason');
      return;
    }

    setShowReportForm(false);
    setReportReason('');
    setOtherReason('');
    setWordCount(0);
    toast.success('Thank you for your report.');
  };

  // Handle feedback submission
  const handleSubmit = async () => {
    if (!feedbackTitle.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (!feedbackContent.trim()) {
      toast.error('Please enter feedback before submitting');
      return;
    }

    if (!feedbackType) {
      toast.error('Please select a feedback type');
      return;
    }

    try {
      await dispatch(
        submitCourseFeedback({
          title: feedbackTitle,
          content: feedbackContent,
          feedbackType,
          courseId: Number(courseId),
        }),
      ).unwrap();

      toast.success('Thank you for your feedback!');
      setFeedbackTitle('');
      setFeedbackContent('');
      setFeedbackType('');
      setShowFeedbackForm(false);
      setWordCount(0);
    } catch {
      toast.error('Failed to send feedback.');
    }
  };

  // Check if user has commented on the course
  useEffect(() => {
    if (!user.full_name) return;
    const hasCommented = Object.values(commentsByLesson).some(({ comments }) =>
      comments.some(c => c.name === user.full_name),
    );
    setUserHasCommented(hasCommented);
  }, [commentsByLesson, user.full_name]);

  // Render the content for the active tab
  const renderTabContent = () => {
    if (isLoading) {
      return <Loader />;
    }
    if (activeTab === 'Course content' && isMobile) {
      return (
        <CourseSidebar
          courseId={courseId}
          selectedLessonId={currentLessonId}
          onSelectVideo={() => {}}
          onInitFirstVideo={() => {}}
          onSelectLessonId={() => {}}
          completedLessons={[]}
          savedIds={savedIds}
          setSavedIds={setSavedIds}
          showBookmark={true}
        />
      );
    }

    switch (activeTab) {
      case 'Overview':
        if (!courseOverview) return <p className="text-sm text-gray-500">Loading overview...</p>;

        return (
          <div className="text-sm text-gray-700">
            <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
              {courseOverview.title}
              <button
                onClick={() => {
                  setSavedIds(prev => {
                    const next = new Set(prev);
                    if (next.has(currentLessonId)) next.delete(currentLessonId);
                    else next.add(currentLessonId);
                    return next;
                  });
                }}
                title={savedIds.has(currentLessonId) ? 'Unsave' : 'Save this lesson'}
                className="text-purple-600 hover:text-purple-800"
              >
                <FaBookmark
                  className={`transition-colors ${
                    savedIds.has(currentLessonId) ? 'fill-purple-600' : 'fill-gray-300'
                  }`}
                />
              </button>
            </h2>{' '}
            <div className="flex gap-6 text-sm text-gray-600 mt-2 ">
              <div className="text-center">
                <div className="flex items-center gap-2 text-xl font-bold text-[#8b4309]">
                  {courseOverview.rating}
                  <FaStar />
                </div>
                <span className="font-medium text-gray-400">
                  ({courseOverview.ratingsCount} ratings)
                </span>
              </div>
              <div className="text-center">
                <div className="items-center gap-1 text-xl font-semibold">
                  👨‍🎓 {courseOverview.students}{' '}
                </div>
                <div className="font-medium text-gray-400">students</div>
              </div>
              <div className="text-center">
                <div className="items-center gap-1 text-xl font-semibold">
                  ⏱️ {courseOverview.duration}
                </div>
                <div className="font-medium text-gray-400">total</div>
              </div>
            </div>
            <div className="gap-1 items-center mt-2 font-semibold text-base border-b border-gray-300 py-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 border border-black rounded-full p-1 ">
                  <FaExclamation className="text-sm" />
                </div>
                Last updated: {courseOverview.lastUpdated}
              </div>
              <div className="flex items-center gap-2">
                <Globe />English
                {/* {courseOverview.language === 'en'
                  ? ''
                  : courseOverview.language === 'cn'
                    ? 'Vietnam'
                    : 'Unknown'} */}
              </div>
            </div>
            <div className="mt-6 grid grid-cols-3  md:grid-cols-[300px_1fr_1fr] text-lg border-b border-gray-300 pb-6">
              <div className="text-lg font-semibold">By the number</div>
              <div>
                <p>
                  <strong>Skill level:</strong> {courseOverview.skillLevel}
                </p>
                <p>
                  <strong>Students:</strong> {courseOverview.students}
                </p>
                <p>
                  <strong>Languages:</strong> English
                </p>
                <p>
                  <strong>Captions:</strong>
                  {courseOverview.hasCaptions ? 'Yes' : 'No'}
                </p>
              </div>
              <div>
                <p>
                  <strong>Lectures:</strong> {courseOverview.lectures}
                </p>
                <p>
                  <strong>Video:</strong> {courseOverview.duration}
                </p>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 md:grid-cols-[300px_1fr] w-fit">
              <h3 className="font-semibold text-lg">Description</h3>
              <p className="mt-1 text-lg">{courseOverview.description}</p>
            </div>
          </div>
        );

      case 'Reviews':
        return (
          <div className="text-sm text-gray-700">
            <h3 className="text-xl font-bold">Student feedback</h3>
            <div className="mt-2 flex items-center gap-6">
              <p className="text-3xl font-bold text-orange-500">
                {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length || 0).toFixed(1)}
              </p>

              <div className="flex flex-col gap-1">
                {(() => {
                  const totalRatings = Object.values(ratingCounts).reduce(
                    (sum, count) => sum + count,
                    0,
                  );
                  return [5, 4, 3, 2, 1].map(star => {
                    const percent = totalRatings
                      ? Math.round((ratingCounts[star] / totalRatings) * 100)
                      : 0;

                    return (
                      <div key={star} className="flex items-center gap-2">
                        <div className="md:w-64 w-32 bg-gray-200 h-2 rounded">
                          <div
                            className="bg-purple-500 h-2 rounded"
                            style={{ width: `${percent}%` }}
                          />
                        </div>

                        <span className="text-xs">
                          {star} ★ {percent.toFixed(0)}%
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            <div className="mt-6">
              <input
                className="border px-3 py-1 rounded w-full max-w-lg"
                placeholder="Search reviews"
              />

              <select title="rating" className="ml-2 border px-2 py-1 rounded text-xs">
                <option>All ratings</option>
              </select>
            </div>

            <div className="bg-white p-2 rounded-lg shadow-md mt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Leave a review</h3>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowReportForm(prev => !prev)}
                    className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                  >
                    Report this course
                  </button>

                  <button
                    onClick={() => setShowFeedbackForm(prev => !prev)}
                    className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                  >
                    Send feedback
                  </button>
                </div>
              </div>

              {showReportForm && (
                <div className="mt-4 border p-4 rounded bg-red-50 space-y-4 max-w-xl">
                  <h4 className="font-semibold text-red-700">Report Course</h4>

                  <label className="block text-sm font-medium text-gray-700">Reason</label>

                  <select
                    title="report reason"
                    value={reportReason}
                    onChange={e => setReportReason(e.target.value)}
                    className="border rounded px-3 py-2 w-full"
                  >
                    <option value="">Select a reason</option>
                    <option value="Inappropriate content">Inappropriate content</option>
                    <option value="Copyright infringement">Copyright infringement</option>
                    <option value="Spam or misleading">Spam or misleading</option>
                    <option value="Other">Other</option>
                  </select>

                  {reportReason === 'Other' && (
                    <div>
                      <textarea
                        value={otherReason}
                        placeholder="Please specify your reason"
                        rows={3}
                        onChange={e => {
                          const words = e.target.value.trim().split(/\s+/);
                          if (words[0] === '') {
                            setOtherReason('');
                            setWordCount(0);
                            return;
                          }
                          if (words.length <= 255) {
                            setOtherReason(e.target.value);
                            setWordCount(words.length);
                          }
                        }}
                        className="border rounded w-full px-3 py-2"
                      />

                      <div className="text-right text-xs text-gray-500 mt-1">
                        {wordCount}/255 words
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleSubmitReport}
                      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                    >
                      Submit Report
                    </button>

                    <button
                      onClick={() => setShowReportForm(false)}
                      className="text-sm text-gray-600 hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {showFeedbackForm && (
                <div className="mt-4 border p-4 rounded bg-blue-50 space-y-4 max-w-xl">
                  <h4 className="font-semibold text-blue-700">Feedback</h4>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={feedbackTitle}
                      onChange={e => setFeedbackTitle(e.target.value)}
                      className="border rounded w-full px-3 py-2"
                      placeholder="Short summary of your feedback"
                    />
                  </div>

                  {/* Feedback type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Feedback type
                    </label>
                    <select
                      value={feedbackType}
                      onChange={e => setFeedbackType(e.target.value as FeedbackType)}
                      className="border rounded w-full px-3 py-2 bg-white"
                    >
                      <option value="">Select type...</option>
                      <option value={FeedbackType.Bug}>Bug</option>
                      <option value={FeedbackType.FeatureRequest}>Feature request</option>
                      <option value={FeedbackType.CourseContent}>Course content</option>
                      <option value={FeedbackType.General}>General</option>
                    </select>
                  </div>

                  {/* Content */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                    <textarea
                      value={feedbackContent}
                      placeholder="Let us know your thoughts..."
                      rows={3}
                      onChange={e => {
                        const words = e.target.value.trim().split(/\s+/);
                        if (words[0] === '') {
                          setFeedbackContent('');
                          setWordCount(0);
                          return;
                        }
                        if (words.length <= 255) {
                          setFeedbackContent(e.target.value);
                          setWordCount(words.length);
                        }
                      }}
                      className="border rounded w-full px-3 py-2"
                    />

                    <div className="text-right text-xs text-gray-500 mt-1">
                      {wordCount}/255 words
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleSubmit}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Submit Feedback
                    </button>

                    <button
                      onClick={() => setShowFeedbackForm(false)}
                      className="text-sm text-gray-600 hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {userHasCommented ? (
                <p className="text-sm italic text-gray-500">
                  You have already commented on this course.
                </p>
              ) : (
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div className="flex items-center gap-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>

                    <div className="flex space-x-1 mb-2">
                      {[1, 2, 3, 4, 5].map(star => (
                        <span
                          key={star}
                          onMouseEnter={() => setHoveredRating(star)}
                          onMouseLeave={() => setHoveredRating(0)}
                          onClick={() => setNewReview({ ...newReview, rating: star.toString() })}
                          className={`cursor-pointer text-2xl ${
                            star <= (hoveredRating || parseInt(newReview.rating))
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
                      Content
                    </label>

                    <textarea
                      id="comment"
                      name="comment"
                      rows={3}
                      value={newReview.comment}
                      onChange={e => {
                        const words = e.target.value.trim().split(/\s+/);
                        if (words[0] === '') {
                          setNewReview({ ...newReview, comment: '' });
                          setWordCount(0);
                          return;
                        }
                        if (words.length <= 255) {
                          setNewReview({ ...newReview, comment: e.target.value });
                          setWordCount(words.length);
                        }
                      }}
                      className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>

                  <div className="text-right text-xs text-gray-500 mt-1">{wordCount}/255 words</div>

                  <button
                    type="submit"
                    className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                  >
                    Submit Review
                  </button>
                </form>
              )}
            </div>

            <div className="mt-6 space-y-4">
              <h3 className="text-xl font-semibold mb-2">Comment</h3>
              {Object.entries(commentsByLesson)
                .filter(([lessonId]) => {
                  if (!currentLessonId) return true;
                  return lessonId === currentLessonId;
                })
                .map(([lessonId, lessonReviews]) => (
                  <div key={lessonId} className="mb-6 relative">
                    {lessonReviews.comments.map((r, i) => {
                      return (
                        <div
                          key={i}
                          className={`border-b py-2 px-4 rounded mb-3 ${
                            r.is_positive ? 'bg-green-100' : 'bg-red-100'
                          }`}
                        >
                          {r.name === user.full_name && (
                            <button
                              onClick={() => handleDeleteComment(r._id, lessonId)}
                              className="absolute top-2 right-2 text-gray-500 hover:text-red-700 z-50"
                              title="Delete comment"
                            >
                              <FaTimes />
                            </button>
                          )}

                          <div className="flex items-center gap-2">
                            <strong>{r.name}</strong>
                            <span className="text-sm text-gray-500">({r.timeAgo})</span>
                          </div>

                          <p className="text-yellow-500">{Array(r.rating).fill('⭐').join('')}</p>
                          <p>{r.comment}</p>
                        </div>
                      );
                    })}
                  </div>
                ))}
            </div>
          </div>
        );

      default:
        return <p className="text-sm mt-4 text-gray-500">Coming soon for tab: {activeTab}</p>;
      case 'Quiz':
        return (
          <QuizSection
            onStartQuiz={(quizId: string) => onStartQuiz(quizId, moduleId)}
            currentLessonId={currentLessonId}
            moduleId={moduleId}
          />
        );
    }
  };

  return (
    <div className="p-4">
      <div className="relative">
        <button
          title="Scroll left"
          onClick={() => scrollTabs('left')}
          className="absolute -left-8 top-1/2 -translate-y-1/2 z-10 p-2 bg-white shadow rounded-full lg:hidden"
        >
          <FaChevronLeft />
        </button>

        <div
          ref={tabRef}
          className="flex overflow-x-auto whitespace-nowrap space-x-3 border-b mb-4 no-scrollbar scroll-smooth px-3"
        >
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-shrink-0 px-4 py-2 text-sm font-semibold ${
                activeTab === tab
                  ? 'border-b-2 border-black text-black'
                  : 'border-b-2 border-transparent text-gray-500 hover:text-black'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <button
          title="Scroll right"
          onClick={() => scrollTabs('right')}
          className="absolute -right-8 top-1/2 -translate-y-1/2 z-10 p-2 bg-white shadow rounded-full lg:hidden"
        >
          <FaChevronRight />
        </button>
      </div>
      {renderTabContent()}
    </div>
  );
};

export default CourseTabs;
