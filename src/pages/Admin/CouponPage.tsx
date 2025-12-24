import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/core/store/store';
import {
  listCoupons,
  createCoupon,
  updateCoupon,
  softDeleteCoupon,
} from '@/redux/slices/adminSlices/coupon.slice';
import { toast } from 'react-toastify';
import { FaTrash, FaEdit } from 'react-icons/fa';
import Sidebar from '@/components/Admin/Sidebar';
import Header from '@/components/Admin/Header';
import { AiOutlineReload } from 'react-icons/ai';

import { fetchCoursesAndWishlist } from '@/redux/slices/course.slice';

type Row = {
  index: number;
  id: number;
  code: string;
  discountType: string;
  discountAmount: number;
  maxUses: number;
  perUserLimit: number;
  expirationDate: string;
  createdAt: string;
  courseId: number | null;
  deletedAt: string | null;
  status: 'active' | 'expired' | 'deleted';
};

type CourseOption = {
  id: number;
  title: string;
  instructorName: string;
};

type FormState = {
  code: string;
  discountType: string;
  discountAmount: number;
  maxUses: number;
  perUserLimit: number;
  expirationDate: string;
  courseId: number | null;
};

type CreateCouponPayload = {
  code?: string;
  discountType: string;
  discountAmount: number;
  maxUses: number;
  perUserLimit: number;
  expirationDate: string;
  courseId: number;
};

