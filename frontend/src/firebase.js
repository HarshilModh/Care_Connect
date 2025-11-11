// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";


const firebaseConfig = {
    apiKey: "AIzaSyACy6gKBLOF7z7ylHyagOMKGZYTgnH-nvA",
    authDomain: "fbauthfall2025.firebaseapp.com",
    projectId: "fbauthfall2025",
    storageBucket: "fbauthfall2025.firebasestorage.app",
    messagingSenderId: "744962704559",
    appId: "1:744962704559:web:fe3dc2d068f1936d3e405a"
};


const app = initializeApp(firebaseConfig);


export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();