'use client';
import React from 'react';
import {
    Bars3Icon,
    XMarkIcon,
    SunIcon,
    MoonIcon,
} from '@heroicons/react/24/outline';
import { Link, useNavigate } from 'react-router-dom';
import { Popover, PopoverButton, PopoverGroup } from '@headlessui/react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'react-toastify';

export default function Navbar() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    console.log("user in Navbar:", user);
    const { theme, toggleTheme } = useTheme();

    const handleLogout = async () => {
        try {
            await logout();
            toast.success('Logged out successfully!');
            navigate('/signin');
        } catch (error) {
            console.error("Logout failed:", error);
            toast.error("Something went wrong during logout.");
        }
    };

    return (
        <header className="navbar_main_div navbar_container  bg-white dark:bg-gray-900 shadow-md transition-colors duration-300">
            <nav
                aria-label="Global"
                className="navbar_container mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8"
            >
                {/* Logo */}
                <div className="flex items-center gap-2">
                    <svg
                        className="h-10 w-10 text-orange-600 dark:text-orange-400"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M12 20l9-5-9-5-9 5 9 5z" />
                        <path d="M12 12l9-5-9-5-9 5 9 5z" />
                    </svg>
                    <Link
                        to="/"
                        className="text-lg font-semibold text-gray-900 dark:text-white"
                    >
                        CareConnect
                    </Link>
                </div>


                <div className="flex lg:hidden">
                    <button
                        type="button"
                        className="p-2.5 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        <Bars3Icon className="w-6 h-6" />
                    </button>
                </div>


                <PopoverGroup className="hidden lg:flex lg:gap-x-12">
                    <Link
                        to="/about"
                        className="text-sm font-semibold text-gray-800 dark:text-gray-200 hover:text-orange-500 dark:hover:text-orange-400"
                    >
                        About
                    </Link>
                    <Link
                        to="/features"
                        className="text-sm font-semibold text-gray-800 dark:text-gray-200 hover:text-orange-500 dark:hover:text-orange-400"
                    >
                        Features
                    </Link>
                    <Link
                        to="/contact"
                        className="text-sm font-semibold text-gray-800 dark:text-gray-200 hover:text-orange-500 dark:hover:text-orange-400"
                    >
                        Contact
                    </Link>
                </PopoverGroup>


                <div className="hidden lg:flex lg:flex-1 lg:justify-end items-center gap-4">
                    {/* If logged in */}
                    {user ? (
                        <>
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-semibold">
                                    {user.displayName
                                        ? user.displayName.charAt(0)
                                        : user.email?.charAt(0)?.toUpperCase()}
                                </div>
                                <span className="text-sm text-gray-800 dark:text-gray-200">
                                    {user.displayName || user.email}
                                </span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 bg-orange-600 text-white text-sm rounded-md hover:bg-orange-700 transition"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/signin" className="animated-button text-orange-500 border border-orange-500 relative  font-semibold overflow-hidden">
                                <svg viewBox="0 0 24 24" className="arr-2" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"
                                    ></path>
                                </svg>
                                <span className="text">Sign In</span>
                                <span className="circle bg-orange-600"></span>
                                <svg viewBox="0 0 24 24" className="arr-1 fill-orange-500" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"
                                    ></path>
                                </svg>
                            </Link>
                            <Link to="/signup" className="animated-button text-orange-500 border border-orange-500 relative  font-semibold overflow-hidden">
                                <svg viewBox="0 0 24 24" className="arr-2" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"
                                    ></path>
                                </svg>
                                <span className="text">Sign Up</span>
                                <span className="circle bg-orange-600"></span>
                                <svg viewBox="0 0 24 24" className="arr-1 fill-orange-500" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"
                                    ></path>
                                </svg>
                            </Link>
                        </>
                    )}


                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-md hover:scale-105 transition"
                        title="Toggle theme"
                    >
                        {theme === 'light' ? (
                            <MoonIcon className="w-6 h-6 text-gray-800" />
                        ) : (
                            <SunIcon className="w-6 h-6 text-yellow-400" />
                        )}
                    </button>
                </div>
            </nav>
        </header>
    );
}