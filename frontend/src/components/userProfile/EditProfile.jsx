import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getAuth } from "firebase/auth";
import api from "../../api/axios";
//Navigation
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { validateName, validateEmail } from "../../utils/validation";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const EditProfile = () => {
  const auth = getAuth();
  const navigate = useNavigate();
  //const { logout } = useAuth();
  const firebaseUser = auth.currentUser;
  console.log("Firebase User in EditProfile:", firebaseUser);
  const { login, token } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [uid, setUid] = useState("");

  // Initialize form once
  useEffect(() => {
    if (firebaseUser) {
      const display = firebaseUser.displayName || "";
      const parts = display.trim().split(" ");
      setFirstName(
        parts[0] ||
        (localStorage.getItem("user")
          ? JSON.parse(localStorage.getItem("user")).firstName
          : "")
      );
      setLastName(
        parts.slice(1).join(" ") ||
        (localStorage.getItem("user")
          ? JSON.parse(localStorage.getItem("user")).lastName
          : "")
      );
      setEmail(firebaseUser.email || "");
      setUid(firebaseUser.uid || "");
    } else {
      setFirstName(
        localStorage.getItem("user")
          ? JSON.parse(localStorage.getItem("user")).firstName
          : ""
      );
      setLastName(
        localStorage.getItem("user")
          ? JSON.parse(localStorage.getItem("user")).lastName
          : ""
      );
      setEmail(
        localStorage.getItem("user")
          ? JSON.parse(localStorage.getItem("user")).email
          : ""
      );
      setUid(
        localStorage.getItem("user")
          ? JSON.parse(localStorage.getItem("user")).uid
          : ""
      );
    }
  }, [firebaseUser]);

  const updateProfile = async () => {
    try {
      setSaving(true);

      const res = await api.patch("/users/me", {
        firebaseUid: uid,
        id: JSON.parse(localStorage.getItem("user"))._id,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });

      const updatedUser = res.data;

      // Update global auth state and localStorage via login context
      login(updatedUser, token);

      toast.success("Profile updated");
      navigate("/user-profile");
    } catch (err) {
      console.error("Update profile error:", err);
      const message =
        err?.response?.data?.error ||
        err.message ||
        "Failed to update profile";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };


  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate first name
    const firstNameError = validateName(firstName, "First name");
    if (firstNameError) {
      toast.error(firstNameError);
      return;
    }

    // Validate last name
    const lastNameError = validateName(lastName, "Last name");
    if (lastNameError) {
      toast.error(lastNameError);
      return;
    }

    // Validate email
    // const emailError = validateEmail(email);
    // if (emailError) {
    //   toast.error(emailError);
    //   return;
    // }

    updateProfile();
  };

  return (
    <div className="max-w-2xl mx-auto pt-8 px-4">
      <button
        type="button"
        onClick={() => navigate("/user-profile")}
        className="mb-4 inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to profile
      </button>
      <div className="card card-pad shadow-xl">
        <div className="mb-8 text-center">
          <h2 className="section-title text-3xl">Edit Profile</h2>
          <p className="section-sub">Update your personal details</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`floater ${firstName ? "filled" : ""}`}>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="input"
                maxLength={60}
                required
              />
              <span className="float-label">First Name</span>
            </div>

            <div className={`floater ${lastName ? "filled" : ""}`}>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="input"
                maxLength={60}
                required
              />
              <span className="float-label">Last Name</span>
            </div>
          </div>

          <div className={`floater ${email ? "filled" : ""}`}>
            <input
              type="email"
              value={email}
              readOnly
              // onChange={(e) => setEmail(e.target.value)}
              className="input bg-gray-100 cursor-not-allowed"
              maxLength={120}
            //required
            />
            <span className="float-label">Email Address</span>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary w-full text-lg py-3"
            >
              {saving ? (
                <div className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Saving...</span>
                </div>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;
