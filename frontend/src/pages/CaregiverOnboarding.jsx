import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const CaregiverOnboarding = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const [bio, setBio] = useState("");
    const [experienceYears, setExperienceYears] = useState("");
    const [skills, setSkills] = useState(""); // comma separated
    const [certifications, setCertifications] = useState(""); // comma separated
    const [availability, setAvailability] = useState("");
    const [rate, setRate] = useState("");

    const navigate = useNavigate();

    // Load existing profile (if any) so user can edit
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                setError(null);

                const res = await axios.get(
                    "http://localhost:3000/api/caregiver-profile/me",
                    { withCredentials: true }
                );

                if (res.data) {
                    const p = res.data;
                    setBio(p.bio || "");
                    setExperienceYears(p.experienceYears ?? "");
                    setSkills(Array.isArray(p.skills) ? p.skills.join(", ") : "");
                    setCertifications(
                        Array.isArray(p.certifications)
                            ? p.certifications.join(", ")
                            : ""
                    );
                    setAvailability(p.availability || "");
                    setRate(p.rate ?? "");
                } else {
                    // no existing profile yet; keep defaults (empty form)
                    setBio("");
                    setExperienceYears("");
                    setSkills("");
                    setCertifications("");
                    setAvailability("");
                    setRate("");
                }

                // if res.data not found or is empty then what 
            } catch (err) {
                console.error("Error loading caregiver profile", err);
                if (err.response?.status === 404) {
                    // no profile yet, not an error – keep form empty
                    setError(null);
                } else {
                    setError(
                        err.response?.data?.error ||
                        err.message ||
                        "Failed to load caregiver profile"
                    );
                }
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // basic validation
        if (!bio.trim()) {
            toast.error("Please add a short bio");
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const payload = {
                bio: bio.trim(),
                experienceYears: Number(experienceYears) || 0,
                skills,          // backend will normalize
                certifications,  // backend will normalize
                availability: availability.trim(),
                rate: Number(rate) || 0,
            };

            const res = await axios.post(
                "http://localhost:3000/api/caregiver-profile",
                payload,
                { withCredentials: true }
            );
            console.log("resres", res);

            // if res not found then what..

            toast.success("Caregiver onboarding saved 🎉");

            // After onboarding, send them back to family groups
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
        <main className="page">
            <div className="container-n max-w-2xl mx-auto">
                <header className="mb-6 text-center">
                    <h1 className="section-title">Caregiver Onboarding</h1>
                    <p className="section-sub">
                        Tell families about your experience, skills, and availability. This
                        profile will be reused for all groups where you&apos;re a caregiver.
                    </p>
                </header>

                {loading ? (
                    <div className="text-center text-slate-600">Loading profile…</div>
                ) : (
                    <div className="card">
                        <div className="card-pad">
                            {error && <div className="alert-error mb-4">{String(error)}</div>}

                            <form className="grid gap-4" onSubmit={handleSubmit}>
                                {/* Bio */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Short bio <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        className="input min-h-[80px]"
                                        placeholder="Describe your caregiving experience and approach"
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                    />
                                </div>

                                {/* Experience + Rate */}
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Years of experience
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            className="input"
                                            value={experienceYears}
                                            onChange={(e) => setExperienceYears(e.target.value)}
                                            placeholder="e.g. 3"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Hourly rate (optional)
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-500">$</span>
                                            <input
                                                type="number"
                                                min="0"
                                                className="input"
                                                value={rate}
                                                onChange={(e) => setRate(e.target.value)}
                                                placeholder="e.g. 25"
                                            />
                                            <span className="text-slate-500 text-sm">/ hour</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Skills */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Skills (comma separated)
                                    </label>
                                    <input
                                        className="input"
                                        placeholder="e.g. Medication management, Mobility support, Meal preparation"
                                        value={skills}
                                        onChange={(e) => setSkills(e.target.value)}
                                    />
                                    <p className="text-xs text-slate-500 mt-1">
                                        Separate multiple skills with commas.
                                    </p>
                                </div>

                                {/* Certifications */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Certifications (comma separated)
                                    </label>
                                    <input
                                        className="input"
                                        placeholder="e.g. CPR, First Aid"
                                        value={certifications}
                                        onChange={(e) => setCertifications(e.target.value)}
                                    />
                                    <p className="text-xs text-slate-500 mt-1">
                                        List any relevant certifications or training.
                                    </p>
                                </div>

                                {/* Availability */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Availability
                                    </label>
                                    <textarea
                                        className="input min-h-[60px]"
                                        placeholder="e.g. Weekdays 9am–6pm, weekends on request"
                                        value={availability}
                                        onChange={(e) => setAvailability(e.target.value)}
                                    />
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
                                    <button
                                        type="submit"
                                        className="btn-primary"
                                        disabled={saving}
                                    >
                                        {saving ? "Saving…" : "Save & Continue"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
};

export default CaregiverOnboarding;