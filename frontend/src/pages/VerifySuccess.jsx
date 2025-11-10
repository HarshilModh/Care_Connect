import { useEffect, useState, useRef } from "react";
import { auth } from "../firebase";
import api from "../api/axios";
import { toast } from "react-toastify";
import { applyActionCode } from "firebase/auth";
import { useSearchParams, useNavigate, Link } from "react-router-dom";

export default function VerifySuccess() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState("Verifying your email...");
    const [isVerifying, setIsVerifying] = useState(true);
    const [verificationSuccess, setVerificationSuccess] = useState(null); // true for success, false for error

    //  ref to prevent double execution
    const hasVerified = useRef(false);

    useEffect(() => {
        const handleVerification = async () => {
            // Check if already verified
            if (hasVerified.current) {
                console.log("Skipping - already verified");
                return;
            }

            // Mark as verified immediately
            hasVerified.current = true;

            try {
                const oobCode = searchParams.get("oobCode");
                const mode = searchParams.get("mode");

                if (!oobCode) {
                    setStatus("Invalid verification link");
                    setVerificationSuccess(false);
                    toast.error("Invalid or missing verification code.");
                    setIsVerifying(false);
                    return;
                }

                if (mode !== "verifyEmail") {
                    setStatus("Invalid verification mode");
                    setVerificationSuccess(false);
                    toast.error("This link is not for email verification.");
                    setIsVerifying(false);
                    return;
                }

                console.log("Applying verification code to Firebase...");


                await applyActionCode(auth, oobCode);

                console.log("Firebase email verification successful");

                // Reload current user if logged in
                if (auth.currentUser) {
                    await auth.currentUser.reload();
                    console.log("User reloaded. Email verified:>>>>", auth.currentUser.emailVerified);

                    // update backend about verification
                    try {
                        const response = await api.post("/users/verify-email");
                        console.log("Backend updated successful:", response.data);
                    } catch (backendError) {
                        console.warn("Backend update failed", backendError);
                    }
                } else {
                    console.log("User not logged in - verification saved for next login");
                }

                // Success!
                setStatus("Email verified successfully!");
                setVerificationSuccess(true);
                toast.success("Email verified! You can now log in.");
                setIsVerifying(false);

                // setTimeout(() => navigate("/signin", { replace: true }), 2000);

            } catch (error) {
                console.error("Verification error:", error);
                setIsVerifying(false);
                setVerificationSuccess(false);

                // Handle specific errors
                switch (error.code) {
                    case "auth/invalid-action-code":
                        setStatus("This link is invalid or has been used");
                        toast.error("Verification link already used or invalid.");
                        break;
                    case "auth/expired-action-code":
                        setStatus("This link has expired");
                        toast.error("Link expired. Request a new verification email.");
                        break;
                    default:
                        setStatus("Verification failed");
                        toast.error("Something went wrong. Please try again.");
                }
            }
        };

        handleVerification();
    }, [searchParams, navigate]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                {isVerifying && (
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
                )}

                <h1 className="text-3xl font-bold text-gray-800 mb-4">
                    {status}
                </h1>

                <p className="text-gray-600 mb-6">
                    {verificationSuccess === true
                        ? "You can now log in to your account."
                        : verificationSuccess === false
                            ? "Please request a new verification link or contact support."
                            : "Please wait while we verify your email..."}
                </p>

                {!isVerifying && (
                    <div className="space-y-3">
                        <Link
                            to="/signin"
                            className="block w-full bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition"
                        >
                            Go to Login
                        </Link>

                        {verificationSuccess === false && (
                            <Link
                                href="/resend-verification"
                                className="block w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition"
                            >
                                Request New Link
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}