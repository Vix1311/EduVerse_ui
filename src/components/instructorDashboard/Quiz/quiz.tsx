import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '@/core/store/store';

import { listCourses } from '@/redux/slices/courseForm.slice';
import { getModules, getLessons } from '@/redux/slices/module.slice';

import { logo } from '@/assets/images';
import { Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import CourseCard from './courseCard';
import LessonQuizSheet from './lessonQuizSheet';
import ModuleQuizSheet from './moduleQuizSheet';
import { fetchCategories } from '@/redux/slices/category.slice';
import { Category } from '@/models/interface/category.interface';

type LessonPayload = {
  courseId: number;
  moduleId: number;
  lessonId: number;
  lessonTitle: string;
};

type ModulePayload = {
  courseId: number;
  moduleId: number;
  moduleTitle: string;
};

export default function QuizBuilder() {
  const dispatch = useDispatch<AppDispatch>();

  const { courses } = useSelector((s: RootState) => s.courseForm);
  const { modules } = useSelector((s: RootState) => s.module);
  const { categories } = useSelector((s: RootState) => s.category);

  const [openLessonSheet, setOpenLessonSheet] = useState(false);
  const [openModuleSheet, setOpenModuleSheet] = useState(false);

  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [selectedModule, setSelectedModule] = useState<any>(null);

  // only include categories that are actually used by at least one course
  const categoryOptions = useMemo(() => {
    const courseCategoryIds = new Set(
      courses
        .map((c: any) => c.categoryId)
        .filter((id: any) => id !== null && id !== undefined)
        .map((id: any) => String(id)),
    );

    return categories
      .filter((cat: Category) => cat.id !== null && courseCategoryIds.has(String(cat.id)))
      .map((cat: Category) => cat.name);
  }, [categories, courses]);

  // search + filter by category
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | string>('all');

  const getCategoryName = (course: any) => {
    if (!course?.categoryId) return 'No category';

    const found = categories.find((c: Category) => String(c.id) === String(course.categoryId));

    return found?.name ?? 'No category';
  };

  // apply filters to courses
  const filteredCourses = useMemo(
    () =>
      courses.filter((course: any) => {
        const matchTitle = course.title?.toLowerCase().includes(searchTerm.toLowerCase());

        const courseCategoryName = getCategoryName(course);

        const matchCategory = categoryFilter === 'all' || courseCategoryName === categoryFilter;

        return matchTitle && matchCategory;
      }),
    [courses, searchTerm, categoryFilter, categories],
  );

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  // load courses
  useEffect(() => {
    dispatch(listCourses());
  }, [dispatch]);

  // load modules
  const modulesLoaded = useRef(false);
  useEffect(() => {
    if (!modulesLoaded.current && courses?.length) {
      modulesLoaded.current = true;
      courses.forEach((c: any) => dispatch(getModules(Number(c.id))));
    }
  }, [courses, dispatch]);

  // load lessons
  const fetchedLessonsRef = useRef<Set<number>>(new Set());
  useEffect(() => {
    modules.forEach((m: any) => {
      if (!fetchedLessonsRef.current.has(m.id)) {
        fetchedLessonsRef.current.add(m.id);
        dispatch(getLessons({ courseId: m.courseId, moduleId: m.id }));
      }
    });
  }, [modules, dispatch]);

  const Navbar: React.FC = () => (
    <header className="fixed inset-x-0 top-0 z-30 h-14 border-b border-slate-200 bg-white">
      <div className="flex h-full items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Link to="/instructor-dashboard">
            <div className="text-black text-lg pl-2 h-10 w-10 flex items-center justify-center">
              <FaArrowLeft />
            </div>
          </Link>
          <Link to="/">
            <div className="flex gap-1 items-center">
              <img src={logo} alt="logo" className="h-[38px] border-l-2 border-black pl-3" />
              <span className="text-xl font-medium">E-Learning</span>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );

  return (
    <div className="p-6 space-y-8">
      <Navbar />
      <h1 className="text-3xl font-bold mt-16 mb-4">Quiz Builder</h1>

      {/* Search bar + category filter */}
      <div className="flex flex-col md:flex-row gap-3 md:items-center mb-4">
        {/* Search by course name */}
        <div className="flex-1">
          <input
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Category select (only shows categories that have at least one course) */}
        <div className="w-full md:w-60">
          <select
            className="w-full border rounded px-3 py-2 text-sm bg-white"
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
          >
            <option value="all">All categories</option>
            {categoryOptions.map(catName => (
              <option key={catName} value={catName}>
                {catName}
              </option>
            ))}
          </select>
        </div>

        {/* Clear filters button */}
        <button
          className="border rounded px-3 py-2 text-sm hover:bg-slate-100 transition"
          onClick={() => {
            setSearchTerm('');
            setCategoryFilter('all');
          }}
        >
          Clear filters
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCourses.map((course: any) => (
          <CourseCard
            key={course.id}
            course={course}
            modules={modules.filter((m: any) => m.courseId === course.id)}
            onOpenLessonQuiz={(payload: LessonPayload) => {
              setSelectedLesson(payload);
              setOpenLessonSheet(true);
            }}
            onOpenModuleQuiz={(payload: ModulePayload) => {
              setSelectedModule(payload);
              setOpenModuleSheet(true);
            }}
          />
        ))}
      </div>

      <LessonQuizSheet
        open={openLessonSheet}
        onOpenChange={v => {
          setOpenLessonSheet(v);
          if (!v) setSelectedLesson(null);
        }}
        baseSelected={selectedLesson}
      />

      <ModuleQuizSheet
        open={openModuleSheet}
        onOpenChange={v => {
          setOpenModuleSheet(v);
          if (!v) setSelectedModule(null);
        }}
        baseSelected={selectedModule}
      />
    </div>
  );
}
