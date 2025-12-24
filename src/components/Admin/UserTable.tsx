import { FaExclamationTriangle } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import {
  unlockUser,
  lockUser,
  createUserViolation,
  fetchTeachers,
  ensureTeacher,
  approveInstructor,
} from '@/redux/slices/adminSlices/user.slice';
import { AppDispatch } from '@/core/store/store';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import ResetPasswordModal from './UserResetPasswordModal';

interface User {
  id: string;
  fullName: string;
  email: string;
  roleId: number;
  role?: string;
  createdAt: string;
  isActive: boolean;
  isApproved?: boolean;
}

interface DisableUserModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (params: { reason: string; until: string | null }) => void;
  fullName: string;
}

function DisableUserModal({ open, onClose, onSubmit, fullName }: DisableUserModalProps) {
  const [reason, setReason] = useState('');
  const [durationValue, setDurationValue] = useState('1');
  const [durationUnit, setDurationUnit] = useState<'s' | 'm' | 'h' | 'd' | 'w'>('d');

  if (!open) return null;

  const handleConfirm = () => {
    if (!reason.trim()) {
      toast.error('Please enter reason!');
      return;
    }

    let until: string | null = null;
    if (durationValue && Number(durationValue) > 0) {
      until = `${durationValue}${durationUnit}`;
    }

    onSubmit({ reason: reason.trim(), until });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[420px] max-w-full mx-4">
        <h2 className="text-xl font-semibold mb-4 text-center text-gray-800">Lock account</h2>
        <p className="text-gray-600 mb-4 text-center">
          Are you sure you want to lock <strong>{fullName}</strong>?
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
          <textarea
            placeholder="Enter reason"
            value={reason}
            onChange={e => setReason(e.target.value)}
            className="w-full border rounded p-2 resize-none text-sm"
            rows={3}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lock duration (optional)
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              value={durationValue}
              onChange={e => setDurationValue(e.target.value)}
              className="w-1/2 border rounded px-3 py-2 text-sm"
              placeholder="10"
            />
            <select
              className="w-1/2 border rounded px-3 py-2 text-sm"
              value={durationUnit}
              onChange={e => setDurationUnit(e.target.value as any)}
            >
              <option value="s">seconds (s)</option>
              <option value="m">minutes (m)</option>
              <option value="h">hours (h)</option>
              <option value="d">days (d)</option>
              <option value="w">weeks (w)</option>
            </select>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Ví dụ: 10d = 10 ngày, 5h = 5 giờ. Để trống sẽ lock vô thời hạn.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <button
            className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
            onClick={handleConfirm}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

interface ViolationModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    reason: string;
    violationType: string;
    actionTaken: string;
    lockDurationDays?: number;
  }) => void;
  fullName: string;
}

