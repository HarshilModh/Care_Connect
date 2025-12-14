import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  initializeSocket,
  getSocket,
  joinGroup,
  leaveGroup,
  emitTyping
} from "../../utils/socket";
import {
  sendMessage as sendMessageAPI,
  getRecentMessages,
  markAllAsRead,
  deleteMessage,
  editMessage,
  searchMessages
} from "../../api/chatApi";
import { toast } from "react-toastify";
import GroupDetailsModal from "./GroupDetailsModal";

const ChatWindow = ({ group }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [showDetails, setShowDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Initialize socket and load messages
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);

        // Initialize socket with loged in user info
        initializeSocket(user._id, `${user.firstName} ${user.lastName}`);
        const socket = getSocket();

        // Join group
        joinGroup(group._id);

        // Load recent messages
        const response = await getRecentMessages(group._id); //need to check
        setMessages(response.data);

        // Mark all as read
        await markAllAsRead(group._id);

        // Listen for new messages
        socket.on("new-message", (data) => {
          if (data.groupId === group._id) {
            setMessages((prev) => {
              if (prev.some(m => m._id === data.message._id)) return prev;
              return [...prev, data.message];
            });
            scrollToBottom();
            // Auto mark as read
            markAllAsRead(group._id);
          }
        });

        // Listen for message deletion
        socket.on("message-deleted", ({ messageId }) => {
          setMessages((prev) => prev.map(msg =>
            msg._id === messageId ? { ...msg, deleted: true } : msg
          ));
        });

        // Listen for message edits
        socket.on("message-edited", ({ message }) => {
          setMessages((prev) => prev.map(msg =>
            msg._id === message._id ? message : msg
          ));
        });

        // Listen for typing indicators
        socket.on("user-typing", ({ userId, userName, isTyping }) => {
          if (userId !== user._id) {
            setTypingUsers((prev) => {
              const newSet = new Set(prev);
              if (isTyping) {
                newSet.add(userName);
              } else {
                newSet.delete(userName);
              }
              return newSet;
            });
          }
        });

        // Listen for user joined
        socket.on("user-joined", ({ userName }) => {
          toast.info(`${userName} joined the chat`, { autoClose: 2000 });
        });

        // Listen for user left
        socket.on("user-left", ({ userName }) => {
          toast.info(`${userName} left the chat`, { autoClose: 2000 });
        });

        // Re-join on reconnect
        socket.on("connect", () => {
          console.log("Reconnected to socket, re-joining group");
          joinGroup(group._id);
        });

      } catch (error) {
        console.error("Error initializing chat:", error);
        toast.error("Failed to load chat");
      } finally {
        setLoading(false);
      }
    };

    init();

    // Cleanup
    return () => {
      leaveGroup(group._id);
      const socket = getSocket();
      socket.off("new-message");
      socket.off("message-deleted");
      socket.off("message-edited");
      socket.off("user-typing");
      socket.off("user-joined");
      socket.off("user-left");
    };
  }, [group._id, user._id, user.firstName, user.lastName]);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!isSearching && !loading) {
      scrollToBottom();
    }
  }, [messages, isSearching, loading]);

  // Handle typing indicator
  const handleTyping = () => {
    emitTyping(group._id, true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      emitTyping(group._id, false);
    }, 2000);
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() || sending) {
      return;
    }

    try {
      setSending(true);
      emitTyping(group._id, false);
      setNewMessage(""); 

      if (editingMessage) {
        await editMessage(editingMessage._id, newMessage.trim());
        setEditingMessage(null);
        toast.success("Message updated");
      } else {
        const response = await sendMessageAPI(group._id, newMessage.trim());
        if (response && response.success && response.data) {
          setMessages((prev) => {
            if (prev.some(m => m._id === response.data._id)) return prev;
            return [...prev, response.data];
          });
          scrollToBottom();
        }
      }



    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (confirm("Are you sure you want to delete this message?")) {
      try {
        await deleteMessage(messageId);
        toast.success("Message deleted");
      } catch (error) {
        console.error("Failed to delete message", error);
        toast.error("Failed to delete message");
      }
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      const res = await searchMessages(group._id, searchQuery);
      setMessages(res.data.reverse()); 
    } catch (error) {
      console.error("Search failed", error);
      toast.error("Search failed");
    }
  };

  const clearSearch = async () => {
    setSearchQuery("");
    setIsSearching(false);
    setLoading(true);
    try {
      const response = await getRecentMessages(group._id, 50);
      setMessages(response.data);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      month: "2-digit",
      day: "2-digit",
      year: "2-digit"
    });
  };
  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  const groupMessages = (msgs) => {
    const groups = [];
    let currentGroup = [];

    msgs.forEach((msg, index) => {
      const prevMsg = msgs[index - 1];
      const isSameSender = prevMsg && prevMsg.senderId._id === msg.senderId._id;
      const isWithinTime = prevMsg && (new Date(msg.createdAt) - new Date(prevMsg.createdAt) < 5 * 60 * 1000); // 5 mins

      if (isSameSender && isWithinTime) {
        currentGroup.push(msg);
      } else {
        if (currentGroup.length > 0) {
          groups.push(currentGroup);
        }
        currentGroup = [msg];
      }
    });

    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    return groups;
  };

  const messageGroups = groupMessages(messages);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-[var(--surface-2)]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--brand-1)]"></div>
          <p className="text-gray-500 text-sm animate-pulse">Loading conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50/50 dark:bg-gray-900/50 relative">
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md px-6 py-3 border-b border-[var(--border)] sticky top-0 z-10 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setShowDetails(true)}>
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[var(--brand-1)] to-[var(--brand-2)] flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:scale-105 transition-transform">
            {group.groupName?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--text-main)] flex items-center gap-2 group-hover:text-[var(--brand-1)] transition-colors">
              {group.groupName}
            </h2>
            <p className="text-xs text-gray-500 truncate max-w-xs">
              {group.description || "Click for group info"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isSearching ? (
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-1.5 animate-fadeIn">
              <span className="text-xs text-gray-500 mr-2">Results for "{searchQuery}"</span>
              <button onClick={clearSearch} className="text-gray-500 hover:text-red-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSearch} className="relative hidden md:block group/search">
              <input
                type="text"
                placeholder="Search messages..."
                className="bg-gray-100 dark:bg-gray-800 border-none rounded-full py-1.5 pl-4 pr-9 text-sm focus:ring-2 focus:ring-[var(--brand-1)]/20 w-40 focus:w-60 transition-all placeholder:text-gray-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 group-hover/search:text-[var(--brand-1)] transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                </svg>
              </button>
            </form>
          )}

          <button
            onClick={() => setShowDetails(true)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-[var(--brand-1)] transition-colors"
            title="Group Info"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar scroll-smooth">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-0 animate-fadeIn" style={{ animationFillMode: 'forwards' }}>
            <div className="w-20 h-20 bg-gradient-to-br from-[var(--brand-1)]/10 to-[var(--brand-2)]/10 rounded-full flex items-center justify-center mb-4 shadow-sm">
              <span className="text-4xl">👋</span>
            </div>
            <h3 className="text-xl font-bold mb-1 text-[var(--text-main)]">Welcome to {group.groupName}!</h3>
            <p className="text-gray-500 text-sm max-w-xs mx-auto">
              This is the start of your legendary conversation. Say hello!
            </p>
          </div>
        ) : (
          messageGroups.map((grp, grpIndex) => {
            const firstMsg = grp[0];
            const isOwn = firstMsg.senderId._id === user._id;

            return (
              <div key={`group-${grpIndex}`} className={`flex gap-3 ${isOwn ? "justify-end" : "justify-start"} animate-slideUp`}>
                {!isOwn && (
                  <div className="flex-shrink-0 self-end mb-1">
                    <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 shadow-sm" title={`${firstMsg.senderId.firstName} ${firstMsg.senderId.lastName}`}>
                      {getInitials(firstMsg.senderId.firstName, firstMsg.senderId.lastName)}
                    </div>
                  </div>
                )}

                <div className={`flex flex-col gap-0.5 max-w-[75%] ${isOwn ? "items-end" : "items-start"}`}>
                  {!isOwn && (
                    <span className="text-[10px] text-gray-400 ml-1 mb-0.5 font-medium">
                      {firstMsg.senderId.firstName}
                    </span>
                  )}

                  {grp.map((msg, msgIndex) => {
                    const isLast = msgIndex === grp.length - 1;
                    const isFirst = msgIndex === 0;
                    const isDeleted = msg.deleted;

                    let borderRadiusClass = "rounded-2xl";
                    if (isOwn) {
                      if (!isFirst) borderRadiusClass += " rounded-tr-md";
                      if (!isLast) borderRadiusClass += " rounded-br-md";
                      if (isLast) borderRadiusClass += " rounded-br-none"; // Tail effect
                    } else {
                      if (!isFirst) borderRadiusClass += " rounded-tl-md";
                      if (!isLast) borderRadiusClass += " rounded-bl-md";
                      if (isLast) borderRadiusClass += " rounded-bl-none"; // Tail effect
                    }

                    return (
                      <div
                        key={msg._id}
                        className={`
                          group/msg relative px-4 py-2 shadow-sm transition-all hover:shadow-md
                          ${borderRadiusClass}
                          ${isDeleted
                            ? "bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 italic text-gray-500"
                            : isOwn
                              ? "bg-gradient-to-br from-[var(--brand-1)] to-[var(--brand-2)] text-white"
                              : "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-[var(--text-main)]"
                          }
                        `}
                      >
                        <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                          {isDeleted ? "This message was deleted" : msg.message}
                        </p>
                        <div className={`flex items-center justify-end gap-1 mt-1 ${isOwn ? "text-white/70" : "text-gray-400"}`}>
                          <span className="text-[10px]">
                            {formatTime(msg.createdAt)}
                          </span>
                          {msg.meta?.edited && !isDeleted && (
                            <span className="text-[10px] italic">edited</span>
                          )}
                        </div>

                        {isOwn && !isDeleted && (
                          <div className="absolute -top-8 right-0 hidden group-hover/msg:flex bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 p-1 gap-1 z-10 animate-fadeIn">
                            {(new Date() - new Date(msg.createdAt) < 15 * 60 * 1000) && (
                              <button
                                onClick={() => {
                                  setNewMessage(msg.message);
                                  setEditingMessage(msg);
                                }}
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-blue-500 transition-colors"
                                title="Edit"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                  <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                                  <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
                                </svg>
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteMessage(msg._id)}
                              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-red-500 transition-colors"
                              title="Delete"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}

        {typingUsers.size > 0 && (
          <div className="flex items-center gap-2 ml-12 animate-fadeIn">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-2 flex items-center gap-1 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <span className="text-xs text-gray-400 italic">
              {Array.from(typingUsers).join(", ")} is typing...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-[var(--border)]">
        {editingMessage && (
          <div className="flex items-center justify-between bg-[var(--brand-1)]/10 border border-[var(--brand-1)]/20 p-2 rounded-lg mb-2 text-sm animate-slideUp">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-[var(--brand-1)]">
                <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
              </svg>
              <span className="text-gray-600 dark:text-gray-300 truncate max-w-xs">Editing: {editingMessage.message}</span>
            </div>
            <button onClick={() => { setEditingMessage(null); setNewMessage(""); }} className="text-red-500 hover:text-red-700 text-xs font-medium px-2 py-1 hover:bg-red-50 rounded transition-colors">Cancel</button>
          </div>
        )}
        <form
          onSubmit={handleSendMessage}
          className="flex items-end gap-2 max-w-4xl mx-auto bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-[24px] p-1.5 shadow-sm focus-within:shadow-md focus-within:border-[var(--brand-1)]/50 focus-within:ring-2 focus-within:ring-[var(--brand-1)]/10 transition-all"
        >
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder={editingMessage ? "Edit your message..." : "Type a message..."}
            className="flex-1 bg-transparent border-none focus:ring-0 px-4 py-3 max-h-32 min-h-[48px] resize-none overflow-y-auto text-sm"
            disabled={sending}
            maxLength={3000}
          />

          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className={`
              h-10 w-10 rounded-full flex items-center justify-center mb-1 mr-1 transition-all duration-200
              ${!newMessage.trim() || sending
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-[var(--brand-1)] to-[var(--brand-2)] text-white hover:shadow-lg hover:scale-105 active:scale-95"
              }
            `}
          >
            {sending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            ) : editingMessage ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-0.5">
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
              </svg>
            )}
          </button>
        </form>
        <div className="text-center mt-2">
          <p className="text-[10px] text-gray-400">
            Press Enter to send
          </p>
        </div>
      </div>

      {showDetails && (
        <GroupDetailsModal
          group={group}
          onClose={() => setShowDetails(false)}
        />
      )}
    </div>
  );
};

export default ChatWindow;