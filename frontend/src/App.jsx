import React, { useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import NavbarTwo from "./components/Navbar";
import SideBar from "./components/SideBar";
import AppRoutes from "./routes/AppRoutes"

import "./App.css"; // keep your css imports

// const hideLayoutRoutes = ["/signin", "/signup",];
const hideSidebarRoutes = ["/", "/signin", "/signup"]; // ⬅️ hide sidebar on Landing too
const hideNavbarRoutes = ["/signin", "/signup"];       // ⬅️ only auth pages hide navbar


function App() {
  const location = useLocation();
  const hideSidebar = hideSidebarRoutes.includes(location.pathname);
  const hideNavbar = hideNavbarRoutes.includes(location.pathname);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer position="top-right" />

      {!hideSidebar && (
        <div
          className={`fixed inset-0 bg-black/40 z-30 transition-opacity md:hidden ${sidebarOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
            }`}
          onClick={() => setSidebarOpen(false)}
        />
      )}


      <div className="flex">
        {/* Sidebar for md and up */}
        {!hideSidebar && (
          <aside className="hidden md:block md:sticky md:top-0 md:h-screen">
            <SideBar />
          </aside>
        )}

        <div className="flex-1 min-h-screen flex flex-col">
          {/* Mobile header with toggle */}
          {!hideSidebar && (
            <div className="md:hidden bg-white border-b">
              {/* … */}
            </div>
          )}

          {/* Navbar */}
          {!hideNavbar && <NavbarTwo />}

          <main className="flex-1 p-4 md:p-6">
            <div className="max-w-6xl mx-auto">
              <AppRoutes />
            </div>
          </main>
        </div>

        {/* Mobile sliding sidebar */}
        {!hideSidebar && (
          <div
            className={`fixed z-40 top-0 left-0 h-full w-64 transform bg-white border-r shadow-lg transition-transform md:hidden ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
              }`}
          >
            {/* … */}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
