import React, { useState, useRef, useEffect } from 'react';
import { Category, Transaction, TransactionType } from '../types';
import { analyzeTransactionSource, fileToGenerativePart } from '../services/geminiService';
import { X, Camera, Sparkles, FileText, Check, ScanLine, ArrowUpCircle, ArrowDownCircle, WifiOff, ClipboardPaste } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id'>) => void;
  initialText?: string;
}

const EXPENSE_CATEGORIES = [
  Category.FOOD, Category.SHOPPING, Category.TRANSPORT, 
  Category.BILLS, Category.ENTERTAINMENT, Category.HEALTH, 
  Category.EDUCATION, Category.EXPENSE_OTHER
];

const INCOME_CATEGORIES = [
  Category.SALARY, Category.INVESTMENT, Category.BONUS, Category.INCOME_OTHER
];

export const AddTransactionModal: React.FC<Props> = ({ isOpen, onClose, onSave, initialText = '' }) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'manual'>('ai');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  // Form State
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState<string>('');
  const [merchant, setMerchant] = useState<string>('');
  const [category, setCategory] = useState<Category>(Category.FOOD);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // AI Input State
  const [pastedText, setPastedText] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Haptic helper
  const vibrate = () => {
    if (navigator.vibrate) navigator.vibrate(10);
  };

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => {
        setIsOffline(true);
        setActiveTab('manual');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (!navigator.onLine) {
        setActiveTab('manual');
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle Initial Text (from Share Target)
  useEffect(() => {
    if (isOpen && initialText) {
      setPastedText(initialText);
      // Auto analyze if text is present
      // We need a small timeout to let state settle or just call analyze directly?
      // Better to let user click to confirm so they know what's happening
    }
  }, [isOpen, initialText]);

  // Reset category when type changes
  useEffect(() => {
    if (type === 'expense') {
      if (!EXPENSE_CATEGORIES.includes(category)) setCategory(Category.FOOD);
    } else {
      if (!INCOME_CATEGORIES.includes(category)) setCategory(Category.SALARY);
    }
  }, [type]);

  if (!isOpen) return null;

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      vibrate();
      const file = e.target.files[0];
      setSelectedImage(file);
      const base64 = await fileToGenerativePart(file);
      setImagePreview(`data:${file.type};base64,${base64}`);
    }
  };

  const handleClipboardPaste = async () => {
    vibrate();
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setPastedText(text);
        // Optional: Auto analyze immediately
        analyzeWithData(text, undefined, undefined);
      } else {
        alert("剪贴板为空");
      }
    } catch (err) {
      // Fallback for browsers blocking readText without permission query
      console.error('Failed to read clipboard', err);
      // Focus the textarea so user can paste manually
      document.querySelector('textarea')?.focus();
    }
  };

  const analyzeWithData = async (text: string, image?: File | null, mimeType?: string) => {
    if (isOffline) {
        alert("网络连接已断开，AI 功能无法使用");
        return;
    }

    setIsAnalyzing(true);
    try {
      let imageBase64: string | undefined = undefined;
      let imgMime: string | undefined = mimeType;

      if (image) {
        imageBase64 = await fileToGenerativePart(image);
        imgMime = image.type;
      }

      const result = await analyzeTransactionSource(text, imageBase64, imgMime);

      // Populate form
      setType(result.type);
      setAmount(result.amount.toString());
      setMerchant(result.merchant);
      
      const matchedCategory = Object.values(Category).find(c => c === result.category);
      if (matchedCategory) {
        setCategory(matchedCategory);
      } else {
        setCategory(result.type === 'expense' ? Category.EXPENSE_OTHER : Category.INCOME_OTHER);
      }
      
      if (result.date) {
        setDate(result.date);
      }

      vibrate();
      setActiveTab('manual');
    } catch (error) {
      alert("智能识别失败，请重试或切换到手动输入。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAIAnalyze = () => {
    vibrate();
    analyzeWithData(pastedText, selectedImage);
  };

  const handleSave = () => {
    vibrate();
    if (!amount || !merchant) {
        alert("请填写金额和商户名称");
        return;
    }
    onSave({
      type,
      amount: parseFloat(amount),
      merchant,
      category,
      date
    });
    // Reset fields
    setAmount('');
    setMerchant('');
    setCategory(Category.FOOD);
    setPastedText('');
    setSelectedImage(null);
    setImagePreview(null);
    setActiveTab('ai');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white w-full max-w-md h-[92vh] sm:h-auto rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold text-gray-800">记一笔</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex p-2 bg-gray-50 mx-4 mt-4 rounded-lg">
          <button
            onClick={() => { vibrate(); !isOffline && setActiveTab('ai'); }}
            disabled={isOffline}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'ai' 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : isOffline 
                    ? 'text-gray-300 cursor-not-allowed' 
                    : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {isOffline ? <WifiOff size={16} /> : <Sparkles size={16} />}
            AI 智能识别
          </button>
          <button
            onClick={() => { vibrate(); setActiveTab('manual'); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'manual' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText size={16} />
            手动记账
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          
          {activeTab === 'ai' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 p-4 rounded-xl text-indigo-900 text-sm flex gap-3">
                 <div className="bg-white p-2 rounded-lg shadow-sm h-fit">
                    <ScanLine size={20} className="text-indigo-600" />
                 </div>
                 <p className="leading-relaxed">
                   <strong>自动检测：</strong>复制支付宝/微信账单，或在其他APP中选中文字“分享”至此APP。
                 </p>
              </div>

              {/* Image Upload Area */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">截图识别</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl h-40 flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden ${
                    imagePreview ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                  }`}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleImageSelect}
                  />
                  
                  {imagePreview ? (
                     <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-2 text-indigo-500">
                        <Camera size={24} />
                      </div>
                      <span className="text-gray-500 text-sm font-medium">点击上传或粘贴图片</span>
                    </>
                  )}
                </div>
              </div>

              {/* Text Area with Smart Paste */}
              <div className="space-y-2 relative">
                <div className="flex justify-between items-center">
                   <label className="block text-sm font-medium text-gray-700">文本识别</label>
                   <button 
                      onClick={handleClipboardPaste}
                      className="text-xs flex items-center gap-1 text-indigo-600 font-bold hover:bg-indigo-50 px-2 py-1 rounded-md transition-colors"
                   >
                      <ClipboardPaste size={14} /> 粘贴并自动分析
                   </button>
                </div>
                <textarea 
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none text-sm transition-shadow bg-gray-50 focus:bg-white"
                  rows={3}
                  placeholder="粘贴账单信息，如：'星巴克消费28元'"
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                />
              </div>

              <button 
                onClick={handleAIAnalyze}
                disabled={isAnalyzing || (!selectedImage && !pastedText)}
                className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98] ${
                  isAnalyzing || (!selectedImage && !pastedText)
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
                }`}
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    分析中...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    开始分析
                  </>
                )}
              </button>
            </div>
          )}

          {activeTab === 'manual' && (
            <div className="space-y-5 animate-in slide-in-from-right duration-300">
              
              {/* Type Switcher */}
              <div className="flex gap-4 mb-4">
                <button
                   onClick={() => { vibrate(); setType('expense'); }}
                   className={`flex-1 py-3 rounded-xl border-2 flex items-center justify-center gap-2 font-bold transition-all ${
                     type === 'expense' 
                     ? 'border-gray-900 bg-gray-900 text-white' 
                     : 'border-gray-200 text-gray-400 hover:border-gray-300'
                   }`}
                >
                  <ArrowUpCircle size={18} /> 支出
                </button>
                <button
                   onClick={() => { vibrate(); setType('income'); }}
                   className={`flex-1 py-3 rounded-xl border-2 flex items-center justify-center gap-2 font-bold transition-all ${
                     type === 'income' 
                     ? 'border-emerald-500 bg-emerald-500 text-white' 
                     : 'border-gray-200 text-gray-400 hover:border-gray-300'
                   }`}
                >
                  <ArrowDownCircle size={18} /> 收入
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">金额</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl font-medium">¥</span>
                  <input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    className={`w-full pl-10 pr-4 py-4 bg-gray-50 border-2 border-transparent hover:bg-gray-100 focus:bg-white rounded-xl text-3xl font-bold text-gray-900 outline-none transition-all ${
                      type === 'income' ? 'focus:border-emerald-500' : 'focus:border-indigo-500'
                    }`}
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">商户 / 来源</label>
                <input
                  type="text"
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                  placeholder={type === 'expense' ? "例如：星巴克、超市" : "例如：公司发薪、理财收益"}
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">分类</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => { vibrate(); setCategory(cat); }}
                      className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        category === cat 
                          ? (type === 'income' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200' : 'bg-indigo-600 text-white shadow-md shadow-indigo-200')
                          : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">日期</label>
                <input
                  type="date"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <button 
                onClick={handleSave}
                className={`w-full py-4 mt-2 text-white rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] ${
                  type === 'income' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-gray-900 hover:bg-black'
                }`}
              >
                <Check size={20} />
                确认保存
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};