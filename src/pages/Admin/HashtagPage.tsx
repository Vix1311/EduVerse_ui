import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/core/store/store';
import {
  fetchHashtags,
  createHashtag,
  updateHashtag,
  deleteHashtag,
} from '@/redux/slices/hashtag.slice';
import { toast } from 'react-toastify';
import { FaTrash, FaEdit } from 'react-icons/fa';
import Sidebar from '@/components/Admin/Sidebar';
import Header from '@/components/Admin/Header';
import { AiOutlineReload } from 'react-icons/ai';

type Row = {
  index: number;
  id: number;
  name: string;
};

const HashtagPage = () => {
  const dispatch = useDispatch<AppDispatch>();

  const { items, loading } = useSelector((state: RootState) => state.hashtag);

  const [openModal, setOpenModal] = useState(false);
  const [editingRow, setEditingRow] = useState<Row | null>(null);
  const [name, setName] = useState('');

  useEffect(() => {
    dispatch(fetchHashtags());
  }, [dispatch]);

  const rows = useMemo<Row[]>(
    () =>
      (items || []).map((h: any, idx: number) => ({
        index: idx + 1,
        id: h.id,
        name: h.name,
      })),
    [items],
  );

  const openCreateModal = () => {
    setEditingRow(null);
    setName('');
    setOpenModal(true);
  };

  const openEditModal = (row: Row) => {
    setEditingRow(row);
    setName(row.name);
    setOpenModal(true);
  };

  const handleDelete = async (row: Row) => {
    if (!window.confirm(`Are you sure you want to delete the hashtag "${row.name}"?`)) return;
    try {
      await dispatch(deleteHashtag(row.id)).unwrap();
      toast.success('Hashtag deletion successful');
      dispatch(fetchHashtags());
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Hashtag deletion failed');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Hashtag name cannot be empty');
      return;
    }

    try {
      if (editingRow) {
        await dispatch(
          updateHashtag({
            id: editingRow.id,
            name: name.trim(),
          }),
        ).unwrap();
        toast.success('Hashtag update successful');
      } else {
        await dispatch(createHashtag(name.trim())).unwrap();
        toast.success('Hashtag creation successful');
      }

      setOpenModal(false);
      setEditingRow(null);
      setName('');
      dispatch(fetchHashtags());
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Hammer saving failed');
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Header />

        <div className="bg-white rounded-xl shadow p-4 mt-6">
          <div className="flex justify-between mb-4 items-center">
            <h3 className="text-lg font-semibold">Hashtag list</h3>

            <div className="flex gap-3">
              <button
                onClick={() => dispatch(fetchHashtags())}
                disabled={loading}
                className="border px-3 py-2 rounded hover:bg-gray-100 disabled:opacity-60"
              >
                <AiOutlineReload className={`text-xl ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                type="button"
                onClick={openCreateModal}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                + Add hashtag
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="p-2 w-16">#</th>
                  <th className="p-2">Hashtag name</th>
                  <th className="p-2 text-center w-32">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && !loading && (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-gray-500">
                      No hashtags yet.
                    </td>
                  </tr>
                )}

                {rows.map(row => (
                  <tr key={row.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{row.index}</td>
                    <td className="p-2 font-medium">#{row.name}</td>
                    <td className="p-2">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          title="Sửa hashtag"
                          onClick={() => openEditModal(row)}
                          className="p-2 rounded border hover:bg-gray-100 text-blue-600"
                        >
                          <FaEdit />
                        </button>
                        <button
                          title="Xóa hashtag"
                          onClick={() => handleDelete(row)}
                          className="p-2 rounded border hover:bg-gray-100 text-red-600"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {loading && (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-gray-500">
                      Loading data...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {openModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
              <div className="border-b px-6 py-4 flex justify-between items-center">
                <h2 className="text-lg font-semibold">
                  {editingRow ? 'Edit hashtag' : 'Add hashtag'}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setOpenModal(false);
                    setEditingRow(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Hashtag name</label>
                  <input
                    className="w-full border rounded px-3 py-2"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="For example: javascript, reactjs..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOpenModal(false);
                      setEditingRow(null);
                    }}
                    className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                  >
                    {editingRow ? 'Save changes' : 'Create new'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default HashtagPage;
