import React, { useState, useEffect } from "react";
import ReactModal from "react-modal";
import { X, User, Calendar, FileText, Phone, Activity } from "lucide-react";
import api from "../../api/axios";

// Bind modal to app element (accessibility)
ReactModal.setAppElement("#root");

const CareRecipentModal = ({ isOpen, onClose, careRecipentId, groupId }) => {
  const [careRecipient, setCareRecipient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !careRecipentId) return;

    const fetchCareRecipient = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch by User ID
        const response = await api.get(
          `/care-recipients/user/${careRecipentId}`
        );
        const data = response.data;

        // If array, find the one for this group, or default to first
        let recipientData = null;
        if (Array.isArray(data)) {
          recipientData =
            data.find((r) => r.groupId === groupId) ||
            data.find((r) => r.groupId?._id === groupId) ||
            data[0];
        } else {
          recipientData = data;
        }

        setCareRecipient(recipientData);
      } catch (err) {
        console.error("Error fetching care recipient:", err);
        setError("Could not load care recipient details.");
      } finally {
        setLoading(false);
      }
    };

    fetchCareRecipient();
  }, [isOpen, careRecipentId, groupId]);

  const modalStyles = {
    overlay: {
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      zIndex: 1000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    content: {
      position: "relative",
      top: "auto",
      left: "auto",
      right: "auto",
      bottom: "auto",
      maxWidth: "500px",
      width: "90%",
      padding: "0",
      border: "none",
      borderRadius: "16px",
      boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
      maxHeight: "90vh",
      overflow: "auto",
    },
  };

  if (!isOpen) return null;

  return (
    <ReactModal
      isOpen={isOpen}
      onRequestClose={onClose}
      style={modalStyles}
      contentLabel="Care Recipient Details"
    >
      <div className="bg-white">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            Care Recipient Profile
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              <p>{error}</p>
            </div>
          ) : careRecipient ? (
            <div className="space-y-6">
              {/* User Info */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 text-2xl font-bold">
                  {careRecipient.userId?.firstName?.[0]}
                  {careRecipient.userId?.lastName?.[0]}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {careRecipient.userId?.firstName}{" "}
                    {careRecipient.userId?.lastName}
                  </h3>
                  <p className="text-sm text-gray-500">Care Recipient</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-500 text-xs font-medium uppercase mb-1">
                    <Calendar className="w-3 h-3" /> Date of Birth
                  </div>
                  <p className="font-semibold text-gray-900">
                    {careRecipient.dob
                      ? new Date(careRecipient.dob).toLocaleDateString()
                      : "Not set"}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-500 text-xs font-medium uppercase mb-1">
                    <Activity className="w-3 h-3" /> Condition
                  </div>
                  <p
                    className="font-semibold text-gray-900 truncate"
                    title={careRecipient.primaryCondition}
                  >
                    {careRecipient.primaryCondition || "None listed"}
                  </p>
                </div>
              </div>

              {/* Notes */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" /> Medical Notes
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                  {careRecipient.notes || "No notes provided."}
                </p>
              </div>

              {/* Emergency Contacts */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" /> Emergency Contacts
                </h4>
                <div className="space-y-2">
                  {careRecipient.emergencyContacts?.map((contact, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100"
                    >
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          {contact.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {contact.relation}
                        </p>
                      </div>
                      <a
                        href={`tel:${contact.phone}`}
                        className="text-red-600 hover:text-red-700 font-medium text-sm flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" /> {contact.phone}
                      </a>
                    </div>
                  ))}
                  {(!careRecipient.emergencyContacts ||
                    careRecipient.emergencyContacts.length === 0) && (
                    <span className="text-sm text-gray-500 italic">
                      No emergency contacts listed.
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No care recipient details found.
            </div>
          )}
        </div>
      </div>
    </ReactModal>
  );
};

export default CareRecipentModal;
