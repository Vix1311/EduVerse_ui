import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { logo } from '@/assets/images';
import { Input } from '@/components/ui/input';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '@/core/store/store';
import {
  createHashtag,
  deleteHashtag,
  fetchHashtags,
  updateHashtag,
} from '@/redux/slices/hashtag.slice';
import {
  createCourse,
  listCourses,
  restoreCourse,
  softDeleteCourse,
  updateCourse,
  updateCourseStatus,
} from '@/redux/slices/courseForm.slice';
import { fetchCategories } from '@/redux/slices/category.slice';
import { toast } from 'react-toastify';
import ModuleBuilder from '@/components/moduleBuilder/ModuleBuilder';
import { FaArrowLeft } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';

/* ----------------------------- Status Label ----------------------------- */
function StatusLabel({ status }: { status: 'pending' | 'approved' }) {
  const ui =
    status === 'approved'
      ? { text: 'Approved', cls: 'bg-sky-100 text-sky-700 border-sky-200' }
      : { text: 'Pending', cls: 'bg-violet-100 text-violet-700 border-violet-200' };

  return (
    <span
      className={[
        'inline-flex items-center justify-center px-2 py-0.5 rounded font-semibold border text-xs capitalize',
        ui.cls,
      ].join(' ')}
      title={ui.text}
      aria-label={ui.text}
    >
      {ui.text}
    </span>
  );
}

/* --------------------------------- Types -------------------------------- */
type Course = {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  categoryId: number;
  categoryName: string;
  price: number;
  hashtagIds: number[];
  isFree: boolean;
  isFeatured: boolean;
  isPreorder: boolean;
  previewDescription: string;
  status: 'pending' | 'approved' | 'blacklisted';
  updatedAt: number;
};

/* -------------------------------- Helpers -------------------------------- */
function formatVND(n: number) {
  return new Intl.NumberFormat('vi-VN').format(n);
}

