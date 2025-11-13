/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useContext, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // Helper to get stored data
    const getStoredAuth = () => {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('accessToken');
        const expiry = localStorage.getItem('tokenExpiry');
        if (storedUser && storedToken && expiry) {
            return { user: JSON.parse(storedUser), token: storedToken, expiry: Number(expiry) };
        }
        return null;
    };

    // Auto refresh Firebase token before it expires
    const refreshAuthToken = async (currentUser) => {
        try {
            const idToken = await currentUser.getIdToken(true); // force refresh
            const expiryTime = Date.now() + 60 * 60 * 1000; // 1 hour from now
            localStorage.setItem('accessToken', idToken);
            localStorage.setItem('tokenExpiry', expiryTime.toString());
            setToken(idToken);
        } catch (error) {
            console.error("Error refreshing token:", error);
        }
    };

    // Monitor Firebase auth state
    useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (currentUser) {
            const idToken = await currentUser.getIdToken();
            const expiryTime = Date.now() + 60 * 60 * 1000; // 1 hour expiry

            // Try to get _id from stored user
            let storedUser = {};
            try {
                storedUser = JSON.parse(localStorage.getItem('user')) || {};
            } catch { storedUser = {}; }

            const userData = {
                userId: storedUser._id || '', // restore _id if present
                uid: currentUser.uid,
                email: currentUser.email,
                displayName: currentUser.displayName || '',
                _id: storedUser._id || '', // optional: keep _id for backend
            };

            setUser(userData);
            setToken(idToken);
            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('accessToken', idToken);
            localStorage.setItem('tokenExpiry', expiryTime.toString());
        } else {
            localStorage.removeItem('user');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('tokenExpiry');
            setUser(null);
            setToken(null);
        }
        setLoading(false);
    });

    return () => unsubscribe();
}, []);
    // Auto-refresh token every 55 minutes
    useEffect(() => {
        if (!auth.currentUser) return;
        const interval = setInterval(() => {
            refreshAuthToken(auth.currentUser);
        }, 55 * 60 * 1000); // 55 minutes
        return () => clearInterval(interval);
    }, [auth.currentUser]);

    // Rehydrate session if not expired
    useEffect(() => {
        const stored = getStoredAuth();
        if (stored && Date.now() < stored.expiry) {
            setUser(stored.user);
            setToken(stored.token);
            setLoading(false);
        } else {
            localStorage.removeItem('user');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('tokenExpiry');
        }
    }, []);

    const login = (userData, accessToken) => {
        if (!userData || !accessToken) return;
        const expiryTime = Date.now() + 60 * 60 * 1000; // 1 hour
        if (userData && accessToken) {
            // Store user and token
            setUser({
                userId: userData._id || '',
                uid: userData.firebaseUid || '',
                email: userData.email,
                displayName: userData.firstName || '',
            });
            setToken(accessToken);
            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('tokenExpiry', expiryTime.toString());

        }


    };

    const logout = async () => {
        try {
            await signOut(auth);
            localStorage.removeItem('user');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('tokenExpiry');
            setUser(null);
            setToken(null);
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);