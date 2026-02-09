import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyDzwmdzJJf3SdleoSyvT3tTYplP9emaG40",
    authDomain: "gen-lang-client-0388967875.firebaseapp.com",
    projectId: "gen-lang-client-0388967875",
    storageBucket: "gen-lang-client-0388967875.firebasestorage.app",
    messagingSenderId: "735292280224",
    appId: "1:735292280224:web:6a8ec919950269345368c5",
    measurementId: "G-RN7YDHZ2RQ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
