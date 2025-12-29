import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/core/store/store';
import { logo } from '@/assets/images';
import defaultAvatar from '@/assets/icons/user.png';
import {
  ChatUser,
  fetchChatUsers,
  resetUnseenForUser,
  setSelectedUser,
  createConversation,
  socketMemberKicked,
  socketCurrentUserKicked,
  socketConversationAdded,
} from '@/redux/slices/chat.slice';
import { FaSearch, FaPlus, FaCheck, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';

import { getSocket } from '@/core/services/socket-client';

import type { ServerUser } from '@/redux/slices/adminSlices/user.slice';
import { fetchUsers as fetchServerUsers } from '@/redux/slices/adminSlices/user.slice';
import { Link } from 'react-router-dom';

// ====== ADDED ======
import {
  createDirectConversationWithTeacherUser,
  fetchTeacherFollowing,
} from '@/redux/slices/teacherFollow.slice';

interface SidebarProps {
  onOpenChatMobile?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onOpenChatMobile }) => {
  const dispatch = useDispatch<AppDispatch>();

  const { users, selectedUser, unseenMessages, loading } = useSelector((state: RootState) => ({
    users: state.chat.users,
    selectedUser: state.chat.selectedUser,
    unseenMessages: state.chat.unseenMessages,
    loading: state.chat.loading,
  }));

  const usersState = useSelector((state: RootState) => state.users);
  const serverUsers = usersState.items;
  const serverUsersLoading = usersState.loading;

  // Current logged-in user (from auth slice)
  const authUser = useSelector((state: RootState) => state.user.user);

  const [searchTerm, setSearchTerm] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<'DIRECT' | 'GROUP'>('DIRECT');

  // DIRECT
  const [selectedDirectUser, setSelectedDirectUser] = useState<ServerUser | null>(null);
  const [directTitle, setDirectTitle] = useState('');
  const [directDescription, setDirectDescription] = useState('');

  // GROUP
  const [groupTitle, setGroupTitle] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedGroupUsers, setSelectedGroupUsers] = useState<ServerUser[]>([]);

  // user picker modal: null / 'DIRECT' / 'GROUP'
  const [pickerMode, setPickerMode] = useState<'DIRECT' | 'GROUP' | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');

  // ====== ADDED ======
  const [checkingUserId, setCheckingUserId] = useState<number | null>(null);

  // ====== ADDED ======
  const isTeacher = useMemo(() => {
    const role = (authUser as any)?.role ?? (authUser as any)?.userType;
    return String(role || '').toLowerCase() === 'teacher';
  }, [authUser]);

  // ====== ADDED ======
  const extractFollowedUserId = (item: any): number | null => {
    const direct =
      item?.userId ??
      item?.id ??
      item?.followingUserId ??
      item?.targetUserId ??
      item?.studentId ??
      item?.followerId;

    if (direct != null && !Number.isNaN(Number(direct))) return Number(direct);

    const nested =
      item?.user?.id ??
      item?.following?.id ??
      item?.targetUser?.id ??
      item?.student?.id ??
      item?.follower?.id;

    if (nested != null && !Number.isNaN(Number(nested))) return Number(nested);

    return null;
  };

  // ===== load conversations for sidebar =====
  useEffect(() => {
    dispatch(fetchChatUsers());
  }, [dispatch]);

  // ===== ensure server user list is loaded when opening create modal =====
  useEffect(() => {
    if (showCreateModal && serverUsers.length === 0 && !serverUsersLoading) {
      dispatch(fetchServerUsers({ limit: 1000 }));
    }
  }, [showCreateModal, serverUsers.length, serverUsersLoading, dispatch]);

  // ===== SOCKET: kicked + new conversations =====
  useEffect(() => {
    const socket = getSocket();
    console.log('[Sidebar socket] getSocket():', socket);

    if (!socket) {
      // Socket is not initialized yet; make sure you call initSocket somewhere (e.g. ChatContainer)
      return;
    }

    if (!authUser) {
      console.log('[Sidebar socket] no authUser -> skip binding');
      return;
    }

    // Normalize conversationId & targetUserId for "kicked" events
    const handleMemberKicked = (raw: any) => {
      console.log('[Sidebar socket] member kicked raw:', raw);

      const convIdRaw = raw.conversationId ?? raw.conversation_id ?? raw.conversation?.id ?? raw.id;

      const targetUserIdRaw = raw.targetUserId ?? raw.userId ?? raw.memberId;

      if (convIdRaw == null || targetUserIdRaw == null) {
        console.warn('[Sidebar socket] invalid member kicked payload', raw);
        return;
      }

      const conversationId = String(convIdRaw);
      const targetUserId = Number(targetUserIdRaw);

      // Update members list for that conversation
      dispatch(
        socketMemberKicked({
          conversationId,
          targetUserId,
        }),
      );

      // If current user was kicked: remove conversation from sidebar + close it
      if (authUser && targetUserId === authUser.id) {
        dispatch(
          socketCurrentUserKicked({
            conversationId,
          }),
        );

        toast('You have been removed from this conversation', {
          icon: '⚠️',
        });
      }
    };

    // Normalize conversation payload for "new conversation" events
    const handleConversationCreated = (raw: any) => {
      console.log('[Sidebar socket] conversation created raw:', raw);

      const conv = raw.conversation ?? raw;
      if (!conv || conv.id == null) {
        console.warn('[Sidebar socket] invalid conversation payload', raw);
        return;
      }

      const chatUser: ChatUser = {
        _id: String(conv.id),
        fullName: conv.title || conv.name || conv.conversationName || `Conversation #${conv.id}`,
        profilePic: conv.avatar || conv.imageUrl || undefined,
        bio: conv.description || '',
      };

      dispatch(socketConversationAdded(chatUser));
    };

    // Subscribe to possible event names from backend
    const kickedEvents = ['conversation_member_kicked', 'memberKicked', 'conversationMemberKicked'];
    const createdEvents = [
      'conversation_created',
      'conversationCreated',
      'conversation_invited',
      'conversationJoined',
    ];

    kickedEvents.forEach(evt => socket.on(evt, handleMemberKicked));
    createdEvents.forEach(evt => socket.on(evt, handleConversationCreated));

    // Cleanup
    return () => {
      kickedEvents.forEach(evt => socket.off(evt, handleMemberKicked));
      createdEvents.forEach(evt => socket.off(evt, handleConversationCreated));
    };
  }, [dispatch, authUser]);

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;
    const lower = searchTerm.toLowerCase();
    return users.filter(u => u.fullName.toLowerCase().includes(lower));
  }, [users, searchTerm]);

  const handleSelectUser = (user: ChatUser) => {
    dispatch(setSelectedUser(user));
    dispatch(resetUnseenForUser(user._id));
    if (onOpenChatMobile) {
      onOpenChatMobile();
    }
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setCreateType('DIRECT');
    setSelectedDirectUser(null);
    setDirectTitle('');
    setDirectDescription('');
    setGroupTitle('');
    setGroupDescription('');
    setSelectedGroupUsers([]);
    setPickerMode(null);
    setPickerSearch('');
  };

  const handleCreateConversation = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (createType === 'DIRECT') {
        if (!selectedDirectUser) {
          toast.error('Please select a user to chat with directly');
          return;
        }

        // ====== ADDED/CHANGED: teacher uses createDirectConversationWithTeacherUser ======
        if (isTeacher) {
          const newConv = await dispatch(
            createDirectConversationWithTeacherUser(selectedDirectUser.id),
          ).unwrap();

          toast.success('Live chat created successfully');
          dispatch(setSelectedUser(newConv));
          closeCreateModal();
          return;
        }

        const titleToSend = directTitle.trim() || '';
        const descToSend = directDescription.trim() || undefined;

        const newConv = await dispatch(
          createConversation({
            type: 'DIRECT',
            title: titleToSend,
            description: descToSend,
            participantIds: [selectedDirectUser.id],
          }),
        ).unwrap();
        toast.success('Live chat created successfully');
        dispatch(setSelectedUser(newConv));
      } else {
        if (!groupTitle.trim()) {
          toast.error('Please enter group name');
          return;
        }
        if (selectedGroupUsers.length === 0) {
          toast.error('Please select at least 1 member for the group');
          return;
        }

        const participantIds = selectedGroupUsers.map(u => u.id);

        const newConv = await dispatch(
          createConversation({
            type: 'GROUP',
            title: groupTitle.trim(),
            description: groupDescription.trim() || undefined,
            participantIds,
          }),
        ).unwrap();

        toast.success('Group chat created successfully');
        dispatch(setSelectedUser(newConv));
      }
      closeCreateModal();
    } catch (err: any) {
      toast.error(err?.toString() || 'Chat creation failed');
    }
  };

  // ====== picker user list filter ======
  const filteredServerUsers = useMemo(() => {
    if (!pickerSearch.trim()) return serverUsers;
    const lower = pickerSearch.toLowerCase();
    return serverUsers.filter(
      u =>
        u.fullname.toLowerCase().includes(lower) ||
        u.email.toLowerCase().includes(lower) ||
        (u.username ?? '').toLowerCase().includes(lower),
    );
  }, [serverUsers, pickerSearch]);

  const toggleGroupUser = (user: ServerUser) => {
    setSelectedGroupUsers(prev => {
      const exists = prev.some(u => u.id === user.id);
      if (exists) {
        return prev.filter(u => u.id !== user.id);
      }
      return [...prev, user];
    });
  };

  const isGroupUserSelected = (userId: number) => selectedGroupUsers.some(u => u.id === userId);

  return (
    <>
      {/* ====== SIDEBAR ====== */}
      <div className="flex flex-col h-full bg-[#070720] border-r border-purple-600/30 min-w-[260px]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-purple-600/30">
          <div className="flex items-center gap-2">
            <Link to="/">
              <img src={logo} alt="Logo" className="w-8 h-8 rounded-lg object-contain" />
            </Link>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-white">Chat Center</p>
              <p className="text-[11px] text-gray-400">List of conversations</p>
            </div>
          </div>
        </div>

        {/* Search + button + modal trigger */}
        <div className="px-3 pt-3 pb-2 border-b border-purple-600/30">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400" />
              <input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search user..."
                className="w-full pl-8 pr-3 py-2 text-[12px] rounded-full bg-[#171432] text-white border border-purple-600/40 placeholder:text-gray-500 outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-[#6D28D9] hover:bg-purple-700 transition-colors"
              title="New chat / Group"
            >
              <FaPlus className="text-xs text-white" />
            </button>
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto scrollbar-soft px-2 py-2 space-y-1">
          {loading && <p className="text-[12px] text-gray-400 px-2">Loading conversation...</p>}

          {!loading && filteredUsers.length === 0 && (
            <p className="text-[12px] text-gray-500 px-2">Conversation not found.</p>
          )}

          {!loading &&
            filteredUsers.map(user => {
              const isActive = selectedUser?._id === user._id;
              return (
                <div
                  key={user._id}
                  onClick={() => handleSelectUser(user)}
                  className={`relative flex items-center gap-3 px-3 py-2 rounded-2xl cursor-pointer transition-colors ${
                    isActive ? 'bg-[#6D28D9]' : 'hover:bg-[#120F2A]'
                  }`}
                >
                  <img
                    src={user.profilePic || (defaultAvatar as string)}
                    alt={user.fullName}
                    className="w-9 h-9 rounded-full object-cover border border-purple-500/40"
                  />

                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-white truncate">{user.fullName}</p>
                    {user.bio && (
                      <p className="text-[11px] text-gray-400 truncate max-w-[160px]">{user.bio}</p>
                    )}
                  </div>

                  {unseenMessages[user._id] > 0 && (
                    <p className="absolute top-2 right-3 text-[10px] h-5 w-5 flex justify-center items-center rounded-full bg-[#F48C06] text-white">
                      {unseenMessages[user._id]}
                    </p>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* ========= MODAL CREATE ========= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
          <div className="relative w-full max-w-md rounded-2xl bg-[#070720] border border-purple-600/60 p-4">
            {/* Header modal */}
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-white">
                {createType === 'DIRECT' ? 'New chat' : 'New group'}
              </h2>
              <button
                type="button"
                onClick={closeCreateModal}
                className="text-xs px-2 py-1 rounded-full text-white"
              >
                <FaTimes />
              </button>
            </div>

            {/* Form create */}
            <form onSubmit={handleCreateConversation} className="space-y-3 text-[12px]">
              {createType === 'DIRECT' && (
                <>
                  <div className="mt-3">
                    <label className="block text-gray-300 mb-1">Title</label>
                    <input
                      value={directTitle}
                      onChange={e => setDirectTitle(e.target.value)}
                      placeholder="Conversation Title"
                      className="w-full px-2 py-1.5 rounded-lg bg-[#1E1D33] border border-[#3B3A5C] text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1">Description</label>
                    <input
                      value={directDescription}
                      onChange={e => setDirectDescription(e.target.value)}
                      placeholder="Description "
                      className="w-full px-2 py-1.5 rounded-lg bg-[#1E1D33] border border-[#3B3A5C] text-white outline-none"
                    />
                  </div>{' '}
                  <p className="text-gray-300 ">Receiver</p>
                  {selectedDirectUser ? (
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-[#1E1D33] border border-[#3B3A5C]">
                      <img
                        src={selectedDirectUser.avatar || (defaultAvatar as string)}
                        alt={selectedDirectUser.fullname}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="text-[12px] font-semibold text-white truncate">
                          {selectedDirectUser.fullname}
                        </span>
                        <span className="text-[10px] text-gray-400 truncate">
                          {selectedDirectUser.email}
                        </span>
                      </div>
                      <span className="ml-auto text-[10px] text-gray-500">
                        ID: {selectedDirectUser.id}
                      </span>
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-500 italic">No user selected</p>
                  )}
                  <button
                    type="button"
                    onClick={() => setPickerMode('DIRECT')}
                    className="w-full py-1.5 rounded-full bg-[#1E1D33] border border-[#3B3A5C] hover:bg-[#2A2845] text-gray-300"
                  >
                    Select user
                  </button>
                </>
              )}

              {createType === 'GROUP' && (
                <>
                  <div>
                    <label className="block text-gray-300 mb-1">Group title</label>
                    <input
                      value={groupTitle}
                      onChange={e => setGroupTitle(e.target.value)}
                      placeholder="Group Name"
                      className="w-full px-2 py-1.5 rounded-lg bg-[#1E1D33] border border-[#3B3A5C] text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-1">Description</label>
                    <input
                      value={groupDescription}
                      onChange={e => setGroupDescription(e.target.value)}
                      placeholder="Description "
                      className="w-full px-2 py-1.5 rounded-lg bg-[#1E1D33] border border-[#3B3A5C] text-white outline-none"
                    />
                  </div>

                  <div>
                    <p className="block text-gray-300 mb-1">Members</p>

                    {selectedGroupUsers.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mb-1">
                        {selectedGroupUsers.map(u => (
                          <div
                            key={u.id}
                            className="flex items-center gap-2 px-2 py-1 rounded-full bg-[#1E1D33] border border-[#3B3A5C]"
                          >
                            <img
                              src={u.avatar || (defaultAvatar as string)}
                              alt={u.fullname}
                              className="w-5 h-5 rounded-full object-cover"
                            />
                            <span className="text-[11px] text-white max-w-[110px] truncate">
                              {u.fullname}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedGroupUsers(prev => prev.filter(item => item.id !== u.id))
                              }
                              className="text-[10px] text-gray-400 hover:text-red-400"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-gray-500 italic mb-1">
                        No members have been selected yet.
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={() => setPickerMode('GROUP')}
                      className="w-full py-1.5 rounded-full bg-[#1E1D33] border border-[#3B3A5C] hover:bg-[#2A2845]  text-gray-300"
                    >
                      Add members
                    </button>
                  </div>
                </>
              )}

              <button
                type="submit"
                className="w-full py-1.5 rounded-full bg-[#F48C06] hover:bg-orange-500 text-[12px] font-semibold text-white"
              >
                {createType === 'DIRECT' ? 'Create chat' : 'Create group'}
              </button>
            </form>

            {/* ===== MODAL PICKER USERS ===== */}
            {pickerMode && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70">
                <div className="w-full max-w-sm max-h-[420px] rounded-2xl bg-[#070720] border border-purple-600/70 flex flex-col">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-[#3B3A5C]">
                    <p className="text-[12px] font-semibold text-white">
                      {pickerMode === 'DIRECT'
                        ? 'Select user to chat directly'
                        : 'Select members for the group'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setPickerMode(null)}
                      className="text-[11px] px-2 py-1 rounded-full"
                    >
                      <FaTimes className="text-white" />
                    </button>
                  </div>

                  <div className="px-3 pt-2 pb-1">
                    <input
                      value={pickerSearch}
                      onChange={e => setPickerSearch(e.target.value)}
                      placeholder="Search by name, email..."
                      className="w-full px-2 py-1.5 text-[11px] rounded-full bg-[#171432] text-white border border-[#3B3A5C] outline-none"
                    />
                  </div>

                  <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1">
                    {serverUsersLoading && (
                      <p className="text-[11px] text-gray-400 px-2">Loading user...</p>
                    )}

                    {!serverUsersLoading && filteredServerUsers.length === 0 && (
                      <p className="text-[11px] text-gray-400 px-2">User not found.</p>
                    )}

                    {!serverUsersLoading &&
                      filteredServerUsers.map(u => {
                        const isSelectedDirect =
                          pickerMode === 'DIRECT' && selectedDirectUser?.id === u.id;
                        const isSelectedGroup = pickerMode === 'GROUP' && isGroupUserSelected(u.id);

                        const isSelected = isSelectedDirect || isSelectedGroup;

                        return (
                          <button
                            key={u.id}
                            type="button"
                            // ====== ADDED/CHANGED: follow-check when teacher selects DIRECT user ======
                            onClick={async () => {
                              if (pickerMode === 'DIRECT') {
                                // Teacher: when selecting -> check following first
                                if (isTeacher && authUser?.id) {
                                  setCheckingUserId(u.id);
                                  try {
                                    const res = await dispatch(
                                      fetchTeacherFollowing({
                                        teacherId: authUser.id,
                                        page: 1,
                                        limit: 1000,
                                      }),
                                    ).unwrap();

                                    const items = (res as any)?.items ?? [];
                                    const isFollowing = items.some(
                                      (it: any) => extractFollowedUserId(it) === u.id,
                                    );

                                    if (!isFollowing) {
                                      toast.error(
                                        'Bạn chưa follow người này nên không thể tạo chat trực tiếp.',
                                      );
                                      return;
                                    }

                                    setSelectedDirectUser(u);
                                    setPickerMode(null);
                                  } catch (err: any) {
                                    toast.error(
                                      err?.toString?.() || 'Không kiểm tra được following',
                                    );
                                  } finally {
                                    setCheckingUserId(null);
                                  }
                                  return;
                                }

                                // Non-teacher: keep old behavior
                                setSelectedDirectUser(u);
                                setPickerMode(null);
                              } else {
                                toggleGroupUser(u);
                              }
                            }}
                            // ====== ADDED ======
                            disabled={checkingUserId === u.id}
                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-xl border text-left ${
                              isSelected
                                ? 'bg-[#6D28D9] border-[#6D28D9]'
                                : 'bg-[#1E1D33] border-[#3B3A5C] hover:bg-[#2A2845]'
                            }`}
                          >
                            <img
                              src={u.avatar || (defaultAvatar as string)}
                              alt={u.fullname}
                              className="w-7 h-7 rounded-full object-cover"
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="text-[12px] font-semibold text-white truncate">
                                {u.fullname}
                              </span>
                              <span className="text-[10px] text-gray-400 truncate">{u.email}</span>
                            </div>
                            {isSelected && (
                              <FaCheck className="ml-auto text-[11px] text-emerald-300" />
                            )}
                          </button>
                        );
                      })}
                  </div>

                  {pickerMode === 'GROUP' && (
                    <div className="px-3 py-2 border-t border-[#3B3A5C] text-[11px] text-gray-300">
                      Selected: {selectedGroupUsers.length} members
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
