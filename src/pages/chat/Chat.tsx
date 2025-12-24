import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import ChatContainer from '@/components/chat/ChatContainer';
import Sidebar from '@/components/chat/Sidebar';
import RightSidebar from '@/components/chat/RightSidebar';

import { RootState } from '@/core/store/store';
import { initSocket, disconnectSocket } from '@/core/services/socket-client';
import { getAccessTokenFromLS } from '@/core/shared/storage';

const Chat: React.FC = () => {
  const selectedUser = useSelector((state: RootState) => state.chat.selectedUser);
  const tokenFromLS = getAccessTokenFromLS();

  const [isRightOpen, setIsRightOpen] = useState(false);
  const [isMobileSidebarVisible, setIsMobileSidebarVisible] = useState(true);

  useEffect(() => {
    if (!tokenFromLS) return;

    const socket = initSocket(tokenFromLS);
    return () => {
      disconnectSocket();
    };
  }, [tokenFromLS]);

  useEffect(() => {
    if (!selectedUser) {
      setIsMobileSidebarVisible(true);
      setIsRightOpen(false);
    }
  }, [selectedUser]);

  const showThreeCols = Boolean(selectedUser && isRightOpen);

  return (
    <div className="w-full h-screen bg-[#070720]">
      <div
        className={`backdrop-blur-xl border-2 border-gray-600
        overflow-hidden h-full grid grid-cols-1 relative
        ${
          selectedUser
            ? showThreeCols
              ? 'md:grid-cols-[1fr_1.6fr_1fr] xl:grid-cols-[1fr_2fr_1fr]'
              : 'md:grid-cols-[1fr_2fr]'
            : 'md:grid-cols-[1.1fr_1.9fr]'
        }`}
      >
        {selectedUser && isRightOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 md:hidden"
            onClick={() => setIsRightOpen(false)}
          />
        )}

        {/* SIDEBAR */}
        <div className={`${isMobileSidebarVisible ? 'block' : 'hidden'} md:block`}>
          <Sidebar onOpenChatMobile={() => setIsMobileSidebarVisible(false)} />
        </div>

        {/* CHAT CONTAINER */}
        <div className={`min-h-80 ${isMobileSidebarVisible ? 'hidden' : 'block'} md:block`}>
          <ChatContainer
            onBackMobile={() => setIsMobileSidebarVisible(true)}
            onToggleRightSidebar={() => setIsRightOpen(prev => !prev)}
          />
        </div>

        {selectedUser && showThreeCols && (
          <div className="hidden md:block">
            <RightSidebar />
          </div>
        )}

        {selectedUser && (
          <div
            className={`
              fixed inset-y-0 right-0 z-40 w-72 max-w-[80%]
              transform transition-transform duration-200
              md:hidden
              ${isRightOpen ? 'translate-x-0' : 'translate-x-full'}
            `}
          >
            <RightSidebar />
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
