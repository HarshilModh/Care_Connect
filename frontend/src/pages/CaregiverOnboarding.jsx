import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";

const CaregiverOnboarding = () => {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const [bio, setBio] = useState("");
    const [experienceYears, setExperienceYears] = useState("");
    const [skills, setSkills] = useState(""); // comma separated
    const [certifications, setCertifications] = useState(""); // comma separated
    const [availability, setAvailability] = useState("");
    const [rate, setRate] = useState("");

    let storedUser = localStorage.getItem("user");
    let userId = "";
    try {
        userId = storedUser ? JSON.parse(storedUser)._id : "";
    } catch (err) {
        console.error("Invalid user data in localStorage", err);
    }

    const navigate = useNavigate();

    const validateForm = () => {
        console.log("validating form", {
            bio,
            experienceYears,
            skills,
            certifications,
            availability,
            rate,
        });
        if (!bio.trim()) {
            toast.error("Please add a short bio");
            return false;
        }
        if (!experienceYears && experienceYears !== "0") {
            toast.error("Please specify your years of experience (0 if none)");
            return false;
        }

        if (experienceYears && (isNaN(experienceYears) || Number(experienceYears) < 0)) {
            toast.error("Years of experience must be a non-negative number");
            return false;
        }

        if (skills && typeof skills !== "string") {
            toast.error("Skills must be a comma separated string");
            return false;
        }
        if (!skills.trim()) {
            toast.error("Please specify at least one skill");
            return false;
        }

        if (!certifications.trim()) {
            toast.error("Please specify at least one certification");
            return false;
        }

        if (certifications && typeof certifications !== "string") {
            toast.error("Certifications must be a comma separated string");
            return false;
        }

        if (rate && (isNaN(rate) || Number(rate) < 0)) {
            toast.error("Hourly rate must be a non-negative number");
            return false;
        }

        if (!availability.trim()) {
            toast.error("Please specify your availability");
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        console.log("form submit clicked");

        if (!validateForm()) return;

        setSaving(true);
        setError(null);

        try {
            const payload = {
                bio: bio.trim(),
                experienceYears: Number(experienceYears) || 0,
                skills: skills
                    .split(",")
                    .map((s) => s.trim())
                    .filter((s) => s),
                certifications: certifications
                    .split(",")
                    .map((c) => c.trim())
                    .filter((c) => c),
                availability: availability
                    .split(",")
                    .map((a) => a.trim())
                    .filter((a) => a),
                rate: Number(rate) || 0,
            };

            const accessToken = localStorage.getItem("accessToken");
            const res = await axios.post("http://localhost:3000/api/caregivers", payload, {
                withCredentials: true,
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            console.log("resres", res);

            toast.success("Caregiver onboarding saved 🎉");

            navigate("/family-groups");
        } catch (err) {
            console.error("Error saving caregiver onboarding", err);
            setError(
                err.response?.data?.error ||
                err.message ||
                "Failed to save caregiver onboarding"
            );
            toast.error("Failed to save onboarding");
        } finally {
            setSaving(false);
        }
    };

    return (
        <main className="page bg-gray-50 dark:bg-gray-900 transition-colors">
            <div className="container-n max-w-2xl mx-auto py-8">
                <header className="mb-6 text-center">
                    <h1 className="section-title text-gray-900 dark:text-white">
                        Caregiver Onboarding
                    </h1>
                    <p className="section-sub text-gray-600 dark:text-gray-300">
                        Tell families about your experience, skills, and availability. This
                        profile will be reused for all groups where you&apos;re a caregiver.
                    </p>
                </header>

                <div className="card bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm">
                    <div className="card-pad">
                        {error && (
                            <div className="alert-error mb-4 bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-200 border border-red-200 dark:border-red-700 rounded-lg px-4 py-3">
                                {String(error)}
                            </div>
                        )}

                        <form className="grid gap-4" onSubmit={handleSubmit}>
                            {/* Bio */}
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-800 dark:text-gray-200">
                                    Short bio <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    className="input min-h-[80px] bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="Describe your caregiving experience and approach"
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                />
                            </div>

                            {/* Experience + Rate */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-800 dark:text-gray-200">
                                        Years of experience
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="input bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        value={experienceYears}
                                        onChange={(e) => setExperienceYears(e.target.value)}
                                        placeholder="e.g. 3"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-800 dark:text-gray-200">
                                        Hourly rate (optional)
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-500 dark:text-slate-300">$</span>
                                        <input
                                            type="number"
                                            min="0"
                                            className="input bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            value={rate}
                                            onChange={(e) => setRate(e.target.value)}
                                            placeholder="e.g. 25"
                                        />
                                        <span className="text-slate-500 dark:text-slate-300 text-sm">
                                            / hour
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Skills */}
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-800 dark:text-gray-200">
                                    Skills (comma separated)
                                </label>
                                <input
                                    className="input bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="e.g. Medication management, Mobility support, Meal preparation"
                                    value={skills}
                                    onChange={(e) => setSkills(e.target.value)}
                                />
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    Separate multiple skills with commas.
                                </p>
                            </div>

                            {/* Certifications */}
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-800 dark:text-gray-200">
                                    Certifications (comma separated)
                                </label>
                                <input
                                    className="input bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="e.g. CPR, First Aid"
                                    value={certifications}
                                    onChange={(e) => setCertifications(e.target.value)}
                                />
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    List any relevant certifications or training.
                                </p>
                            </div>

                            {/* Availability */}
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-800 dark:text-gray-200">
                                    Availability
                                </label>
                                <textarea
                                    className="input min-h-[60px] bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="e.g. Weekdays 9am–6pm, weekends on request"
                                    value={availability}
                                    onChange={(e) => setAvailability(e.target.value)}
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-4">
                                <button
                                    type="button"
                                    className="btn-ghost text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                                    onClick={() => navigate("/family-groups")}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 text-white"
                                    disabled={saving}
                                >
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

export default CaregiverOnboarding;