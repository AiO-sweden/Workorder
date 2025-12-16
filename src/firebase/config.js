import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBA9MNEhk_saveKA_rEPX9IvmI2CJTE-Xg",
  authDomain: "aio-arbetsorder.firebaseapp.com",
  projectId: "aio-arbetsorder",
  storageBucket: "aio-arbetsorder.firebasestorage.app", // Changed to .app to match where CORS was applied
  messagingSenderId: "856679087951",
  appId: "1:856679087951:web:c3341bde65c1779f804f3a",
  measurementId: "G-8WJX7ZSSQF"
};

// const app = initializeApp(firebaseConfig); // Redan hanterad ovan

export const app = initializeApp(firebaseConfig); // Flyttad och exporterad
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
