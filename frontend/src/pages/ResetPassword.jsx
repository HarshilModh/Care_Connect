import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { auth } from "../firebase";
import { toast } from "react-toastify";

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [verifiedCode, setVerifiedCode] = useState(false);
    const [loading, setLoading] = useState(true);
    const [oobCode, setOobCode] = useState(null);

    useEffect(() => {
        const code = searchParams.get("oobCode");
        const mode = searchParams.get("mode");

        if (!code || mode !== "resetPassword") {
            toast.error("Invalid or expired link.");
            setLoading(false);
            return;
        }

        setOobCode(code);

        verifyPasswordResetCode(auth, code)
            .then(() => {
                setVerifiedCode(true);
            })
            .catch(() => {
                toast.error("Reset link is invalid or expired.");
            })
            .finally(() => setLoading(false));
    }, [searchParams]);

    const handleReset = async (e) => {
        e.preventDefault();
        if (password.trim().length < 6) {
            toast.error("Password must be at least 6 characters long.");
            return;
        }
        if (password !== confirmPassword) {
            toast.error("Passwords do not match.");
            return;
        }

        try {
            await confirmPasswordReset(auth, oobCode, password);
            // update the backend about password change 
            const user = auth.currentUser;
            if (user) {
                const idToken = await user.getIdToken();
                await fetch(`${import.meta.env.VITE_API_URL}/users/updatePassword`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${idToken}`,
                    },
                    body: JSON.stringify({ newPassword: password }),
                });
            }

            toast.success("Password has been reset successfully!");
            navigate("/signin");
        } catch (error) {
            console.error("Error resetting password:", error);
            toast.error("Failed to reset password. Please try again.");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-gray-700 dark:text-gray-300">Verifying link...</p>
            </div>
        );
    }

    if (!verifiedCode) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-red-500">Invalid or expired password reset link.</p>
            </div>
        );
    }

    return (
        <div className="flex justify-center items-center min-h-screen bg-white dark:bg-gray-900">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-[90%] max-w-md">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                    Reset Your Password
                </h1>
                <form onSubmit={handleReset} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            New Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="Enter new password"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="Confirm new password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg transition-all"
                    >
                        Reset Password
                    </button>
                </form>

                <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
                    Remembered it?{" "}
                    <Link
                        to="/signin"
                        className="text-orange-600 dark:text-orange-400 hover:underline"
                    >
                        Back to Login
                    </Link>
                </p>
            </div>
        </div>
    );
}