const CouponPage = () => {
  const dispatch = useDispatch<AppDispatch>();

  const { items: discounts, loading } = useSelector((state: RootState) => state.coupon);

  const [openModal, setOpenModal] = useState(false);
  const [editingRow, setEditingRow] = useState<Row | null>(null);
  const [form, setForm] = useState<FormState>({
    code: '',
    discountType: 'Fixed',
    discountAmount: 0,
    maxUses: 0,
    perUserLimit: 1,
    expirationDate: '',
    courseId: null,
  });

  const [openCourseModal, setOpenCourseModal] = useState(false);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [instructorFilter, setInstructorFilter] = useState<string>('');
  const [selectedCourse, setSelectedCourse] = useState<CourseOption | null>(null);

  useEffect(() => {
    dispatch(listCoupons());
  }, [dispatch]);

  const rows = useMemo<Row[]>(
    () =>
      (discounts || []).map((d: any, index: number) => {
        const now = new Date();
        const exp = new Date(d.expirationDate);
        const isExpired = exp.getTime() < now.getTime();
        const isDeleted = !!d.deletedAt;

        let status: Row['status'] = 'active';
        if (isDeleted) status = 'deleted';
        else if (isExpired) status = 'expired';

        return {
          index: index + 1,
          id: d.id,
          code: d.code,
          discountType: d.discountType,
          discountAmount: d.discountAmount,
          maxUses: d.maxUses,
          perUserLimit: d.perUserLimit,
          expirationDate: d.expirationDate,
          createdAt: d.createdAt,
          courseId: d.courseId ?? null,
          deletedAt: d.deletedAt,
          status,
        };
      }),
    [discounts],
  );

  const resetForm = () => {
    setForm({
      code: '',
      discountType: 'Fixed',
      discountAmount: 0,
      maxUses: 0,
      perUserLimit: 1,
      expirationDate: '',
      courseId: null,
    });
    setSelectedCourse(null);
  };

  const openCreateModal = () => {
    setEditingRow(null);
    resetForm();
    setOpenModal(true);
  };

  const openEditModal = (row: Row) => {
    setEditingRow(row);

    // convert ISO -> value cho input datetime-local
    const exp = new Date(row.expirationDate);
    const local = new Date(exp.getTime() - exp.getTimezoneOffset() * 60000);
    const dateStr = local.toISOString().slice(0, 16); // yyyy-MM-ddTHH:mm

    setForm({
      code: row.code,
      discountType: row.discountType,
      discountAmount: row.discountAmount,
      maxUses: row.maxUses,
      perUserLimit: row.perUserLimit,
      expirationDate: dateStr,
      courseId: row.courseId,
    });
    setSelectedCourse(null);
    setOpenModal(true);
  };

  const handleSoftDelete = async (row: Row) => {
    if (!window.confirm(`Are you sure you want to soft delete the code "${row.code}"?`)) return;
    try {
      await dispatch(softDeleteCoupon({ id: Number(row.id) })).unwrap();
      toast.success('Deleting the discount code was successful');
      dispatch(listCoupons());
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Deleting the discount code failed');
    }
  };
  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDiscountValue = (row: Row) => {
    if (row.discountType === 'Percent' || row.discountType === 'Percentage') {
      return `${row.discountAmount}%`;
    }
    return row.discountAmount.toLocaleString('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    });
  };

  const handleChange = (field: keyof FormState, value: string) => {
    if (field === 'courseId') {
      const num = Number(value);
      setForm(prev => ({
        ...prev,
        courseId: value === '' || Number.isNaN(num) ? null : num,
      }));
      return;
    }

    setForm(prev => ({
      ...prev,
      [field]:
        field === 'discountAmount' || field === 'maxUses' || field === 'perUserLimit'
          ? Number(value)
          : value,
    }));
  };

  const fetchCourses = async () => {
    try {
      setCoursesLoading(true);

      const result = await dispatch(fetchCoursesAndWishlist()).unwrap();

      const allCourses = [
        ...(result.courses1 || []),
        ...(result.courses2 || []),
        ...(result.courses3 || []),
      ];

      const mapById = new Map<string, any>();
      allCourses.forEach((c: any) => {
        if (!c?.id) return;
        mapById.set(c.id, c);
      });

      const uniqueCourses = Array.from(mapById.values());
      const mapped: CourseOption[] = uniqueCourses
        .map((c: any) => ({
          id: Number(c.id),
          title: c.title || 'No title',
          instructorName: c.author || 'Unknown',
        }))
        .filter(c => !Number.isNaN(c.id));
      setCourses(mapped);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Course list failed to load');
    } finally {
      setCoursesLoading(false);
    }
  };

  const handleOpenCourseModal = () => {
    setOpenCourseModal(true);
  };

  useEffect(() => {
    if (openCourseModal && !courses.length) {
      fetchCourses();
    }
  }, [openCourseModal]);

  const instructorOptions = useMemo(
    () => Array.from(new Set(courses.map(c => c.instructorName))).sort(),
    [courses],
  );

  const filteredCourses = useMemo(
    () =>
      courses.filter(c => {
        if (!instructorFilter) return true;
        return c.instructorName === instructorFilter;
      }),
    [courses, instructorFilter],
  );

  const handleSelectCourse = (c: CourseOption) => {
    setSelectedCourse(c);
    setForm(prev => ({
      ...prev,
      courseId: c.id,
    }));
    setOpenCourseModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.discountType || !form.expirationDate) {
      toast.error('Please fill in the Discount type and Expiration date');
      return;
    }

    try {
      const isoExpiration = new Date(form.expirationDate).toISOString();

      const payloadFixed: CreateCouponPayload = {
        code: form.code?.trim() || undefined,
        discountType: form.discountType,
        discountAmount: Number(form.discountAmount),
        maxUses: Number(form.maxUses),
        perUserLimit: Number(form.perUserLimit),
        expirationDate: isoExpiration,
        courseId: form.courseId ?? 0, // ✅ không còn null
      };

      if (editingRow) {
        await dispatch(
          updateCoupon({
            id: editingRow.id,
            data: payloadFixed,
          }),
        ).unwrap();
        toast.success('Coupon updated successfully');
      } else {
        await dispatch(createCoupon(payloadFixed)).unwrap();
        toast.success('Coupon created successfully');
      }

      setOpenModal(false);
      setEditingRow(null);
      resetForm();
      dispatch(listCoupons());
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Coupon saving failed');
    }
  };

  const courseInputText = selectedCourse
    ? `${selectedCourse.title} – ${selectedCourse.instructorName}`
    : form.courseId
      ? `ID: ${form.courseId}`
      : 'Applies to all courses';

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Header />
        <div className="bg-white rounded-xl shadow p-4 mt-6">
          <div className="flex justify-between mb-4 items-center">
            <h3 className="text-lg font-semibold">List of discount codes</h3>

            <div className="flex gap-3">
              <button
                onClick={() => dispatch(listCoupons())}
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
                + Add discount code
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="p-2 w-12">#</th>
                  <th className="p-2">Code</th>
                  <th className="p-2">Type</th>
                  <th className="p-2">Value</th>
                  <th className="p-2">Maximum number of uses</th>
                  <th className="p-2">Limit / user</th>
                  <th className="p-2">Course</th>
                  <th className="p-2">Expiration</th>
                  <th className="p-2 text-center w-40">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && !loading && (
                  <tr>
                    <td colSpan={10} className="p-4 text-center text-gray-500">
                      No discount codes available.
                    </td>
                  </tr>
                )}

                {rows.map(row => {
                  const isDeleted = !!row.deletedAt;

                  return (
                    <tr key={row.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">{row.index}</td>
                      <td className="p-2 font-mono font-semibold">{row.code}</td>
                      <td className="p-2">{row.discountType}</td>
                      <td className="p-2">{formatDiscountValue(row)}</td>
                      <td className="p-2">{row.maxUses}</td>
                      <td className="p-2">{row.perUserLimit}</td>
                      <td className="p-2">
                        {row.courseId ? `#${row.courseId}` : 'Tất cả khóa học'}
                      </td>
                      <td className="p-2">{formatDateTime(row.expirationDate)}</td>
                      <td className="p-2">
                        <div className="flex items-center justify-center gap-2">
                          {!isDeleted && (
                            <button
                              title="Sửa coupon"
                              onClick={() => openEditModal(row)}
                              className="p-2 rounded border hover:bg-gray-100 text-blue-600"
                            >
                              <FaEdit />
                            </button>
                          )}

                          <button
                            title="Xóa mềm"
                            onClick={() => handleSoftDelete(row)}
                            className="p-2 rounded border hover:bg-gray-100 text-red-600"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {loading && (
                  <tr>
                    <td colSpan={10} className="p-4 text-center text-gray-500">
                      Loading data...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        {/* MODAL add / edit coupon */}
        {openModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-lg mx-4">
              <div className="border-b px-6 py-4 flex justify-between items-center">
                <h2 className="text-lg font-semibold">
                  {editingRow ? 'Sửa mã giảm giá' : 'Thêm mã giảm giá'}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Code (optional)</label>
                    <input
                      className="w-full border rounded px-3 py-2"
                      value={form.code}
                      onChange={e => handleChange('code', e.target.value)}
                      placeholder="Để trống để random"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Discount type</label>
                    <select
                      className="w-full border rounded px-3 py-2"
                      value={form.discountType}
                      onChange={e => handleChange('discountType', e.target.value)}
                    >
                      <option value="Fixed">Fixed (VND)</option>
                      <option value="Percentage">Percentage (%)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Discount amount</label>
                    <input
                      type="number"
                      className="w-full border rounded px-3 py-2"
                      value={form.discountAmount}
                      onChange={e => handleChange('discountAmount', e.target.value)}
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Max uses</label>
                    <input
                      type="number"
                      className="w-full border rounded px-3 py-2"
                      value={form.maxUses}
                      onChange={e => handleChange('maxUses', e.target.value)}
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Per user limit</label>
                    <input
                      type="number"
                      className="w-full border rounded px-3 py-2"
                      value={form.perUserLimit}
                      onChange={e => handleChange('perUserLimit', e.target.value)}
                      min={1}
                    />
                  </div>
                  {/* COURSE + BUTTON OPEN POPUP */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Course</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="w-full border rounded px-3 py-2"
                        value={courseInputText}
                        readOnly
                        placeholder="Áp dụng cho tất cả khóa học"
                      />
                      <button
                        type="button"
                        onClick={handleOpenCourseModal}
                        className="px-3 py-2 rounded bg-indigo-600 text-white whitespace-nowrap hover:bg-indigo-700"
                      >
                        Select course
                      </button>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Expiration date</label>
                    <input
                      type="datetime-local"
                      className="w-full border rounded px-3 py-2"
                      value={form.expirationDate}
                      onChange={e => handleChange('expirationDate', e.target.value)}
                    />
                  </div>
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
                    {editingRow ? 'Lưu thay đổi' : 'Tạo mới'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* POPUP SELECT COURSE */}
        {openCourseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl mx-4 max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <h2 className="text-lg font-semibold">Select course</h2>
                <button
                  type="button"
                  onClick={() => setOpenCourseModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="px-6 py-4 border-b flex gap-4 items-center flex-wrap">
                <div>
                  <label className="block text-sm font-medium mb-1">Filter by instructor</label>
                  <select
                    className="border rounded px-3 py-2 min-w-[220px]"
                    value={instructorFilter}
                    onChange={e => setInstructorFilter(e.target.value)}
                  >
                    <option value="">-- All --</option>
                    {instructorOptions.map(name => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="px-6 py-4 overflow-auto flex-1">
                {coursesLoading ? (
                  <div className="text-center text-gray-500">Loading course list...</div>
                ) : filteredCourses.length === 0 ? (
                  <div className="text-center text-gray-500">No matching courses.</div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="p-2 w-16">ID</th>
                        <th className="p-2">Course name</th>
                        <th className="p-2">Instructor</th>
                        <th className="p-2 w-32 text-center">Select</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCourses.map(c => (
                        <tr key={c.id} className="border-b hover:bg-gray-50">
                          <td className="p-2 font-mono text-sm">#{c.id}</td>
                          <td className="p-2">{c.title}</td>
                          <td className="p-2">{c.instructorName}</td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleSelectCourse(c)}
                              className="px-3 py-1 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
                            >
                              Select
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="px-6 py-3 border-t flex justify-end">
                <button
                  type="button"
                  onClick={() => setOpenCourseModal(false)}
                  className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CouponPage;
