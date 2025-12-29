import { RootState } from '@/core/store/store';
import {
  ConversationMember,
  fetchConversationMembers,
  updateConversation,
  kickConversationMember,
  leaveConversation,
  inviteConversationMember,
  fetchPendingMembers,
  approveJoinRequest,
} from '@/redux/slices/chat.slice';
import defaultAvatar from '@/assets/icons/user.png';
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '@/core/store/store';
import toast from 'react-hot-toast';
import { FaCheck, FaDoorOpen, FaPencilAlt, FaTimes, FaUserPlus } from 'react-icons/fa';
import { fetchUsers as fetchServerUsers } from '@/redux/slices/adminSlices/user.slice';

type PickerTab = 'add' | 'pending';

const RightSidebar: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  const { selectedUser, messages, onlineUsers, members } = useSelector(
    (state: RootState) => state.chat,
  );

  // pending state from chat slice
  const { pendingMembersByConversationId, pendingLoading, pendingError } = useSelector(
    (state: RootState) => state.chat,
  );

  const authUser = useSelector((state: RootState) => state.user.user);

  const [msgImages, setMsgImages] = useState<string[]>([]);

  const [showEdit, setShowEdit] = useState(false);
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');

  // Invite picker modal
  const usersState = useSelector((state: RootState) => state.users);
  const serverUsers = usersState.items;
  const serverUsersLoading = usersState.loading;

  const [showInvitePicker, setShowInvitePicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerTab, setPickerTab] = useState<PickerTab>('add');

  // Identify yourself in the members list (used to avoid kicking yourself out)
  const myMember = useMemo(() => {
    if (!authUser || !members) return undefined;
    return members.find(m => m.user?.email === authUser.email);
  }, [authUser, members]);

  const isModerator = useMemo(() => {
    const r = (myMember?.role || '').toUpperCase();
    return r === 'MODERATOR';
  }, [myMember?.role]);

  const pendingList = useMemo(() => {
    if (!selectedUser?._id) return [];
    return pendingMembersByConversationId?.[String(selectedUser._id)] || [];
  }, [pendingMembersByConversationId, selectedUser?._id]);

  useEffect(() => {
    const imgs = messages.filter(m => !!m.image).map(m => m.image as string);
    setMsgImages(imgs);
  }, [messages]);

  useEffect(() => {
    if (selectedUser?._id) {
      dispatch(fetchConversationMembers(selectedUser._id));
      setTitle(selectedUser.fullName || '');
      setBio(selectedUser.bio || '');
    }
  }, [dispatch, selectedUser?._id]);

  // load server users list when modal open & add tab
  useEffect(() => {
    if (
      showInvitePicker &&
      pickerTab === 'add' &&
      serverUsers.length === 0 &&
      !serverUsersLoading
    ) {
      dispatch(fetchServerUsers({ limit: 1000 }));
    }
  }, [showInvitePicker, pickerTab, serverUsers.length, serverUsersLoading, dispatch]);

  // load pending list when modal open & pending tab (moderator only)
  useEffect(() => {
    if (!showInvitePicker) return;
    if (!selectedUser?._id) return;
    if (!isModerator) return;
    if (pickerTab !== 'pending') return;

    dispatch(fetchPendingMembers({ conversationId: selectedUser._id, skip: 0, take: 50 }));
  }, [showInvitePicker, pickerTab, selectedUser?._id, isModerator, dispatch]);

  useEffect(() => {
    if (!isModerator && pickerTab === 'pending') {
      setPickerTab('add');
    }
  }, [isModerator, pickerTab]);

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

  if (!selectedUser) return null;

  const isOnline = onlineUsers.includes(selectedUser._id);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser?._id) return;

    try {
      await dispatch(
        updateConversation({
          id: selectedUser._id,
          title: title.trim() || undefined,
          description: bio.trim() || undefined,
        }),
      ).unwrap();
      toast.success('Conversation updated successfully');
      setShowEdit(false);
    } catch (err: any) {
      toast.error(err?.toString() || 'Update failed');
    }
  };

  const handleKick = async (member: ConversationMember) => {
    if (!selectedUser?._id) return;

    if (myMember && member.userId === myMember.userId) {
      toast.error('Cannot kick yourself, please use the "Leave chat" button.');
      return;
    }

    try {
      await dispatch(
        kickConversationMember({
          conversationId: selectedUser._id,
          targetUserId: member.userId,
        }),
      ).unwrap();
      toast.success(`Kicked ${member.user.fullname}`);
    } catch (err: any) {
      toast.error(err?.toString() || 'Kick member failed');
    }
  };

  const handleLeave = async () => {
    if (!selectedUser?._id) return;
    try {
      await dispatch(leaveConversation(selectedUser._id)).unwrap();
      toast.success('You have left the conversation');
    } catch (err: any) {
      toast.error(err?.toString() || 'Leaving conversation failed');
    }
  };

  const handleApproveOrReject = async (requestId: number, approve: boolean) => {
    if (!selectedUser?._id) return;

    try {
      await dispatch(
        approveJoinRequest({
          requestId,
          approve,
          conversationId: selectedUser._id,
        }),
      ).unwrap();

      toast.success(approve ? 'Approved successfully' : 'Rejected successfully');

      // refresh UI
      dispatch(fetchPendingMembers({ conversationId: selectedUser._id, skip: 0, take: 50 }));
      dispatch(fetchConversationMembers(selectedUser._id));
    } catch (err: any) {
      toast.error(err?.toString() || 'Action failed');
    }
  };

  return (
    <div className="bg-[#252641] text-white w-full h-full relative">
      {/* Profile & Update */}
      <div className="pt-16 flex flex-col items-center gap-2 text-xs font-light mx-auto">
        <img
          src={selectedUser.profilePic || (defaultAvatar as string)}
          alt="avatar"
          className="w-20 h-20 rounded-full object-cover border-2 border-[#6D28D9]"
        />

        <h1 className="px-10 text-xl font-semibold mx-auto flex items-center gap-2">
          {isOnline && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
          {selectedUser.fullName}
        </h1>

        <p className="px-10 mx-auto opacity-80">{selectedUser.bio}</p>
        <div className="flex items-center justify-between gap-4 mt-4">
          {/* leave conversation button */}
          <button
            type="button"
            onClick={handleLeave}
            className=" p-2 rounded-full bg-red-600 hover:bg-red-500 "
          >
            <FaDoorOpen className="text-xl" />
          </button>

          {/* invite member */}
          <button
            type="button"
            onClick={() => {
              setShowInvitePicker(true);
              setPickerSearch('');
              setPickerTab('add');
            }}
            className="p-2 text-xl rounded-full bg-[#22C55E] hover:bg-green-500 transition"
            title="Add member"
          >
            <FaUserPlus />
          </button>

          {/* Update button and hidden form */}
          <button
            type="button"
            onClick={() => setShowEdit(prev => !prev)}
            className="p-2 text-xl rounded-full bg-[#6D28D9] hover:bg-purple-700 transition"
          >
            <FaPencilAlt />
          </button>
        </div>

        {showEdit && (
          <form
            onSubmit={handleUpdate}
            className="mt-2 w-full px-10 flex flex-col gap-2 text-[11px]"
          >
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Conversation Title"
              className="px-2 py-3 rounded bg-[#1E1D33] border border-[#6D28D9]/40 outline-none text-xs"
            />
            <input
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Description / Notes"
              className="px-2 py-3 rounded bg-[#1E1D33] border border-[#6D28D9]/40 outline-none text-xs"
            />
            <button
              type="submit"
              className="self-end px-3 py-1 rounded-full bg-[#F48C06] hover:bg-orange-500 text-base font-medium"
            >
              Save
            </button>
          </form>
        )}

        {/* Invite / Pending modal */}
        {showInvitePicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="w-full max-w-sm max-h-[460px] rounded-2xl bg-[#070720] border border-purple-600/70 flex flex-col">
              <div className="flex items-center justify-between px-3 py-2 ">
                <p className="text-[12px] font-semibold text-white">Manage members</p>
                <button
                  type="button"
                  onClick={() => {
                    setShowInvitePicker(false);
                    setPickerSearch('');
                    setPickerTab('add');
                  }}
                  className="text-[11px] px-2 py-1 rounded-full "
                >
                  <FaTimes />
                </button>
              </div>

              {/* Tabs */}
              <div className="px-4 ">
                <div className="bg-[#0B0B1E] rounded-full p-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPickerTab('add')}
                    className={`flex-1 h-8 rounded-full text-[12px] font-semibold transition
                                ${pickerTab === 'add' ? 'bg-purple-600 text-white' : 'bg-transparent text-gray-200'}
                              `}
                  >
                    Add user
                  </button>

                  {isModerator && (
                    <button
                      type="button"
                      onClick={() => setPickerTab('pending')}
                      className={`flex-1 h-8 rounded-full text-[12px] font-semibold transition
                                  ${pickerTab === 'pending' ? 'bg-purple-600 text-white' : 'bg-transparent text-gray-200'}
                                `}
                    >
                      Pending
                    </button>
                  )}
                </div>
              </div>

              {/* Search only for add tab */}
              {pickerTab === 'add' && (
                <div className="px-3 pt-2 pb-1">
                  <input
                    value={pickerSearch}
                    onChange={e => setPickerSearch(e.target.value)}
                    placeholder="Search by name, email..."
                    className="w-full px-2 py-1.5 text-[11px] rounded-full bg-[#171432] text-white border border-[#3B3A5C] outline-none"
                  />
                </div>
              )}

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1">
                {/* ADD TAB */}
                {pickerTab === 'add' && (
                  <>
                    {serverUsersLoading && (
                      <p className="text-[11px] text-gray-400 px-2">Loading user...</p>
                    )}

                    {!serverUsersLoading && filteredServerUsers.length === 0 && (
                      <p className="text-[11px] text-gray-400 px-2">User not found.</p>
                    )}

                    {!serverUsersLoading &&
                      filteredServerUsers.map(u => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={async () => {
                            if (!selectedUser?._id) return;

                            try {
                              const result = await dispatch(
                                inviteConversationMember({
                                  conversationId: selectedUser._id,
                                  userId: u.id,
                                }),
                              ).unwrap();

                              if (result.kind === 'MEMBER') {
                                toast.success('Member added successfully');
                                dispatch(fetchConversationMembers(selectedUser._id));
                              } else {
                                toast.success('Invitation sent (awaiting MOD approval)');
                                // If the moderator has a pending tab open, the list will refresh; otherwise, it will not.
                              }

                              setShowInvitePicker(false);
                              setPickerSearch('');
                              setPickerTab('add');
                            } catch (err: any) {
                              toast.error(err?.toString() || 'Invite failed');
                            }
                          }}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-xl border text-left bg-[#1E1D33] border-[#3B3A5C] hover:bg-[#2A2845]"
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

                          <FaCheck className="ml-auto text-[11px] text-emerald-300 opacity-0 group-hover:opacity-100" />
                        </button>
                      ))}
                  </>
                )}

                {/* PENDING TAB */}
                {pickerTab === 'pending' && isModerator && (
                  <>
                    {pendingLoading && (
                      <p className="text-[11px] text-gray-400 px-2">Loading pending members...</p>
                    )}

                    {!pendingLoading && pendingError && (
                      <p className="text-[11px] text-red-400 px-2">{pendingError}</p>
                    )}

                    {!pendingLoading && !pendingError && pendingList.length === 0 && (
                      <p className="text-[11px] text-gray-400 px-2">No pending members.</p>
                    )}

                    {!pendingLoading &&
                      !pendingError &&
                      pendingList.map((p: any) => {
                        const requestId = Number(p.requestId ?? p.id);
                        const user = p.invitedUser ?? {};
                        const fullname = user.fullname ?? 'Unknown';
                        const email = user.email ?? '';
                        const avatar = user.avatar ?? user.profilePic ?? null;

                        return (
                          <div
                            key={String(requestId)}
                            className="w-full flex items-center gap-2 px-2 py-2 rounded-xl border text-left bg-[#1E1D33] border-[#3B3A5C]"
                          >
                            <img
                              src={avatar || (defaultAvatar as string)}
                              alt={fullname}
                              className="w-8 h-8 rounded-full object-cover"
                            />

                            <div className="flex flex-col min-w-0">
                              <span className="text-[12px] font-semibold text-white truncate">
                                {fullname}
                              </span>
                              <span className="text-[10px] text-gray-400 truncate">{email}</span>
                            </div>

                            <div className="ml-auto flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleApproveOrReject(requestId, true)}
                                className="text-[10px] px-2 py-1 rounded-full bg-emerald-600 hover:bg-emerald-500"
                              >
                                Accept
                              </button>
                              <button
                                type="button"
                                onClick={() => handleApproveOrReject(requestId, false)}
                                className="text-[10px] px-2 py-1 rounded-full bg-red-600 hover:bg-red-500"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Media section */}
      <div className="px-5 text-xs mt-6">
        <p className="font-semibold text-[#F48C06]">Media</p>

        <div className="mt-3 max-h-[200px] overflow-y-auto scrollbar-soft grid grid-cols-2 gap-3">
          {msgImages.map((url, index) => (
            <a
              key={index}
              href={url}
              data-fancybox="chat-images"
              data-caption={`Media ${index + 1}`}
              className="cursor-pointer rounded border border-[#6D28D9]/40 p-1 block"
            >
              <img src={url} alt="media" className="h-full w-full object-cover rounded-md" />
            </a>
          ))}
          {msgImages.length === 0 && (
            <p className="text-[11px] text-gray-400 col-span-2">No media.</p>
          )}
        </div>
      </div>

      {/* Members section with Kick button */}
      <div className="px-5 text-xs mt-6 pb-4">
        <p className="font-semibold text-[#F48C06]">Members</p>
        <div className="mt-3 flex flex-col gap-3 max-h-60 overflow-y-auto scrollbar-soft">
          {members.map((m: ConversationMember) => {
            const isMe = myMember && myMember.userId === m.userId;
            return (
              <div
                key={m.userId}
                className="flex items-center justify-between gap-3 bg-[#1E1D33] rounded-xl px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <img
                    src={m.user.avatar || (defaultAvatar as string)}
                    alt={m.user.fullname}
                    className="w-8 h-8 rounded-full object-cover border border-purple-600/50"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{m.user.fullname}</span>
                    <span className="text-[10px] text-gray-400">
                      {m.role} · {m.user.email}
                    </span>
                  </div>
                </div>

                {!isMe && (
                  <button
                    type="button"
                    onClick={() => handleKick(m)}
                    className="text-[10px] px-3 py-1 rounded-full bg-red-600 hover:bg-red-500"
                  >
                    Kick
                  </button>
                )}
                {isMe && <span className="text-[10px] text-green-400 font-medium pr-2">You</span>}
              </div>
            );
          })}
          {members.length === 0 && <p className="text-[11px] text-gray-400">No members found.</p>}
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;
