import React from 'react';
import { Transaction } from '../types';
import { TransactionCard } from './TransactionCard';

type Period = 'day' | 'month' | 'year';

interface Props {
  transactions: Transaction[];
  period: Period;
}

interface GroupedData {
  title: string;
  totalIncome: number;
  totalExpense: number;
  transactions: Transaction[];
}

export const SummaryList: React.FC<Props> = ({ transactions, period }) => {
  
  const groupedData = React.useMemo(() => {
    const groups: Record<string, GroupedData> = {};

    transactions.forEach(t => {
      const date = new Date(t.date);
      let key = '';
      let title = '';

      if (period === 'day') {
        key = t.date; // YYYY-MM-DD
        title = date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' });
      } else if (period === 'month') {
        key = `${date.getFullYear()}-${date.getMonth()}`;
        title = date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });
      } else {
        key = `${date.getFullYear()}`;
        title = `${date.getFullYear()}年`;
      }

      if (!groups[key]) {
        groups[key] = { title, totalIncome: 0, totalExpense: 0, transactions: [] };
      }

      if (t.type === 'income') {
        groups[key].totalIncome += t.amount;
      } else {
        groups[key].totalExpense += t.amount;
      }
      
      groups[key].transactions.push(t);
    });

    // Sort keys descending (newest first)
    return Object.keys(groups).sort((a, b) => b.localeCompare(a)).map(key => groups[key]);
  }, [transactions, period]);

  if (transactions.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-gray-400 text-sm">暂无账单数据</p>
        </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {groupedData.map((group, index) => (
        <div key={index} className="animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: `${index * 50}ms` }}>
          {/* Header */}
          <div className="flex justify-between items-end px-1 mb-2">
            <h3 className="font-bold text-gray-800 text-sm">{group.title}</h3>
            <div className="text-xs space-x-3">
              {group.totalIncome > 0 && (
                <span className="text-emerald-600">收: ¥{group.totalIncome.toFixed(2)}</span>
              )}
              <span className="text-gray-500">支: ¥{group.totalExpense.toFixed(2)}</span>
            </div>
          </div>
          
          {/* List Content */}
          {period === 'day' ? (
             <div className="space-y-3">
               {group.transactions.map(t => <TransactionCard key={t.id} transaction={t} />)}
             </div>
          ) : (
             // For Month/Year view, show a summary card instead of full list (optional, but requested summary)
             // However, usually users want to see the details if they click, but for a "Summary" view, we can just list the transactions below
             // Or we can just show the high level stats. Let's show the transactions for now, but maybe collapsible?
             // To keep it simple and effective: In month/year mode, we show a Summary Card, and maybe top 3 transactions?
             // Let's just list them all for now as the app is simple.
             <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                   <div className="space-y-1">
                      <p className="text-xs text-gray-400">结余</p>
                      <p className="text-xl font-bold text-gray-800">
                        {group.totalIncome - group.totalExpense > 0 ? '+' : ''}
                        ¥{(group.totalIncome - group.totalExpense).toFixed(2)}
                      </p>
                   </div>
                   <div className="h-10 w-[1px] bg-gray-100"></div>
                   <div className="flex gap-6 text-right">
                      <div>
                         <p className="text-xs text-gray-400">收入</p>
                         <p className="font-semibold text-emerald-600">¥{group.totalIncome.toFixed(2)}</p>
                      </div>
                      <div>
                         <p className="text-xs text-gray-400">支出</p>
                         <p className="font-semibold text-gray-800">¥{group.totalExpense.toFixed(2)}</p>
                      </div>
                   </div>
                </div>
                {/* Visual bar */}
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden flex">
                    <div 
                        className="bg-emerald-500 h-full" 
                        style={{ width: `${(group.totalIncome / (group.totalIncome + group.totalExpense + 0.001)) * 100}%` }}
                    />
                    <div 
                        className="bg-gray-800 h-full" 
                        style={{ width: `${(group.totalExpense / (group.totalIncome + group.totalExpense + 0.001)) * 100}%` }}
                    />
                </div>
             </div>
          )}
        </div>
      ))}
    </div>
  );
};