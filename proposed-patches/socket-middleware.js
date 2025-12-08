// proposed-patches/socket-middleware.js

/**
 * Socket.IO Middleware for Firebase Auth Verification
 * 
 * INSTRUCTIONS:
 * 1. Import 'admin' from your firebaseAdmin integration.
 * 2. Import 'User' model (to map UID to _id).
 * 3. Use this function in app.js before io.on('connection', ...).
 */

import admin from '../integrations/firebaseAdmin.js';
import User from '../models/user.model.js';

export const socketAuthMiddleware = async (socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
        return next(new Error('Authentication error: No token provided'));
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);

        // Optional: fetch internal MongoDB _id
        const user = await User.findOne({ uid: decodedToken.uid }).select('_id firstName lastName');

        if (!user) {
            return next(new Error('Authentication error: User not found in DB'));
        }

        socket.user = {
            _id: user._id, // Internal ID
            uid: decodedToken.uid, // Firebase UID
            name: `${user.firstName} ${user.lastName}`
        };

        next();
    } catch (err) {
        console.error('Socket Auth Error:', err.message);
        next(new Error('Authentication error: Invalid token'));
    }
};
