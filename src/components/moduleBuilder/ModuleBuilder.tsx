import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import ModuleSheet from './sheets/ModuleSheet';
import ModuleItem from './ModuleItem';

import type { AppDispatch, RootState } from '@/core/store/store';
import type { Lesson, Module } from '@/models/interface/moduleBuilder.interface';
import LessonSheet from './sheets/LessonSheet';
import { getModules } from '@/redux/slices/module.slice';

export default function ModuleBuilder({ courseId }: { courseId: number }) {
  const dispatch = useDispatch<AppDispatch>();
  const modules = useSelector((state: RootState) =>
    (state.module.modules || []).filter(m => Number(m.courseId) === Number(courseId)),
  );
  const [openSheet, setOpenSheet] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [lessonSheetOpen, setLessonSheetOpen] = useState(false);
  const [activeModuleId, setActiveModuleId] = useState<number | null>(null);

  const [lessonMode, setLessonMode] = useState<'create' | 'edit'>('create');
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  const handleAddLesson = (moduleId: number) => {
    setActiveModuleId(moduleId);
    setLessonMode('create');
    setEditingLesson(null);
    setLessonSheetOpen(true);
  };

  const handleEditLesson = (moduleId: number, lesson: Lesson) => {
    setActiveModuleId(moduleId);
    setLessonMode('edit');
    setEditingLesson(lesson);
    setLessonSheetOpen(true);
  };

  useEffect(() => {
    if (!courseId) return;
    dispatch(getModules(courseId));
    console.log('[USEEFFECT] getModules for courseId', courseId);
  }, [courseId, dispatch]);

  const handleAddModule = () => {
    setMode('create');
    setEditingModule(null);
    setOpenSheet(true);
  };

  const handleEditModule = (m: Module) => {
    setMode('edit');
    setEditingModule(m);
    setOpenSheet(true);
  };

  return (
    <div className="border rounded-lg p-4 bg-white space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">Modules</h2>
        <button
          className="px-3 py-1 rounded-md bg-violet-600 text-white text-sm hover:bg-violet-700"
          onClick={handleAddModule}
        >
          + Add module
        </button>
      </div>

      <div className="space-y-2">
        {modules.map(m => (
          <ModuleItem
            key={m.id}
            module={m}
            courseId={courseId}
            onAddLesson={handleAddLesson}
            onEdit={() => handleEditModule(m)}
            onEditLesson={lesson => handleEditLesson(m.id, lesson)}
          />
        ))}
        <LessonSheet
          open={lessonSheetOpen}
          onOpenChange={open => {
            if (!open) {
              setLessonSheetOpen(false);
              setLessonMode('create');
              setEditingLesson(null);
            } else {
              setLessonSheetOpen(true);
            }
          }}
          courseId={courseId}
          moduleId={activeModuleId}
          mode={lessonMode}
          lesson={editingLesson}
        />

        {modules.length === 0 && (
          <div className="text-sm text-gray-500 italic">
            No module yet. Click &quot;Add module&quot; to add the first chapter.
          </div>
        )}
      </div>

      <ModuleSheet
        open={openSheet}
        onOpenChange={open => {
          if (!open) {
            setOpenSheet(false);
            setMode('create');
            setEditingModule(null);
          } else {
            setOpenSheet(true);
          }
        }}
        courseId={courseId}
        mode={mode}
        module={editingModule}
      />
    </div>
  );
}
