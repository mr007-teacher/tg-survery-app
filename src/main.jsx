import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

// --- 1. 直接配置 Firebase (合并到这里以防止文件丢失) ---
const firebaseConfig = {
  apiKey: "AIzaSyBFGLjRinG7hfcq33mcnnhddNXFcSHL4v0",
  authDomain: "tg-survey-app.firebaseapp.com",
  projectId: "tg-survey-app",
  storageBucket: "tg-survey-app.firebasestorage.app",
  messagingSenderId: "126112805306",
  appId: "1:126112805306:web:d80e61a4e89ce55b766d83"
};

// 初始化
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export default function App() {
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState('idle');

  const addLog = (msg) => {
    console.log(msg);
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    setStatus('running');
    setLogs([]); // 清空日志
    addLog("🚀 开始诊断 Firebase 连接...");

    try {
      // 1. 检查 Auth
      if (!auth) throw new Error("Firebase Auth 未初始化");
      addLog("✅ Firebase Auth 对象存在");

      // 2. 尝试匿名登录
      addLog("⏳ [Step 1] 正在尝试匿名登录...");
      const userCredential = await signInAnonymously(auth);
      const user = userCredential.user;
      addLog(`✅ 登录成功! User ID: ${user.uid.slice(0, 5)}...`);

      // 3. 尝试写入测试数据
      addLog("⏳ [Step 2] 正在尝试写入数据库...");
      const docRef = await addDoc(collection(db, "diagnostics"), {
        test: "connection_test",
        time: new Date(),
        uid: user.uid
      });
      addLog(`✅ 写入成功! 文档 ID: ${docRef.id}`);

      // 4. 尝试读取数据
      addLog("⏳ [Step 3] 正在尝试读取数据...");
      const snapshot = await getDocs(collection(db, "diagnostics"));
      addLog(`✅ 读取成功! 发现了 ${snapshot.size} 条记录`);

      addLog("🎉🎉🎉 恭喜！数据库连接完全正常！");
      setStatus('success');

    } catch (error) {
      addLog(`❌❌❌ 发生错误: ${error.message}`);
      
      // 智能错误分析
      if (error.code === 'auth/operation-not-allowed') {
        addLog("👇【解决方案】");
        addLog("您忘记在 Firebase 控制台开启 '匿名登录'。");
        addLog("路径: Authentication -> Sign-in method -> Anonymous -> Enable");
      } else if (error.code === 'permission-denied') {
        addLog("👇【解决方案】");
        addLog("数据库规则拒绝访问。");
        addLog("路径: Firestore Database -> Rules -> 改为 allow read, write: if true;");
      } else if (error.message.includes("API key")) {
        addLog("👇【解决方案】");
        addLog("API Key 无效，请检查配置是否被删除或限制。");
      }
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-green-400 p-8 font-mono text-sm sm:text-base">
      <h1 className="text-2xl text-white font-bold mb-6 border-b border-gray-700 pb-4">
        🕵️‍♂️ Firebase 连接诊断工具 (独立版)
      </h1>
      
      <div className="bg-black rounded-lg p-6 border border-gray-800 shadow-xl overflow-hidden min-h-[300px]">
        {logs.map((log, index) => (
          <div key={index} className={`mb-2 break-all ${log.includes('❌') ? 'text-red-500 font-bold' : ''} ${log.includes('👇') ? 'text-yellow-400' : ''}`}>
            {log}
          </div>
        ))}
        
        {status === 'running' && (
          <div className="mt-4 animate-pulse text-blue-400">...正在运行测试...</div>
        )}
      </div>
      
      <div className="mt-6 flex gap-4">
        <button 
          onClick={runDiagnostics}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          重新测试
        </button>
      </div>
    </div>
  );
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}