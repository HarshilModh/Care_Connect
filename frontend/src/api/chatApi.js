import api from './axios'; // ✅ Use the authenticated axios instance

export const sendMessage = async (groupId, message, meta = {}) => {
  const res = await api.post(`/chats/${groupId}/messages`, { message, meta });
  return res.data;
};

export const getRecentMessages = async (groupId, limit = 50) => {
  const res = await api.get(`/chats/${groupId}/messages/recent`, { params: { limit } });
  return res.data;
};

export const getMessagesByGroup = async (groupId, { limit = 50, skip = 0, sortOrder = 1 } = {}) => {
  const res = await api.get(`/chats/${groupId}/messages`, { params: { limit, skip, sortOrder } });
  return res.data;
};

export const markAllAsRead = async (groupId) => {
  const res = await api.patch(`/chats/${groupId}/mark-all-read`);
  return res.data;
};

export const getUnreadCount = async (groupId) => {
  const res = await api.get(`/chats/${groupId}/unread-count`);
  return res.data;
};

export const searchMessages = async (groupId, query) => {
  const res = await api.get(`/chats/${groupId}/messages/search`, { params: { q: query } });
  return res.data;
};

export const getGroupStats = async (groupId) => {
  const res = await api.get(`/chats/${groupId}/stats`);
  return res.data;
};

export const deleteMessage = async (messageId) => {
  const res = await api.delete(`/chats/messages/${messageId}`);
  return res.data;
};

export const editMessage = async (messageId, message) => {
  const res = await api.put(`/chats/messages/${messageId}`, { message });
  return res.data;
};