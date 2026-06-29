// ===== Firebase Configuration =====
// YOU MUST FILL IN YOUR OWN CONFIG FROM FIREBASE CONSOLE
// See FIREBASE_SETUP.md for step-by-step instructions

const firebaseConfig = {
    apiKey: "AIzaSyButKzM4PuwhzO6wV04AxQ-6gnw-9Ze098",
    authDomain: "budget-website-b0029.firebaseapp.com",
    projectId: "budget-website-b0029",
    storageBucket: "budget-website-b0029.firebasestorage.app",
    messagingSenderId: "942546982816",
    appId: "1:942546982816:web:052da74d202d2d58dbb6c5",
    measurementId: "G-8N44WE7BNE"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Auth and Firestore
const auth = firebase.auth();
const db = firebase.firestore();

console.log('Firebase initialized successfully!');