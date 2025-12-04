import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowLeft, Users, FileText, CheckCircle, Plus } from 'lucide-react';

// 模拟的班级数据
const DEFAULT_CLASSES = "12A\n12B\n12C\n12D\n12E";

// 这里的 export default 是关键，许多环境需要它来正确识别主组件
export default function App() {
  // 简单的页面路由状态: 'home' | 'create'
  const [view, setView] = useState('create');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4 sm:px-6 lg:px-8">
      {view === 'create' ? (
        <CreateCollectionForm onBack={() => setView('home')} />
      ) : (
        <HomeView onCreate={() => setView('create')} />
      )}
    </div>
  );
}

// 首页视图
function HomeView({ onCreate }) {
  return (
    <div className="w-full max-w-3xl space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">所有收集</h1>
        <button
          onClick={onCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium text-lg flex items-center transition-colors shadow-sm"
        >
          <Plus className="w-6 h-6 mr-2" />
          新建收集
        </button>
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 text-center text-gray-500 text-xl">
        <p>暂无正在进行的收集任务</p>
        <p className="mt-2 text-base text-gray-400">点击右上角创建一个新的</p>
      </div>
    </div>
  );
}

// 创建收集页
function CreateCollectionForm({ onBack }) {
  const [title, setTitle] = useState('');
  const [fields, setFields] = useState('人数, 缺席');
  const [classList, setClassList] = useState(DEFAULT_CLASSES);

  return (
    <div className="w-full max-w-3xl">
      {/* 头部导航 */}
      <div className="flex items-center mb-8">
        <button 
          onClick={onBack}
          className="p-2 -ml-2 mr-4 rounded-full hover:bg-gray-200 text-gray-600 transition-colors"
        >
          <ArrowLeft className="w-8 h-8" />
        </button>
        <h1 className="text-3xl font-bold text-gray-900">新建收集</h1>
      </div>

      {/* 表单卡片 */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-8 md:p-10 space-y-8">
          
          {/* 标题输入 */}
          <div className="space-y-3">
            <label className="block text-xl font-medium text-gray-800">
              标题
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：1月5日午餐统计"
              className="w-full p-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-400"
            />
          </div>

          {/* 需要填的数据 */}
          <div className="space-y-3">
            <label className="block text-xl font-medium text-gray-800">
              需要填的数据 <span className="text-base text-gray-500 font-normal">（用逗号分隔）</span>
            </label>
            <input
              type="text"
              value={fields}
              onChange={(e) => setFields(e.target.value)}
              className="w-full p-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-gray-50"
            />
          </div>

          {/* 班级名单 */}
          <div className="space-y-3">
            <label className="block text-xl font-medium text-gray-800">
              班级名单 <span className="text-base text-gray-500 font-normal">（一行一个）</span>
            </label>
            <div className="relative">
              <textarea
                value={classList}
                onChange={(e) => setClassList(e.target.value)}
                rows={8}
                className="w-full p-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-y font-mono"
              />
              <div className="absolute bottom-4 right-4 text-gray-400 pointer-events-none">
                <FileText className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* 提交按钮 */}
          <div className="pt-4">
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xl font-semibold py-5 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.99] flex justify-center items-center">
              <CheckCircle className="w-6 h-6 mr-2" />
              创建
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

// 只有当 DOM 中存在 root 元素时才手动挂载
// 这可以防止因为环境自动挂载导致的冲突或找不到元素的错误
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}