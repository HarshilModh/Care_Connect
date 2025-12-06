import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
    User, CheckCircle, XCircle, Calendar, Shield, Key, Edit,
    LogOut, Trash2, Lock, Users, Heart, Plus, Save, X
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { toast } from 'react-toastify';


const UserProfile = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    // Active tab state
    const [activeTab, setActiveTab] = useState('user');

    // User states
    const [isGoogleUser, setIsGoogleUser] = useState(false);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [isVerified, setIsVerified] = useState(false);
    const [needPasswordReset, setNeedPasswordReset] = useState(false);
    const [createdAt, setCreatedAt] = useState("");

    // Caregiver and Care Recipient states
    const [caregivers, setCaregivers] = useState([]);
    const [careRecipients, setCareRecipients] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [loading, setLoading] = useState(false);

    // Single caregiver profile (for when logged-in user IS a caregiver)
    const [caregiverProfile, setCaregiverProfile] = useState(null);
    const [caregiverProfileForm, setCaregiverProfileForm] = useState({
        bio: "",
        experienceYears: "",
        skills: "",
        certifications: "",
        availability: "",
        rate: ""
    });
    const [isEditingCaregiverProfile, setIsEditingCaregiverProfile] = useState(false);


    // Fetch logged-in caregiver's profile
    const fetchCaregivers = async () => {
        if (!user?._id) return;
        try {
            setLoading(true);

            const res = await api.get(`/caregivers/user/${user._id}`);
            console.log("Caregiver Profile Response:", res.data);
            const data = res.data;

            setCaregiverProfile(data);

            // Prefill form for edit mode
            setCaregiverProfileForm({
                bio: data.bio || "",
                experienceYears: data.experienceYears ?? "",
                skills: Array.isArray(data.skills) ? data.skills.join(", ") : "",
                certifications: Array.isArray(data.certifications)
                    ? data.certifications.join(", ")
                    : "",
                availability: Array.isArray(data.availability)
                    ? data.availability.join(", ")
                    : "",
                rate: data.rate ?? ""
            });
        } catch (err) {
            // If no profile exists yet, it's fine – just show "Create Profile"
            if (err?.response?.status === 404) {
                setCaregiverProfile(null);
            } else {
                console.error("Error fetching caregiver profile:", err);
                toast.error("Failed to load caregiver profile");
            }
        } finally {
            setLoading(false);
        }
    };

    const saveCaregiverProfile = async () => {
        try {
            const payload = {
                bio: caregiverProfileForm.bio.trim(),
                experienceYears: Number(caregiverProfileForm.experienceYears) || 0,
                skills: caregiverProfileForm.skills
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                certifications: caregiverProfileForm.certifications
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                availability: caregiverProfileForm.availability
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                rate: Number(caregiverProfileForm.rate) || 0,
                userId: user._id
            };

            let res;
            if (caregiverProfile?._id) {
                // update existing
                res = await api.put(`/caregivers/${caregiverProfile._id}`, payload);
            } else {
                // create new
                res = await api.post("/caregiver-profile", payload);
            }

            const saved = res.data;
            setCaregiverProfile(saved);
            setIsEditingCaregiverProfile(false);

            toast.success("Caregiver profile saved successfully");
        } catch (err) {
            console.error("Error saving caregiver profile:", err);
            toast.error("Failed to save caregiver profile");
        }
    };

    // Fetch care recipients
    const fetchCareRecipients = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/care-recipients/user/${user._id}`);
            console.log("Care Recipients Response:", response.data);
            setCareRecipients(response.data);
        } catch (error) {
            console.error("Error fetching care recipients:", error);
            toast.error("Failed to load care recipients");
        } finally {
            setLoading(false);
        }
    };

    // Delete user
    const deleteUser = async () => {
        if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
            return;
        }
        try {
            await api.delete(`users/delete/${user._id}`);
            toast.success("User deleted successfully");
            await logout();
            navigate("/");
        } catch (error) {
            console.error("Error deleting user:", error);
            toast.error("Failed to delete user");
        }
    };

    // Handle logout
    const handleLogout = async () => {
        try {
            await logout();
            toast.success("Logged out successfully!");
            navigate("/signin");
        } catch (error) {
            console.error("Logout failed:", error);
            toast.error("Something went wrong during logout.");
        }
    };



    const updateCaregiver = async (id) => {
        try {
            const response = await api.put(`/caregivers/${id}`, editForm);
            setCaregivers(caregivers.map(c => c._id === id ? response.data : c));
            cancelEdit();
            toast.success("Caregiver updated successfully");
        } catch (error) {
            console.error("Error updating caregiver:", error);
            toast.error("Failed to update caregiver");
        }
    };

    // const deleteCaregiver = async (id) => {
    //     if (!window.confirm("Are you sure you want to delete this caregiver?")) {
    //         return;
    //     }
    //     try {
    //         await api.delete(`/caregivers/${id}`);
    //         setCaregivers(caregivers.filter(c => c._id !== id));
    //         toast.success("Caregiver deleted successfully");
    //     } catch (error) {
    //         console.error("Error deleting caregiver:", error);
    //         toast.error("Failed to delete caregiver");
    //     }
    // };

    // CRUD operations for care recipients


    const updateCareRecipient = async (id) => {
        try {
            const response = await api.put(`/care-recipients/${id}`, editForm);
            setCareRecipients(careRecipients.map(r => r._id === id ? response.data : r));
            cancelEdit();
            toast.success("Care recipient updated successfully");
        } catch (error) {
            console.error("Error updating care recipient:", error);
            toast.error("Failed to update care recipient");
        }
    };

    const deleteCareRecipient = async (id) => {
        if (!window.confirm("Are you sure you want to delete this care recipient?")) {
            return;
        }
        try {
            await api.delete(`/care-recipients/${id}`);
            setCareRecipients(careRecipients.filter(r => r._id !== id));
            toast.success("Care recipient deleted successfully");
        } catch (error) {
            console.error("Error deleting care recipient:", error);
            toast.error("Failed to delete care recipient");
        }
    };

    // Edit helpers
    const startEdit = (id, data, type) => {
        setEditingId(`${type}-${id}`);
        setEditForm(data);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    const saveEdit = (id, type) => {
        if (type === 'caregiver') {
            updateCaregiver(id);
        } else if (type === 'recipient') {
            updateCareRecipient(id);
        }
    };

    // Initialize user data
    useEffect(() => {
        if (user) {
            setIsGoogleUser(user.googleId || false);
            setFirstName(user.firstName || "");
            setLastName(user.lastName || "");
            setEmail(user.email || "");
            setIsVerified(user.isVerified || false);
            setNeedPasswordReset(user.needPasswordReset || false);
            setCreatedAt(user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "");

            // Fetch related data
            fetchCaregivers();
            fetchCareRecipients();

        }
    }, [user]);

    // Render User Profile Tab
    // Render User Profile Tab
    const renderUserTab = () => (
        <div className="w-full">
            <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-xl border border-white/60 p-6 lg:p-8 flex flex-col lg:flex-row gap-8">
                {/* Left: Avatar + basic info + actions */}
                <div className="lg:w-1/3 flex flex-col items-center text-center border-b lg:border-b-0 lg:border-r border-gray-100 pb-6 lg:pb-0 lg:pr-6">
                    <div className="relative mb-4">
                        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center shadow-lg">
                            <User className="w-14 h-14 text-white" />
                        </div>
                        <span className="absolute -bottom-1 -right-1 inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500 text-white text-xs font-semibold shadow-md">
                            {firstName?.[0] || 'U'}
                        </span>
                    </div>

                    <h2 className="text-2xl font-extrabold text-gray-900 capitalize">
                        {firstName} {lastName}
                    </h2>
                    <p className="mt-1 inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                        {email}
                    </p>

                    <div className="mt-6 w-full space-y-3">
                        {/* {!isGoogleUser && ( */}
                        <>
                            <Link to="/edit-profile">
                                <button className="w-full inline-flex items-center justify-center px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white font-semibold shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.98] transition">
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit Profile
                                </button>
                            </Link>

                            <Link to="/forgot-password">
                                <button className="w-full inline-flex items-center justify-center px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition">
                                    <Lock className="w-4 h-4 mr-2 text-gray-400" />
                                    Reset Password
                                </button>
                            </Link>
                        </>
                        {/* )} */}

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <button
                                onClick={handleLogout}
                                className="inline-flex items-center justify-center px-3 py-3 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition"
                            >
                                <LogOut className="w-4 h-4 mr-1.5 text-gray-400" />
                                Logout
                            </button>
                            <button
                                onClick={deleteUser}
                                className="inline-flex items-center justify-center px-3 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-semibold hover:bg-red-100 transition"
                            >
                                <Trash2 className="w-4 h-4 mr-1.5" />
                                Delete
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right: status cards */}
                <div className="lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Google Account */}
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white shadow-sm border border-gray-100 hover:shadow-md transition">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-indigo-50">
                                <Shield className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-800">Google Account</p>
                                <p className="text-xs text-gray-500">Signed in via Google</p>
                            </div>
                        </div>
                        <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${isGoogleUser
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-gray-100 text-gray-500'
                                }`}
                        >
                            {isGoogleUser ? 'Yes' : 'No'}
                        </span>
                    </div>

                    {/* Email Verified */}
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white shadow-sm border border-gray-100 hover:shadow-md transition">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-emerald-50">
                                <CheckCircle className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-800">Email Verified</p>
                                <p className="text-xs text-gray-500">
                                    {isVerified ? 'Secure & confirmed' : 'Verification pending'}
                                </p>
                            </div>
                        </div>
                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${isVerified ? 'bg-emerald-100' : 'bg-red-100'
                                }`}
                        >
                            {isVerified ? (
                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                            ) : (
                                <XCircle className="w-4 h-4 text-red-600" />
                            )}
                        </div>
                    </div>

                    {/* Password Reset */}
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white shadow-sm border border-gray-100 hover:shadow-md transition">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-orange-50">
                                <Key className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-800">Password Reset</p>
                                <p className="text-xs text-gray-500">
                                    {needPasswordReset ? 'Action needed' : 'All good'}
                                </p>
                            </div>
                        </div>
                        <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${needPasswordReset
                                ? 'bg-orange-50 text-orange-700'
                                : 'bg-gray-100 text-gray-500'
                                }`}
                        >
                            {needPasswordReset ? 'Required' : 'Not Required'}
                        </span>
                    </div>

                    {/* Member Since */}
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white shadow-sm border border-gray-100 hover:shadow-md transition">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-purple-50">
                                <Calendar className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-800">Member Since</p>
                                <p className="text-xs text-gray-500">Account creation date</p>
                            </div>
                        </div>
                        <span className="px-3 py-1 rounded-lg bg-gray-50 border border-gray-100 text-xs font-mono text-gray-700">
                            {createdAt || 'N/A'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );

    // Render Caregivers Tab
    // Render Caregivers Tab
    const renderCaregiversTab = () => (
        <div className="max-w-5xl w-full bg-white rounded-3xl shadow-2xl p-8">
                <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-900">Caregivers</h2>
                    <p className="text-sm text-gray-500">
                    Manage caregivers connected to your account.
                    </p>
                </div>
                <button
                    onClick={() => navigate("/addMember")}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                    <Plus className="w-4 h-4" />
                    Add Caregiver
                </button>
                </div>

            {/* 🔹 My Caregiver Profile card */}


            {/* ⬇️ Your existing caregivers list UI stays below this */}
            {loading ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : caregiverProfile.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg">No caregivers added yet</p>
                    <p className="text-sm mt-2">Click "Add Caregiver" to get started</p>
                </div>
            ) : (
                /* ... your existing caregivers.map(...) cards ... */
                <div className="space-y-4">
                    <div className="mb-8 border border-green-100 rounded-2xl p-6 bg-green-50/40">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900">
                                    My Caregiver Profile
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    This is what families will see when they view your caregiver profile.
                                </p>
                            </div>
                            {isEditingCaregiverProfile ? (
                                <button
                                    onClick={() => setIsEditingCaregiverProfile(false)}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
                                >
                                    <X className="w-4 h-4" />
                                    Cancel
                                </button>
                            ) : (
                                <button
                                    onClick={() => setIsEditingCaregiverProfile(true)}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-white text-green-700 border border-green-200 hover:bg-green-50"
                                >
                                    <Edit className="w-4 h-4" />
                                    {caregiverProfile ? "Edit Profile" : "Create Profile"}
                                </button>
                            )}
                        </div>

                        {isEditingCaregiverProfile ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Bio */}
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Bio
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={caregiverProfileForm.bio}
                                        onChange={(e) =>
                                            setCaregiverProfileForm({
                                                ...caregiverProfileForm,
                                                bio: e.target.value
                                            })
                                        }
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                                        placeholder="Briefly describe your experience and caregiving style"
                                    />
                                </div>

                                {/* Experience Years */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Years of Experience
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={caregiverProfileForm.experienceYears}
                                        onChange={(e) =>
                                            setCaregiverProfileForm({
                                                ...caregiverProfileForm,
                                                experienceYears: e.target.value
                                            })
                                        }
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                                    />
                                </div>

                                {/* Hourly Rate */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Rate (per hour)
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-500">$</span>
                                        <input
                                            type="number"
                                            min="0"
                                            value={caregiverProfileForm.rate}
                                            onChange={(e) =>
                                                setCaregiverProfileForm({
                                                    ...caregiverProfileForm,
                                                    rate: e.target.value
                                                })
                                            }
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Skills */}
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Skills (comma separated)
                                    </label>
                                    <input
                                        type="text"
                                        value={caregiverProfileForm.skills}
                                        onChange={(e) =>
                                            setCaregiverProfileForm({
                                                ...caregiverProfileForm,
                                                skills: e.target.value
                                            })
                                        }
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                                        placeholder="e.g., dementia care, medication reminders, mobility support"
                                    />
                                </div>

                                {/* Certifications */}
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Certifications (comma separated)
                                    </label>
                                    <input
                                        type="text"
                                        value={caregiverProfileForm.certifications}
                                        onChange={(e) =>
                                            setCaregiverProfileForm({
                                                ...caregiverProfileForm,
                                                certifications: e.target.value
                                            })
                                        }
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                                        placeholder="e.g., CPR, First Aid, CNA"
                                    />
                                </div>

                                {/* Availability */}
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Availability (comma separated)
                                    </label>
                                    <input
                                        type="text"
                                        value={caregiverProfileForm.availability}
                                        onChange={(e) =>
                                            setCaregiverProfileForm({
                                                ...caregiverProfileForm,
                                                availability: e.target.value
                                            })
                                        }
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                                        placeholder="e.g., weekdays evenings, weekends full-day"
                                    />
                                </div>

                                <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                                    <button
                                        onClick={() => setIsEditingCaregiverProfile(false)}
                                        className="px-4 py-2 rounded-lg text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={saveCaregiverProfile}
                                        className="px-4 py-2 rounded-lg text-sm bg-green-600 text-white font-semibold hover:bg-green-700"
                                    >
                                        Save Profile
                                    </button>
                                </div>
                            </div>
                        ) : caregiverProfile ? (
                            // 🔹 View mode
                            <div className="space-y-3 text-sm">
                                <div>
                                    <p className="text-xs font-semibold text-gray-600 mb-1">Bio</p>
                                    <p className="text-gray-800 bg-white/70 rounded-xl p-3 border border-green-100">
                                        {caregiverProfile.bio || "No bio added yet."}
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-4">
                                    <div>
                                        <p className="text-xs font-semibold text-gray-600 mb-1">
                                            Experience
                                        </p>
                                        <p className="text-gray-800">
                                            {caregiverProfile.experienceYears ?? 0} years
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-600 mb-1">Rate</p>
                                        <p className="text-gray-800">${caregiverProfile.rate ?? 0}/hr</p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs font-semibold text-gray-600 mb-1">Skills</p>
                                    <div className="flex flex-wrap gap-2">
                                        {Array.isArray(caregiverProfile.skills) &&
                                            caregiverProfile.skills.length > 0 ? (
                                            caregiverProfile.skills.map((skill) => (
                                                <span
                                                    key={skill}
                                                    className="px-2.5 py-1 rounded-full bg-white text-xs text-gray-700 border border-green-100"
                                                >
                                                    {skill}
                                                </span>
                                            ))
                                        ) : (
                                            <p className="text-gray-500 text-xs">No skills listed</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs font-semibold text-gray-600 mb-1">
                                        Certifications
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {Array.isArray(caregiverProfile.certifications) &&
                                            caregiverProfile.certifications.length > 0 ? (
                                            caregiverProfile.certifications.map((cert) => (
                                                <span
                                                    key={cert}
                                                    className="px-2.5 py-1 rounded-full bg-white text-xs text-gray-700 border border-green-100"
                                                >
                                                    {cert}
                                                </span>
                                            ))
                                        ) : (
                                            <p className="text-gray-500 text-xs">No certifications listed</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs font-semibold text-gray-600 mb-1">
                                        Availability
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {Array.isArray(caregiverProfile.availability) &&
                                            caregiverProfile.availability.length > 0 ? (
                                            caregiverProfile.availability.map((slot) => (
                                                <span
                                                    key={slot}
                                                    className="px-2.5 py-1 rounded-full bg-white text-xs text-gray-700 border border-green-100"
                                                >
                                                    {slot}
                                                </span>
                                            ))
                                        ) : (
                                            <p className="text-gray-500 text-xs">No availability set</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-600">
                                You haven’t created your caregiver profile yet. Click{" "}
                                <span className="font-semibold">Create Profile</span> to get started.
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );

    // Render Care Recipients Tab
    const renderCareRecipientsTab = () => (
        <div className="max-w-5xl w-full bg-white rounded-3xl shadow-2xl p-8">
            <div className="flex items-center justify-between mb-6">
            <div>
                <h2 className="text-2xl font-semibold text-gray-900">Care Recipients</h2>
                <p className="text-sm text-gray-500">
                Manage the people receiving care in your network.
                </p>
            </div>
            <button
                onClick={() => navigate("/addMember")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
                <Plus className="w-4 h-4" />
                Add Recipient
            </button>
            </div>

            {loading ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : careRecipients.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg">No care recipients added yet</p>
                    <p className="text-sm mt-2">Click <span className="font-semibold">Add Recipient</span> to get started</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {careRecipients.map((recipient) => {
                        const isEditing = editingId === `recipient-${recipient._id}`;
                        const data = isEditing ? editForm : recipient;

                        return (
                            <div key={recipient._id} className="border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-800">
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={data.recipientName || ''}
                                                    onChange={(e) => setEditForm({ ...editForm, recipientName: e.target.value })}
                                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                                                    placeholder="Recipient Name"
                                                />
                                            ) : (
                                                data.recipientName || 'Unnamed Recipient'
                                            )}
                                        </h3>
                                        <span className={`inline-block mt-2 px-3 py-1 text-xs font-semibold rounded-full ${data.careLevel === 'High' ? 'bg-red-100 text-red-800' :
                                            data.careLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-green-100 text-green-800'
                                            }`}>
                                            {data.careLevel} Care Level
                                        </span>
                                    </div>
                                    {!isEditing ? (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => startEdit(recipient._id, recipient, 'recipient')}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                            >
                                                <Edit className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => deleteCareRecipient(recipient._id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => saveEdit(recipient._id, 'recipient')}
                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                                            >
                                                <Save className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={cancelEdit}
                                                className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {['dateOfBirth', 'emergencyContact', 'careLevel'].map((field) => (
                                        <div key={field}>
                                            <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">
                                                {field.replace(/([A-Z])/g, ' $1').trim()}
                                            </label>
                                            {isEditing ? (
                                                field === 'careLevel' ? (
                                                    <select
                                                        value={data[field] || 'Low'}
                                                        onChange={(e) => setEditForm({ ...editForm, [field]: e.target.value })}
                                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                                                    >
                                                        <option>Low</option>
                                                        <option>Medium</option>
                                                        <option>High</option>
                                                    </select>
                                                ) : (
                                                    <input
                                                        type={field === 'dateOfBirth' ? 'date' : 'text'}
                                                        value={data[field] || ''}
                                                        onChange={(e) => setEditForm({ ...editForm, [field]: e.target.value })}
                                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                                                    />
                                                )
                                            ) : (
                                                <p className="text-sm text-gray-800 bg-gray-50 px-3 py-2 rounded-lg">
                                                    {data[field] || 'N/A'}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                    {['medicalConditions', 'medications', 'allergies'].map((field) => (
                                        <div key={field} className="md:col-span-3">
                                            <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">
                                                {field.replace(/([A-Z])/g, ' $1').trim()}
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={Array.isArray(data[field]) ? data[field].join(', ') : ''}
                                                    onChange={(e) => setEditForm({
                                                        ...editForm,
                                                        [field]: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                                                    })}
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                                                    placeholder="Comma separated"
                                                />
                                            ) : (
                                                <p className="text-sm text-gray-800 bg-gray-50 px-3 py-2 rounded-lg">
                                                    {Array.isArray(data[field]) && data[field].length > 0 ? data[field].join(', ') : 'None'}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Profile Management</h1>
                    <p className="text-gray-600">Manage your account, caregivers, and care recipients</p>
                </div>

                {/* Tab Navigation */}
                <div className="mb-6 flex gap-2 bg-white rounded-xl p-1 shadow-lg max-w-fit">
                    <button
                        onClick={() => setActiveTab('user')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition ${activeTab === 'user'
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                            : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        <User className="w-5 h-5" />
                        My Profile
                    </button>

                    <button
                        onClick={() => setActiveTab('caregivers')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition ${activeTab === 'caregivers'
                            ? 'bg-green-600 text-white shadow-md'
                            : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        <Users className="w-5 h-5" />
                        Caregivers
                    </button>

                    <button
                        onClick={() => setActiveTab('careRecipients')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition ${activeTab === 'careRecipients'
                            ? 'bg-red-600 text-white shadow-md'
                            : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        <Heart className="w-5 h-5" />
                        Care Recipients
                    </button>
                </div>

                {/* Tab Content */}
                <div className="mt-6 flex justify-center">
                    {activeTab === 'user' && renderUserTab()}
                    {activeTab === 'caregivers' && renderCaregiversTab()}

                    {activeTab === 'careRecipients' && renderCareRecipientsTab()}
                </div>
            </div>
        </div>
    );
};

export default UserProfile;