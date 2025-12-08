import React, { useState } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { AlertTriangle } from 'lucide-react';

const PanicButton = ({ groupId, userId }) => {
  const [loading, setLoading] = useState(false);

  const handlePanic = async () => {
    if (!confirm("🚨 ARE YOU SURE?\n\nThis will send an EMERGENCY ALERT to all group members.")) {
      return;
    }

    setLoading(true);
    try {
      await api.post(`/family-groups/group/${groupId}/panic`, { senderId: userId });
      toast.error("🚨 EMERGENCY ALERT SENT!", {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.error || "Failed to send alert");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePanic}
      disabled={loading}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-white shadow-md transition-all
        ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 animate-pulse'}
      `}
    >
      <AlertTriangle className="w-5 h-5" />
      {loading ? 'SENDING...' : 'PANIC ALERT'}
    </button>
  );
};

export default PanicButton;