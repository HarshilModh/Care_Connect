import React, { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";
import { toast, ToastContainer } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import { validateEmail } from "../utils/validation";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate email
        const emailError = validateEmail(email);
        if (emailError) {
            toast.error(emailError);
            return;
        }

        try {
            setLoading(true);
            await sendPasswordResetEmail(auth, email);
            toast.success("Password reset email sent! Check your inbox.");
            setEmail("");
            setTimeout(() => navigate("/signin"), 3000);
        } catch (error) {
            console.error("Password reset error:", error);
            if (error.code === "auth/user-not-found") {
                toast.error("No account found with this email.");
            } else if (error.code === "auth/invalid-email") {
                toast.error("Invalid email format.");
            } else {
                toast.error("Something went wrong. Please try again later.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-10 w-[90%] max-w-md">
                <div className="text-center mb-6">
                    <svg
                        className="h-12 w-12 mx-auto text-orange-500"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M12 20l9-5-9-5-9 5 9 5z" />
                        <path d="M12 12l9-5-9-5-9 5 9 5z" />
                    </svg>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-4">
                        Reset Your Password
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
                        Enter your registered email to receive a password reset link.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label
                            htmlFor="email"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                        >
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white 
                placeholder-gray-400 dark:placeholder-gray-500 
                focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 
              text-white font-semibold py-3 rounded-lg transition-all duration-200 
              transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {loading ? "Sending..." : "Send Reset Link"}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
                    Remember your password?{" "}
                    <Link
                        to="/signin"
                        className="text-orange-600 dark:text-orange-400 hover:underline"
                    >
                        Sign In
                    </Link>
                </p>
            </div>

            <ToastContainer position="top-right" autoClose={3000} theme="colored" />
        </div>
    );
}