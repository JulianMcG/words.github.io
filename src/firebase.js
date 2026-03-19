import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, updatePassword } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, onSnapshot, collection, query, where, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAB-oPKIuSNcHVEufy0JlUkPlfxVb2UAgM",
  authDomain: "words-1cf98.firebaseapp.com",
  projectId: "words-1cf98",
  storageBucket: "words-1cf98.firebasestorage.app",
  messagingSenderId: "357476098780",
  appId: "1:357476098780:web:62803a654150122b8f4a19",
  measurementId: "G-K1BRXSNT5Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
googleProvider.addScope('https://www.googleapis.com/auth/calendar.readonly');

export {
  auth,
  db,
  googleProvider,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  collection,
  query,
  where,
  getDocs
};
