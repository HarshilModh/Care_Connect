import React, { useState } from "react";
import {
  CheckCircleIcon,
  XCircleIcon,
  BellIcon,
  UserGroupIcon,
  ClockIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import {
  acceptJoinRequest,
  rejectJoinRequest,
  markAsRead,
  markForDeletion,
} from "../../api/notifications";

const NotificationItem = ({ notification, onUpdate, userId }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAcceptConfirm, setShowAcceptConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);

  // Handle accept join request
  const handleAccept = async () => {
    setIsProcessing(true);
    try {
      await acceptJoinRequest(notification._id, userId);
      toast.success("Join request accepted!");
      setShowAcceptConfirm(false);
      onUpdate(); // Refresh notifications
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to accept request");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle reject join request
  const handleReject = async () => {
    setIsProcessing(true);
    try {
      await rejectJoinRequest(notification._id, userId);
      toast.success("Join request rejected");
      setShowRejectConfirm(false);
      onUpdate(); // Refresh notifications
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to reject request");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle mark as read
  const handleMarkRead = async () => {
    if (notification.isRead) return;

    try {
      await markAsRead(notification._id, userId);
      onUpdate(); // Refresh notifications
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  // Handle dismiss (mark for deletion)
  const handleDismiss = async () => {
    try {
      await markForDeletion(notification._id, userId);
      toast.success("Notification dismissed");
      onUpdate(); // Refresh notifications
    } catch (error) {
      toast.error("Failed to dismiss notification");
    }
  };

  // Get icon based on notification type
  const getIcon = () => {
    switch (notification.type) {
      case "join_request":
        return <UserGroupIcon className="h-6 w-6 text-indigo-500" />;
      case "task_reminder":
      case "task_assigned":
        return <ClockIcon className="h-6 w-6 text-amber-500" />;
      case "task_completed":
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case "system":
        return <BellIcon className="h-6 w-6 text-blue-500" />;
      default:
        return <BellIcon className="h-6 w-6 text-slate-500" />;
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  // Check if notification has expired
  const isExpired =
    notification.expiresAt && new Date(notification.expiresAt) < new Date();

  return (
    <div
      onClick={handleMarkRead}
      className={`
        relative p-4 border rounded-lg transition-all cursor-pointer
        ${
          notification.isRead
            ? "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
            : "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800"
        }
        hover:shadow-md
      `}
    >
      {/* Unread indicator */}
      {!notification.isRead && (
        <div className="absolute top-4 left-0 w-1 h-12 bg-indigo-500 rounded-r"></div>
      )}

      <div className="flex gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-1">{getIcon()}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title and time */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              {notification.title}
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
              {formatTime(notification.createdAt)}
            </span>
          </div>

          {/* Message */}
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
            {notification.message}
          </p>

          {/* Group name if available */}
          {(notification.groupId?.groupName ||
            notification.metadata?.groupName) && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              Group:{" "}
              {notification.groupId?.groupName ||
                notification.metadata?.groupName}
            </p>
          )}

          {/* Expiration warning */}
          {isExpired && notification.type === "join_request" && (
            <p className="text-xs text-red-500 mb-2">
              This invitation has expired
            </p>
          )}

          {/* Action buttons for join request */}
          {notification.type === "join_request" &&
            notification.actionStatus === "pending" &&
            !isExpired && (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log("Accept button clicked, showing modal");
                    setShowAcceptConfirm(true);
                  }}
                  disabled={isProcessing}
                  className="
                  flex items-center gap-1 px-3 py-1.5 text-sm font-medium
                  text-white bg-green-600 hover:bg-green-700
                  rounded-md transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
                >
                  <CheckCircleIcon className="h-4 w-4" />
                  Accept
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log("Reject button clicked, showing modal");
                    setShowRejectConfirm(true);
                  }}
                  disabled={isProcessing}
                  className="
                  flex items-center gap-1 px-3 py-1.5 text-sm font-medium
                  text-white bg-red-600 hover:bg-red-700
                  rounded-md transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
                >
                  <XCircleIcon className="h-4 w-4" />
                  Reject
                </button>
              </div>
            )}

          {/* Status indicator for processed requests */}
          {notification.type === "join_request" &&
            notification.actionStatus !== "pending" && (
              <div className="mt-2">
                {notification.actionStatus === "accepted" && (
                  <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                    <CheckCircleIcon className="h-4 w-4" />
                    Accepted
                  </span>
                )}
                {notification.actionStatus === "rejected" && (
                  <span className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                    <XCircleIcon className="h-4 w-4" />
                    Rejected
                  </span>
                )}
              </div>
            )}
        </div>

        {/* Dismiss button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDismiss();
          }}
          className="
            flex-shrink-0 p-1 text-slate-400 hover:text-red-500
            transition-colors rounded
          "
          title="Dismiss notification"
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Accept Confirmation Modal */}
      {showAcceptConfirm && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => {
            console.log("Modal backdrop clicked, closing");
            setShowAcceptConfirm(false);
          }}
        >
          {console.log("Accept modal is rendering")}
          <div
            className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Accept Join Request
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
              Are you sure you want to accept this join request for{" "}
              <span className="font-semibold">
                {notification.groupId?.groupName ||
                  notification.metadata?.groupName ||
                  "this group"}
              </span>
              ?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowAcceptConfirm(false)}
                disabled={isProcessing}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAccept}
                disabled={isProcessing}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-4 w-4" />
                    Accept
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {showRejectConfirm && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowRejectConfirm(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Reject Join Request
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
              Are you sure you want to reject this join request for{" "}
              <span className="font-semibold">
                {notification.groupId?.groupName ||
                  notification.metadata?.groupName ||
                  "this group"}
              </span>
              ?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowRejectConfirm(false)}
                disabled={isProcessing}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={isProcessing}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <XCircleIcon className="h-4 w-4" />
                    Reject
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationItem;
