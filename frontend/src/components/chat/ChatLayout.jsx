import { useState } from "react";
import GroupList from "./GroupList.jsx";
import ChatWindow from "./ChatWindow.jsx";

const ChatLayout = () => {
  const [selectedGroup, setSelectedGroup] = useState(null);

  return (
    <div className="h-screen flex bg-[var(--surface-2)]">
      {/* Left Sidebar - Group List */}
      <div className="w-full md:w-80 lg:w-96 border-r border-[var(--border)] overflow-hidden bg-white dark:bg-gray-900">
        <GroupList
          onSelectGroup={setSelectedGroup}
          selectedGroupId={selectedGroup?._id}
        />
      </div>

      {/* Right Side - Chat Window */}
      <div className="flex-1 overflow-hidden relative">
        {selectedGroup ? (
          <ChatWindow group={selectedGroup} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-[var(--surface-2)] relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[var(--brand-1)]/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--brand-2)]/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '7s' }}></div>

            <div className="relative z-10 flex flex-col items-center max-w-md animate-scaleIn">
              <div className="w-24 h-24 bg-gradient-to-br from-[var(--brand-1)]/10 to-[var(--brand-2)]/10 rounded-[2rem] flex items-center justify-center mb-8 shadow-sm rotate-3 hover:rotate-6 transition-transform duration-500">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-[var(--brand-1)]">
                  <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.678 3.348-3.97zM6.75 8.25a.75.75 0 01.75-.75h9a.75.75 0 010 1.5h-9a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H7.5z" clipRule="evenodd" />
                </svg>
              </div>

              <h2 className="text-3xl font-black mb-3 bg-gradient-to-r from-[var(--text-main)] to-gray-500 bg-clip-text text-transparent">
                Select a group to start chatting
              </h2>
              <p className="text-gray-500 text-lg leading-relaxed">
                Choose a family group from the sidebar to view messages, share updates, and stay connected with your loved ones.
              </p>

              <div className="mt-8 flex gap-2">
                <div className="w-2 h-2 rounded-full bg-[var(--brand-1)] animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-[var(--brand-1)] animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-[var(--brand-1)] animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatLayout;