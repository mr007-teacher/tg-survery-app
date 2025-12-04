import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { 
  getFirestore, collection, addDoc, doc, onSnapshot, query, 
  serverTimestamp, setDoc, orderBy 
} from 'firebase/firestore';
import { 
  Plus, Share2, CheckCircle2, ChevronRight, 
  ArrowLeft, Home, Copy, Check
} from 'lucide-react';

// --- 1. Firebase 配置 (整合在同一文件中) ---
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

// --- 2. 主程序组件 ---
const App = () => {
  const [view, setView] = useState('loading'); // loading, list, create, dashboard, fill
  const [currentSurvey, setCurrentSurvey] = useState(null);
  const [surveys, setSurveys] = useState([]);
  const [notification, setNotification] = useState(null);

  // --- 初始化 & 路由检测 ---
  useEffect(() => {
    // 检查 URL 是否带有 ?id=xxx
    const params = new URLSearchParams(window.location.search);
    const surveyId = params.get('id');

    if (surveyId) {
      // 如果有 ID，直接监听该问卷，进入仪表盘模式
      const unsub = onSnapshot(doc(db, "surveys", surveyId), (docSnap) => {
        if (docSnap.exists()) {
          setCurrentSurvey({ id: docSnap.id, ...docSnap.data() });
          setView('dashboard');
        } else {
          showNotify("找不到该任务，可能已被删除");
          setView('list');
        }
      });
      return () => unsub();
    } else {
      // 如果没有 ID，加载列表
      const q = query(collection(db, "surveys"), orderBy("createdAt", "desc"));
      const unsub = onSnapshot(q, (snapshot) => {
        setSurveys(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        setView('list');
      });
      return () => unsub();
    }
  }, []);

  // --- 工具函数 ---
  const showNotify = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // --- 视图渲染 ---
  if (view === 'loading') return <div className="min-h-screen flex items-center justify-center text-gray-400">加载中...</div>;
  if (view === 'create') return <CreateSurvey setView={setView} showNotify={showNotify} db={db} />;
  if (view === 'dashboard' && currentSurvey) return <Dashboard survey={currentSurvey} setView={setView} showNotify={showNotify} db={db} />;
  if (view === 'fill' && currentSurvey) return <FillForm survey={currentSurvey} setView={setView} showNotify={showNotify} db={db} />;
  
  // 默认：列表页
  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans max-w-md mx-auto">
      {notification && <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm">{notification}</div>}
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">我的收集任务</h1>
        <button onClick={() => setView('create')} className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 active:scale-95 transition-all">
          <Plus size={24} />
        </button>
      </div>

      {surveys.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p>暂无任务，点击右上角 + 创建</p>
        </div>
      ) : (
        <div className="space-y-3">
          {surveys.map(s => (
            <div 
              key={s.id} 
              onClick={() => { setCurrentSurvey(s); setView('dashboard'); }} 
              className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center cursor-pointer hover:border-blue-300 transition-colors"
            >
              <div>
                <h3 className="font-bold text-gray-800">{s.title}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {s.createdAt ? new Date(s.createdAt.seconds * 1000).toLocaleDateString() : '刚刚'}
                </p>
              </div>
              <ChevronRight className="text-gray-300" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- 子组件 1: 创建任务 ---
const CreateSurvey = ({ setView, showNotify, db }) => {
  const [title, setTitle] = useState('');
  const [columns, setColumns] = useState('人数, 缺席');
  const [targets, setTargets] = useState('12A\n12B\n12C\n12D\n12E');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!title) return showNotify("请输入标题");
    setLoading(true);
    
    const targetList = targets.split('\n').filter(t => t.trim());
    const colList = columns.split(/[,，]/).map(c => c.trim()).filter(c => c);
    
    try {
      await addDoc(collection(db, "surveys"), {
        title,
        columns: colList,
        targets: targetList,
        createdAt: serverTimestamp()
      });
      showNotify("创建成功！");
      setView('list');
    } catch (e) {
      console.error(e);
      showNotify("创建失败，请检查网络");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 max-w-md mx-auto">
      <div className="flex items-center mb-6">
        <button onClick={() => setView('list')} className="mr-3 p-2 bg-white rounded-full shadow-sm text-gray-600"><ArrowLeft size={20}/></button>
        <h2 className="text-xl font-bold">新建收集</h2>
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-sm space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
          <input className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-500" placeholder="例如: 1月5日午餐统计" value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">需要填的数据 (用逗号分隔)</label>
          <input className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-500" placeholder="人数, 缺席, 备注" value={columns} onChange={e => setColumns(e.target.value)} />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">班级名单 (一行一个)</label>
          <textarea className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg h-40 outline-none focus:border-blue-500 font-mono text-sm" placeholder="12A&#10;12B&#10;12C" value={targets} onChange={e => setTargets(e.target.value)} />
        </div>

        <button onClick={handleCreate} disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 active:scale-95 transition-all">
          {loading ? '创建中...' : '创建'}
        </button>
      </div>
    </div>
  );
};

// --- 子组件 2: 仪表盘 ---
const Dashboard = ({ survey, setView, showNotify, db }) => {
  const [responses, setResponses] = useState({});

  useEffect(() => {
    const unsub = onSnapshot(collection(db, `surveys/${survey.id}/responses`), (snap) => {
      const data = {};
      snap.docs.forEach(doc => data[doc.id] = doc.data());
      setResponses(data);
    });
    return () => unsub();
  }, [survey.id]);

  const copyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?id=${survey.id}`;
    
    // 尝试使用现代 API
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(() => {
            showNotify("链接已复制！请发给老师");
        }).catch(() => fallbackCopy(url));
    } else {
        fallbackCopy(url);
    }
  };
  
  const fallbackCopy = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed"; 
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        document.execCommand('copy');
        showNotify("链接已复制！");
    } catch (err) {
        showNotify("复制失败，请手动复制地址栏");
    }
    document.body.removeChild(textArea);
  };

  const copyResult = () => {
    let text = `📊 *${survey.title}*\n\n`;
    let submittedCount = 0;
    
    survey.targets.forEach(t => {
      const res = responses[t];
      if (res) {
        text += `${t}: ${Object.values(res).join(' / ')}\n`;
        submittedCount++;
      } else {
        text += `${t}: (未填)\n`;
      }
    });
    
    text += `\n进度: ${submittedCount}/${survey.targets.length}`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => showNotify("统计结果已复制！")).catch(() => fallbackCopy(text));
    } else {
        fallbackCopy(text);
    }
  };

  const filledCount = Object.keys(responses).length;
  const progress = Math.round((filledCount / survey.targets.length) * 100);

  return (
    <div className="min-h-screen bg-gray-100 font-sans max-w-md mx-auto relative">
      {/* 顶部导航 */}
      <div className="bg-white p-4 shadow-sm sticky top-0 z-10">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <button onClick={() => setView('list')} className="p-1 rounded-full hover:bg-gray-100"><Home size={20} className="text-gray-500"/></button>
            <h1 className="text-lg font-bold leading-tight">{survey.title}</h1>
          </div>
          <button onClick={copyLink} className="text-blue-600 bg-blue-50 p-2 rounded-full"><Share2 size={20}/></button>
        </div>
        
        {/* 进度条 */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
          <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{width: `${progress}%`}}></div>
        </div>
        <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
          <span>完成度: {filledCount}/{survey.targets.length}</span>
          <button onClick={copyResult} className="flex items-center gap-1 text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded">
            <Copy size={12}/> 复制结果
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg mb-4 text-sm text-blue-800 flex items-center gap-2">
          <div className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">!</div>
          请点击下方班级进行填写
        </div>

        <div className="grid grid-cols-2 gap-3">
          {survey.targets.map(target => {
            const isDone = !!responses[target];
            const resData = responses[target] || {};
            
            return (
              <div 
                key={target} 
                onClick={() => {
                  localStorage.setItem('selectedTarget', target);
                  setView('fill');
                }}
                className={`
                  p-4 rounded-xl border-l-4 shadow-sm cursor-pointer relative overflow-hidden active:scale-[0.98] transition-all
                  ${isDone ? 'bg-white border-green-500' : 'bg-white border-gray-300'}
                `}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-lg text-gray-800">{target}</span>
                  {isDone && <CheckCircle2 size={18} className="text-green-500"/>}
                </div>
                
                {isDone ? (
                   <div className="text-xs text-gray-500 truncate">
                     {/* 只显示前两个数据预览 */}
                     {survey.columns.slice(0,2).map(col => resData[col]).join('/')}
                   </div>
                ) : (
                  <div className="text-xs text-gray-400">未填写</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// --- 子组件 3: 填写表单 ---
const FillForm = ({ survey, setView, showNotify, db }) => {
  const target = localStorage.getItem('selectedTarget');
  const [form, setForm] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // 写入数据，ID是班级名，确保不重复
      await setDoc(doc(db, `surveys/${survey.id}/responses`, target), form);
      showNotify("提交成功！");
      setView('dashboard');
    } catch (e) {
      console.error(e);
      showNotify("提交失败，请重试");
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-white p-6 flex flex-col max-w-md mx-auto">
      <div className="flex-1">
        <button onClick={() => setView('dashboard')} className="mb-6 text-gray-500 flex items-center gap-1">
          <ArrowLeft size={18}/> 返回
        </button>
        
        <div className="mb-8">
          <div className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mb-2">正在填写</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">{target}</h1>
          <p className="text-gray-500">{survey.title}</p>
        </div>

        <div className="space-y-6">
          {survey.columns.map(col => (
            <div key={col}>
              <label className="block font-bold text-gray-700 mb-2">{col}</label>
              <input 
                type="text" 
                inputMode={col.includes("备注") ? "text" : "numeric"} 
                className="w-full text-lg p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" 
                placeholder="点击输入..."
                value={form[col] || ''}
                onChange={e => setForm({...form, [col]: e.target.value})}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <button 
          onClick={handleSubmit} 
          disabled={submitting}
          className={`w-full text-white py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex justify-center items-center gap-2
            ${submitting ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'}
          `}
        >
          {submitting ? '提交中...' : <><Check size={20}/> 确认提交</>}
        </button>
      </div>
    </div>
  );
};

export default App;