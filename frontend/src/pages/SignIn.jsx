import React from "react";
import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { sendEmailVerification, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { useAuth } from "../context/AuthContext";
// import { useTheme } from "../context/ThemeContext";
import api from "../api/axios";
import { validateEmail, validateRequired } from "../utils/validation";
import { Eye, EyeOff } from "lucide-react";

function SignIn() {
    const navigate = useNavigate();

    const { login } = useAuth();
    // const { theme } = useTheme();
    // console.log("first theme", theme);
    const [errors, setErrors] = useState({});

    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: "",
            }));
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const firebaseUser = result.user;
            const idToken = await firebaseUser.getIdToken();

            const res = await api.post("/users/google", { idToken });
            const { user: backendUser, tokens } = res.data || {};

            if (!backendUser || !backendUser._id) {
                toast.error("Invalid server response for Google login");
                return;
            }

            const accessToken = tokens?.accessToken || idToken;
            login(backendUser, accessToken);

            toast.success("Logged in successfully!");
            setTimeout(() => navigate("/home", { replace: true }), 1000);
        } catch (err) {
            console.error("Google login error:", err);
            toast.error("Google Sign-In failed. Try again.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate email
        const emailError = validateEmail(formData.email);
        if (emailError) {
            toast.error(emailError);
            return;
        }

        // Validate password is not empty
        const passwordError = validateRequired(formData.password, "Password");
        if (passwordError) {
            toast.error(passwordError);
            return;
        }

        const payload = {
            email: formData.email,
            password: formData.password,
        };
        try {
            const res = await api.post("users/login", payload);
            console.log("Login response:", res);
            if (res.data?.user && res.data?.tokens?.accessToken) {
                login(res.data.user, res.data.tokens?.accessToken);

                toast.success("Login successful!");
                setFormData({ email: "", password: "" });
                // navigate("/home", { replace: true });
                setTimeout(() => navigate("/home", { replace: true }), 1000);
                // navigate("/home", { replace: true });
            } else {
                toast.error("Invalid server response");
            }
        } catch (error) {
            console.log(">>", error.response?.data?.error);
            if (
                error.response?.data?.error ===
                "Email not verified. Please verify your email before logging in."
            ) {
                toast.error(
                    "Email not verified. Please check your inbox for the verification email."
                );
                sendEmailVerification(auth.currentUser, {
                    url: "http://localhost:5173/verify-success", // custom redirect URL
                });
                return;
            }
            console.error(
                "Login error:",
                error.response?.data?.error || error.message
            );
            toast.error(error.response?.data?.error || "Login failed. Try again.");
        }
    };

    // const handleSubmit = async (e) => {
    //     e.preventDefault();
    //     if (formData.email.trim() === "") {
    //         toast.error("Email is required");
    //         return;
    //     }
    //     if (formData.password.trim() === "") {
    //         toast.error("Password is required");
    //         return;
    //     }

    //     const payload = {
    //         email: formData.email,
    //         password: formData.password,
    //     };

    //     console.log("Submitting login with payload:", payload);

    //     const result = await api.post('users/login', payload);
    //     console.log("Login response:", result.data);
    //     if (result.data) {
    //         toast.success("Login successful!");
    //         login(result.data.user, result.data.tokens.accessToken);
    //         setFormData({ email: "", password: "" });
    //         navigate("/home", { replace: true });
    //     } else {
    //         toast.error(result.message);
    //     }
    // }

    return (
        <div className="flex justify-center items-center min-h-screen w-full bg-white dark:bg-gray-900 transition-colors duration-300">
            <div className="flex min-h-screen w-full max-w-7xl shadow-2xl">
                {/* Left Section  */}
                <div className="hidden md:flex md:w-1/2 relative bg-gradient-to-br from-white-100 to-orange-500 overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 left-0 w-full h-full">
                            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                                <defs>
                                    <pattern
                                        id="grid"
                                        width="40"
                                        height="40"
                                        patternUnits="userSpaceOnUse"
                                    >
                                        <path
                                            d="M 40 0 L 0 0 0 40"
                                            fill="none"
                                            stroke="white"
                                            strokeWidth="2"
                                        />
                                    </pattern>
                                </defs>
                                <rect width="100%" height="100%" fill="url(#grid)" />
                            </svg>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex flex-col items-center justify-center px-12 relative text-center text-white w-full z-10">
                        <div className="flex flex-col items-center justify-center px-12 relative text-center text-white w-full z-10 mb-12">
                            <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-6 mx-auto">
                                <svg
                                    className="h-16 w-16 text-orange-600 dark:text-orange-400"
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
                            </div>
                            <h2 className="text-4xl font-bold mb-4">Join CareConnect</h2>
                            <p className="text-lg text-indigo-100 max-w-md mx-auto py-4">
                                Connect with caregivers, coordinate care, and manage everything
                                in one place. Join thousands of families already using
                                CareConnect.
                            </p>
                        </div>

                        {/* Feature List */}
                        <div className="space-y-4 text-left max-w-md">
                            <div className="flex items-center gap-3 py-4">
                                <div className="flex-shrink-0 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                                    <svg
                                        className="w-5 h-5"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                                <span className="text-indigo-100">
                                    Seamless care coordination
                                </span>
                            </div>
                            <div className="flex items-center gap-3 py-4">
                                <div className="flex-shrink-0 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                                    <svg
                                        className="w-5 h-5"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                                <span className="text-indigo-100">
                                    Real-time communication tools
                                </span>
                            </div>
                            <div className="flex items-center gap-3 py-4">
                                <div className="flex-shrink-0 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                                    <svg
                                        className="w-5 h-5"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                                <span className="text-indigo-100">
                                    Secure and private platform
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-10 left-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"></div>
                </div>
                {/* Right Section  */}
                <div className="bg-white dark:bg-gray-900 duration-300 flex flex-col items-center justify-center lg:px-16 md:w-1/2 px-8 py-12 transition-colors w-full">
                    <div className="max-w-md w-full mx-auto px-4 md:p-4 lg:px-0">
                        <div className="flex items-center gap-3 mb-10px">
                            <div className="relative">
                                <svg
                                    className="h-10 w-10 text-orange-600 dark:text-orange-400"
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
                                <div className="absolute  top-1 right-1 h-3 w-3 bg-orange-500 rounded-full animate-pulse"></div>
                            </div>
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                <Link to="/">CareConnect</Link>
                            </span>
                        </div>

                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white py-4 mb-5">
                                Login your account
                            </h1>
                            <p className="text-sm text-gray-600 dark:text-gray-400 py-4">
                                Don't have an account?{" "}
                                <Link
                                    to="/signup"
                                    className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                                >
                                    {" "}
                                    Sign UP
                                </Link>
                            </p>
                        </div>

                        {/* OAuth Buttons */}
                        <div className="space-y-3 mb-8">
                            <button
                                onClick={handleGoogleLogin}
                                type="button"
                                className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 group hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md"
                            >
                                <FcGoogle className="text-xl" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 py-4">
                                    Continue with Google
                                </span>
                            </button>
                        </div>

                        {/* Divider */}
                        <div className="relative mb-8 py-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                                    Or continue with email
                                </span>
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Name Fields */}

                            {/* Email Field */}
                            <div>
                                <label
                                    htmlFor="email"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 py-4"
                                >
                                    Email address
                                </label>
                                <div className="relative">
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="you@example.com"
                                        className="w-full px-4 py-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"

                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className={`floater ${formData.password ? "filled" : ""}`}>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="input pr-10"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((prev) => !prev)}
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-4 h-4" />
                                        ) : (
                                            <Eye className="w-4 h-4" />
                                        )}
                                    </button>
                                    <span className="float-label">Password</span>
                                </div>
                            </div>


                            <div className="text-right mt-2">
                                <Link
                                    to="/forgot-password"
                                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                                >
                                    Forgot password?
                                </Link>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                className="w-full py-4 mt-4 bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 text-white font-semibold py-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
                            >
                                Login Account
                            </button>
                        </form>

                        {/* Footer Text */}
                        {/* <p className="mt-2 py-4 text-center text-xs text-gray-500 dark:text-gray-400">
                            By signing up, you agree to receive updates and newsletters from
                            CareConnect.
                        </p> */}
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
        </div>
    );
}

export default SignIn;
