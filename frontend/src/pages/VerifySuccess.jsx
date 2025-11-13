/* eslint-disable no-unused-vars */
import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { applyActionCode } from "firebase/auth";
import { auth } from "../firebase";
import api from "../api/axios";
import { toast } from "react-toastify";

export default function VerifySuccess() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const executed = useRef(false);

    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState(null);
    const [statusText, setStatusText] = useState("Verifying your email...");

    useEffect(() => {
        const verifyEmail = async () => {
            if (executed.current) return;
            executed.current = true;

            const oobCode = searchParams.get("oobCode");
            const mode = searchParams.get("mode");

            if (!oobCode || mode !== "verifyEmail") {
                setSuccess(false);
                setStatusText("Invalid verification link");
                setLoading(false);
                return;
            }

            try {
                await applyActionCode(auth, oobCode);

                if (auth.currentUser) {
                    await auth.currentUser.reload();
                }

                // backend update (if logged in)
                try {
                    await api.post("/users/verify-email");
                } catch (e) {
                    console.warn("Backend update failed");
                }

                setSuccess(true);
                setStatusText("Email verified successfully!");
                toast.success("Your email is verified!");

            } catch (err) {
                console.error(err);
                setSuccess(false);

                if (err.code === "auth/expired-action-code") {
                    setStatusText("Verification link expired");
                } else {
                    setStatusText("Verification failed");
                }

                toast.error("Verification failed.");
            }

            setLoading(false);
        };

        verifyEmail();
    }, [searchParams]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-md text-center">

                {loading && (
                    <div className="animate-spin h-10 w-10 rounded-full border-2 border-orange-600 border-t-transparent mx-auto mb-4" />
                )}

                <h1 className="text-2xl font-bold mb-4 text-gray-800">{statusText}</h1>

                {!loading && (
                    <p className="text-gray-600 mb-6">
                        {success
                            ? "You can now log in to your account."
                            : "Please request a new verification link."}
                    </p>
                )}

                {!loading && (
                    <div className="space-y-3">
                        <Link
                            to="/signin"
                            className="block w-full bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700"
                        >
                            Go to Login
                        </Link>

                        {!success && (
                            <Link
                                to="/resend-verification"
                                className="block w-full bg-gray-200 py-3 rounded-lg hover:bg-gray-300"
                            >
                                Request New Verification Link
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}