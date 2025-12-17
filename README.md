# CareConnect

A comprehensive caregiving collaboration platform that brings families, caregivers, and care recipients together to coordinate care activities seamlessly.

CareConnect is a full-stack MERN application designed to simplify care coordination through real-time communication, task management, medication tracking, and vital monitoring - all in one centralized platform.

---

## Features

### Core Functionality

- **Family Group Management**: Create and manage family groups with role-based access control (Admins, Members).
- **Task Management**: Create, assign, and track care tasks with due dates, priorities, and status updates.
- **Medication Tracking**: Log medications, dosages, frequency, and refill reminders.
- **Vital Monitoring**: Record and track key health metrics like blood pressure, heart rate, weight, glucose, and temperature with visual charts.
- **Document Storage**: Upload and manage care-related documents (Medical Records, Prescriptions, etc.) securely using AWS S3.
- **Real-time Chat**: Integrated group messaging for instant communication between family members and caregivers.
- **Notifications**: Automated system notifications for important updates and reminders.

### Role-Based Access

- **Care Recipients**: The central focus of the care group.
- **Caregivers**: Professional or family members providing direct care.
- **Family Members**: Participants assisting in coordination.
- **Admins**: Group creators with full management permissions.

### Security & Architecture

- **Authentication**: Robust Firebase Authentication (Email/Password & Google OAuth).
- **Data Protection**: AWS S3 for secure file storage and signed URL access.
- **Real-time Updates**: Socket.IO for instant chat and status reflection.
- **Background Jobs**: Automated cron jobs for scheduled tasks (medications, refills).

---

## Architecture & Tech Stack

### Frontend
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS v4
- **Visualization**: Recharts (for Vitals)
- **Communication**: Socket.IO Client, Axios


### Backend
- **Runtime**: Node.js + Express 5
- **Database**: MongoDB (Mongoose ODM)
- **Caching**: Redis (Session management & caching)
- **Real-time**: Socket.IO
- **Storage**: AWS S3 (via AWS SDK v3)
- **Auth**: Firebase Admin SDK
- **Email**: Nodemailer

### Infrastructure
- **Hosting**: AWS / Local

### Prerequisites
Ensure you have the following installed:
- **Node.js** (v18+ recommended)
- **MongoDB**
- **Redis**

---

### Configuration :

The project zip file includes the necessary `.env` files for both `frontend/` and `backend/` with all required API keys and database configurations pre-set. No manual variable setup is required.

### Installation :

1. Clone the repository to your local machine using the command
   `git clone https://github.com/HarshilModh/Care_Connect.git`

2. Install the dependencies needed for the project
   **Backend:**
   ```bash
   cd backend
   npm install
   ```
   **Frontend:**
   ```bash
   cd frontend
   npm install
   ```

3. Start the application
   **Backend:**
   ```bash
   cd backend
   npm start
   ```
   *The server listens on PORT: 3000 by default.*

   **Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```
   *The frontend runs on http://localhost:5173 by default.*


### Accessing the Application :

1. Project URL : [http://localhost:5173/](http://localhost:5173/)

2. Navigate to [http://localhost:5173/signup](http://localhost:5173/signup) to create a new account.

3. Navigate to [http://localhost:5173/signin](http://localhost:5173/signin) to login to an existing account.


### Database :

1. A MongoDB database named `care_connect_db` is utilized (on `localhost:27017`). Ensure your local MongoDB instance is running.

2. Open MongoDB Compass and connect to `MONGODB_URI=mongodb+srv://jitesh16:Jitesh%4016@cluster0.j66yjdt.mongodb.net/care_connect?retryWrites=true&w=majority&appName=Cluster0`.


### Important Notes :

- Please create an account with your own email to test the OTP email functionality.
- OTP emails can sometimes land in your spam or junk folder so please check that.

### Deployment Information

We have deployed this application on AWS EC2. You can access it at:  
[http://3.138.189.214:5173/](http://3.138.189.214:5173/)  

*Note: The AWS EC2 instance may be paused due to low credits. Please Shirsha know if you face any issues accessing the application.*


### Credentials for Testing CareConnect

- **Email**: person1.careconnect@gmail.com  
  **Password**: r$zr6Ur.ZfjDkJ4

- **Email**: person2.careconnect@gmail.com  
  **Password**: Q2M8kPjVmz2!.Jd

- **Email**: person3.careconnect@gmail.com  
  **Password**: Cs554WebDev@@

- **Email**: person4.careconnect@gmail.com  
  **Password**: Abcd123@@

**Note**: You cannot use the "Reset Password" or "Forgot Password" features with these emails, as they are shared testing accounts. If needed, you can create your own account for testing.

---

### Feature Explained (If missed in video)

- **Task Status & Reminders**: 
  - If you see a **red background** in a task, it means the task has been marked as "missed" by our automated cron job (runs every 15 minutes).
  - **Automated Reminders**: The system checks every minute for tasks due soon.
    - **5 Minutes Before**: A "Task Due Soon" notification is sent to the assignee.
    - **Due Time**: An "Urgent: Task Due Now" notification is sent.
  - **Daily Recurring Tasks**: Every night at midnight, the system automatically generates the next instance for any recurring tasks (daily, weekly, monthly).

- **Panic Button**:
  - Located in the Family Group details.
  - Clicking this and confirming will send an **immediate emergency alert** to ALL members of that family group. Use this only for emergencies.

- **Invitation System**:
  - You can add members in two ways:
    1. **Search Existing Users**: Find users already on CareConnect by their email.
    2. **Invite via Email**: If they aren't registered, invite them by email. This creates a pre-verified account for them, and they will receive an email (handled via our simulated email service in development) or notifications upon logging in.

- **Vitals Monitoring**:
  - We use **Recharts** to visualize health trends. Adding a new vital reading immediately updates the charts to show progress over time.


### Task Editing Behavior

- **Calendar View**: 
  - When you click on a task:
    - If you are an admin, the task will open in edit mode.
    - If the task is marked as "done" (tick), it will not open for editing.

- **List View**: 
  - The "Edit" button will be disabled for tasks marked as "done".

### User Deletion
- When a user deletes their account:
  - The system checks all groups they own.
  - It attempts to transfer ownership to the next available family member.
  - If no other members exist, the entire group is deleted.
  - **Note**: Deleting a user will also recursively delete their specific tasks, messages, and memberships to ensure no orphaned data remains.
 
