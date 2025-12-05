import React, { useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import {
  validateRequired,
  validatePhone,
  validateAge,
  validateEmergencyContact,
} from "../utils/validation";

const CareRecipientOnboarding = () => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [dob, setDob] = useState("");
  const [primaryCondition, setPrimaryCondition] = useState("");
  const [notes, setNotes] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [emergencyRelation, setEmergencyRelation] = useState("");

  const navigate = useNavigate();
  const { groupId } = useParams();
  console.log("groupId", groupId);

  // Read userId from localStorage (same pattern you used already)
  let storedUser = localStorage.getItem("user");
  let userId = "";
  try {
    userId = storedUser ? JSON.parse(storedUser)._id : "";
  } catch (err) {
    console.error("Invalid user data in localStorage", err);
  }

  const validateForm = () => {
    if (!groupId) {
      toast.error("Missing group information. Please go back and try again.");
      return false;
    }

    if (!userId) {
      toast.error("User not found. Please log in again.");
      return false;
    }

    // Validate date of birth
    const dobError = validateAge(dob);
    if (dobError) {
      toast.error(dobError);
      return false;
    }

    // Validate primary condition
    const conditionError = validateRequired(
      primaryCondition,
      "Primary medical condition"
    );
    if (conditionError) {
      toast.error(conditionError);
      return false;
    }

    // Validate emergency contact
    const emergencyError = validateEmergencyContact(
      emergencyName,
      emergencyPhone,
      emergencyRelation
    );
    if (emergencyError) {
      toast.error(emergencyError);
      return false;
    }

    return true;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSaving(true);
    setError(null);

    try {
      const payload = {
        userId,
        groupId,
        dob,
        primaryCondition: primaryCondition.trim(),
        notes: notes.trim(),
        emergencyContacts: [
          {
            name: emergencyName.trim(),
            phone: emergencyPhone.trim(),
            relation: emergencyRelation.trim(),
          },
        ],
      };

      const accessToken = localStorage.getItem("accessToken");

      const res = await axios.post(
        "http://localhost:3000/api/care-recipients",
        payload,
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      console.log("careRecipient onboarding response:", res);

      toast.success("Care recipient onboarding saved ");

      // After onboarding, send them back to family groups or specific group page
      navigate("/family-groups");
      // or navigate(`/group-members/${groupId}`);
    } catch (err) {
      console.error("Error saving care recipient onboarding", err);
      setError(
        err.response?.data?.error ||
          err.message ||
          "Failed to save care recipient onboarding"
      );
      toast.error("Failed to save onboarding");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="page">
      <div className="container-n max-w-2xl mx-auto">
        <header className="mb-6 text-center">
          <h1 className="section-title">Care Recipient Onboarding</h1>
          <p className="section-sub">
            Add key health details and an emergency contact for this care
            recipient. This helps caregivers provide safe, personalized support.
          </p>
        </header>

        <div className="card">
          <div className="card-pad">
            {error && <div className="alert-error mb-4">{String(error)}</div>}

            <form className="grid gap-4" onSubmit={handleSubmit}>
              {/* DOB */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Date of birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  className="input"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  required
                />
              </div>

              {/* Primary condition */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Primary condition <span className="text-red-500">*</span>
                </label>
                <input
                  className="input"
                  placeholder="e.g. Alzheimer's, post-surgery recovery, diabetes"
                  value={primaryCondition}
                  onChange={(e) => setPrimaryCondition(e.target.value)}
                  required
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Additional notes (optional)
                </label>
                <textarea
                  className="input min-h-[80px]"
                  placeholder="Important routines, preferences, allergies, triggers, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Emergency contact */}
              <div className="border rounded-lg p-3 mt-2">
                <h2 className="text-sm font-semibold mb-2">
                  Emergency contact <span className="text-red-500">*</span>
                </h2>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      Name
                    </label>
                    <input
                      className="input"
                      placeholder="e.g. John Doe"
                      value={emergencyName}
                      onChange={(e) => setEmergencyName(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1">
                      Phone
                    </label>
                    <input
                      className="input"
                      placeholder="e.g. +1 555-123-4567"
                      value={emergencyPhone}
                      onChange={(e) => setEmergencyPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-xs font-medium mb-1">
                    Relationship
                  </label>
                  <input
                    className="input"
                    placeholder="e.g. Daughter, Son, Spouse"
                    value={emergencyRelation}
                    onChange={(e) => setEmergencyRelation(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => navigate("/family-groups")}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Saving…" : "Save & Continue"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </main>
  );
};

export default CareRecipientOnboarding;
