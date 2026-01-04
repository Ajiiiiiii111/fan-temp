import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDr03ectVNiaMqB9T41RdbGDpBIxIu0aXw",
  authDomain: "fan-temperature-system.firebaseapp.com",
  databaseURL: "https://fan-temperature-system-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "fan-temperature-system",
  storageBucket: "fan-temperature-system.firebasestorage.app",
  messagingSenderId: "630104641810",
  appId: "1:630104641810:web:f78c8e58b04d56e4e723cb"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
