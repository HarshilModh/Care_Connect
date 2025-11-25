// src/routes/PrivateRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PrivateRoute = ({ children, allowedRoles }) => {
    const { user } = useAuth();
    const location = useLocation();

    // Not logged in → go to signin
    if (!user) {
        return (
            <Navigate
                to="/signin"
                replace
                state={{ from: location.pathname }}
            />
        );
    }

    // Optional: role-based check
    if (allowedRoles && allowedRoles.length > 0) {
        const userRole = user.role;
        if (!allowedRoles.includes(userRole)) {
            return <Navigate to="/unauthorized" replace />;
        }
    }

    return children;
};

export default PrivateRoute;