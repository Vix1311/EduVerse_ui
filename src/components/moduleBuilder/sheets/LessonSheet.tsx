// src/components/ModuleBuilder/sheets/LessonSheet.tsx

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '@/core/store/store';
import { createLesson, updateLesson } from '@/redux/slices/module.slice';
import { uploadLessonPdf } from '@/redux/slices/courseForm.slice';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import type { Lesson } from '@/models/interface/moduleBuilder.interface';

type LessonMode = 'create' | 'edit';

interface LessonSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: number;
  moduleId: number | null;
  mode: LessonMode;
  lesson?: Lesson | null;
}

/**
 * LessonSheet
 * Side sheet for creating and editing lessons.
 * - In CREATE mode: user can set title, video URL, document URL (link only).
 *   To upload PDF, they must first create the lesson, then edit it.
 * - In EDIT mode: user can choose between document link or uploading a PDF file.
 */
export default function LessonSheet({
  open,
  onOpenChange,
  courseId,
  moduleId,
  mode,
  lesson,
}: LessonSheetProps) {
  const dispatch = useDispatch<AppDispatch>();

  // Basic fields
  const [title, setTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  // Document
  const [useLink, setUseLink] = useState(true); // only meaningful in edit mode
  const [documentUrl, setDocumentUrl] = useState('');
  const [documentFile, setDocumentFile] = useState<File | null>(null); // only edit mode

  const [isPreviewable, setIsPreviewable] = useState(false);
  const [lessonOrder, setLessonOrder] = useState<number>(1);

  // Prefill / reset
  useEffect(() => {
    if (mode === 'edit' && lesson) {
      setTitle(lesson.title || '');
      setVideoUrl((lesson as any).videoUrl || (lesson as any).video_url || '');

      const docUrl =
        (lesson as any).documentUrl ||
        (lesson as any).document_url ||
        (lesson as any).materialUrl ||
        '';
      if (docUrl) {
        setUseLink(true);
        setDocumentUrl(docUrl);
        setDocumentFile(null);
      } else {
        setUseLink(true); // default to link mode, empty
        setDocumentUrl('');
        setDocumentFile(null);
      }

      setIsPreviewable(!!(lesson as any).isPreviewable);
      setLessonOrder((lesson as any).lessonOrder ?? (lesson as any).order ?? 1);
    } else if (mode === 'create') {
      setTitle('');
      setVideoUrl('');
      setUseLink(true);
      setDocumentUrl('');
      setDocumentFile(null);
      setIsPreviewable(false);
      setLessonOrder(1);
    }
  }, [mode, lesson, open]);

  const canSubmit = !!moduleId && title.trim().length > 0;

  const extractLessonId = (created: any): number | null => {
    if (!created) return null;
    return (
      Number(created.id) ||
      Number(created.lessonId) ||
      Number(created.lesson_id) ||
      Number(created.data?.id) ||
      null
    );
  };

  const handleSubmit = async () => {
    if (!canSubmit || !moduleId) return;

    // documentUrl logic:
    // - create: always use documentUrl state (link only)
    // - edit: only send when useLink === true
    const docUrlToSend =
      mode === 'create'
        ? documentUrl.trim() || undefined
        : useLink && documentUrl.trim()
          ? documentUrl.trim()
          : undefined;

    const payload: any = {
      title: title.trim(),
      videoUrl: videoUrl.trim() || undefined,
      documentUrl: docUrlToSend,
      isPreviewable,
      lessonOrder: Number(lessonOrder || 1),
    };

    try {
      if (mode === 'create') {
        // Create lesson (NO file upload here)
        await dispatch(
          createLesson({
            courseId,
            moduleId,
            payload,
          }),
        ).unwrap();

        toast.success('Lesson created');

        // Reset for next lesson
        setTitle('');
        setVideoUrl('');
        setDocumentUrl('');
        setIsPreviewable(false);
        setLessonOrder(prev => prev + 1);
      } else if (mode === 'edit' && lesson) {
        // Update lesson
        await dispatch(
          updateLesson({
            courseId,
            moduleId,
            lessonId: Number(lesson.id),
            payload,
          }),
        ).unwrap();

        // If in file mode and a PDF is selected, upload it
        if (!useLink && documentFile) {
          await dispatch(
            uploadLessonPdf({
              courseId,
              moduleId,
              lessonId: Number(lesson.id),
              file: documentFile,
            }),
          ).unwrap();
        }

        toast.success('Lesson updated');
        onOpenChange(false);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Lesson action failed');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{mode === 'create' ? 'Add lesson' : 'Edit lesson'}</SheetTitle>
          <SheetDescription>
            {mode === 'create'
              ? 'Create a new lesson for the current module.'
              : 'Update the information of this lesson.'}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-3">
          {/* Title */}
          <div>
            <label className="block text-sm mb-1">Title</label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Lesson title"
            />
          </div>

          {/* Video URL */}
          <div>
            <label className="block text-sm mb-1">Video URL</label>
            <Input
              value={videoUrl}
              onChange={e => setVideoUrl(e.target.value)}
              placeholder="https://example.com/video.mp4"
            />
          </div>

          {/* Document */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Document</span>

              {mode === 'edit' && (
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-1">
                    <input type="radio" checked={useLink} onChange={() => setUseLink(true)} />
                    <span>Use link</span>
                  </label>
                  <label className="inline-flex items-center gap-1">
                    <input type="radio" checked={!useLink} onChange={() => setUseLink(false)} />
                    <span>Upload PDF file</span>
                  </label>
                </div>
              )}
            </div>

            {/* CREATE MODE: only link + info message */}
            {mode === 'create' && (
              <>
                <Input
                  value={documentUrl}
                  onChange={e => setDocumentUrl(e.target.value)}
                  placeholder="https://example.com/doc.pdf (optional)"
                />
                <p className="text-xs text-amber-600 mt-1">
                  To upload a PDF file, please create this lesson first, then open it in{' '}
                  <span className="font-semibold">Edit</span> mode.
                </p>
              </>
            )}

            {/* EDIT MODE: link or file depending on useLink */}
            {mode === 'edit' && (
              <>
                {useLink ? (
                  <Input
                    value={documentUrl}
                    onChange={e => setDocumentUrl(e.target.value)}
                    placeholder="https://example.com/doc.pdf"
                  />
                ) : (
                  <Input
                    type="file"
                    accept="application/pdf"
                    onChange={e => setDocumentFile(e.target.files?.[0] || null)}
                  />
                )}
              </>
            )}
          </div>

          {/* Preview flag */}
          <div className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isPreviewable}
              onChange={e => setIsPreviewable(e.target.checked)}
            />
            <span>Allow preview for this lesson</span>
          </div>

          {/* Lesson order */}
          <div>
            <label className="block text-sm mb-1">Lesson order</label>
            <Input
              type="number"
              min={1}
              value={lessonOrder}
              onChange={e => setLessonOrder(Number(e.target.value) || 1)}
            />
          </div>
        </div>

        <SheetFooter className="mt-6 flex justify-between">
          <button
            className="px-4 py-2 rounded-md bg-violet-600 text-white text-sm disabled:opacity-60"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {mode === 'create' ? 'Save & continue' : 'Save changes'}
          </button>
          <button
            className="px-4 py-2 rounded-md border text-sm"
            onClick={() => onOpenChange(false)}
          >
            Close
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