/* ------------------------------- Main Page ------------------------------- */
export default function CourseFormPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [tab, setTab] = useState<'list' | 'create' | 'detail' | 'edit'>('list');
  const [activeId, setActiveId] = useState<string>('');
  const [search, setSearch] = useState('');

  const didFetchRef = useRef(false);

  useEffect(() => {
    if (tab !== 'list') return;
    if (didFetchRef.current) return;
    didFetchRef.current = true;
    dispatch(listCourses());
  }, [tab, dispatch]);

  const { courses, loading } = useSelector((s: RootState) => s.courseForm);
  const hashtagItems = useSelector((s: RootState) => s.hashtag.items || []);

  useEffect(() => {
    dispatch(fetchHashtags());
  }, [dispatch]);

  const categoryLoading = useSelector((s: RootState) => s.categories.loading);
  const categoryItems = useSelector((state: RootState) => state.category.categories);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);
  useEffect(() => {}, [categoryLoading, categoryItems]);

  const catMap = useMemo(
    () => Object.fromEntries((categoryItems || []).map((c: any) => [Number(c.id), c.name])),
    [categoryItems],
  );
  const hashtagMap = useMemo(
    () => Object.fromEntries((hashtagItems || []).map((h: any) => [h.id, h.name])),
    [hashtagItems],
  );

  const itemsFromApi = useMemo<Course[]>(
    () =>
      (courses || []).map((apiItem: any) => {
        const rawStatus = String(apiItem.status || 'pending').toLowerCase();
        const normStatus = rawStatus.toLowerCase() as 'approved' | 'pending' | 'blacklisted';

        const categoryId = Number(apiItem.categoryId);
        return {
          id: String(apiItem.id),
          title: apiItem.title,
          description: apiItem.description,
          thumbnail: apiItem.thumbnail,
          categoryId,
          categoryName: catMap[categoryId] ?? '',
          price: Number(apiItem.price || 0),
          hashtagIds: Array.isArray(apiItem.hashtagIds)
            ? apiItem.hashtagIds.map((x: any) => Number(x))
            : [],
          isFree: !!apiItem.isFree,
          isFeatured: !!apiItem.isFeatured,
          isPreorder: !!apiItem.isPreorder,
          previewDescription: apiItem.previewDescription || '',
          status: normStatus,
          updatedAt: new Date(apiItem.updatedAt || Date.now()).getTime(),
        };
      }),
    [courses, catMap],
  );

  // load list when entering List tab
  useEffect(() => {
    if (tab === 'list') dispatch(listCourses());
  }, [tab, dispatch]);
  const active = useMemo(
    () => itemsFromApi.find(i => i.id === activeId) || null,
    [itemsFromApi, activeId],
  );

  const navigate = useNavigate();

  const handleBack = () => {
    if (tab === 'list') {
      navigate('/instructor-dashboard');
    } else {
      setTab('list');
      setActiveId('');
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col">
      <header className="border-b border-violet-200/60 bg-white/70 backdrop-blur pr-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="text-black text-lg pl-2 h-10 w-10 flex items-center justify-center"
          >
            <FaArrowLeft />
          </button>
          <Link to="/">
            <div className="flex gap-1 items-center border-black border-r-2 pr-3">
              <img
                src={logo}
                alt="logo"
                className="transition-all duration-300 border-black border-l-2 pl-3 h-[38px]"
              />
              <span className="text-xl font-medium ">E-Learning</span>
            </div>
          </Link>
          <h1 className="text-xl font-semibold">Course</h1>
          <nav className="flex gap-2 text-sm">
            <button
              className={`px-3 py-1 rounded-md border ${tab === 'list' ? 'bg-muted' : 'hover:bg-muted'}`}
              onClick={() => setTab('list')}
            >
              List
            </button>
            <button
              className={`px-3 py-1 rounded-md border ${tab === 'create' ? 'bg-muted' : 'hover:bg-muted'}`}
              onClick={() => setTab('create')}
            >
              Create
            </button>
            <button
              disabled={!active}
              className={`px-3 py-1 rounded-md border ${tab === 'detail' ? 'bg-muted' : 'hover:bg-muted'} disabled:opacity-50`}
              onClick={() => setTab('detail')}
            >
              Detail
            </button>
            {tab === 'list' && (
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search title…"
                className="ml-4 w-64 border border-slate-300 rounded-md px-3 py-1 text-sm outline-none focus:border-violet-500 transition"
              />
            )}
          </nav>
        </div>
        <Button onClick={() => setTab('create')}>Create course</Button>
      </header>

      <main className="flex-1 p-4">
        {tab === 'list' && (
          <CourseList
            items={itemsFromApi}
            catMap={catMap}
            hashtagMap={hashtagMap}
            loading={loading}
            search={search}
            onSearch={setSearch}
            onOpen={id => {
              setActiveId(id);
              setTab('detail');
            }}
            onToggleStatus={() => {}}
          />
        )}
        {tab === 'create' && <CourseCreate hashtagMap={hashtagMap} onSubmit={() => {}} />}
        {tab === 'detail' && active && (
          <CourseDetail
            item={active}
            catMap={catMap}
            hashtagMap={hashtagMap}
            onBack={() => setTab('list')}
            onEdit={() => setTab('edit')}
          />
        )}
        {tab === 'edit' && active && (
          <CourseEdit course={active} hashtagMap={hashtagMap} onBack={() => setTab('detail')} />
        )}
      </main>
    </div>
  );
}

