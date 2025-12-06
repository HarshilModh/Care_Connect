import React, { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import {
  signInWithPopup,
  sendEmailVerification,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import {
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  validateName,
} from "../utils/validation";
import { Eye, EyeOff } from "lucide-react";

// import { useTheme } from "../context/ThemeContext";

export default function Signup() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // const { theme } = useTheme();
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmpassword: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const token = await user.getIdToken();

      const res = await api.post(
        "/users/google",
        { idToken: token },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      login(res.data.user, token);
      toast.success("Logged in successfully!");
      // navigate("/home", { replace: true });
      setTimeout(() => navigate("/home", { replace: true }), 1000);
    } catch (err) {
      console.error("Google login error:", err);
      toast.error("Google Sign-In failed. Try again.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields
    const newErrors = {};


    const firstNameError = validateName(formData.firstName, "First name");
    if (firstNameError) newErrors.firstName = firstNameError;

    const lastNameError = validateName(formData.lastName, "Last name");
    if (lastNameError) newErrors.lastName = lastNameError;

    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;

    const passwordError = validatePassword(formData.password);
    if (passwordError) newErrors.password = passwordError;

    const confirmPasswordError = validateConfirmPassword(
      formData.password,
      formData.confirmpassword
    );
    if (confirmPasswordError) newErrors.confirmpassword = confirmPasswordError;

    console.log("Validating form data:", newErrors);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fix the errors in the form");
      return;
    }
    console.log("Submitting signup form with data:", formData);

    try {
      setLoading(true);
      console.log("Creating Firebase user");
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      console.log("Firebase user created:", userCredential);
      const user = userCredential.user;

      console.log("Sending email verification");
      await sendEmailVerification(user, {
        url: "http://localhost:5173/verify-success",
      });
      console.log("Email verification sent");
      //toast.success("Verification email sent! Redirecting to login...");

      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmpassword,
        firebaseUid: user.uid,
        needPasswordReset: false,
      };

      console.log("Sending signup data to backend:", payload);
      const response = await api.post("users/signUp", payload);
      const data = response.data;
      
      console.log("User created in backend:", data);
      
      if (data?.error) {throw new Error(data.error);}
      
      toast.success("Verification email sent! Please verify your email, then sign in.");

      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmpassword: "",
      });
      // Redirect after a short delay so user sees toast
      setTimeout(() => {
        navigate("/signin", { replace: true });
      }, 2000);
    } catch (error) {
      console.error("Signup error:", error);
      const message =error.response?.data?.error || error.message || "Signup failed. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen w-full bg-white dark:bg-gray-900 transition-colors duration-300">
      <div className="flex min-h-screen w-full max-w-7xl shadow-2xl">
        {/* Left Section */}
        <div className="hidden md:flex md:w-1/2 relative bg-gradient-to-br from-white-100 to-orange-500 overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
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
          <div className="flex flex-col items-center justify-center px-12 relative text-center text-white w-full z-10">
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
            <p className="text-lg text-indigo-100 max-w-md mx-auto py-2">
              Connect with caregivers, coordinate care, and manage everything in
              one place.
            </p>
          </div>
        </div>

        {/* Right Section */}
        <div className="bg-white dark:bg-gray-900 duration-300 flex flex-col items-center justify-center lg:px-16 md:w-1/2 px-8 py-12 transition-colors w-full">
          <div className="max-w-md w-full mx-auto">
            <div className="flex items-center gap-3 mb-6">
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
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                <Link to="/">CareConnect</Link>
              </span>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Create your account
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Already have an account?{" "}
              <Link
                to="/signin"
                className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
              >
                Sign in
              </Link>
            </p>

            {/* Google OAuth */}
            <button
              onClick={handleGoogleLogin}
              type="button"
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 group hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md mb-6"
            >
              <FcGoogle className="text-xl" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Continue with Google
              </span>
            </button>

            {/* Divider */}
            <div className="relative mb-6">
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    First Name
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="John"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Doe"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                  required
                />
              </div>

              <div className={`floater ${formData.password ? "filled" : ""}`}>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="input pr-10"
                    minLength={8}
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
                <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters</p>
              </div>

              <div className={`floater ${formData.confirmpassword ? "filled" : ""}`}>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmpassword"
                    value={formData.confirmpassword}
                    onChange={handleChange}
                    className="input pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                  <span className="float-label">Confirm Password</span>
                </div>
              </div>

              {/* Terms */}
              <div className="flex items-start gap-2">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  required
                />
                <label
                  htmlFor="terms"
                  className="text-sm text-gray-600 dark:text-gray-400"
                >
                  I agree to the{" "}
                  <a
                    href="#"
                    className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                  >
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a
                    href="#"
                    className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                  >
                    Privacy Policy
                  </a>
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-100 shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>

            <p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
              By signing up, you agree to receive updates and newsletters from
              CareConnect.
            </p>
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
