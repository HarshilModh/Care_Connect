import { io } from "socket.io-client";

let socket = null;

export const initializeSocket = (userId, userName) => {
  if (socket) return socket;
  let connectionUrl = "http://localhost:3000";

  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    connectionUrl = apiUrl.replace(/\/api\/?$/, "");
  } else if (typeof window !== "undefined") {
    connectionUrl = `${window.location.protocol}//${window.location.hostname}:3000`;
  }

  socket = io(connectionUrl, {
    query: { userId, userName },
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5
  });

  socket.on("connect", () => console.log("Socket connected:", socket.id));
  socket.on("disconnect", (r) => console.log("Socket disconnected:", r));
  socket.on("connect_error", (e) => console.error("Socket connect_error:", e.message));

  return socket;
};

export const getSocket = () => {
  if (!socket) throw new Error("Socket not initialized. Call initializeSocket() first.");
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log("Socket disconnected");
  }
};

export const joinGroup = (groupId) => {
  const socket = getSocket();
  socket.emit("join-group", groupId);
};

export const leaveGroup = (groupId) => {
  const socket = getSocket();
  socket.emit("leave-group", groupId);
};

export const emitTyping = (groupId, isTyping) => {
  const socket = getSocket();
  socket.emit("typing", { groupId, isTyping });
};

export const emitMessageRead = (groupId, messageId) => {
  const socket = getSocket();
  socket.emit("message-read", { groupId, messageId });
};