import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

// Production/Live Firebase Configuration
// Replace these values with your actual project keys from the Firebase Console.
const firebaseConfig = {
  apiKey: "AIzaSyA4Nx5e1o-Hal_Yj4vdSavXxqOCeAigPEg",
  authDomain: "logisync-66bed.firebaseapp.com",
  projectId: "logisync-66bed",
  storageBucket: "logisync-66bed.firebasestorage.app",
  messagingSenderId: "388034836724",
  appId: "1:388034836724:web:6b9df8cae43b1e87cd06a1",
  measurementId: "G-MW4173N9NQ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Robust local emulator fallback check
const isLocalhost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1" ||
  window.location.hostname === "::1" ||
  window.location.hostname === "[::1]";

const isMockKey =
  firebaseConfig.apiKey.includes("ChangeMe") ||
  firebaseConfig.apiKey.includes("mock") ||
  firebaseConfig.apiKey.includes("Mock");

// Force production override if explicitly requested in localStorage
const forceProduction = localStorage.getItem("USE_PRODUCTION_FIREBASE") === "true";

if ((isMockKey || isLocalhost) && !forceProduction) {
  console.warn("Using Firebase Local Emulator Suite for development stability.");
  connectAuthEmulator(auth, "http://localhost:9099");
  connectFirestoreEmulator(db, "localhost", 8080);
  connectStorageEmulator(storage, "localhost", 9199);
} else {
  console.log("Connecting directly to production Cloud Firebase services.");
}

export { auth, db, storage };
