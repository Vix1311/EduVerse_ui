import { useState } from 'react';
import LessonItem from './LessonItem';
import { Lesson, Module } from '@/models/interface/moduleBuilder.interface';
import { ChevronDown, ChevronUp, Pencil, Trash } from 'lucide-react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '@/core/store/store';
import { deleteModule, getLessons } from '@/redux/slices/module.slice';

interface Props {
  module: Module;
  courseId: number;
  onAddLesson: (moduleId: number) => void;
  onEdit: () => void;
  onEditLesson: (lesson: Lesson) => void;
  onRefreshModules?: () => void;
}

export default function ModuleItem({
  module,
  courseId,
  onAddLesson,
  onEdit,
  onEditLesson,
  onRefreshModules,
}: Props) {
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch<AppDispatch>();

  const handleToggleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next && (!module.lessons || module.lessons.length === 0)) {
      dispatch(getLessons({ courseId, moduleId: module.id }));
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this module?')) return;
    await dispatch(deleteModule({ courseId, id: module.id }));
    onRefreshModules?.();
  };

  return (
    <div className="border rounded-md bg-white shadow-sm">
      <div className="flex items-center justify-between px-3 py-2">
        <div
          className="flex items-center gap-2 cursor-pointer select-none"
          onClick={handleToggleOpen}
        >
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          <div>
            <div className="font-semibold text-sm">{module.title}</div>
            {module.description && (
              <div className="text-xs text-gray-500 line-clamp-1">{module.description}</div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="text-xs text-violet-600 hover:text-violet-800"
            onClick={() => onAddLesson(module.id)}
          >
            + Lesson
          </button>
          <button onClick={onEdit}>
            <Pencil size={16} className="text-blue-600 hover:text-blue-800" />
          </button>
          <button onClick={handleDelete}>
            <Trash size={16} className="text-red-600 hover:text-red-800" />
          </button>
        </div>
      </div>

      {open && (
        <div className="p-3 pt-1 pl-6 space-y-2 bg-gray-50">
          {module.lessons?.length ? (
            module.lessons.map(lesson => (
              <LessonItem
                key={lesson.id}
                lesson={lesson}
                courseId={courseId}
                moduleId={module.id}
                onEdit={onEditLesson}
              />
            ))
          ) : (
            <div className="text-xs text-gray-400 italic">No lesson yet</div>
          )}
        </div>
      )}
    </div>
  );
}
