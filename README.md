# CareConnect

> A comprehensive caregiving collaboration platform that brings families, caregivers, and care recipients together to coordinate care activities seamlessly.

CareConnect is a full-stack MERN application designed to simplify care coordination through real-time communication, task management, medication tracking, and vital monitoring - all in one centralized platform.

---

## 🌟 Features

### Core Functionality

- **Family Group Management** - Create and manage family groups with role-based access control
- **Task Management** - Create, assign, and track care tasks with reminders and notifications
- **Medication Tracking** - Log medications, dosages, schedules, and refill reminders
- **Vital Monitoring** - Record and track blood pressure, heart rate, weight, glucose, and temperature
- **Document Storage** - Upload and manage care-related documents securely
- **Real-time Chat** - Group messaging with Socket.IO for instant communication
- **Notifications** - Automated reminders for tasks, medications, and care activities

### User Roles

- **Care Recipients** - Individuals receiving care
- **Care Givers** - Professional or family caregivers
- **Family Members** - Family participants in care coordination
- **Admins/Owners** - Group administrators with full permissions

### Authentication & Security

- Firebase Authentication with email/password and Google OAuth
- JWT-based session management with access and refresh tokens
- Role-based access control (RBAC) for all resources
- Email verification and password reset flows
- Case-insensitive email handling for improved user experience

## 🏗️ Architecture

### Tech Stack

**Frontend**

- React 18 with Vite
- TailwindCSS for styling
- React Router for navigation
- Axios for API calls
- Socket.IO client for real-time features
- React Toastify for notifications
- Firebase Auth SDK

**Backend**

- Node.js with Express
- MongoDB with Mongoose ODM
- Redis for caching and session management
- Firebase Admin SDK for authentication
- Socket.IO for real-time communication
- Node-cron for scheduled tasks
- Nodemailer for email notifications

**Storage & Services**

- AWS S3 for file storage
- Cloudinary for image management
- MongoDB Atlas (production)
- Redis for token caching

---

2. **Set up environment variables**

   Create `backend/.env`:

   ```env
   # Database
   MONGODB_URI=mongodb://mongodb:27017/care_connect_db

   # Redis
   REDIS_URL=redis://redis:6379

   # JWT Secrets
   ACCESS_TOKEN_SECRET=your_access_token_secret
   REFRESH_TOKEN_SECRET=your_refresh_token_secret

   # Firebase
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_PRIVATE_KEY=your_private_key
   FIREBASE_CLIENT_EMAIL=your_client_email

   # AWS S3
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_REGION=us-east-1
   S3_BUCKET_NAME=your_bucket_name

   # Email (Nodemailer)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=465
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   ```

   Create `frontend/.env`:

   ```env
   VITE_API_URL=http://localhost:3000/api
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   ```

3. **Access the application**
   - Frontend: [http://localhost:5173](http://localhost:5173)
   - Backend API: [http://localhost:3000](http://localhost:3000)
   - MongoDB: `localhost:27017`
   - Redis: `localhost:6379`

### Local Development

**Backend Setup**

```bash
cd backend
npm install
npm start
```

**Frontend Setup**

```bash
cd frontend
npm install
npm run dev
```

**Production URL**: `http://3.138.189.214:5173/`