/* ---------------------------------- List --------------------------------- */
function CourseList({
  items,
  catMap,
  hashtagMap,
  loading,
  search,
  onSearch,
  onOpen,
  onToggleStatus,
}: {
  items: Course[];
  catMap: Record<number, string>;
  hashtagMap: Record<number, string>;
  loading: boolean;
  search: string;
  onSearch: (x: string) => void;
  onOpen: (id: string) => void;
  onToggleStatus: (id: string) => void;
}) {
  const [q, setQ] = useState('');
  const dispatch = useDispatch<AppDispatch>();

  const filtered = items
    .filter(it => !search || it.title.toLowerCase().includes(search.toLowerCase()))
    .filter(it => ['pending', 'approved', 'blacklisted'].includes(it.status?.toLowerCase()));

  if (loading) return <div className="text-sm text-gray-500">Loading courses…</div>;
  if (!loading && items.length === 0)
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-3 items-center"></div>
        <div className="text-sm text-gray-500">No courses found.</div>
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full border border-slate-200 border-collapse text-sm rounded-lg overflow-hidden">
          <thead className="bg-slate-50">
            <tr className="text-left text-slate-600">
              <th className="px-2 py-2 border border-slate-200">Thumbnail</th>
              <th className="px-2 py-2 border border-slate-200">Title</th>
              <th className="px-2 py-2 border border-slate-200">Category</th>
              <th className="px-2 py-2 border border-slate-200">Price</th>
              <th className="px-2 py-2 border border-slate-200">Status</th>
              <th className="px-2 py-2 border border-slate-200">Updated</th>
              <th className="px-2 py-2 border border-slate-200">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(it => (
              <tr
                key={it.id}
                className="hover:bg-violet-50 cursor-pointer transition-colors"
                onClick={() => onOpen(it.id)}
              >
                <td className="px-2 py-2 border border-slate-200">
                  <img src={it.thumbnail} className="h-10 w-16 object-cover rounded" />
                </td>
                <td className="px-2 py-2 border border-slate-200 font-medium">{it.title}</td>
                <td className="px-2 py-2 border border-slate-200">
                  {it.categoryName || catMap[it.categoryId] || `#${it.categoryId}`}
                </td>
                <td className="px-2 py-2 border border-slate-200">
                  {it.isFree ? (
                    <span className="px-2 py-0.5 rounded bg-emerald-600/10 text-emerald-700 text-xs">
                      Free
                    </span>
                  ) : (
                    `${formatVND(it.price)}₫`
                  )}
                </td>
                <td className="px-2 py-2 border border-slate-200">
                  {it.status === 'blacklisted' ? (
                    <span className="inline-block px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-medium border border-gray-200">
                      Blacklisted
                    </span>
                  ) : (
                    <StatusLabel status={it.status} />
                  )}
                </td>
                <td className="px-2 py-2 border border-slate-200 text-sm text-gray-500">
                  {new Date(it.updatedAt).toLocaleString()}
                </td>
                <td className="px-2 py-2 border border-slate-200">
                  <button
                    className="px-3 py-1 rounded-md border hover:bg-muted"
                    onClick={e => {
                      e.stopPropagation();
                      onOpen(it.id);
                    }}
                  >
                    Open
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* -------------------------- Tag chip & TagPicker ------------------------- */
function TagChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-orange-200 text-orange-900 text-xs font-medium">
      {label}
      <button className="ml-1 rounded hover:bg-orange-300/60 px-1 leading-none" onClick={onRemove}>
        ✕
      </button>
    </span>
  );
}

type PickerItem = { id: number; label: string };

function TagPicker({
  value,
  onChange,
  options,
  placeholder = 'Select hashtags…',
}: {
  value: number[];
  onChange: (ids: number[]) => void;
  options: PickerItem[];
  placeholder?: string;
}) {
  const [q, setQ] = useState('');
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const map = useMemo(() => new Map(options.map(o => [o.id, o.label])), [options]);
  const selected = value.map(id => ({ id, label: map.get(id) || `#${id}` }));
  const rest = options.filter(
    o => !value.includes(o.id) && (!q || o.label.toLowerCase().includes(q.toLowerCase())),
  );

  const add = (id: number) => {
    if (!value.includes(id)) onChange([...value, id]);
    setQ('');
    inputRef.current?.focus();
  };
  const remove = (id: number) => onChange(value.filter(v => v !== id));

  return (
    <div className="relative">
      <div
        className="min-h-[44px] w-full rounded-md border p-2 flex flex-wrap gap-2 cursor-text bg-white"
        onClick={() => inputRef.current?.focus()}
      >
        {selected.map(tag => (
          <TagChip key={tag.id} label={tag.label} onRemove={() => remove(tag.id)} />
        ))}
        <input
          ref={inputRef}
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && rest[0]) {
              e.preventDefault();
              add(rest[0].id);
            }
            if (e.key === 'Backspace' && !q && selected.length)
              remove(selected[selected.length - 1].id);
          }}
          placeholder={selected.length ? '' : placeholder}
          className="flex-1 min-w-[120px] outline-none text-sm bg-transparent"
        />
      </div>
      {rest.length > 0 && q && (
        <div className="absolute z-20 mt-1 w-full rounded-md border bg-white shadow max-h-52 overflow-auto">
          {rest.map(opt => (
            <button
              key={opt.id}
              onClick={() => add(opt.id)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* --------------------------------- Create -------------------------------- */
function CourseCreate({
  onSubmit,
  hashtagMap,
}: {
  onSubmit: (payload: Omit<Course, 'id' | 'status' | 'updatedAt' | 'categoryName'>) => void;
  hashtagMap: Record<number, string>;
}) {
  const dispatch = useDispatch<AppDispatch>();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [price, setPrice] = useState<number>(0);
  const [isFree, setIsFree] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPreorder, setIsPreorder] = useState(false);
  const [previewDescription, setPreviewDescription] = useState('');
  const [hashtagIds, setHashtagIds] = useState<number[]>([]);

  const categoryItems = useSelector((state: RootState) => state.category.categories);
  const categoryLoading = useSelector((s: RootState) => s.categories.loading);

  const hashtagItems = useSelector((s: RootState) => s.hashtag.items || []);
  const hashtagOptions = useMemo(
    () => hashtagItems.map((h: any) => ({ id: h.id, label: h.name })),
    [hashtagItems],
  );

  const [manageOpen, setManageOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');

  useEffect(() => {
    dispatch(fetchHashtags());
  }, [dispatch]);

  // Prefill all hashtags on first load
  useEffect(() => {
    if (hashtagItems.length > 0 && hashtagIds.length === 0) {
      setHashtagIds(hashtagItems.map((h: any) => h.id));
    }
  }, [hashtagItems, hashtagIds.length]);

  useEffect(() => {
    if (isFree) setPrice(0);
  }, [isFree]);

  const canCreate = title.trim() && description.trim() && thumbnail.trim() && categoryId;

  // Hashtag manage handlers
  const handleCreateHashtag = async () => {
    const name = newTagName.trim();
    if (!name) return;

    try {
      const created: any = await dispatch(createHashtag(name)).unwrap();
      toast.success('Hashtag created');

      setNewTagName('');

      // Auto-select the new hashtag for this course if id exists
      const newId = Number(created?.id);
      if (newId && !hashtagIds.includes(newId)) {
        setHashtagIds(prev => [...prev, newId]);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Create hashtag failed');
    }
  };

  const handleStartEdit = (id: number, currentName: string) => {
    setEditingId(id);
    setEditingName(currentName);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    const name = editingName.trim();
    if (!name) return;

    try {
      await dispatch(updateHashtag({ id: editingId, name })).unwrap();
      toast.success('Hashtag updated');
      setEditingId(null);
      setEditingName('');
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Update hashtag failed');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleDeleteHashtag = async (id: number) => {
    if (!confirm('Delete this hashtag?')) return;
    try {
      await dispatch(deleteHashtag(id)).unwrap();
      toast.success('Hashtag deleted');

      // Remove from selected list if currently selected
      setHashtagIds(prev => prev.filter(hid => hid !== id));
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Delete hashtag failed');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
      <div className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Title</label>
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Course title"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            className="w-full border rounded-md p-2 text-sm"
            placeholder="Describe the course…"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Thumbnail URL</label>
          <textarea
            value={thumbnail}
            onChange={e => setThumbnail(e.target.value)}
            rows={2}
            className="w-full border rounded-md p-2 text-sm"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm mb-1">Category</label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(Number(e.target.value) || '')}
              className="w-full border rounded-md p-2 h-[59px]"
              disabled={categoryLoading || !categoryItems.length}
            >
              <option value="">
                {categoryLoading ? 'Loading categories…' : 'Select category'}
              </option>
              {categoryItems.map((c: any) => (
                <option key={c._id ?? c.id} value={Number(c.id ?? c._id)}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1">Price</label>
            <Input
              type="number"
              value={isFree ? 0 : price}
              disabled={isFree}
              onChange={e => setPrice(Number(e.target.value))}
              placeholder="0"
            />
          </div>

          <div className="grid grid-cols-1 gap-2 pt-6">
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isFree} onChange={e => setIsFree(e.target.checked)} />
              <span>Free</span>
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={e => setIsFeatured(e.target.checked)}
              />
              <span>Featured</span>
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isPreorder}
                onChange={e => setIsPreorder(e.target.checked)}
              />
              <span>Preorder</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1">Preview Description</label>
          <textarea
            value={previewDescription}
            onChange={e => setPreviewDescription(e.target.value)}
            rows={3}
            className="w-full border rounded-md p-2 text-sm"
            placeholder="Short teaser shown to users…"
          />
        </div>

        {/* Hashtags + manage panel */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm">Services used (Hashtags)</label>
            <button
              type="button"
              className="text-xs text-violet-600 hover:text-violet-800"
              onClick={() => setManageOpen(v => !v)}
            >
              {manageOpen ? 'Close manage' : 'Manage hashtags'}
            </button>
          </div>

          <TagPicker value={hashtagIds} onChange={setHashtagIds} options={hashtagOptions} />

          {manageOpen && (
            <div className="mt-3 border rounded-md bg-slate-50 p-3 space-y-3">
              {/* Create new */}
              <div>
                <div className="text-xs font-semibold mb-1">Add new hashtag</div>
                <div className="flex gap-2 h-[44px]">
                  <input
                    value={newTagName}
                    onChange={e => setNewTagName(e.target.value)}
                    placeholder="Hashtag name"
                    className="text-xs border rounded-md px-3 py-2 flex-1 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCreateHashtag}
                    className="px-3 py-1 rounded-md bg-violet-600 text-white text-xs hover:bg-violet-700"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Existing list */}
              <div>
                <div className="text-xs font-semibold mb-1">Existing hashtags</div>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {hashtagItems.length === 0 && (
                    <div className="text-xs text-gray-400 italic">No hashtags yet.</div>
                  )}

                  {hashtagItems.map((h: any) => (
                    <div
                      key={h.id}
                      className="flex items-center justify-between text-xs bg-white rounded px-2 py-1"
                    >
                      {editingId === h.id ? (
                        <div className="flex-1 flex gap-2 h-[44px]">
                          <input
                            value={editingName}
                            onChange={e => setEditingName(e.target.value)}
                            className="text-xs border rounded-md px-3 py-2 flex-1 outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleSaveEdit}
                            className="px-2 py-1 rounded bg-emerald-600 text-white"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="px-2 py-1 rounded border"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="truncate mr-2">{h.name}</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(h.id, h.name)}
                              className="text-[11px] text-blue-600 hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteHashtag(h.id)}
                              className="text-[11px] text-red-600 hover:underline"
                            >
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Button
            disabled={!canCreate}
            onClick={async () => {
              if (!canCreate) return;

              const payload = {
                title: title.trim(),
                description: description.trim(),
                thumbnail: thumbnail.trim(),
                categoryId: Number(categoryId),
                price: isFree ? 0 : Number(price || 0),
                hashtagIds,
                isFree,
                isFeatured,
                isPreorder,
                previewDescription: previewDescription.trim(),
              };

              try {
                await (dispatch as AppDispatch)(createCourse(payload)).unwrap();
                toast.success('Create a successful course!');

                // reset form
                setTitle('');
                setDescription('');
                setThumbnail('');
                setCategoryId('');
                setPrice(0);
                setIsFree(false);
                setIsFeatured(false);
                setIsPreorder(false);
                setPreviewDescription('');
                setHashtagIds(hashtagItems.map((h: any) => h.id));

                await (dispatch as AppDispatch)(listCourses()).unwrap();
              } catch (err: any) {
                console.error(err);
                toast.error(err?.message || 'Create course failed');
              }
            }}
          >
            Create
          </Button>

          <button
            className="px-3 py-2 rounded-md border"
            onClick={() => {
              setTitle('');
              setDescription('');
              setThumbnail('');
              setCategoryId('');
              setPrice(0);
              setIsFree(false);
              setIsFeatured(false);
              setIsPreorder(false);
              setPreviewDescription('');
              setHashtagIds(hashtagItems.map((h: any) => h.id));
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Live preview */}
      <aside className="border rounded-xl p-3 h-fit sticky top-4">
        <div className="text-sm font-medium mb-2">Live preview</div>
        <div className="rounded-lg overflow-hidden border bg-card">
          {thumbnail ? (
            <img src={thumbnail} className="w-full h-40 object-cover" />
          ) : (
            <div className="w-full h-40 grid place-items-center text-sm text-gray-500">
              No thumbnail
            </div>
          )}
          <div className="p-3 space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-base truncate">{title || 'Course title'}</h3>
              {isFeatured && (
                <span className="px-2 py-0.5 rounded bg-purple-600/10 text-purple-700 text-xs">
                  Featured
                </span>
              )}
              {isPreorder && (
                <span className="px-2 py-0.5 rounded bg-amber-600/10 text-amber-700 text-xs">
                  Preorder
                </span>
              )}
            </div>
            <div className="text-sm text-gray-600 line-clamp-2">
              {description || 'Description…'}
            </div>
            <div className="text-xs text-gray-500">
              {previewDescription || 'Preview description…'}
            </div>
            <div className="pt-1 text-sm">
              {isFree ? (
                <span className="px-2 py-0.5 rounded bg-emerald-600/10 text-emerald-700 text-xs">
                  Free
                </span>
              ) : (
                `${formatVND(price)}₫`
              )}
            </div>
            {hashtagIds.length > 0 && (
              <div className="flex flex-wrap gap-1 text-xs">
                {hashtagIds.map(id => (
                  <span key={id} className="px-2 py-0.5 rounded bg-slate-600/10 text-slate-700">
                    {hashtagMap[id] ?? `#${id}`}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

/* ---------------------------------- Edit ---------------------------------- */
function CourseEdit({
  course,
  hashtagMap,
  onBack,
}: {
  course: Course;
  hashtagMap: Record<number, string>;
  onBack: () => void;
}) {
  const dispatch = useDispatch<AppDispatch>();

  const [title, setTitle] = useState(course.title);
  const [description, setDescription] = useState(course.description);
  const [thumbnail, setThumbnail] = useState(course.thumbnail);
  const [categoryId, setCategoryId] = useState<number | ''>(course.categoryId || '');
  const [price, setPrice] = useState<number>(course.price);
  const [isFree, setIsFree] = useState(course.isFree);
  const [isFeatured, setIsFeatured] = useState(course.isFeatured);
  const [isPreorder, setIsPreorder] = useState(course.isPreorder);
  const [previewDescription, setPreviewDescription] = useState(course.previewDescription);
  const [hashtagIds, setHashtagIds] = useState<number[]>(course.hashtagIds || []);

  useEffect(() => {
    setTitle(course.title);
    setDescription(course.description);
    setThumbnail(course.thumbnail);
    setCategoryId(course.categoryId || '');
    setPrice(course.price);
    setIsFree(course.isFree);
    setIsFeatured(course.isFeatured);
    setIsPreorder(course.isPreorder);
    setPreviewDescription(course.previewDescription);
    setHashtagIds(course.hashtagIds || []);
  }, [course]);

  const categoryItems = useSelector((state: RootState) => state.category.categories);
  const categoryLoading = useSelector((s: RootState) => s.categories.loading);

  const hashtagItems = useSelector((s: RootState) => s.hashtag.items || []);
  const hashtagOptions = useMemo(
    () => hashtagItems.map((h: any) => ({ id: h.id, label: h.name })),
    [hashtagItems],
  );

  useEffect(() => {
    dispatch(fetchHashtags());
  }, [dispatch]);

  useEffect(() => {
    if (isFree) setPrice(0);
  }, [isFree]);

  const canSave = title.trim() && description.trim() && thumbnail.trim() && categoryId;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold">Edit course</h2>
          <Button variant="outline" onClick={onBack}>
            Back to detail
          </Button>
        </div>

        <div>
          <label className="block text-sm mb-1">Title</label>
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Course title"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            className="w-full border rounded-md p-2 text-sm"
            placeholder="Describe the course…"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Thumbnail URL</label>
          <textarea
            value={thumbnail}
            onChange={e => setThumbnail(e.target.value)}
            rows={2}
            className="w-full border rounded-md p-2 text-sm"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm mb-1">Category</label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(Number(e.target.value) || '')}
              className="w-full border rounded-md p-2 h-[59px]"
              disabled={categoryLoading || !categoryItems.length}
            >
              <option value="">
                {categoryLoading ? 'Loading categories…' : 'Select category'}
              </option>
              {categoryItems.map((c: any) => (
                <option key={c._id ?? c.id} value={Number(c.id ?? c._id)}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Price</label>
            <Input
              type="number"
              value={isFree ? 0 : price}
              disabled={isFree}
              onChange={e => setPrice(Number(e.target.value))}
              placeholder="0"
            />
          </div>
          <div className="grid grid-cols-1 gap-2 pt-6">
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isFree} onChange={e => setIsFree(e.target.checked)} />
              <span>Free</span>
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={e => setIsFeatured(e.target.checked)}
              />
              <span>Featured</span>
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isPreorder}
                onChange={e => setIsPreorder(e.target.checked)}
              />
              <span>Preorder</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1">Preview Description</label>
          <textarea
            value={previewDescription}
            onChange={e => setPreviewDescription(e.target.value)}
            rows={3}
            className="w-full border rounded-md p-2 text-sm"
            placeholder="Short teaser shown to users…"
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Button
            disabled={!canSave}
            onClick={async () => {
              if (!canSave) return;

              const payload = {
                title: title.trim(),
                description: description.trim(),
                thumbnail: thumbnail.trim(),
                categoryId: Number(categoryId),
                price: isFree ? 0 : Number(price || 0),
                hashtagIds,
                isFree,
                isFeatured,
                isPreorder,
                previewDescription: previewDescription.trim(),
              };

              try {
                await (dispatch as AppDispatch)(
                  updateCourse({ id: Number(course.id), body: payload }),
                ).unwrap();
                toast.success('Course update successful!');
                await (dispatch as AppDispatch)(listCourses()).unwrap();
                onBack();
              } catch (err: any) {
                console.error(err);
                toast.error(err?.message || 'Update course failed');
              }
            }}
          >
            Save changes
          </Button>

          <button
            className="px-3 py-2 rounded-md border"
            onClick={() => {
              setTitle(course.title);
              setDescription(course.description);
              setThumbnail(course.thumbnail);
              setCategoryId(course.categoryId || '');
              setPrice(course.price);
              setIsFree(course.isFree);
              setIsFeatured(course.isFeatured);
              setIsPreorder(course.isPreorder);
              setPreviewDescription(course.previewDescription);
              setHashtagIds(course.hashtagIds || []);
            }}
          >
            Reset to original
          </button>
        </div>
      </div>

      <aside className="border rounded-xl p-3 h-fit sticky top-4">
        <div className="text-sm font-medium mb-2">Live preview</div>
        <div className="rounded-lg overflow-hidden border bg-card">
          {thumbnail ? (
            <img src={thumbnail} className="w-full h-40 object-cover" />
          ) : (
            <div className="w-full h-40 grid place-items-center text-sm text-gray-500">
              No thumbnail
            </div>
          )}
          <div className="p-3 space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-base truncate">{title || 'Course title'}</h3>
              {isFeatured && (
                <span className="px-2 py-0.5 rounded bg-purple-600/10 text-purple-700 text-xs">
                  Featured
                </span>
              )}
              {isPreorder && (
                <span className="px-2 py-0.5 rounded bg-amber-600/10 text-amber-700 text-xs">
                  Preorder
                </span>
              )}
            </div>
            <div className="text-sm text-gray-600 line-clamp-2">
              {description || 'Description…'}
            </div>
            <div className="text-xs text-gray-500">
              {previewDescription || 'Preview description…'}
            </div>
            <div className="pt-1 text-sm">
              {isFree ? (
                <span className="px-2 py-0.5 rounded bg-emerald-600/10 text-emerald-700 text-xs">
                  Free
                </span>
              ) : (
                `${formatVND(price)}₫`
              )}
            </div>
            {hashtagIds.length > 0 && (
              <div className="flex flex-wrap gap-1 text-xs">
                {hashtagIds.map(id => (
                  <span key={id} className="px-2 py-0.5 rounded bg-slate-600/10 text-slate-700">
                    {hashtagMap[id] ?? `#${id}`}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

/* --------------------------------- Detail -------------------------------- */
function IconBtn({
  title,
  children,
  onClick,
}: {
  title: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md border hover:bg-muted text-xs"
    >
      {children}
    </button>
  );
}

function CourseDetail({
  item,
  onBack,
  catMap,
  hashtagMap,
  onEdit,
}: {
  item: Course;
  onBack: () => void;
  catMap: Record<number, string>;
  hashtagMap: Record<number, string>;
  onEdit: () => void;
}) {
  const dispatch = useDispatch<AppDispatch>();
  const handleUpdateStatus = async () => {
    const next = item.status === 'approved' ? 'pending' : 'approved';
    console.log('[Detail] update status', item.id, '->', next); // LOG
    try {
      await dispatch(updateCourseStatus({ id: Number(item.id), status: next })).unwrap();
      await dispatch(listCourses()).unwrap();
    } catch (err: any) {
      toast.error(err || 'Update status failed');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{item.title}</h2>
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 h-[32px] justify-center flex items-center rounded font-bold capitalize  ${
                item.status === 'approved'
                  ? 'bg-sky-100 text-sky-700'
                  : item.status === 'blacklisted'
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-violet-100 text-violet-700'
              }`}
            >
              {item.status}
            </span>
            <Button onClick={onBack}>Back to list</Button>
          </div>
        </div>

        <div className="rounded-xl overflow-hidden border">
          <img src={item.thumbnail} className="w-full max-h-72 object-cover" />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="border rounded-lg p-3">
            <div className="font-medium mb-1">Description</div>
            <div className="text-sm text-gray-700 whitespace-pre-line">{item.description}</div>
          </div>
          <div className="border rounded-lg p-3">
            <div className="font-medium mb-1">Preview description</div>
            <div className="text-sm text-gray-700 whitespace-pre-line">
              {item.previewDescription}
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="border rounded-lg p-3 space-y-1 text-sm">
            <div>
              <span className="text-gray-500">Category:</span>{' '}
              {item.categoryName || catMap[item.categoryId] || `#${item.categoryId}`}
            </div>
            <div>
              <span className="text-gray-500">Price:</span>{' '}
              {item.isFree ? 'Free' : `${formatVND(item.price)}₫`}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Flags:</span>{' '}
              {item.isFeatured && (
                <span className="px-2 py-0.5 rounded bg-purple-600/10 text-purple-700 text-xs">
                  Featured
                </span>
              )}{' '}
              {item.isPreorder && (
                <span className="px-2 py-0.5 rounded bg-amber-600/10 text-amber-700 text-xs">
                  Preorder
                </span>
              )}
            </div>
            <div>
              <span className="text-gray-500">Updated:</span>{' '}
              {new Date(item.updatedAt).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      <aside className="space-y-3">
        <div className="border rounded-lg p-3">
          <div className="font-medium mb-1">Actions</div>
          <div className="flex flex-wrap gap-2">
            <button
              className="px-3 py-1 rounded-md border hover:bg-muted font-semibold bg-violet-100 hover:bg-violet-200"
              onClick={onEdit}
            >
              Edit
            </button>

            <button
              className="px-3 py-1 rounded-md bg-red-200 hover:bg-red-300 font-semibold"
              onClick={async () => {
                if (!confirm('Soft delete this course?')) return;
                try {
                  await (dispatch as AppDispatch)(
                    softDeleteCourse({ id: Number(item.id) }),
                  ).unwrap();
                  await (dispatch as AppDispatch)(listCourses()).unwrap();
                  toast.success('Soft deleted.');
                } catch (err: any) {
                  toast.error(err?.message || 'Soft delete failed');
                }
              }}
            >
              Delete (soft)
            </button>
          </div>
        </div>
        {item?.id && <ModuleBuilder courseId={Number(item.id)} />}
      </aside>
    </div>
  );
}