function ViolationModal({ open, onClose, onSubmit, fullName }: ViolationModalProps) {
  const [reason, setReason] = useState('');
  const [violationType, setViolationType] = useState<'Content' | 'Behavior' | 'Payment' | 'Other'>(
    'Content',
  );
  const [otherDetail, setOtherDetail] = useState('');
  const [actionTaken, setActionTaken] = useState<'Warning' | 'Lock' | 'Suspend' | 'Unlock'>(
    'Warning',
  );
  const [lockDays, setLockDays] = useState('');

  if (!open) return null;

  const handleSubmit = () => {
    if (!reason.trim()) {
      toast.error('Reason is required');
      return;
    }

    if (actionTaken === 'Lock' && !lockDays) {
      toast.error('Lock duration (days) is required');
      return;
    }

    let finalReason = reason.trim();
    if (violationType === 'Other' && otherDetail.trim()) {
      finalReason = `${finalReason} (${otherDetail.trim()})`;
    }

    onSubmit({
      reason: finalReason,
      violationType,
      actionTaken,
      lockDurationDays: actionTaken === 'Lock' ? Number(lockDays) : undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[420px] max-w-full mx-4">
        <h2 className="text-xl font-semibold mb-4 text-center text-gray-800">
          Create violation – {fullName}
        </h2>

        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Violation type</label>
          <select
            className="w-full border rounded px-3 py-2 text-sm"
            value={violationType}
            onChange={e =>
              setViolationType(e.target.value as 'Content' | 'Behavior' | 'Payment' | 'Other')
            }
          >
            <option value="Content">Content</option>
            <option value="Behavior">Behavior</option>
            <option value="Payment">Payment</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {violationType === 'Other' && (
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Specify violation (optional)
            </label>
            <input
              className="w-full border rounded px-3 py-2 text-sm"
              value={otherDetail}
              onChange={e => setOtherDetail(e.target.value)}
              placeholder="Ví dụ: Fake document, Abuse..."
            />
          </div>
        )}

        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Action taken</label>
          <select
            className="w-full border rounded px-3 py-2 text-sm"
            value={actionTaken}
            onChange={e =>
              setActionTaken(e.target.value as 'Warning' | 'Lock' | 'Suspend' | 'Unlock')
            }
          >
            <option value="Warning">Warning</option>
            <option value="Lock">Lock</option>
            <option value="Suspend">Suspend</option>
            <option value="Unlock">Unlock</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
          <textarea
            className="w-full border rounded p-2 text-sm resize-none"
            rows={3}
            value={reason}
            onChange={e => setReason(e.target.value)}
          />
        </div>

        {actionTaken === 'Lock' && (
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lock duration (days)
            </label>
            <input
              type="number"
              min={1}
              className="w-full border rounded px-3 py-2 text-sm"
              value={lockDays}
              onChange={e => setLockDays(e.target.value)}
            />
          </div>
        )}

        <div className="flex justify-end gap-3 mt-2">
          <button
            className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            onClick={handleSubmit}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UserTable({ users }: { users: User[] }) {
  const [userStates, setUserStates] = useState<User[]>([]);
  const dispatch = useDispatch<AppDispatch>();

  const teacherIds: number[] = useSelector((state: any) => state.users?.teacherIds || []);

  const [disableModalOpen, setDisableModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resettingUser, setResettingUser] = useState<User | null>(null);

  const [violationModalOpen, setViolationModalOpen] = useState(false);
  const [violationUser, setViolationUser] = useState<User | null>(null);

  useEffect(() => {
    setUserStates(users);
  }, [users]);

  useEffect(() => {
    dispatch(fetchTeachers());
  }, [dispatch]);

  const roleLabelFromRoleId = (roleId: number) => {
    if (roleId === 5) return 'Admin';
    if (roleId === 2) return 'Seller';
    return 'User';
  };

  const handleToggleActiveClick = (user: User) => {
    if (user.isActive) {
      setSelectedUser(user);
      setDisableModalOpen(true);
    } else {
      dispatch(unlockUser(user.id))
        .unwrap()
        .then(() => {
          setUserStates(prev => prev.map(u => (u.id === user.id ? { ...u, isActive: true } : u)));
        })
        .catch(() => toast.error('Unlock failed'));
    }
  };

  const handleConfirmLock = (user: User, params: { reason: string; until: string | null }) => {
    dispatch(
      lockUser({
        userId: user.id,
        reason: params.reason,
        until: params.until ?? undefined,
      }),
    )
      .unwrap()
      .then(() => {
        setUserStates(prev => prev.map(u => (u.id === user.id ? { ...u, isActive: false } : u)));
      })
      .catch(() => toast.error('Lock failed'));
  };

  const handleSubmitViolation = (
    user: User,
    data: { reason: string; violationType: string; actionTaken: string; lockDurationDays?: number },
  ) => {
    dispatch(
      createUserViolation({
        userId: user.id,
        ...data,
      }),
    )
      .unwrap()
      .then(() => {
        if (data.actionTaken === 'Lock' && data.lockDurationDays) {
          setUserStates(prev => prev.map(u => (u.id === user.id ? { ...u, isActive: false } : u)));
        }
        toast.success('Violation created successfully');
      })
      .catch(() => {
        toast.error('Create violation failed');
      });
  };

  const handleToggleApproveTeacher = (user: User) => {
    const uid = Number(user.id);

    if (teacherIds.includes(uid)) return;

    dispatch(approveInstructor({ userId: user.id, currentRoleId: Number(user.roleId) }))
      .unwrap()
      .then(() => toast.success('Upgraded to instructor'))
      .catch(() => toast.error('Approve failed'));
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm text-left border rounded">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2">Full Name</th>
            <th className="px-4 py-2">Email</th>
            <th className="px-4 py-2">Creation Date</th>
            <th className="px-4 py-2">Activate</th>
            <th className="px-4 py-2">Approve</th>
            <th className="px-4 py-2">Role</th>
            <th className="px-4 py-2">Action</th>
          </tr>
        </thead>

        <tbody>
          {userStates.length > 0 ? (
            userStates.map(user => {
              const uid = Number(user.id);
              const roleId = Number(user.roleId);

              const isTeacher = teacherIds.includes(uid);
              const isAdmin = roleId === 5;

              const displayRole = isTeacher ? 'Instructor' : roleLabelFromRoleId(roleId);

              return (
                <tr key={user.id} className="border-t">
                  <td className="px-4 py-2">{user.fullName}</td>
                  <td className="px-4 py-2">{user.email}</td>
                  <td className="px-4 py-2">{user.createdAt}</td>

                  {/* Activate toggle */}
                  <td className="px-4 py-2">
                    <div
                      className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer ${
                        user.isActive ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                      onClick={() => handleToggleActiveClick(user)}
                      title={user.isActive ? 'Click to lock' : 'Click to unlock'}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full shadow-md transform duration-300 ${
                          user.isActive ? 'translate-x-6' : ''
                        }`}
                      />
                    </div>
                  </td>

                  {/* Approve teacher */}
                  <td className="px-4 py-2">
                    {isAdmin ? (
                      <span className="text-gray-400">—</span>
                    ) : (
                      <div
                        className={`w-12 h-6 flex items-center rounded-full p-1 ${
                          isTeacher
                            ? 'bg-blue-500 cursor-not-allowed'
                            : 'bg-gray-300 cursor-pointer'
                        }`}
                        onClick={() => {
                          if (!isTeacher) handleToggleApproveTeacher(user); 
                        }}
                        title={isTeacher ? 'Already instructor' : 'Click to approve -> instructor'}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full shadow-md transform duration-300 ${
                            isTeacher ? 'translate-x-6' : ''
                          }`}
                        />
                      </div>
                    )}
                  </td>

                  {/* Role */}
                  <td className="px-4 py-2">{displayRole}</td>

                  {/* Action */}
                  <td className="px-4 py-2 flex gap-2">
                    <button
                      title="violation"
                      className="text-yellow-500 hover:underline border rounded p-2 shadow"
                      onClick={() => {
                        setViolationUser(user);
                        setViolationModalOpen(true);
                      }}
                    >
                      <FaExclamationTriangle size={16} />
                    </button>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td className="px-4 py-4 text-center text-gray-500" colSpan={7}>
                No users found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Reset password (giữ nguyên nếu bạn dùng) */}
      {resetModalOpen && resettingUser && (
        <ResetPasswordModal
          open={resetModalOpen}
          onClose={() => setResetModalOpen(false)}
          user={resettingUser}
          onSubmit={async () => {
            toast.success('Password has been reset');
          }}
        />
      )}

      {/* Lock user modal */}
      {disableModalOpen && selectedUser && (
        <DisableUserModal
          open={disableModalOpen}
          onClose={() => setDisableModalOpen(false)}
          fullName={selectedUser.fullName}
          onSubmit={params => handleConfirmLock(selectedUser, params)}
        />
      )}

      {/* Violation modal */}
      {violationModalOpen && violationUser && (
        <ViolationModal
          open={violationModalOpen}
          onClose={() => setViolationModalOpen(false)}
          fullName={violationUser.fullName}
          onSubmit={data => handleSubmitViolation(violationUser, data)}
        />
      )}
    </div>
  );
}
