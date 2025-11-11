import { FirebaseOptions, initializeApp } from 'firebase/app';

// Configuration values are taken from the root .env file
const firebaseConfig: FirebaseOptions = {
    apiKey: "AIzaSyCLILz9pxGprYQrBQprb573He40lQfpRuI",
    authDomain: "coin-discoverer.firebaseapp.com",
    projectId: "coin-discoverer",
    storageBucket: "coin-discoverer.firebasestorage.app",
    messagingSenderId: "430038767083",
    appId: "1:430038767083:web:e293c5b7224d58d4f435ae",
    measurementId: "G-E609FZLLQZ"
};

export const app = initializeApp(firebaseConfig);