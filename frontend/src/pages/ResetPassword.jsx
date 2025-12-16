/* eslint-disable no-unused-vars */
import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";
import { auth } from "../firebase";
import { toast } from "react-toastify";
import api from "../api/axios";
import { validatePassword, validateConfirmPassword } from "../utils/validation";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const executed = useRef(false);

  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [email, setEmail] = useState(null);
  const [oobCode, setOobCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const verifyCode = async () => {
      if (executed.current) return;
      executed.current = true;

      const code = searchParams.get("oobCode");
      const mode = searchParams.get("mode");

      if (!code || mode !== "resetPassword") {
        toast.error("Invalid password reset link.");
        setLoading(false);
        return;
      }

      setOobCode(code);

      try {
        const email = await verifyPasswordResetCode(auth, code);

        setEmail(email);
        setVerified(true);
      } catch {
        toast.error("Reset link is invalid or expired.");
        setVerified(false);
      }

      setLoading(false);
    };

    verifyCode();
  }, [searchParams]);

  const handleReset = async (e) => {
    e.preventDefault();

    // Validate password
    const passwordError = validatePassword(password);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    // Validate confirm password
    const confirmError = validateConfirmPassword(password, confirmPassword);
    if (confirmError) {
      toast.error(confirmError);
      return;
    }

    try {
      await confirmPasswordReset(auth, oobCode, password);

      const resetpass = await api.patch("users/me/reset_passoword", {
        email: email.trim().toLowerCase(),
        password,
      });
      console.log("resetpass", resetpass);

      toast.success("Password updated! Please log in.");
      navigate("/signin");
    } catch (err) {
      toast.error("Failed to reset password.");
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-700">Verifying reset link...</p>
      </div>
    );
  }

  if (!verified) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-red-500">Invalid or expired reset link</p>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-xl shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Reset Password
        </h1>

        <form onSubmit={handleReset} className="space-y-5">
          <div>
            <label className="block mb-2 text-gray-700">New Password</label>
            <input
              type="password"
              className="w-full px-4 py-3 border rounded-lg"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block mb-2 text-gray-700">Confirm Password</label>
            <input
              type="password"
              className="w-full px-4 py-3 border rounded-lg"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button
            className="w-full bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700"
            type="submit"
          >
            Reset Password
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4">
          Remembered it?{" "}
          <Link to="/signin" className="text-orange-600 hover:underline">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}
