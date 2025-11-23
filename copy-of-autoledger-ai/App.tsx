import React, { useState, useEffect } from 'react';
import { Transaction } from './types';
import { TransactionCard } from './components/TransactionCard';
import { StatsChart } from './components/StatsChart';
import { AddTransactionModal } from './components/AddTransactionModal';
import { SummaryList } from './components/SummaryList';
import { DataBackupModal } from './components/DataBackupModal';
import { Plus, LayoutDashboard, List, Wallet, ScanLine, ArrowUpCircle, ArrowDownCircle, Settings, WifiOff } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'autoledger_transactions';

const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [modalInitialText, setModalInitialText] = useState<string>('');
  const [view, setView] = useState<'dashboard' | 'list'>('dashboard');
  const [summaryPeriod, setSummaryPeriod] = useState<'day' | 'month' | 'year'>('day');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Haptic feedback helper
  const vibrate = () => {
    if (navigator.vibrate) navigator.vibrate(10);
  };

  // Online status listener
  useEffect(() => {
    const handleStatusChange = () => {
      setIsOffline(!navigator.onLine);
    };
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setTransactions(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse transactions", e);
      }
    }
  }, []);

  // Handle Share Target (Incoming text from other apps)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isShareTarget = params.get('share_target') === 'true';
    
    if (isShareTarget) {
      const title = params.get('title') || '';
      const text = params.get('text') || '';
      const url = params.get('url') || '';
      
      const combinedText = `${title} ${text} ${url}`.trim();
      
      if (combinedText) {
        setModalInitialText(combinedText);
        setIsModalOpen(true);
        // Clean up URL to prevent reopening on refresh
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  }, [transactions]);

  const addTransaction = (data: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      id: uuidv4(),
      ...data
    };
    setTransactions(prev => [newTransaction, ...prev]);
  };

  const handleOpenModal = () => {
    vibrate();
    setModalInitialText('');
    setIsModalOpen(true);
  };

  const handleImportData = (data: Transaction[]) => {
    setTransactions(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    vibrate();
  };

  const handleClearData = () => {
    setTransactions([]);
    localStorage.removeItem(STORAGE_KEY);
    vibrate();
  };

  // Calculate Global Stats
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const totalBalance = totalIncome - totalExpense;

  // Filter transactions for charts (Expenses only usually)
  const expenseTransactions = transactions.filter(t => t.type === 'expense');

  return (
    <div className="min-h-screen max-w-md mx-auto bg-gray-50 relative pb-24 shadow-2xl overflow-hidden font-sans">
      
      {/* Offline Indicator */}
      {isOffline && (
        <div className="bg-gray-900 text-white text-xs py-2 px-4 text-center font-medium animate-in slide-in-from-top flex items-center justify-center gap-2">
           <WifiOff size={12} />
           离线模式：数据将保存到本地
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-md px-6 py-4 flex justify-between items-center border-b border-gray-100 shadow-sm transition-all duration-300">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-indigo-200 shadow-lg">
            <Wallet className="text-white" size={18} />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-gray-900 leading-tight">智能记账本</h1>
            <p className="text-[10px] text-gray-500 font-medium">AutoLedger AI</p>
          </div>
        </div>
        <button onClick={() => { vibrate(); setIsBackupOpen(true); }} className="p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200 active:scale-90 transition-transform">
          <Settings size={20} />
        </button>
      </header>

      {/* Main Content */}
      <main className="p-5 space-y-6">
        
        {/* Total Balance Card */}
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-6 text-white shadow-xl shadow-gray-300 ring-1 ring-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-700">
             <Wallet size={120} />
          </div>
          
          <div className="relative z-10">
            <p className="text-gray-400 text-xs font-medium mb-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
              当前净资产
            </p>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-xl font-medium opacity-80">¥</span>
              <h2 className="text-4xl font-bold tracking-tight">{totalBalance.toFixed(2)}</h2>
            </div>

            <div className="flex gap-4">
                <div className="flex-1 bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                    <div className="flex items-center gap-1.5 mb-1 text-emerald-300">
                         <ArrowDownCircle size={14} />
                         <span className="text-xs font-medium">总收入</span>
                    </div>
                    <p className="font-bold text-lg">¥{totalIncome.toFixed(0)}</p>
                </div>
                <div className="flex-1 bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                    <div className="flex items-center gap-1.5 mb-1 text-rose-300">
                         <ArrowUpCircle size={14} />
                         <span className="text-xs font-medium">总支出</span>
                    </div>
                    <p className="font-bold text-lg">¥{totalExpense.toFixed(0)}</p>
                </div>
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex p-1.5 bg-gray-200/60 rounded-xl backdrop-blur-sm">
          <button 
            onClick={() => { vibrate(); setView('dashboard'); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${view === 'dashboard' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <LayoutDashboard size={16} /> 概览
          </button>
          <button 
            onClick={() => { vibrate(); setView('list'); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${view === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <List size={16} /> 账单
          </button>
        </div>

        {/* Dynamic View Content */}
        {view === 'dashboard' ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Action Bar */}
            <div className="flex gap-3">
               <button 
                  onClick={handleOpenModal}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 bg-white border border-gray-100 rounded-xl shadow-sm text-sm font-bold text-indigo-600 hover:bg-indigo-50 active:scale-[0.98] transition-all"
               >
                 <ScanLine size={18} />
                 截图/粘贴
               </button>
               <button 
                  onClick={handleOpenModal}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 bg-white border border-gray-100 rounded-xl shadow-sm text-sm font-bold text-gray-700 hover:bg-gray-50 active:scale-[0.98] transition-all"
               >
                 <Plus size={18} />
                 手动记账
               </button>
            </div>

            {/* Chart Section */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                 <h3 className="font-bold text-gray-800 text-lg">支出分析</h3>
              </div>
              <StatsChart transactions={expenseTransactions} />
            </div>

            {/* Recent Mini List */}
            <div>
              <div className="flex justify-between items-end mb-4 px-1">
                <h3 className="font-bold text-gray-800 text-lg">最近动态</h3>
                <button onClick={() => { vibrate(); setView('list'); }} className="text-indigo-600 text-sm font-semibold hover:text-indigo-800 transition-colors">查看全部</button>
              </div>
              <div className="space-y-3">
                {transactions.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-gray-200">
                    <p className="text-gray-400 text-sm">暂无最近账单</p>
                  </div>
                ) : (
                  transactions.slice(0, 3).map(t => (
                    <TransactionCard key={t.id} transaction={t} />
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             
             {/* Period Filter */}
             <div className="flex justify-center mb-6">
                 <div className="inline-flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
                    {(['day', 'month', 'year'] as const).map((p) => (
                        <button
                            key={p}
                            onClick={() => { vibrate(); setSummaryPeriod(p); }}
                            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                                summaryPeriod === p 
                                ? 'bg-gray-900 text-white shadow-sm' 
                                : 'text-gray-500 hover:bg-gray-50'
                            }`}
                        >
                            {{'day': '日账单', 'month': '月汇总', 'year': '年汇总'}[p]}
                        </button>
                    ))}
                 </div>
             </div>

             <SummaryList transactions={transactions} period={summaryPeriod} />
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-6 z-20">
        <button
          onClick={handleOpenModal}
          className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-full shadow-xl shadow-indigo-300/50 flex items-center justify-center text-white hover:scale-105 transition-transform active:scale-95 group"
        >
          <Plus size={32} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>

      {/* Modals */}
      <AddTransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={addTransaction}
        initialText={modalInitialText}
      />
      
      <DataBackupModal 
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
        transactions={transactions}
        onImport={handleImportData}
        onClear={handleClearData}
      />
    </div>
  );
};

export default App;