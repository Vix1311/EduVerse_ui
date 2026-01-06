import { useDispatch } from 'react-redux';
import { Lesson } from '@/models/interface/moduleBuilder.interface';
import { Pencil, Trash2, ExternalLink } from 'lucide-react';
import type { AppDispatch } from '@/core/store/store';
import { deleteLesson } from '@/redux/slices/courseForm.slice';
import { getLessons } from '@/redux/slices/module.slice';
import { toast } from 'react-toastify';

interface Props {
  lesson: Lesson;
  courseId: number;
  moduleId: number;
  onEdit: (lesson: Lesson) => void;
}

export default function LessonItem({ lesson, courseId, moduleId, onEdit }: Props) {
  const dispatch = useDispatch<AppDispatch>();

  const handleDelete = async () => {
    if (!confirm('Delete this lesson?')) return;

    try {
      await dispatch(
        deleteLesson({
          courseId,
          moduleId,
          lessonId: Number(lesson.id),
        }),
      ).unwrap();
      await dispatch(getLessons({ courseId, moduleId })).unwrap();
      toast.success('Delete successfully');
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Delete lesson failed');
    }
  };

  return (
    <div className="flex items-center justify-between text-sm bg-white rounded px-3 py-2 shadow-sm">
      <div className="space-y-1">
        <div className="font-medium">{lesson.title}</div>

        <div className="text-xs text-gray-600 space-y-1">
          {lesson.videoUrl && (
            <div className="flex items-center gap-1 flex-wrap">
              <span className="font-semibold">Video:</span>
              <a
                href={lesson.videoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:underline"
              >
                <span>Open video</span>
                <ExternalLink size={12} />
              </a>
            </div>
          )}

          {lesson.documentUrl && (
            <div className="flex items-center gap-1 flex-wrap">
              <span className="font-semibold">Doc:</span>
              <a
                href={lesson.documentUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:underline break-all"
              >
                <span>Open document</span>
                <ExternalLink size={12} />
              </a>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleDelete}
          title="Delete lesson"
          className="p-1 rounded hover:bg-slate-100"
        >
          <Trash2 size={14} className="text-red-600" />
        </button>

        <button
          type="button"
          onClick={() => onEdit(lesson)}
          title="Edit lesson"
          className="p-1 rounded hover:bg-slate-100"
        >
          <Pencil size={14} className="text-blue-600" />
        </button>
      </div>
    </div>
  );
}
