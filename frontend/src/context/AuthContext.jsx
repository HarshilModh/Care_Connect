/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useContext, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase";
import api from "../api/axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadStoredSession = () => {
        const storedUser = localStorage.getItem("user");
        const storedToken = localStorage.getItem("accessToken");
        const storedExpiry = localStorage.getItem("tokenExpiry");

        console.log("Loaded session from storage:", {
            storedUser,
            storedToken,
            storedExpiry,
        });

        if (storedUser && storedToken && storedExpiry) {
            const expiry = Number(storedExpiry);
            if (Date.now() < expiry) {
                return {
                    user: JSON.parse(storedUser),
                    token: storedToken,
                    expiry,
                };
            }
        }
        return null;
    };

    const storeSession = (userData, accessToken) => {
        // const expiry = Date.now() + 60 * 60 * 1000; // 1 hour from now
        const expiry = Date.now() + 5 * 60 * 1000; // 5 minutes from now
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("tokenExpiry", expiry.toString());

        setUser(userData);
        setToken(accessToken);
    };

    // Ensure session is cleared if expired
    useEffect(() => {
        const storedExpiry = localStorage.getItem("tokenExpiry");
        console.log("storedExpiry", storedExpiry);
        if (storedExpiry && Date.now() >= Number(storedExpiry)) {
            localStorage.removeItem("user");
            localStorage.removeItem("accessToken");
            localStorage.removeItem("tokenExpiry");
            setUser(null);
            setToken(null);
        }
    }, []);

    const clearSession = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("tokenExpiry");
        setUser(null);
        setToken(null);
    };

    const login = (userData, accessToken) => {
        if (!userData || !accessToken) return;
        const normalizedUser = Array.isArray(userData) ? userData[0] : userData;

        console.log("Logging in user function authcontext", normalizedUser);
        storeSession(normalizedUser, accessToken);
    };

    const logout = async () => {
        try {
            await signOut(auth); // Will logout Google if logged in
        } catch {
            // Ignore signOut errors
        }
        clearSession();
    };

    useEffect(() => {
        console.log("Initializing AuthContext");
        let unsubscribe = () => { };

        const initAuth = async () => {
            try {
                // 1) Restore from localStorage
                const stored = loadStoredSession();
                if (stored?.user?._id) {
                    setUser(stored.user);
                    setToken(stored.token);
                }

                // 2) Listen for Firebase (Google) auth changes
                unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
                    try {
                        if (!firebaseUser) {
                            // Don't clear existing session here – email/password users won’t have a firebaseUser
                            return;
                        }

                        const idToken = await firebaseUser.getIdToken();
                        console.log("idToken from onAuthStateChanged:", idToken);

                        // Make sure axios baseURL is http://localhost:3000
                        // const res = await api.post("/users/google", { idToken });
                        // const { user: backendUser, tokens } = res.data || {};
                        // console.log("Backend user after Google login:", backendUser);

                        // if (backendUser && backendUser._id) {
                        //     const accessToken = tokens?.accessToken || idToken;
                        //     storeSession(backendUser, accessToken);
                        // }
                    } catch (err) {
                        console.error("Backend login error in onAuthStateChanged:", err);
                    }
                });
            } finally {
                // 3) Done initial checks
                setLoading(false);
            }
        };

        initAuth();

        return () => unsubscribe();
    }, []);

    // useEffect(() => {
    //     const stored = loadStoredSession();
    //     // Only restore if backend user object has _id
    //     if (stored && stored.user && stored.user._id) {
    //         setUser(stored.user);
    //         setToken(stored.token);
    //     }
    //     setLoading(false);
    // }, []);

    useEffect(() => {
        if (!auth.currentUser) return;

        const interval = setInterval(async () => {
            try {
                const idToken = await auth.currentUser.getIdToken(true);
                const res = await api.post("/users/google", { idToken });
                const { user: backendUser, tokens } = res.data || {};
                console.log("Refreshed backend user:", backendUser);

                if (backendUser && backendUser._id) {
                    const accessToken = tokens?.accessToken || idToken;
                    storeSession(backendUser, accessToken);
                }
            } catch (err) {
                console.error("Token refresh error:", err);
            }
        }, 55 * 60 * 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);