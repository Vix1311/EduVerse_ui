import { categoryService } from '@/core/services/category.service';
import { Category } from '@/models/types/category.types';
import { useState } from 'react';

interface Props {
  type: 'view' | 'edit' | 'add' | 'delete' | null;
  category: Category | null;
  onClose: () => void;
  onRefresh: () => void;
  onConfirmDelete: (id: string) => void;
}

const CategoryModals: React.FC<Props> = ({
  type,
  category,
  onClose,
  onRefresh,
  onConfirmDelete,
}) => {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    description: category?.description || '',
    thumbnail: category?.thumbnail || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    try {
      if (type === 'edit' && category) {
        const updatedData = {
          name: formData.name.trim(),
          description: formData.description.trim(),
          thumbnail: formData.thumbnail.trim(),
        };
        console.log('Submitting data', { id: category?.id, formData });

        await categoryService.update(category.id, updatedData);
        toast.success('Category update successful');
      } else if (type === 'add') {
        const newData = {
          name: formData.name.trim(),
          description: formData.description.trim(),
          thumbnail: formData.thumbnail.trim(),
        };
        await categoryService.create(newData);
        toast.success('Category added successfully');
      }

      onRefresh();
      onClose();
    } catch (err: any) {
      if (err.response?.data?.message) {
        console.error(err.response.data.message);
      } else {
        toast.error('An error occurred while sending data');
      }
    }
  };

  if (!type) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded shadow-lg w-96">
        {type === 'view' && category && (
          <>
            <h2 className="text-lg font-semibold mb-4">Category Details</h2>
            <p>
              <strong>ID:</strong> {category.id}
            </p>
            <p>
              <strong>Name:</strong> {category.name}
            </p>
            <p>
              <strong>Slug:</strong> {category.slug}
            </p>
            <p>
              <strong>Status:</strong> {category.isActive ? 'Active' : 'Inactive'}
            </p>
            <button className="mt-4 bg-gray-300 px-4 py-2 rounded" onClick={onClose}>
              Close
            </button>
          </>
        )}

        {(type === 'edit' || type === 'add') && (
          <>
            <h2 className="text-lg font-semibold mb-4">
              {type === 'edit' ? 'Edit category' : 'Add category'}
            </h2>
            <input
              className="w-full border px-3 py-2 mb-3 rounded"
              name="name"
              placeholder="Category Name"
              value={formData.name}
              onChange={handleChange}
            />
            <textarea
              className="w-full border px-3 py-2 mb-3 rounded"
              name="description"
              placeholder="Description"
              value={formData.description}
              onChange={handleChange}
            />
            <input
              className="w-full border px-3 py-2 mb-3 rounded"
              name="thumbnail"
              placeholder="Thumbnail link"
              value={formData.thumbnail}
              onChange={handleChange}
            />
            <div className="flex justify-end gap-2">
              <button onClick={onClose} className="bg-gray-300 px-4 py-2 rounded">
                Cancel
              </button>
              <button onClick={handleSubmit} className="bg-blue-500 text-white px-4 py-2 rounded">
                {type === 'edit' ? 'Save' : 'Add'}
              </button>
            </div>
          </>
        )}

        {type === 'delete' && category && (
          <>
            <h2 className="text-lg font-semibold mb-4 text-center">Xác nhận xóa</h2>
            <p className="text-center mb-4">
              Bạn có chắc chắn muốn xóa <strong>{category.name}</strong>?
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={onClose} className="bg-gray-300 px-4 py-2 rounded">
                Hủy
              </button>
              <button
                onClick={() => onConfirmDelete(category.id)}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                Xóa
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CategoryModals;
import { toast } from 'react-toastify';
