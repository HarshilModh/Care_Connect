import React, { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Bell,
  Users,
  Clock,
  Trash2,
  AlertCircle,
  Calendar,
  Check,
  X
} from "lucide-react";
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

  const handleAccept = async () => {
    setIsProcessing(true);
    try {
      await acceptJoinRequest(notification._id, userId);
      toast.success("Join request accepted!");
      setShowAcceptConfirm(false);
      onUpdate();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to accept request");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      await rejectJoinRequest(notification._id, userId);
      toast.success("Join request rejected");
      setShowRejectConfirm(false);
      onUpdate();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to reject request");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkRead = async () => {
    if (notification.isRead) return;
    try {
      await markAsRead(notification._id, userId);
      onUpdate();
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleDismiss = async (e) => {
    e.stopPropagation();
    try {
      await markForDeletion(notification._id, userId);
      toast.success("Notification dismissed");
      onUpdate();
    } catch (error) {
      toast.error("Failed to dismiss notification");
    }
  };

  const getIconConfig = () => {
    switch (notification.type) {
      case "join_request":
        return { icon: Users, color: "text-indigo-600", bg: "bg-indigo-100" };
      case "task_reminder":
        return { icon: Clock, color: "text-amber-600", bg: "bg-amber-100" };
      case "task_assigned":
        return { icon: Calendar, color: "text-blue-600", bg: "bg-blue-100" };
      case "task_completed":
        return { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-100" };
      case "system":
        return { icon: AlertCircle, color: "text-gray-600", bg: "bg-gray-100" };
      default:
        return { icon: Bell, color: "text-gray-600", bg: "bg-gray-100" };
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diff = (now - date) / 1000; // seconds

    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const isExpired = notification.expiresAt && new Date(notification.expiresAt) < new Date();
  const { icon: Icon, color, bg } = getIconConfig();

  return (
    <>
      <div
        onClick={handleMarkRead}
        className={`
          group relative p-4 transition-all duration-200 cursor-pointer
          ${notification.isRead ? "bg-white hover:bg-gray-50" : "bg-blue-50/40 hover:bg-blue-50/70"}
        `}
      >
        <div className="flex gap-4">
          {/* Icon Box */}
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${bg} ${color}`}>
            <Icon className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0 pt-0.5">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <h3 className={`text-sm font-semibold ${notification.isRead ? 'text-gray-900' : 'text-blue-900'}`}>
                {notification.title}
              </h3>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs text-gray-400 font-medium">
                  {formatTime(notification.createdAt)}
                </span>
                {!notification.isRead && (
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                )}
              </div>
            </div>

            {/* Body */}
            <p className="text-sm text-gray-600 mt-1 leading-relaxed">
              {notification.message}
            </p>

            {/* Metadata (Group Name) */}
            {(notification.groupId?.groupName || notification.metadata?.groupName) && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded bg-gray-100 text-xs font-medium text-gray-600">
                <Users className="w-3 h-3 text-gray-400" />
                {notification.groupId?.groupName || notification.metadata?.groupName}
              </div>
            )}

            {/* Special States: Expired */}
            {isExpired && notification.type === "join_request" && (
              <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Invitation expired
              </p>
            )}

            {/* Special States: Join Actions */}
            {notification.type === "join_request" && notification.actionStatus === "pending" && !isExpired && (
              <div className="flex gap-3 mt-4">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowAcceptConfirm(true); }}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm transition-colors"
                >
                  <Check className="w-4 h-4" /> Accept
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowRejectConfirm(true); }}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200 rounded-lg shadow-sm transition-all"
                >
                  <X className="w-4 h-4" /> Reject
                </button>
              </div>
            )}

            {/* Special States: Action Result Status */}
            {notification.type === "join_request" && notification.actionStatus !== "pending" && (
              <div className="mt-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wide">
                {notification.actionStatus === "accepted" ? (
                  <span className="text-green-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Accepted</span>
                ) : (
                  <span className="text-red-600 flex items-center gap-1"><XCircle className="w-4 h-4" /> Rejected</span>
                )}
              </div>
            )}
          </div>

          {/* Dismiss Button (Visible on hover/group) */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 self-start p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
            title="Dismiss notification"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* --- Modals --- */}
      
      {/* Accept Modal */}
      {showAcceptConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowAcceptConfirm(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4 mx-auto text-green-600">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-center text-gray-900 mb-2">Join Group?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Are you sure you want to join <span className="font-semibold text-gray-900">{notification.groupId?.groupName || "this group"}</span>? You will gain access to shared tasks and information.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowAcceptConfirm(false)}
                className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={handleAccept}
                disabled={isProcessing}
                className="px-4 py-2.5 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                {isProcessing ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : "Join Now"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowRejectConfirm(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 mx-auto text-red-600">
              <XCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-center text-gray-900 mb-2">Decline Invitation</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Are you sure you want to decline the invitation to <span className="font-semibold text-gray-900">{notification.groupId?.groupName || "this group"}</span>?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowRejectConfirm(false)}
                className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={isProcessing}
                className="px-4 py-2.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                {isProcessing ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : "Decline"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NotificationItem;