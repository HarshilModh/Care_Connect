/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useContext, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);


    const loadStoredSession = () => {
        const storedUser = localStorage.getItem("user");
        const storedToken = localStorage.getItem("accessToken");
        const storedExpiry = localStorage.getItem("tokenExpiry");

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
        const expiry = Date.now() + 60 * 60 * 1000; // 1 hour
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("tokenExpiry", expiry.toString());

        setUser(userData);
        setToken(accessToken);
    };


    const clearSession = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("tokenExpiry");
        setUser(null);
        setToken(null);
    };


    const login = (userData, accessToken) => {
        if (!userData || !accessToken) return;
        storeSession(userData, accessToken);
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
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // Firebase user logged in (Google)
                const idToken = await firebaseUser.getIdToken();
                const userData = {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    displayName: firebaseUser.displayName || "",
                };

                // Only overwrite if user isn't already logged in via backend
                setUser((prev) => prev || userData);
                setToken((prev) => prev || idToken);

                // Store session if not already stored
                if (!localStorage.getItem("user")) {
                    storeSession(userData, idToken);
                }
            }



            setLoading(false);
        });

        return () => unsubscribe();
    }, []);


    useEffect(() => {
        const stored = loadStoredSession();
        if (stored) {
            setUser(stored.user);
            setToken(stored.token);
        }
        setLoading(false);
    }, []);


    useEffect(() => {
        if (!auth.currentUser) return;

        const interval = setInterval(async () => {
            try {
                const idToken = await auth.currentUser.getIdToken(true);
                const currentUser = auth.currentUser;

                const userData = {
                    uid: currentUser.uid,
                    email: currentUser.email,
                    displayName: currentUser.displayName || "",
                };

                storeSession(userData, idToken);
            } catch (err) {
                console.error("Token refresh error:", err);
            }
        }, 55 * 60 * 1000);

        return () => clearInterval(interval);
    }, [auth.currentUser]);

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);