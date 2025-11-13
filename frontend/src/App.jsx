import React, { useState } from "react"
import { Routes, Route, useLocation } from "react-router-dom"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

import NavbarTwo from "./components/Navbar"
import SideBar from "./components/SideBar"

import Home from "./pages/Home"
import Landing from "./pages/Landing"
import SignUp from "./pages/Signup"
import SignIn from "./pages/SignIn"
import VerifySuccess from "./pages/VerifySuccess"
import ForgotPassword from "./pages/ForgotPassword"
import ResetPassword from "./pages/ResetPassword"
import CreateGroup from "./components/familyGroups/CreateGroup"
import AddMembers from "./components/familyGroups/AddMembers"
import FamilyGroups from "./components/familyGroups/FamilyGroups"
import GroupMembers from "./components/familyGroups/GroupMembers"

import "./App.css" // keep your css imports

const hideLayoutRoutes = ["/signin", "/signup"]

function App() {
  const location = useLocation()
  const hideLayout = hideLayoutRoutes.includes(location.pathname)

  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer position="top-right" />

      {!hideLayout && (
        <div
          className={`fixed inset-0 bg-black/40 z-30 transition-opacity md:hidden ${
            sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex">
        {/* Sidebar for md and up */}
        {!hideLayout && (
          <aside className="hidden md:block md:sticky md:top-0 md:h-screen">
            <SideBar />
          </aside>
        )}

        <div className="flex-1 min-h-screen flex flex-col">
          {/* Mobile header with toggle */}
          {!hideLayout && (
            <div className="md:hidden bg-white border-b">
              <div className="flex items-center justify-between px-4 py-3">
                <button
                  onClick={() => setSidebarOpen((s) => !s)}
                  className="inline-flex items-center justify-center p-2 rounded hover:bg-gray-100"
                  aria-label="toggle menu"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>

                <div className="text-lg font-semibold">CareConnect</div>

                <div className="w-8" />
              </div>
            </div>
          )}

          {!hideLayout && <NavbarTwo />}

          <main className="flex-1 p-4 md:p-6">
            <div className="max-w-6xl mx-auto">
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/verify-success" element={<VerifySuccess />} />
                <Route path="/home" element={<Home />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/createGroup" element={<CreateGroup />} />
                <Route path="/addMember" element={<AddMembers />} />
                <Route path="/family-groups" element={<FamilyGroups />} />
                <Route path="/group-members/:groupId" element={<GroupMembers />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
              </Routes>
            </div>
          </main>
        </div>

        {/* Mobile sliding sidebar */}
        {!hideLayout && (
          <div
            className={`fixed z-40 top-0 left-0 h-full w-64 transform bg-white border-r shadow-lg transition-transform md:hidden ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="text-lg font-semibold">Menu</div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1 rounded hover:bg-gray-100"
                  aria-label="close menu"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <SideBar />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
