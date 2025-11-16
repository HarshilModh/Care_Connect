import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Popover } from "@headlessui/react";
import {
  Bars3Icon,
  XMarkIcon,
  SunIcon,
  MoonIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { toast } from "react-toastify";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully!");
      navigate("/signin");
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Something went wrong during logout.");
    }
  };

  return (
    <header className="w-full bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* left - logo */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md">
                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 20l9-5-9-5-9 5 9 5z" />
                  <path d="M12 12l9-5-9-5-9 5 9 5z" />
                </svg>
              </div>
              <span className="text-lg font-semibold text-slate-900 dark:text-white">
                CareConnect
              </span>
            </Link>
          </div>

          {/* center - nav links for large screens */}
          <nav className="hidden lg:flex lg:gap-8" aria-label="Primary">
            <Link
              to="/about"
              className="text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-300 transition"
            >
              About
            </Link>
            <Link
              to="/features"
              className="text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-300 transition"
            >
              Features
            </Link>
            <Link
              to="/contact"
              className="text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-300 transition"
            >
              Contact
            </Link>
          </nav>

          {/* right - actions */}
          <div className="flex items-center gap-3">
            {/* theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Toggle theme"
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <MoonIcon className="w-5 h-5 text-slate-700" />
              ) : (
                <SunIcon className="w-5 h-5 text-indigo-300" />
              )}
            </button>

            {/* notification bell */}
            <NotificationBell />

            {/* authenticated view desktop */}
            <div className="hidden lg:flex lg:items-center lg:gap-3">
              {user ? (
                <>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center font-semibold">
                      {user.displayName
                        ? user.displayName.charAt(0)
                        : user.email?.charAt(0)?.toUpperCase()}
                    </div>
                    <span className="text-sm text-slate-800 dark:text-slate-200">
                      {user.displayName || user.email}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/signin"
                    className="px-4 py-2 rounded-md text-sm font-semibold text-indigo-600 border border-indigo-600 hover:bg-indigo-50 transition"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/signup"
                    className="px-4 py-2 rounded-md text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>

            {/* mobile menu popover */}
            <Popover className="lg:hidden">
              {({ open }) => (
                <>
                  <Popover.Button
                    className="inline-flex items-center justify-center rounded-md p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    aria-label="Open menu"
                  >
                    {open ? (
                      <XMarkIcon className="h-6 w-6" />
                    ) : (
                      <Bars3Icon className="h-6 w-6" />
                    )}
                  </Popover.Button>

                  <Popover.Panel className="absolute inset-x-4 top-16 z-50 origin-top rounded-lg bg-white dark:bg-slate-900 p-4 shadow-lg ring-1 ring-slate-100 dark:ring-slate-800">
                    <div className="flex flex-col gap-3">
                      <Link
                        to="/about"
                        className="text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-indigo-600 transition"
                      >
                        About
                      </Link>
                      <Link
                        to="/features"
                        className="text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-indigo-600 transition"
                      >
                        Features
                      </Link>
                      <Link
                        to="/contact"
                        className="text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-indigo-600 transition"
                      >
                        Contact
                      </Link>

                      {user && (
                        <Link
                          to="/notifications"
                          className="text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-indigo-600 transition"
                        >
                          Notifications
                        </Link>
                      )}

                      <div className="border-t border-slate-100 dark:border-slate-800 pt-3 mt-2 flex flex-col gap-2">
                        {user ? (
                          <>
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center font-semibold">
                                {user.displayName
                                  ? user.displayName.charAt(0)
                                  : user.email?.charAt(0)?.toUpperCase()}
                              </div>
                              <div>
                                <div className="text-sm text-slate-800 dark:text-slate-200">
                                  {user.displayName || user.email}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={handleLogout}
                              className="w-full px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition"
                            >
                              Logout
                            </button>
                          </>
                        ) : (
                          <>
                            <Link
                              to="/signin"
                              className="w-full px-4 py-2 rounded-md text-sm font-semibold text-indigo-600 border border-indigo-600 hover:bg-indigo-50 text-center transition"
                            >
                              Sign in
                            </Link>
                            <Link
                              to="/signup"
                              className="w-full px-4 py-2 rounded-md text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 text-center transition"
                            >
                              Sign up
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  </Popover.Panel>
                </>
              )}
            </Popover>
          </div>
        </div>
      </div>
    </header>
  );
}
