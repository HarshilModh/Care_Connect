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
import { Eye, EyeOff, Check, User, Mail, Lock } from "lucide-react";

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 md:p-6 font-sans">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-6xl overflow-hidden flex flex-col md:flex-row min-h-[700px]">
        
        {/* Left Side - Brand & Decorative (Blue/Indigo Theme) */}
        <div className="hidden md:flex md:w-5/12 lg:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 relative p-12 flex-col justify-between text-white overflow-hidden">
          {/* Decorative Circles */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-white opacity-10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-400 opacity-20 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 text-2xl font-bold tracking-tight mb-2">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                 <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                 </svg>
              </div>
              CareConnect
            </div>
          </div>

          <div className="relative z-10 max-w-md">
            <h2 className="text-4xl lg:text-5xl font-extrabold mb-6 leading-tight">
              Caregiving made <br/> <span className="text-blue-200">Simple & Collaborative.</span>
            </h2>
            <p className="text-lg text-blue-100/90 leading-relaxed">
              Join thousands of families using CareConnect to coordinate support, manage tasks, and stay connected with their loved ones.
            </p>
          </div>

          <div className="relative z-10 text-sm text-blue-200/60">
            © 2025 CareConnect Inc.
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-7/12 lg:w-1/2 p-8 lg:p-12 xl:p-16 flex flex-col justify-center bg-white">
          <div className="max-w-md mx-auto w-full">
            <div className="text-center md:text-left mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Create an account</h1>
              <p className="text-gray-500">
                Already have an account?{" "}
                <Link to="/signin" className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors">
                  Log in
                </Link>
              </p>
            </div>

            {/* Google Sign In */}
            <button
              onClick={handleGoogleLogin}
              type="button"
              className="w-full flex items-center justify-center gap-3 px-6 py-3.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium text-gray-700 mb-8 group"
            >
              <FcGoogle className="w-6 h-6" />
              <span>Sign up with Google</span>
            </button>

            <div className="relative flex items-center justify-center mb-8">
              <div className="border-t border-gray-200 w-full absolute"></div>
              <span className="bg-white px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider relative z-10">
                Or with Email
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 ml-1">First Name</label>
                  <div className="relative">
                    <input
                      name="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full pl-4 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                      placeholder="John"
                      required
                    />
                  </div>
                  {errors.firstName && <p className="text-xs text-red-500 ml-1">{errors.firstName}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 ml-1">Last Name</label>
                  <div className="relative">
                    <input
                      name="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full pl-4 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                      placeholder="Doe"
                      required
                    />
                  </div>
                  {errors.lastName && <p className="text-xs text-red-500 ml-1">{errors.lastName}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 ml-1">Email Address</label>
                <div className="relative group">
                  <div className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    placeholder="john@example.com"
                    required
                  />
                </div>
                {errors.email && <p className="text-xs text-red-500 ml-1">{errors.email}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 ml-1">Password</label>
                <div className="relative group">
                  <div className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-11 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500 ml-1">{errors.password}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 ml-1">Confirm Password</label>
                <div className="relative group">
                  <div className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmpassword"
                    value={formData.confirmpassword}
                    onChange={handleChange}
                    className="w-full pl-11 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmpassword && <p className="text-xs text-red-500 ml-1">{errors.confirmpassword}</p>}
              </div>

              <div className="flex items-start gap-3 pt-2">
                <div className="flex items-center h-5">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    required
                  />
                </div>
                <label htmlFor="terms" className="text-sm text-gray-600">
                  I agree to the <a href="#" className="text-indigo-600 hover:text-indigo-700 font-medium hover:underline">Terms of Service</a> and <a href="#" className="text-indigo-600 hover:text-indigo-700 font-medium hover:underline">Privacy Policy</a>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all duration-200 transform active:scale-[0.98] shadow-lg hover:shadow-indigo-500/30 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
              >
                {loading ? (
                  <>Processing...</>
                ) : (
                  <>Create Account <Check className="w-5 h-5" /></>
                )}
              </button>
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
    </div>
  );
}