import React from 'react';
import { Link } from 'react-router-dom';
import {
    Heart,
    Users,
    Calendar,
    Activity,
    ArrowRight,
    CheckCircle2,
    Pill,
    MessageCircle,
    Bell,
    Shield,
    ListTodo,
    Sparkles
} from 'lucide-react';

function Landing() {
    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">

            {/* --- Hero Section --- */}
            <header className="relative pt-24 pb-16 px-6 text-center max-w-7xl mx-auto overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-blue-100/50 to-purple-100/50 rounded-full blur-3xl -z-10 opacity-70"></div>

                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-blue-700 text-xs font-semibold shadow-sm mb-6 hover:shadow-md transition-shadow cursor-default">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-current" />
                        <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Reimagining Family Care</span>
                    </div>

                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
                        Care for your loved ones, <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                            in perfect sync.
                        </span>
                    </h1>

                    <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
                        The all-in-one platform to coordinate tasks, track medications, and monitor vitals. <br className="hidden md:block" /> Connect your entire family with professional caregivers.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
                        <Link
                            to="/signup"
                            className="bg-slate-900 hover:bg-black text-white text-base font-bold px-8 py-3.5 rounded-full shadow-xl shadow-blue-500/10 hover:shadow-blue-500/20 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                        >
                            Start Free Account <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link
                            to="/signin"
                            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-base font-bold px-8 py-3.5 rounded-full hover:border-slate-300 transition-all shadow-sm hover:shadow-md"
                        >
                            View Live Demo
                        </Link>
                    </div>
                </div>
            </header>

            {/* --- Features Section --- */}
            <section className="py-20 bg-white border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-900">Everything you need in one place</h2>
                        <p className="text-slate-500 mt-2">Designed to make caregiving less stressful.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Feature 1: Care Team */}
                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:shadow-lg transition-shadow">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-4">
                                <Users className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Care Circles</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                Create private groups for family & caregivers. Assign admin roles and manage members effortlessly.
                            </p>
                        </div>

                        {/* Feature 2: Medications */}
                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:shadow-lg transition-shadow">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-4">
                                <Pill className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Medication Tracker</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                Track prescriptions, logging doses, and monitoring supply levels to prevent stockouts.
                            </p>
                        </div>

                        {/* Feature 3: Vitals */}
                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:shadow-lg transition-shadow">
                            <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600 mb-4">
                                <Activity className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Vitals Monitoring</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                Log and visualize health trends like Blood Pressure, Heart Rate, and Glucose over time.
                            </p>
                        </div>

                        {/* Feature 4: Tasks */}
                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:shadow-lg transition-shadow">
                            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 mb-4">
                                <ListTodo className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Task Management</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                Assign to-do items like "Doctor Appointment" or "Grocery Run" to specific family members.
                            </p>
                        </div>

                        {/* Feature 5: Communication */}
                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:shadow-lg transition-shadow">
                            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 mb-4">
                                <MessageCircle className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Group Chat</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                Built-in secure messaging for each care circle. Keep conversations organized and private.
                            </p>
                        </div>

                        {/* Feature 6: Calendar */}
                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:shadow-lg transition-shadow">
                            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 mb-4">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Smart Calendar</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                View all tasks, appointments, and medication schedules in one unified monthly or weekly view.
                            </p>
                        </div>

                        {/* Feature 7: Panic Button */}
                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:shadow-lg transition-shadow">
                            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-600 mb-4">
                                <Bell className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Panic Alerts</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                One-touch emergency alerts that notify all group members via email and in-app notifications instantly.
                            </p>
                        </div>

                        {/* Feature 8: Security */}
                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:shadow-lg transition-shadow">
                            <div className="w-12 h-12 bg-slate-200 rounded-xl flex items-center justify-center text-slate-700 mb-4">
                                <Shield className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Secure & Private</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                Your data is protected with industry-standard security. We prioritize your family's privacy.
                            </p>
                        </div>

                    </div>
                </div>
            </section>

            {/* --- Bottom CTA --- */}
            <section className="py-20 px-6">
                <div className="max-w-4xl mx-auto bg-slate-900 rounded-3xl p-10 md:p-16 text-center text-white shadow-2xl">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to get started?</h2>
                    <p className="text-slate-400 mb-8 text-lg">Join thousands of families trusting CareConnect today.</p>

                    <ul className="flex flex-col sm:flex-row justify-center gap-6 mb-10 text-sm font-medium text-slate-300">
                        <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-green-500" /> Free for families
                        </li>
                        <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-green-500" /> Secure & Private
                        </li>
                        <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-green-500" /> Mobile Friendly
                        </li>
                    </ul>

                    <Link
                        to="/signup"
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-10 rounded-full inline-block transition-all transform hover:scale-105"
                    >
                        Sign Up Now
                    </Link>
                </div>
            </section>

            {/* --- Simple Footer --- */}
            <footer className="bg-white border-t border-slate-100 py-10 text-center">
                <div className="flex items-center justify-center gap-2 font-bold text-slate-900 mb-4">
                    <Heart className="w-5 h-5 text-blue-600 fill-current" />
                    CareConnect
                </div>
                <p className="text-slate-400 text-sm">
                    &copy; {new Date().getFullYear()} CareConnect Inc. All rights reserved.
                </p>
            </footer>
        </div>
    )
}

export default Landing;