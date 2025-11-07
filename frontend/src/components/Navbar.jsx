'use client'
import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogPanel,
    Disclosure,
    DisclosureButton,
    DisclosurePanel,
    Popover,
    PopoverButton,
    PopoverGroup,
    PopoverPanel,
} from '@headlessui/react'
import {
    ArrowPathIcon,
    Bars3Icon,
    ChartPieIcon,
    CursorArrowRaysIcon,
    FingerPrintIcon,
    SquaresPlusIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom';
import { ChevronDownIcon, PhoneIcon, PlayCircleIcon } from '@heroicons/react/20/solid'


import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';


export default function Example() {
    // const [theme, setTheme] = React.useState(
    //     document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    // );
    const [theme, setTheme] = useState('light');

    useEffect(() => {
        // On component mount, check local storage for theme preference
        const savedTheme = localStorage.getItem('theme');
        console.log("savedTheme", savedTheme)
        if (savedTheme) {
            setTheme(savedTheme);
            if (savedTheme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    }, []);




    const toggleTheme = () => {
        const htmlElement = document.documentElement;
        if (htmlElement.classList.contains('dark')) {
            htmlElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            setTheme('light');
        } else {
            htmlElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            setTheme('dark');
        }
    }


    return (

        <header className="navbar_main_div navbar_container bg-white dark:bg-gray-900 transition-colors duration-300 flex justify-center items-center shadow-md">
            <nav
                aria-label="Global"
                className="mx-auto navbar_container flex mx-auto w-7xl items-center justify-between p-6 lg:px-8"
            >
                {/* Logo */}
                <div className="flex lg:flex-1">
                    <a href="#" className="m-1.5 p-1.5 flex items-center gap-x-2">

                        {/* <img
                            alt="CareConnect Logo"
                            src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=orange&shade=500"
                            className="h-8 w-auto"
                        /> */}
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
                        <span className="text-dark dark:text-white">CareConnect</span>
                    </a>
                </div>

                {/* Mobile Menu Button */}
                <div className="flex lg:hidden">
                    <button
                        type="button"
                        className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-600 dark:text-gray-300"
                    >
                        <span className="sr-only">Open main menu</span>
                        <Bars3Icon aria-hidden="true" className="size-6" />
                    </button>
                </div>

                {/* Nav Links */}
                <PopoverGroup className="hidden lg:flex lg:gap-x-12">


                    <a
                        href="#"
                        className="text-sm font-semibold text-gray-800 dark:text-gray-200"
                    >
                        Menu 1
                    </a>
                    <a
                        href="#"
                        className="text-sm font-semibold text-gray-800 dark:text-gray-200"
                    >
                        Menu 2
                    </a>
                    <a
                        href="#"
                        className="text-sm font-semibold text-gray-800 dark:text-gray-200"
                    >
                        Menu 3
                    </a>
                </PopoverGroup>

                {/* Login + Theme Toggle */}
                <div className="hidden lg:flex lg:flex-1 lg:justify-end items-center gap-4">

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

                    {/* <button className="animated-button text-orange-500 border border-orange-500 relative px-4 py-2 font-semibold overflow-hidden">
                        <svg viewBox="0 0 24 24" className="arr-2" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"
                            ></path>
                        </svg>
                        <span className="text">Login</span>
                        <span className="circle bg-orange-600"></span>
                        <svg viewBox="0 0 24 24" className="arr-1 fill-orange-500" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"
                            ></path>
                        </svg>
                    </button> */}


                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-md hover:scale-105 transition"
                        title="Toggle theme"
                    >
                        {theme === 'light' ? (
                            <MoonIcon className="w-6 h-6 text-gray-800" />
                        ) : (
                            <SunIcon className="w-6 h-6 text-orange-400" />
                        )}
                    </button>
                </div>
            </nav>
        </header>


    );
}
