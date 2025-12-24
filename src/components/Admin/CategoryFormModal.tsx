import { useEffect, useMemo } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/core/store/store';
import {
  createCategory,
  updateCategory,
  fetchCategories,
} from '@/redux/slices/adminSlices/category.slice';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Category } from '@/models/types/category.types';

type Props = {
  open: boolean;
  onClose: () => void;
  editingCategory?: Category | null;
  page: number;
  limit: number;
  sort_by: string | null;
  sort_order: 'asc' | 'desc';
  keyword?: string | null;
};

const Schema = z.object({
  name: z.string().min(1, 'Category name cannot be empty'),
  description: z.string().min(1, 'Description cannot be empty'),
  parent_id: z.string().optional(),
});

type FormValues = z.infer<typeof Schema>;

export default function CategoryFormModal({
  open,
  onClose,
  editingCategory = null,
  page,
  limit,
  sort_by,
  sort_order,
  keyword,
}: Props) {
  const dispatch = useDispatch<AppDispatch>();

  const defaults = useMemo<FormValues>(
    () => ({
      name: '',
      description: '',
      parent_id: undefined,
    }),
    [],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: defaults,
    mode: 'onSubmit',
    shouldFocusError: false,
  });

  useEffect(() => {
    if (!open) return;
    if (editingCategory) {
      form.reset({
        name: editingCategory.name ?? '',
        description: editingCategory.description ?? '',
        parent_id: editingCategory.parent_id || undefined,
      });
    } else {
      form.reset(defaults);
    }
  }, [open, editingCategory, form, defaults]);

  if (!open) return null;

  const isErr = (k: keyof FormValues) =>
    (form.formState.touchedFields[k] || form.formState.submitCount > 0) &&
    !!form.formState.errors[k];

  const busy = form.formState.isSubmitting;

  const submit = async (values: FormValues) => {
    const payload: any = {
      name: values.name,
      description: values.description,
    };
    if (values.parent_id && values.parent_id.trim() !== '') {
      payload.parent_id = values.parent_id.trim();
    }

    if (editingCategory?.id) {
      await dispatch(updateCategory({ id: editingCategory.id, data: payload })).unwrap();
    } else {
      await dispatch(createCategory(payload)).unwrap();
    }

    // reload list
    dispatch(
      fetchCategories({
        page,
        limit,
        sort_order,
        keyword: keyword || undefined,
      }),
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[520px] max-w-full mx-4">
        <h2 className="text-2xl font-semibold mb-4 text-center text-gray-800">
          {editingCategory ? 'Update Category' : 'Add Category'}
        </h2>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            {(['name', 'description', 'parent_id'] as const).map(field => {
              const showErr = isErr(field);
              const shouldFloat = !!form.watch(field) || showErr;
              const labelMap: Record<typeof field, string> = {
                name: 'Category Name',
                description: 'Description',
                parent_id: 'Parent ID (optional)',
              };
              return (
                <FormField
                  key={field}
                  control={form.control}
                  name={field}
                  render={({ field: f }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative group">
                          <Input
                            {...f}
                            id={field}
                            placeholder=" "
                            className="peer focus:border-blue-600"
                            isError={showErr}
                            errorMessage={
                              showErr
                                ? (form.formState.errors as any)[field]?.message?.toString()
                                : undefined
                            }
                          />
                          <label
                            htmlFor={field}
                            className={[
                              'pointer-events-none absolute left-3 bg-white px-1 transition',
                              ' text-sm sm:text-base md:text-base lg:text-lg',
                              shouldFloat
                                ? '-top-2 xl:-top-3.5 md-915-1000:-top-5 6xl:-top-7 scale-90'
                                : 'top-3.5 sm:top-4 md:top-5 lg:top-6 xl:top-3.5 md-915-1000:top-7 6xl:top-12',
                              'group-focus-within:-top-2 xl:group-focus-within:-top-3.5 md-915-1000:group-focus-within:-top-5 6xl:group-focus-within:-top-7 group-focus-within:scale-90',

                              showErr
                                ? 'text-red-500'
                                : 'text-slate-500 group-focus-within:text-blue-600',
                            ].join(' ')}
                          >
                            {labelMap[field]}
                          </label>
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
              );
            })}

            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                {busy
                  ? editingCategory
                    ? 'Updating...'
                    : 'Adding...'
                  : editingCategory
                    ? 'Update'
                    : 'Add Category'}
              </button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
