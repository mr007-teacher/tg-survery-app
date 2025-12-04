import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client'; 
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, orderBy, query, serverTimestamp, doc, setDoc, onSnapshot } from "firebase/firestore";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { ArrowLeft, Plus, Loader2, ChevronRight, X } from 'lucide-react';

// --- 1. 核心配置 ---
const firebaseConfig = {
  apiKey: "AIzaSyBFGLjRinG7hfcq33mcnnhddNXFcSHL4v0",
  authDomain: "tg-survey-app.firebaseapp.com",
  projectId: "tg-survey-app",
  storageBucket: "tg-survey-app.firebasestorage.app",
  messagingSenderId: "126112805306",
  appId: "1:126112805306:web:d80e61a4e89ce55b766d83"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const DEFAULT_CLASSES = "12A\n12B\n12C\n12D\n12E";

export default function App() {
  const [view, setView] = useState('home'); 
  const [user, setUser] = useState(null);
  const [selectedCollection, setSelectedCollection] = useState(null); // 新增：当前选中的任务

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    signInAnonymously(auth).catch((err) => console.error("登录失败:", err));
    return () => unsubscribe();
  }, []);

  // 路由逻辑
  const renderView = () => {
    if (!user) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
          <p>正在连接云端数据...</p>
        </div>
      );
    }

    switch (view) {
      case 'create':
        return <CreateCollectionForm onBack={() => setView('home')} user={user} />;
      case 'fill': // 新增：填表视图
        return (
          <FillCollectionView 
            collection={selectedCollection} 
            onBack={() => {
              setSelectedCollection(null);
              setView('home');
            }} 
            user={user} 
          />
        );
      case 'home':
      default:
        return (
          <HomeView 
            onCreate={() => setView('create')} 
            onSelect={(col) => {
              setSelectedCollection(col);
              setView('fill');
            }}
            user={user} 
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4 sm:px-6 lg:px-8">
      {renderView()}
    </div>
  );
}

// --- 首页视图 ---
function HomeView({ onCreate, onSelect, user }) {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    // 实时监听数据库变化
    const q = query(collection(db, "collections"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCollections(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.error("加载失败:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  return (
    <div className="w-full max-w-3xl space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">所有收集</h1>
        <button onClick={onCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium text-lg flex items-center shadow-sm transition-colors">
          <Plus className="w-6 h-6 mr-2" /> 新建
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
            <div 
              key={item.id} 
              onClick={() => onSelect(item)} // 点击触发
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{item.title}</h3>
                  <p className="text-gray-500 mt-2">需填: {item.fields}</p>
                </div>
                <ChevronRight className="w-6 h-6 text-gray-300 group-hover:text-blue-500" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- 新增：填表视图 ---
function FillCollectionView({ collection: targetCol, onBack, user }) {
  const [submissions, setSubmissions] = useState({});
  const [selectedClass, setSelectedClass] = useState(null); // 当前选中的班级进行填报

  // 1. 监听这个任务下的所有提交记录
  useEffect(() => {
    const subColRef = collection(db, "collections", targetCol.id, "submissions");
    const unsubscribe = onSnapshot(subColRef, (snapshot) => {
      const subData = {};
      snapshot.forEach(doc => {
        subData[doc.id] = doc.data();
      });
      setSubmissions(subData);
    });
    return () => unsubscribe();
  }, [targetCol.id]);

  // 打开填报弹窗
  const openFillModal = (className) => {
    setSelectedClass(className);
  };

  return (
    <div className="w-full max-w-3xl relative">
      <div className="flex items-center mb-8">
        <button onClick={onBack} className="p-2 -ml-2 mr-4 rounded-full hover:bg-gray-200 text-gray-600 transition-colors">
          <ArrowLeft className="w-8 h-8" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{targetCol.title}</h1>
          <p className="text-gray-500 mt-1">请选择班级进行填报</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {targetCol.classes.map((cls) => {
          const isDone = !!submissions[cls];
          return (
            <button
              key={cls}
              onClick={() => openFillModal(cls)}
              className={`p-4 rounded-xl border text-left transition-all ${
                isDone 
                  ? 'bg-green-50 border-green-200 hover:bg-green-100' 
                  : 'bg-white border-gray-200 hover:border-blue-400 hover:shadow-md'
              }`}
            >
              <div className="text-xl font-bold text-gray-800">{cls}</div>
              <div className={`text-sm mt-2 ${isDone ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                {isDone ? '已完成 ✅' : '点击填报'}
              </div>
            </button>
          );
        })}
      </div>

      {/* 填报弹窗 */}
      {selectedClass && (
        <SubmitModal 
          classNameStr={selectedClass} 
          fieldsStr={targetCol.fields} 
          collectionId={targetCol.id}
          existingData={submissions[selectedClass]}
          onClose={() => setSelectedClass(null)}
          user={user}
        />
      )}
    </div>
  );
}

// --- 新增：提交弹窗组件 ---
function SubmitModal({ classNameStr, fieldsStr, collectionId, existingData, onClose, user }) {
  const fields = fieldsStr.split(/[,，]/).map(s => s.trim()).filter(Boolean); // 解析字段
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 如果有旧数据，自动填充
  useEffect(() => {
    if (existingData && existingData.data) {
      setFormData(existingData.data);
    }
  }, [existingData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // 写入子集合：collections/{id}/submissions/{ClassName}
      const docRef = doc(db, "collections", collectionId, "submissions", classNameStr);
      await setDoc(docRef, {
        data: formData,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid
      });
      onClose();
    } catch (error) {
      alert("提交失败: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="text-2xl font-bold text-gray-900">{classNameStr} 填报</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {fields.map(field => (
            <div key={field}>
              <label className="block text-lg font-medium text-gray-700 mb-2">{field}</label>
              <input 
                type="text" 
                required
                value={formData[field] || ''}
                onChange={e => setFormData({...formData, [field]: e.target.value})}
                className="w-full p-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder={`请输入${field}`}
              />
            </div>
          ))}

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold py-4 rounded-xl transition-all flex justify-center items-center"
          >
            {isSubmitting ? <Loader2 className="animate-spin w-6 h-6" /> : '提交'}
          </button>
        </form>
      </div>
    </div>
  );
}

// --- 创建视图 (保持不变) ---
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
            {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Plus className="w-6 h-6 mr-2" /> 创建</>}
          </button>
        </div>
      </div>
    </div>
  );
}

const container = document.getElementById('root');
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(<App />);
}