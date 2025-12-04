import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // 1. 新增：引入 Auth

// 你的 Firebase 配置
const firebaseConfig = {
  apiKey: "AIzaSyBFGLjRinG7hfcq33mcnnhddNXFcSHL4v0",
  authDomain: "tg-survey-app.firebaseapp.com",
  projectId: "tg-survey-app",
  storageBucket: "tg-survey-app.firebasestorage.app",
  messagingSenderId: "126112805306",
  appId: "1:126112805306:web:d80e61a4e89ce55b766d83"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 导出数据库实例
export const db = getFirestore(app);

// 2. 新增：导出 Auth 实例
export const auth = getAuth(app);