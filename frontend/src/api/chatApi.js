import api from './axios'; 

export const sendMessage = async (groupId, message, meta = {}) => {
  const res = await api.post(`/chats/${groupId}/messages`, { message, meta });
  console.log("sendMessage response:", res);
  return res.data;
};

export const getRecentMessages = async (groupId) => {
  const res = await api.get(`/chats/${groupId}/messages/recent`);
  console.log("getRecentMessages response:", res);
  return res.data;
};

export const getMessagesByGroup = async (groupId) => {
  const res = await api.get(`/chats/${groupId}/messages`);
  console.log("getMessagesByGroup response:", res);
  return res.data;
};

export const markAllAsRead = async (groupId) => {
  const res = await api.patch(`/chats/${groupId}/mark-all-read`);
  console.log("markAllAsRead response:", res);
  return res.data;
};

export const getUnreadCount = async (groupId) => {
  const res = await api.get(`/chats/${groupId}/unread-count`);
  console.log("getUnreadCount response:", res);
  return res.data;
};

export const searchMessages = async (groupId, query) => {
  const res = await api.get(`/chats/${groupId}/messages/search`, { params: { q: query } });
  console.log("searchMessages response:", res);
  return res.data;
};

export const getGroupStats = async (groupId) => {
  const res = await api.get(`/chats/${groupId}/stats`);
  console.log("getGroupStats response:", res);
  return res.data;
};

export const deleteMessage = async (messageId) => {
  const res = await api.delete(`/chats/messages/${messageId}`);
  console.log("deleteMessage response:", res);
  return res.data;
};

export const editMessage = async (messageId, message) => {
  const res = await api.put(`/chats/messages/${messageId}`, { message });
  console.log("editMessage response:", res);
  return res.data;
};