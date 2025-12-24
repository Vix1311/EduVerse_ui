import { useEffect, useRef, useState, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { CourseSidebarProps } from '@/models/interface/courseSidebar.interface';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/core/store/store';
import { fetchCourseDetail } from '@/redux/slices/coursePlayer.slice';
import { FaBookmark, FaCheckCircle, FaLock, FaSearch } from 'react-icons/fa';
import { fetchLessonQuizzes } from '@/redux/slices/lessonQuiz.slice';

type ContentItem = {
  type: 'video' | 'document' | 'quiz';
  id: string;

  lessonId: string;
  lessonTitle: string;
  topicIndex: number;

  // video
  video_url?: string;

  // doc
  document_url?: string;
  original_name?: string;

  // quiz
  quizId?: string;
  quizTitle?: string;
  quizScore?: number | null;
  submittedAt?: string | null;
};

type CourseSidebarPropsExtended = CourseSidebarProps & {
  savedIds: Set<string>;
  setSavedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  showBookmark: boolean;

  onOpenLessonQuiz?: (payload: { lessonId: string; quizId: string }) => void;
};

const BookmarkIcon = ({ active }: { active?: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="16" viewBox="0 0 15 16" fill="none">
    <path
      d="M14.5 10.5V1.5C14.5 0.6875 13.8125 0 13 0H11.5V6C11.5 6.40625 11 6.625 10.6875 6.375L9 5L7.28125 6.40625C6.96875 6.65625 6.5 6.4375 6.5 6V0H3.5C1.8125 0 0.5 1.34375 0.5 3V13C0.5 14.6875 1.8125 16 3.5 16H13.5C14.0312 16 14.5 15.5625 14.5 15C14.5 14.6562 14.2812 14.3438 14 14.1562V11.625C14.2812 11.3438 14.5 10.9688 14.5 10.5ZM12.5 14H3.5C2.9375 14 2.5 13.5625 2.5 13C2.5 12.4688 2.9375 12 3.5 12H12.5V14Z"
      fill={active ? '#FFFFFF' : '#a855f7'}
    />
  </svg>
);

// download helper
const handleDownload = async (url: string, filename: string) => {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  } catch (err) {
    console.error('Download failed:', err);
  }
};

const CourseSidebar = ({
  courseId,
  onSelectVideo,
  onInitFirstVideo,
  onSelectLessonId,
  completedLessons,
  onTotalLessons,
  selectedLessonId,
  lastCompletedLessonId,
  setIsLoadingNext,
  savedIds,
  setSavedIds,
  showBookmark,
  onOpenLessonQuiz,
  isMock = false,
  mockData,
}: CourseSidebarPropsExtended & { isMock?: boolean; mockData?: any }) => {
  const topics = useSelector((state: RootState) => state.coursePlayer.topics);
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [openLessonId, setOpenLessonId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'saved'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const hasFetchedRef = useRef(false);
  const dispatch = useDispatch<AppDispatch>();
  const lessonRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const lastAutoAdvancedRef = useRef<string | null>(null);

  const quizzesByLessonId = useSelector((state: RootState) => state.lessonQuiz.quizzesByLessonId);

  // Lesson order according to video (lock/unlock according to video lesson)
  const videoLessonIdsInOrder = useMemo(() => {
    const ids: string[] = [];
    topics.forEach((topic: any) => {
      topic.lessons?.forEach((lesson: any) => {
        if (lesson.video_url) ids.push(String(lesson._id));
      });
    });
    return ids;
  }, [topics]);

  const allContentItems: ContentItem[] = useMemo(() => {
    const items: ContentItem[] = [];
    topics.forEach((topic: any, topicIndex: number) => {
      topic.lessons?.forEach((lesson: any) => {
        const lessonId = String(lesson._id);

        // video row
        if (lesson.video_url) {
          items.push({
            type: 'video',
            id: `video-${lessonId}`,
            lessonId,
            lessonTitle: lesson.title,
            topicIndex,
            video_url: lesson.video_url,
          });
        }

        // document rows
        lesson.document_urls?.forEach((doc: any, i: number) => {
          items.push({
            type: 'document',
            id: `doc-${lessonId}-${i}`,
            lessonId,
            lessonTitle: lesson.title,
            topicIndex,
            document_url: doc.url,
            original_name: doc.original_name || `Document ${i + 1}`,
          });
        });

        // quiz rows
        const quizzes = quizzesByLessonId?.[lessonId] || [];
        quizzes.forEach((q: any) => {
          items.push({
            type: 'quiz',
            id: `quiz-${lessonId}-${q.id}`,
            lessonId,
            lessonTitle: lesson.title,
            topicIndex,
            quizId: String(q.id),
            quizTitle: q.title || `Quiz #${q.id}`,
            quizScore: q.quiz_result?.score ?? null,
            submittedAt: q.quiz_result?.submitted_at ?? null,
          });
        });
      });
    });
    return items;
  }, [topics, quizzesByLessonId]);

  const topicItemMap: Record<number, (ContentItem & { globalIndex: number })[]> = useMemo(() => {
    const map: Record<number, (ContentItem & { globalIndex: number })[]> = {};
    allContentItems.forEach((item, index) => {
      if (!map[item.topicIndex]) map[item.topicIndex] = [];
      map[item.topicIndex].push({ ...item, globalIndex: index });
    });
    return map;
  }, [allContentItems]);

  //Group items by LESSON but remain within TOPIC TopicIndex -> [{ lessonId, lessonTitle, items[] }]

  const lessonGroupByTopic = useMemo(() => {
    const result: Record<
      number,
      Array<{
        lessonId: string;
        lessonTitle: string;
        items: (ContentItem & { globalIndex: number })[];
        firstIndex: number;
      }>
    > = {};

    Object.keys(topicItemMap).forEach(k => {
      const topicIdx = Number(k);
      const items = topicItemMap[topicIdx] || [];

      const temp: Record<
        string,
        {
          lessonId: string;
          lessonTitle: string;
          items: (ContentItem & { globalIndex: number })[];
          firstIndex: number;
        }
      > = {};

      items.forEach(it => {
        if (!temp[it.lessonId]) {
          temp[it.lessonId] = {
            lessonId: it.lessonId,
            lessonTitle: it.lessonTitle,
            items: [],
            firstIndex: it.globalIndex,
          };
        }
        temp[it.lessonId].items.push(it);
        temp[it.lessonId].firstIndex = Math.min(temp[it.lessonId].firstIndex, it.globalIndex);
      });

      const groups = Object.values(temp).sort((a, b) => a.firstIndex - b.firstIndex);
      result[topicIdx] = groups;
    });

    return result;
  }, [topicItemMap]);

  const savedItems = useMemo(
    () => allContentItems.filter(it => savedIds.has(it.lessonId)),
    [allContentItems, savedIds],
  );

  const searchResults = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return [] as (ContentItem & { globalIndex: number })[];
    return allContentItems
      .map((it, idx) => ({ ...it, globalIndex: idx }))
      .filter(it => {
        const lessonMatch = it.lessonTitle.toLowerCase().includes(q);
        const docMatch = it.original_name?.toLowerCase().includes(q) ?? false;
        const quizMatch = it.quizTitle?.toLowerCase().includes(q) ?? false;
        return lessonMatch || docMatch || quizMatch;
      });
  }, [searchTerm, allContentItems]);

  useEffect(() => {
    onTotalLessons?.(allContentItems.length);
  }, [allContentItems.length, onTotalLessons]);

  useEffect(() => {
    hasFetchedRef.current = false;
  }, [courseId]);

  useEffect(() => {
    if (hasFetchedRef.current) return;

    if (Array.isArray(topics) && topics.length > 0) {
      hasFetchedRef.current = true;
      const firstLessonWithVideo = topics
        .flatMap((t: any) => t.lessons)
        .find((l: any) => l.video_url);

      if (firstLessonWithVideo && onInitFirstVideo) {
        onInitFirstVideo(firstLessonWithVideo.video_url!, firstLessonWithVideo._id);
      }
      return;
    }

    dispatch(fetchCourseDetail(courseId))
      .unwrap()
      .then(res => {
        hasFetchedRef.current = true;
        const firstLessonWithVideo = res.topics
          .flatMap((t: any) => t.lessons)
          .find((l: any) => l.video_url);

        if (firstLessonWithVideo && onInitFirstVideo) {
          onInitFirstVideo(firstLessonWithVideo.video_url!, firstLessonWithVideo._id);
        }
      })
      .catch(err => {
        console.error('Failed to fetch course:', err);
      });
  }, [dispatch, courseId, topics, onInitFirstVideo]);

  const toggleSection = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // Toggle lesson accordion (inside the topic)
  const toggleLesson = (lessonId: string) => {
    setOpenLessonId(prev => (prev === lessonId ? null : lessonId));
  };

  // When changing the open topic, reset the lesson accordion to avoid getting stuck with a lesson from another topic
  useEffect(() => {
    setOpenLessonId(null);
  }, [openIndex]);

  useEffect(() => {
    if (!lastCompletedLessonId) return;
    if (lastAutoAdvancedRef.current === lastCompletedLessonId) return;
    if (lastCompletedLessonId !== selectedLessonId) return;

    const currentLessonIndex = allContentItems.findIndex(
      item => item.lessonId === lastCompletedLessonId && item.type === 'video',
    );

    const nextVideo = allContentItems
      .slice(currentLessonIndex + 1)
      .find(item => item.type === 'video');

    if (nextVideo) {
      const pos = videoLessonIdsInOrder.findIndex(id => id === nextVideo.lessonId);
      const prevLessonId = pos > 0 ? videoLessonIdsInOrder[pos - 1] : null;
      const isNextUnlocked = !prevLessonId || completedLessons.includes(prevLessonId);

      if (isNextUnlocked) {
        setIsLoadingNext?.(true);

        setTimeout(() => {
          onSelectVideo(nextVideo.video_url!, nextVideo.lessonId);
          onSelectLessonId(nextVideo.lessonId);
          setIsLoadingNext?.(false);
        }, 1500);

        lastAutoAdvancedRef.current = lastCompletedLessonId;
      }
    }
  }, [
    lastCompletedLessonId,
    selectedLessonId,
    allContentItems,
    completedLessons,
    onSelectLessonId,
    onSelectVideo,
    setIsLoadingNext,
    videoLessonIdsInOrder,
  ]);

  useEffect(() => {
    if (!selectedLessonId) return;
    const matchedItem = allContentItems.find(item => item.lessonId === selectedLessonId);
    if (matchedItem) {
      setOpenIndex(matchedItem.topicIndex);
      setOpenLessonId(matchedItem.lessonId);
    }

    const ref = lessonRefs.current[selectedLessonId || ''];
    if (ref) ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [selectedLessonId, allContentItems]);

  // Fetch list quizzes for the entire lesson video to render the row quiz
  useEffect(() => {
    const videoLessonIds = videoLessonIdsInOrder;
    videoLessonIds.forEach(lid => {
      if (!quizzesByLessonId?.[lid]) {
        dispatch(fetchLessonQuizzes({ lessonId: lid, skip: 0, take: 10 }));
      }
    });
  }, [dispatch, videoLessonIdsInOrder, quizzesByLessonId]);

  const isLessonUnlocked = (lessonId: string) => {
    const pos = videoLessonIdsInOrder.findIndex(id => id === String(lessonId));
    if (pos <= 0) return true;
    const prevLessonId = videoLessonIdsInOrder[pos - 1];
    return completedLessons.includes(prevLessonId);
  };

  const renderItemRow = (item: ContentItem & { globalIndex?: number }) => {
    const unlocked = isLessonUnlocked(item.lessonId);
    const isCompleted = completedLessons.includes(item.lessonId);

    if (item.type === 'video') {
      return (
        <div
          ref={el => {
            lessonRefs.current[item.lessonId] = el;
          }}
          className={`flex items-center justify-between gap-2 px-2 py-4 min-h-[4rem] ${
            selectedLessonId === item.lessonId
              ? 'from-purple-200 bg-gradient-to-r to-white text-purple-800 font-semibold'
              : unlocked
                ? 'hover:text-purple-600 hover:bg-purple-100 cursor-pointer'
                : 'text-gray-400 bg-gray-100 cursor-not-allowed'
          }`}
          onClick={() => {
            if (!unlocked) return;
            onSelectVideo(item.video_url!, item.lessonId);
            onSelectLessonId(item.lessonId);
          }}
        >
          <div className="flex items-center gap-2">
            <span>{unlocked ? '🎬' : <FaLock />}</span>
            <span className="flex items-center gap-1 text-sm">{item.lessonTitle}</span>
          </div>

          <div className="flex items-center gap-3 pr-2">
            {showBookmark && (
              <span
                className="p-2 rounded"
                title={savedIds.has(item.lessonId) ? 'Saved' : 'Unsaved'}
              >
                <FaBookmark
                  className={`h-[16px] w-[10px] ${
                    savedIds.has(item.lessonId) ? 'text-purple-600' : 'text-transparent'
                  }`}
                />
              </span>
            )}
            {isCompleted && <FaCheckCircle className="text-purple-500 w-[12px]" />}
          </div>
        </div>
      );
    }

    if (item.type === 'document') {
      return (
        <div
          className={`flex items-center justify-between gap-2 px-2 min-h-[4rem] ${
            unlocked ? 'hover:text-purple-600 hover:bg-purple-100' : 'text-gray-400 bg-gray-100'
          } ${unlocked ? '' : 'cursor-not-allowed'}`}
        >
          <div className="flex items-center gap-2">
            <span>{unlocked ? '📄' : <FaLock />}</span>
            <button
              onClick={() => {
                if (!unlocked) return;
                handleDownload(item.document_url!, item.original_name!);
              }}
              className={`underline text-left ${unlocked ? 'hover:text-blue-600' : ''}`}
            >
              {item.original_name}
            </button>
          </div>

          <div className="flex items-center gap-3 pr-2">
            {showBookmark && (
              <span
                className="p-2 rounded"
                title={savedIds.has(item.lessonId) ? 'Saved' : 'Not saved'}
              >
                <FaBookmark
                  className={`h-[16px] w-[10px] ${
                    savedIds.has(item.lessonId) ? 'text-purple-600' : 'text-gray-300'
                  }`}
                />
              </span>
            )}
            {isCompleted && <FaCheckCircle className="text-purple-500 w-[12px]" />}
          </div>
        </div>
      );
    }

    // QUIZ ROW
    const score = item.quizScore;
    const hasScore = score != null;

    return (
      <div
        className={`flex items-center justify-between gap-2 px-2 py-4 min-h-[4rem] ${
          unlocked
            ? 'hover:text-purple-600 hover:bg-purple-100 cursor-pointer'
            : 'text-gray-400 bg-gray-100 cursor-not-allowed'
        }`}
        onClick={() => {
          if (!unlocked) return;
          if (!item.quizId) return;

          onSelectLessonId(item.lessonId);

          onOpenLessonQuiz?.({
            lessonId: item.lessonId,
            quizId: item.quizId,
          });
        }}
      >
        <div className="flex items-center gap-2">
          <span>{unlocked ? '📝' : <FaLock />}</span>
          <span className="flex items-center gap-1 text-sm"> {item.quizTitle || 'Quiz'}</span>
        </div>

        <div className="flex items-center gap-3 pr-2">
          <span className="flex items-center gap-1 text-sm">
            {hasScore && <span className="text-xs text-green-700 font-semibold">( {score} )</span>}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col py-4 pr-2 w-full lg:w-[354px] max-w-full">
      {/* Header */}
      <div className="px-2 mb-3 flex items-stretch gap-3 w-full justify-between">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60" />
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by lesson name "
            className="w-full h-12 pl-10 pr-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>

        <div className="flex items-center">
          <button
            onClick={() => setActiveTab(activeTab === 'saved' ? 'all' : 'saved')}
            className={`px-3 py-1.5 h-12 gap-1 rounded-lg border flex items-center transition-colors flex-col ${
              activeTab === 'saved'
                ? 'bg-purple-00 text-white border-purple-600'
                : 'bg-white hover:bg-gray-100 border-gray-300 text-gray-700'
            }`}
            title="Saved list"
          >
            <BookmarkIcon active={activeTab === 'saved'} />
            <span className="text-xs">Saved</span>
          </button>
        </div>
      </div>

      {/* BODY */}
      {searchTerm.trim() ? (
        <div className="px-2">
          {searchResults.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No matching results found.</p>
          ) : (
            <ul className="w-full text-sm text-gray-700 divide-y-2 border border-gray-200 rounded-md overflow-hidden">
              {searchResults.map(it => (
                <li key={it.id}>{renderItemRow(it)}</li>
              ))}
            </ul>
          )}
        </div>
      ) : activeTab === 'saved' ? (
        <div className="px-2">
          {savedItems.length === 0 ? (
            <p className="text-sm mt-36 text-gray-500 italic flex justify-center items-center gap-1">
              You have not saved any lessons yet.
            </p>
          ) : (
            <ul className="w-full text-sm text-gray-700 divide-y-2 border border-gray-200 rounded-md overflow-hidden">
              {savedItems.map(it => (
                <li key={`saved-${it.id}`}>{renderItemRow(it)}</li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <>
          <h3 className="text-lg font-bold mb-2 px-2">Course content</h3>
          {topics.map((topic: any, i: number) => (
            <div key={i} className="border">
              <div className="flex items-center justify-between bg-gradient-to-r from-gray-100 to-white hover:bg-gray-200 transition-colors duration-200">
                <button
                  onClick={() => toggleSection(i)}
                  className="w-full text-left px-3 py-2 font-semibold min-h-[4rem] line-clamp-2"
                >
                  {topic.title}
                </button>
                <ChevronDown
                  className={`w-6 h-6 mr-2 transition-transform duration-200 ${
                    openIndex === i ? 'rotate-180' : ''
                  }`}
                />
              </div>

              {openIndex === i && (
                <ul className="text-sm text-gray-700 divide-y-2 border border-gray-200">
                  {(lessonGroupByTopic[i] || []).map(group => (
                    <li key={`lesson-group-${group.lessonId}`} className="border border-gray-200">
                      <div className="flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                        <button
                          onClick={() => toggleLesson(group.lessonId)}
                          className="w-full text-left px-3 py-2 font-semibold text-sm text-gray-800 bg-gradient-to-r from-orange-100 to-white underline min-h-[3.25rem] line-clamp-2"
                        >
                          {group.lessonTitle}
                        </button>
                        <ChevronDown
                          className={`w-6 h-6 mr-2 transition-transform duration-200 ${
                            openLessonId === group.lessonId ? 'rotate-180' : ''
                          }`}
                        />
                      </div>

                      {openLessonId === group.lessonId && (
                        <ul className="text-sm text-gray-700 divide-y-2 border border-gray-200">
                          {group.items.map(item => (
                            <li key={item.id} className="border border-gray-200">
                              {renderItemRow(item)}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default CourseSidebar;
