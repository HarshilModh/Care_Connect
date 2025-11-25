import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function ActionHandler() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const mode = searchParams.get("mode");

        if (!mode) {
            navigate("/signin");
            return;
        }

        switch (mode) {
            case "verifyEmail":
                navigate(`/verify-success?${searchParams.toString()}`);
                break;

            case "resetPassword":
                navigate(`/reset-password?${searchParams.toString()}`);
                break;

            default:
                navigate("/signin");
        }
    }, [searchParams]);

    return (
        <div className="flex justify-center items-center min-h-screen">
            <p className="text-gray-700">Processing...</p>
        </div>
    );
}