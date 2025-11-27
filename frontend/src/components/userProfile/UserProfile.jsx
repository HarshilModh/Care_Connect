import React, { useEffect, useState } from 'react'
import { auth } from '../../firebase'
import { useAuth } from '../../context/AuthContext';
import { User, Mail, CheckCircle, XCircle, Calendar, Shield, Key, Edit, LogOut, Trash2, Lock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth'
import api from '../../api/axios';
import { toast } from 'react-toastify';

const UserProfile = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    //isGoogleUser
    const [isGoogleUser, setIsGoogleUser] = useState(false);
    //firstName
    const [firstName, setFirstName] = useState("");
    //lastName
    const [lastName, setLastName] = useState("");
    //email
    const [email, setEmail] = useState("");
    //isVerified
    const [isVerified, setIsVerified] = useState(false);
    //needPasswordReset
    const [needPasswordReset, setNeedPasswordReset] = useState(false);
    //createdAt
    const [createdAt, setCreatedAt] = useState("");
    const { user } = useAuth();

    console.log(user);
    const authUser = getAuth();
    console.log(authUser.currentUser);

    const deleteUser = async () => {
        try {
            console.log(user._id);

            await api.delete(`users/delete/${user._id}`);
            // authUser.currentUser.delete();

            toast.success("User deleted successfully");
            //logout 
            await logout();
            navigate("/");
        } catch (error) {
            console.log("Error deleting user: ", error);
            toast.error("Failed to delete user");
        }
    }
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

    useEffect(() => {

        if (user) {
            setIsGoogleUser(user.googleId || false);
            setFirstName(user.firstName || "");
            setLastName(user.lastName || "");
            setEmail(user.email || "");
            setIsVerified(user.isVerified || false);
            setNeedPasswordReset(user.needPasswordReset || false);
            setCreatedAt(user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "");
        }
    }, [user]);

    // console.log("current user: ",user);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-white/10 backdrop-blur-[1px]" />
                    <div className="relative mx-auto bg-white/20 p-1 rounded-full w-24 h-24 flex items-center justify-center backdrop-blur-md mb-4 ring-4 ring-white/30 shadow-lg">
                        <div className="w-full h-full bg-white/10 rounded-full flex items-center justify-center">
                            <User className="w-12 h-12 text-white" />
                        </div>
                    </div>
                    <h2 className="relative text-3xl font-bold text-white tracking-tight">
                        {firstName} {lastName}
                    </h2>
                    <p className="relative text-indigo-100 text-sm mt-2 font-medium bg-white/10 inline-block px-3 py-1 rounded-full backdrop-blur-sm">
                        {email}
                    </p>
                </div>

                <div className="p-8 space-y-8">
                    <div className="space-y-4">
                        {/* Signed up with Google */}
                        <div className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] hover:bg-gray-50">
                            <div className="flex items-center space-x-4">
                                <div className="p-2.5 bg-blue-50 rounded-xl">
                                    <Shield className="w-5 h-5 text-blue-600" />
                                </div>
                                <span className="text-gray-700 font-semibold">Google Account</span>
                            </div>
                            <span className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide ${isGoogleUser ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                {isGoogleUser ? "Yes" : "No"}
                            </span>
                        </div>

                        {/* Email Verified */}
                        <div className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] hover:bg-gray-50">
                            <div className="flex items-center space-x-4">
                                <div className="p-2.5 bg-green-50 rounded-xl">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                </div>
                                <span className="text-gray-700 font-semibold">Email Verified</span>
                            </div>
                            {isVerified ? (
                                <div className="bg-green-100 p-1 rounded-full">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                </div>
                            ) : (
                                <div className="bg-red-100 p-1 rounded-full">
                                    <XCircle className="w-5 h-5 text-red-600" />
                                </div>
                            )}
                        </div>

                        {/* Password Reset only visible if not Google user */}

                        <div className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] hover:bg-gray-50">
                            <div className="flex items-center space-x-4">
                                <div className="p-2.5 bg-orange-50 rounded-xl">
                                    <Key className="w-5 h-5 text-orange-600" />
                                </div>
                                <span className="text-gray-700 font-semibold">Password Reset</span>
                            </div>
                            <span className={`text-sm font-medium ${needPasswordReset ? 'text-orange-600 bg-orange-50 px-3 py-1 rounded-full' : 'text-gray-400'}`}>
                                {needPasswordReset ? "Required" : "Not Required"}
                            </span>
                        </div>

                        {/* Created At */}
                        <div className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] hover:bg-gray-50">
                            <div className="flex items-center space-x-4">
                                <div className="p-2.5 bg-purple-50 rounded-xl">
                                    <Calendar className="w-5 h-5 text-purple-600" />
                                </div>
                                <span className="text-gray-700 font-semibold">Member Since</span>
                            </div>
                            <span className="text-gray-600 text-sm font-mono bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                                {createdAt || "N/A"}
                            </span>
                        </div>
                    </div>


                    <div className="pt-6 space-y-4 border-t border-gray-100">
                        {!isGoogleUser && (
                            <div>
                                <Link
                                    to="/edit-profile"
                                >
                                    <div className="flex items-center justify-center w-full px-4 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 transition-all hover:scale-[1.02] active:scale-[0.98]">
                                        <Edit className="w-5 h-5 mr-2" />
                                        Edit Profile
                                    </div>
                                </Link>

                                <Link
                                    to="/forgot-password"
                                >
                                    <div className="flex items-center justify-center w-full px-4 py-3.5 bg-white border-2 border-gray-100 text-gray-700 rounded-xl font-bold hover:border-indigo-100 hover:bg-indigo-50/50 transition-all mt-3 hover:scale-[1.02] active:scale-[0.98]">
                                        <Lock className="w-5 h-5 mr-2 text-gray-400" />
                                        Reset Password
                                    </div>
                                </Link>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4 mt-3">
                            <button className="flex items-center justify-center px-4 py-3.5 bg-white border-2 border-gray-100 text-gray-700 rounded-xl font-bold hover:border-gray-200 hover:bg-gray-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                onClick={handleLogout}
                            >
                                <LogOut className="w-5 h-5 mr-2 text-gray-400" />
                                Logout
                            </button>
                            <button className="flex items-center justify-center px-4 py-3.5 bg-red-50 border-2 border-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100/80 hover:border-red-100 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                onClick={deleteUser}
                            >
                                <Trash2 className="w-5 h-5 mr-2" />
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default UserProfile