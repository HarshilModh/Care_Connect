// src/routes/AppRoutes.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";

import Home from "../pages/Home";
import Landing from "../pages/Landing";
import SignUp from "../pages/Signup";
import SignIn from "../pages/SignIn";
import VerifySuccess from "../pages/VerifySuccess";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";
import CreateGroup from "../components/familyGroups/CreateGroup";
import AddMembers from "../components/familyGroups/AddMembers";
import FamilyGroups from "../components/familyGroups/FamilyGroups";
import GroupMembers from "../components/familyGroups/GroupMembers";
import ActionHandler from "../pages/ActionHandler";
import Notifications from "../components/notifications/Notifications";
import PrivateRoute from "./PrivateRoutes.jsx";
import Tasks from "../pages/tasksPage.jsx";
import CreateTask from "../pages/createTask.jsx";
import ChatLayout from "../components/chat/chatLayout.jsx";
import UserProfile from "../components/userProfile/UserProfile.jsx";
import EditProfile from "../components/userProfile/EditProfile.jsx";
import EditGroup from "../components/familyGroups/EditGroup";
const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />

      {/* auth routes  */}
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />

      {/* verification routes  */}
      <Route path="/action" element={<ActionHandler />} />
      <Route path="/verify-success" element={<VerifySuccess />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/chat" element={<ChatLayout />} />
      <Route path="/groups/edit/:id" element={<EditGroup />} />
      <Route
        path="/edit-profile"
        element={
          // <PrivateRoute>
            <EditProfile />
          // </PrivateRoute>
        }
      />

      {/* private routes  */}
      <Route
        path="/home"
        element={
          <PrivateRoute>
            <Home />
          </PrivateRoute>
        }
      />

      <Route
        path="/createGroup"
        element={
          <PrivateRoute>
            <CreateGroup />
          </PrivateRoute>
        }
      />
      <Route
        path="/addMember"
        element={
          <PrivateRoute>
            <AddMembers />
          </PrivateRoute>
        }
      />
      <Route
        path="/family-groups"
        element={
          <PrivateRoute>
            <FamilyGroups />
          </PrivateRoute>
        }
      />
      <Route
        path="/group-members/:groupId"
        element={
          <PrivateRoute>
            <GroupMembers />
          </PrivateRoute>
        }
      />

      <Route
        path="/tasks"
        element={
          <PrivateRoute>
            <Tasks />
          </PrivateRoute>
        }
      />
      <Route
        path="/tasks/create"
        element={
          <PrivateRoute>
            <CreateTask />
          </PrivateRoute>
        }
      />

      <Route
        path="/user-profile"
        element={
          // <PrivateRoute>
            <UserProfile />
          // </PrivateRoute>
        }
      />

      <Route path="/notifications" element={<Notifications />} />
    </Routes>
  );
};

export default AppRoutes;
