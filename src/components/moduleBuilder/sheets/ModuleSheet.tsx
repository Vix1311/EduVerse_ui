import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetDescription,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import type { AppDispatch } from '@/core/store/store';
import { createModule, updateModule } from '@/redux/slices/module.slice';
import type { Module } from '@/models/interface/moduleBuilder.interface';

import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';

type ModuleSheetMode = 'create' | 'edit';

interface ModuleSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  courseId: number;
  mode: ModuleSheetMode;
  module?: Module | null;
}

export default function ModuleSheet({
  open,
  onOpenChange,
  courseId,
  mode,
  module,
}: ModuleSheetProps) {
  const dispatch = useDispatch<AppDispatch>();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [chapterOrder, setChapterOrder] = useState<number>(1);

  useEffect(() => {
    if (mode === 'edit' && module) {
      setTitle(module.title || '');
      setDescription(module.description || '');
      setChapterOrder(module.chapterOrder ?? 1);
    } else if (mode === 'create') {
      setTitle('');
      setDescription('');
      setChapterOrder(1);
    }
  }, [mode, module, open]);

  const canSubmit = title.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    const payload = {
      title: title.trim(),
      description: description.trim(),
      chapterOrder: Number(chapterOrder || 1),
    };

    try {
      if (mode === 'create') {
        await dispatch(
          createModule({
            courseId,
            payload,
          }),
        ).unwrap();

        toast.success('Module created successfully');

        setTitle('');
        setDescription('');
        setChapterOrder(prev => prev + 1);
      } else if (mode === 'edit' && module) {
        // PATCH /modules/{id}
        await dispatch(
          updateModule({
            courseId,
            moduleId: Number(module.id),
            payload,
          }),
        ).unwrap();

        toast.success('Updated modules successfully');
        onOpenChange(false); // đóng sheet sau khi sửa xong
      }
    } catch (err: any) {
      toast.error(err?.message || 'Module operation failed');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{mode === 'create' ? 'Add new modules' : 'Edit modules'}</SheetTitle>
          <SheetDescription>
            {mode === 'create' ? 'Create modules for your course.' : 'Update module information.'}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-sm mb-1">Title</label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Chapter/module name"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Describe</label>
            <Textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Short description of chapter content"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Chapter Order</label>
            <Input
              type="number"
              value={chapterOrder}
              onChange={e => setChapterOrder(Number(e.target.value) || 1)}
              min={1}
            />
          </div>
        </div>

        <SheetFooter className="mt-6 flex justify-between">
          <button
            className="px-4 py-2 rounded-md bg-violet-600 text-white text-sm disabled:opacity-60"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {mode === 'create' ? 'Save & Continue' : 'Save changes'}
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
