# CareConnect Codebase Audit Report

## Summary
CareConnect is a robust caregiving collaboration platform. The codebase is well-structured with a clear separation between the Node.js/Express backend and React/Vite frontend. Core features (Family Groups, Chat, Tasks, Memberships) are implemented with appropriate data models and controllers. **Critical Security Finding**: The Socket.IO implementation lacks authentication, allowing any user to impersonate others by simply providing a `userId` in the handshake query. The project uses AWS S3 for document and image storage.

## File Map

### Backend structure (Key files)
- `app.js` (Entry point, Socket.IO setup, Redis connection)
- `routes/` (API definition)
  - `index.js` (Mount point)
  - `chat.Routes.js`, `task.Routes.js`, `documentRoutes.js`, etc.
- `models/` (Mongoose Schemas)
  - `chat.model.js` (Includes recommended indexes)
  - `task.model.js`
  - `document.model.js`
- `data/` (Controllers)
  - `chatController.js` (Message logic)
  - `userController.js` (Auth & User logic)
- `integrations/`
  - `s3.js` (AWS S3 Logic)

### Frontend structure (Key files)
- `src/App.jsx` & `routes/AppRoutes.jsx` (Routing)
- `src/api/axios.js` (Auth interceptor)
- `src/utils/socket.js` (Socket client)
- `src/components/chat/` (Chat UI)

## Feature Status
| Feature | Status | Notes |
| :--- | :--- | :--- |
| **Authentication** | ✅ Done | Firebase Auth + MongoDB User sync. Token injection verified. |
| **Family Groups** | ✅ Done | CRUD operations and membership logic exist. |
| **Chat** | ✅ Done | Persisted in MongoDB. Socket.IO real-time updates. |
| **Tasks** | ✅ Done | CRUD, assignment, and "For" field logic (recently fixed). |
| **Documents** | ✅ Done | Uses **AWS S3** for storage. |
| **Notifications** | ✅ Done | DB-persisted notifications + Socket events. |

## API Endpoint Inventory
Verified via `backend/routes/index.js`:
- `/api/users` -> `user.Routes.js`
- `/api/family-groups` -> `familyGroups.js`
- `/api/memberships` -> `memberShip.Routes.js`
- `/api/chats` -> `chat.Routes.js`
- `/api/tasks` -> `task.Routes.js`
- `/api/documents` -> `documentRoutes.js`
- `/api/notifications` -> `notifications.js`

## Security & Correctness Issues

1.  **CRITICAL: Socket.IO Authentication Missing**
    *   **File**: `backend/app.js:41`
    *   **Issue**: `const userId = socket.handshake.query.userId;` accepts any client-provided ID without verification.
    *   **Fix**: Verify Firebase ID token in handshake `auth` object.

2.  **Dead Code: Cloudinary Integration**
    *   **File**: `backend/integrations/cloudinary.js`
    *   **Issue**: File exists but project standard is AWS S3. It appears unused and should be removed to avoid confusion.

## Prioritized Todo List

1.  **[High - 1h] Secure Socket.IO**: Implement Firebase token verification in `io.use()` middleware.
2.  **[Low - 15m] Cleanup**: Remove unused `cloudinary.js` and uninstall `cloudinary` dependency.
3.  **[Low - 1h] AI Integration**: Add `aiClient.js` for requested features (summarize, smart-reply).

## Suggested Quick Patches

### Patch 1: Socket Auth (backend/app.js)
```javascript
// Add before io.on('connection')
import admin from './integrations/firebaseAdmin.js';

io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    socket.userId = decoded.uid; // Note: Map this to MongoDB _id if needed
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});
```
