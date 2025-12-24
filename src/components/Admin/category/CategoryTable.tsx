import { FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import { Category } from '@/models/types/category.types';

interface Props {
  categories: Category[];
  onEdit: (cat: Category) => void;
  onView: (cat: Category) => void;
  onDelete: (cat: Category) => void;
}

const CategoryTable: React.FC<Props> = ({ categories, onEdit, onView, onDelete }) => {
  return (
    <table className="w-full text-sm text-gray-700 border-collapse table-fixed">
      <colgroup>
        <col className="w-[150px]" />
        <col className="w-[200px]" />
        <col className="w-[300px]" />
        <col className="w-[200px]" />
        <col className="w-[150px]" />
        <col className="w-[100px]" />
        <col className="w-[150px]" />
      </colgroup>
      <thead className="bg-gray-100">
        <tr>
          <th className="px-4 py-2 text-left">ID</th>
          <th className="px-4 py-2 text-left">Tên</th>
          <th className="px-4 py-2 text-left">Slug</th>
          <th className="px-4 py-2 text-left">Ngày tạo</th>
          <th className="px-4 py-2 text-left">Trạng thái</th>
          <th className="px-4 py-2 text-left">Hành động</th>
        </tr>
      </thead>
      <tbody>
        {categories.map(cat => (
          <tr key={cat.id} className="border-b hover:bg-gray-50">
            <td className="px-4 py-2">{cat.id}</td>
            <td className="px-4 py-2">{cat.name}</td>
            <td className="px-4 py-2">{cat.slug}</td>
            <td className="px-4 py-2">{cat.createdAt}</td>
            <td className="px-4 py-2">
              <div
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-default ${
                  cat.isActive ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow-md transform duration-300 ${
                    cat.isActive ? 'translate-x-6' : ''
                  }`}
                />
              </div>
            </td>
            <td className="px-4 py-2 flex gap-2">
              <button
                title="click"
                onClick={() => onView(cat)}
                className="text-green-500 p-2 border rounded shadow"
              >
                <FaEye size={14} />
              </button>
              <button
                title="click"
                onClick={() => onEdit(cat)}
                className="text-blue-500 p-2 border rounded shadow"
              >
                <FaEdit size={14} />
              </button>
              <button
                title="click"
                onClick={() => onDelete(cat)}
                className="text-red-500 p-2 border rounded shadow"
              >
                <FaTrash size={14} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default CategoryTable;
