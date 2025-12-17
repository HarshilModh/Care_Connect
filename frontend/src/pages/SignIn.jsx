import React, { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { sendEmailVerification, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { validateEmail, validateRequired } from "../utils/validation";
import { Eye, EyeOff, Mail, Lock, LogIn } from "lucide-react";
import { useEffect } from "react";

function SignIn() {
  const navigate = useNavigate();
  const { user } = useAuth();
  useEffect(() => {
    console.log("Current user in SignIn:", user);
    if (user) {
      navigate("/home", { replace: true });
    }
  }, [user, navigate]);
  const { login } = useAuth();
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false); // Added loading state for button feedback

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
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
    };

    try {
      setLoading(true);
      const res = await api.post("users/login", payload);
      console.log("Login response:", res);
      if (res.data?.user && res.data?.tokens?.accessToken) {
        login(res.data.user, res.data.tokens?.accessToken);

        toast.success("Login successful!");
        setFormData({ email: "", password: "" });
        setTimeout(() => navigate("/home", { replace: true }), 1000);
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
          url: "http://localhost:5173/verify-success",
        });
        return;
      }
      console.error(
        "Login error:",
        error.response?.data?.error || error.message
      );
      toast.error("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 md:p-6 font-sans">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-6xl overflow-hidden flex flex-col md:flex-row min-h-[700px]">
        <div className="hidden md:flex md:w-5/12 lg:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 relative p-12 flex-col justify-between text-white overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white opacity-10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-400 opacity-20 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 text-2xl font-bold tracking-tight mb-2">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              CareConnect
            </div>
          </div>

          <div className="relative z-10 max-w-md">
            <h2 className="text-4xl lg:text-5xl font-extrabold mb-6 leading-tight">
              Welcome <br /> <span className="text-blue-200">Back.</span>
            </h2>
            <p className="text-lg text-blue-100/90 leading-relaxed">
              Log in to access your care circle, manage tasks, and coordinate
              with your family and caregivers.
            </p>
          </div>

          <div className="relative z-10 text-sm text-blue-200/60">
            © 2025 CareConnect Inc.
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full md:w-7/12 lg:w-1/2 p-8 lg:p-12 xl:p-16 flex flex-col justify-center bg-white">
          <div className="max-w-md mx-auto w-full">
            <div className="text-center md:text-left mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Log in to your account
              </h1>
              <p className="text-gray-500">
                Don't have an account?{" "}
                <Link
                  to="/signup"
                  className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors"
                >
                  Sign up
                </Link>
              </p>
            </div>

            {/* Google Login */}
            <button
              onClick={handleGoogleLogin}
              type="button"
              className="w-full flex items-center justify-center gap-3 px-6 py-3.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium text-gray-700 mb-8 group"
            >
              <FcGoogle className="w-6 h-6" />
              <span>Continue with Google</span>
            </button>

            <div className="relative flex items-center justify-center mb-8">
              <div className="border-t border-gray-200 w-full absolute"></div>
              <span className="bg-white px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider relative z-10">
                Or with Email
              </span>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="text-sm font-semibold text-gray-700 ml-1"
                >
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between ml-1">
                  <label
                    htmlFor="password"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative group">
                  <div className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-11 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all duration-200 transform active:scale-[0.98] shadow-lg hover:shadow-indigo-500/30 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>Logging in...</>
                ) : (
                  <>
                    Log In <LogIn className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* <ToastContainer
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
      /> */}
    </div>
  );
}

export default SignIn;
