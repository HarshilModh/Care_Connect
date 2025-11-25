import api from "./axios";

export const getUserNotifications = async (userId, filters = {}) => {
  const params = new URLSearchParams();
  if (filters.isRead !== undefined) params.append("isRead", filters.isRead);
  if (filters.type) params.append("type", filters.type);
  if (filters.actionStatus) params.append("actionStatus", filters.actionStatus);

  const queryString = params.toString();
  const url = `/notifications/user/${userId}${
    queryString ? `?${queryString}` : ""
  }`;
  const response = await api.get(url);
  return response.data;
};

export const getUnreadCount = async (userId) => {
  const response = await api.get(`/notifications/user/${userId}/unread-count`);
  return response.data;
};

export const getNotificationById = async (notificationId) => {
  const response = await api.get(`/notifications/${notificationId}`);
  return response.data;
};

export const sendJoinRequest = async (
  groupId,
  recipientId,
  senderId,
  message = ""
) => {
  const response = await api.post(
    "/notifications/join-request",
    {
      groupId,
      recipientId,
      senderId,
      message,
    },
    {
      withCredentials: true,
    }
  );
  return response.data;
};

export const acceptJoinRequest = async (notificationId, userId) => {
  const response = await api.patch(`/notifications/${notificationId}/accept`, {
    userId,
  });
  return response.data;
};

export const rejectJoinRequest = async (notificationId, userId) => {
  const response = await api.patch(`/notifications/${notificationId}/reject`, {
    userId,
  });
  return response.data;
};

export const markAsRead = async (notificationId, userId) => {
  const response = await api.patch(`/notifications/${notificationId}/read`, {
    userId,
  });
  return response.data;
};

export const markAllAsRead = async (userId) => {
  const response = await api.patch(`/notifications/user/${userId}/read-all`);
  return response.data;
};

export const markForDeletion = async (notificationId, userId) => {
  const response = await api.patch(
    `/notifications/${notificationId}/mark-delete`,
    {
      userId,
    }
  );
  return response.data;
};

export const deleteNotification = async (notificationId, userId) => {
  const response = await api.delete(`/notifications/${notificationId}`, {
    data: { userId },
  });
  return response.data;
};
