import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyabjvXVscDJyrIssQkcF5cHepcFgMMu0vs",
  authDomain: "lccs-lms-92639.firebaseapp.com",
  projectId: "lccs-lms-92639",
  storageBucket: "lccs-lms-92639.firebasestorage.app",
  messagingSenderId: "625289794577",
  appId: "1:625289794577:web:b8cc059984ef0401978db0",
  measurementId: "G-RVN95GP9E8"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Analytics (safe for SSR / Vercel / Next.js)
export const analytics = typeof window !== "undefined"
  ? await isSupported().then((yes) => yes ? getAnalytics(app) : null)
  : null;