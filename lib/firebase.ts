import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC0nvx7rFixr0PMs5ELzXiEca09Hk-8B_U",
  authDomain: "socforge-quiz.firebaseapp.com",
  projectId: "socforge-quiz",
  storageBucket: "socforge-quiz.firebasestorage.app",
  messagingSenderId: "1010116318295",
  appId: "1:1010116318295:web:7f3e2dbc876fc958c77f12",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);