import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
// 直接引入 Firebase 功能
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, orderBy, query, serverTimestamp } from "firebase/firestore";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { ArrowLeft, FileText, CheckCircle, Plus, Loader2 } from 'lucide-react';

// --- 1. 核心配置 (直接内置，确保稳如泰山) ---
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
const db = getFirestore(app);
const auth = getAuth(app);

const DEFAULT_CLASSES = "12A\n12B\n12C\n12D\n12E";

export default function App() {
  const [view, setView] = useState('home'); 
  const [user, setUser] = useState(null);

  // 2. 自动登录逻辑
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    // 悄悄地在后台登录，用户无感知
    signInAnonymously(auth).catch((err) => console.error("登录失败:", err));
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4 sm:px-6 lg:px-8">
      {!user ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
          <p>正在连接云端数据...</p>
        </div>
      ) : view === 'create' ? (
        <CreateCollectionForm onBack={() => setView('home')} user={user} />
      ) : (
        <HomeView onCreate={() => setView('create')} user={user} />
      )}
    </div>
  );
}

// --- 首页视图 ---
function HomeView({ onCreate, user }) {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function fetchCollections() {
      try {
        const q = query(collection(db, "collections"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        setCollections(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("加载失败:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchCollections();
  }, [user]);

  return (
    <div className="w-full max-w-3xl space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">所有收集</h1>
        <button onClick={onCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium text-lg flex items-center shadow-sm">
          <Plus className="w-6 h-6 mr-2" /> 新建收集
        </button>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-blue-500" /></div>
      ) : collections.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 text-center text-gray-500 text-xl">
          <p>暂无任务</p><p className="mt-2 text-base text-gray-400">点击右上角新建</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {collections.map(item => (
            <div key={item.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">{item.title}</h3>
              <p className="text-gray-500 mt-2">包含: {item.fields}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- 创建视图 ---
function CreateCollectionForm({ onBack, user }) {
  const [title, setTitle] = useState('');
  const [fields, setFields] = useState('人数, 缺席');
  const [classList, setClassList] = useState(DEFAULT_CLASSES);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) return alert("请填写标题");
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "collections"), {
        title,
        fields,
        classes: classList.split('\n').filter(c => c.trim()),
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        status: 'active'
      });
      alert("创建成功！");
      onBack();
    } catch (error) {
      alert("错误: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-3xl">
      <div className="flex items-center mb-8">
        <button onClick={onBack} className="p-2 -ml-2 mr-4 rounded-full hover:bg-gray-200 text-gray-600">
          <ArrowLeft className="w-8 h-8" />
        </button>
        <h1 className="text-3xl font-bold text-gray-900">新建收集</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 md:p-10 space-y-8">
        <div className="space-y-3">
          <label className="block text-xl font-medium text-gray-800">标题</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="例如：1月5日午餐统计" className="w-full p-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <div className="space-y-3">
          <label className="block text-xl font-medium text-gray-800">需要填的数据</label>
          <input type="text" value={fields} onChange={e => setFields(e.target.value)} className="w-full p-4 text-lg border border-gray-300 rounded-xl bg-gray-50 outline-none" />
        </div>
        <div className="space-y-3">
          <label className="block text-xl font-medium text-gray-800">班级名单</label>
          <textarea value={classList} onChange={e => setClassList(e.target.value)} rows={8} className="w-full p-4 text-lg border border-gray-300 rounded-xl font-mono outline-none" />
        </div>
        <div className="pt-4">
          <button onClick={handleCreate} disabled={isSubmitting} className={`w-full text-white text-xl font-semibold py-5 rounded-xl flex justify-center items-center ${isSubmitting ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
            {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <><CheckCircle className="w-6 h-6 mr-2" /> 创建</>}
          </button>
        </div>
      </div>
    </div>
  );
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}