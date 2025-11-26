import { useState } from "react";
import GroupList from "./GroupList.jsx";
import ChatWindow from "./ChatWindow.jsx";

const ChatLayout = () => {
  const [selectedGroup, setSelectedGroup] = useState(null);

  return (
    <div className="h-screen flex bg-[var(--surface-2)]">
      {/* Left Sidebar - Group List */}
      <div className="w-full md:w-80 lg:w-96 border-r-2 border-[var(--border)] overflow-hidden">
        <GroupList 
          onSelectGroup={setSelectedGroup}
          selectedGroupId={selectedGroup?._id}
        />
      </div>

      {/* Right Side - Chat Window */}
      <div className="flex-1 overflow-hidden">
        {selectedGroup ? (
          <ChatWindow group={selectedGroup} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="text-8xl mb-6">💬</div>
            <h2 className="text-3xl font-bold mb-4">Select a group to start chatting</h2>
            <p className="text-gray-600 text-lg">
              Choose a family group from the list to view messages and start conversations
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatLayout;