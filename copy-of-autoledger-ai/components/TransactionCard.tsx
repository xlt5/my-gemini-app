import React from 'react';
import { Transaction, Category } from '../types';
import { 
  ShoppingBag, 
  Coffee, 
  Car, 
  Zap, 
  Film, 
  Activity, 
  MoreHorizontal,
  GraduationCap,
  Banknote,
  TrendingUp,
  Gift
} from 'lucide-react';

interface Props {
  transaction: Transaction;
}

const getCategoryIcon = (category: Category) => {
  switch (category) {
    // Expense
    case Category.FOOD: return <Coffee size={20} className="text-orange-500" />;
    case Category.SHOPPING: return <ShoppingBag size={20} className="text-blue-500" />;
    case Category.TRANSPORT: return <Car size={20} className="text-green-500" />;
    case Category.BILLS: return <Zap size={20} className="text-yellow-500" />;
    case Category.ENTERTAINMENT: return <Film size={20} className="text-purple-500" />;
    case Category.HEALTH: return <Activity size={20} className="text-red-500" />;
    case Category.EDUCATION: return <GraduationCap size={20} className="text-indigo-500" />;
    
    // Income
    case Category.SALARY: return <Banknote size={20} className="text-emerald-600" />;
    case Category.INVESTMENT: return <TrendingUp size={20} className="text-red-600" />; // Red often means up in stocks in China, but let's stick to emerald for general income money or Red for stock logic. Let's use Red for 'Red Packet' logic or standardizing income as Green/Gold. Let's use Emerald for money in.
    case Category.BONUS: return <Gift size={20} className="text-pink-500" />;
    
    default: return <MoreHorizontal size={20} className="text-gray-500" />;
  }
};

const getCategoryColor = (category: Category) => {
  // Simple background logic
  return 'bg-gray-100'; 
};

export const TransactionCard: React.FC<Props> = ({ transaction }) => {
  const dateObj = new Date(transaction.date);
  const dateStr = dateObj.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  const isExpense = transaction.type === 'expense';

  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-full ${getCategoryColor(transaction.category)}`}>
          {getCategoryIcon(transaction.category)}
        </div>
        <div>
          <h3 className="font-semibold text-gray-800">{transaction.merchant}</h3>
          <p className="text-xs text-gray-500">{transaction.category} • {dateStr}</p>
        </div>
      </div>
      <div className="text-right">
        <span className={`block font-bold ${isExpense ? 'text-gray-900' : 'text-emerald-600'}`}>
          {isExpense ? '-' : '+'}¥{transaction.amount.toFixed(2)}
        </span>
      </div>
    </div>
  );
};